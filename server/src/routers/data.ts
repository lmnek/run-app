import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc.js"
import { db } from "../db/db.js"
import { positions, runs } from '../db/schema.js';
import { desc, eq, max } from "drizzle-orm";
import { Position } from "./tracking.js";
import { Message } from "../utils/llm.js";
import { logger } from "../utils/logger.js";
import { UserStore } from "../utils/redisStore.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Run input parameters
export interface RunInput {
    startTime: number;
    endTime: number;
    duration: number;
    distance: number;
    speed: number;
}

// Data element: Run creation result
export interface RunCreationResult {
    insertedId: number;
}

// Data element: Run history item
export interface RunHistoryItem {
    id: number;
    serial: number;
    userId: string;
    distance: number;
    startTime: number;
    endTime: number;
    duration: number;
    speed: number;
    topic: string | null;
    intent: string | null;
}

// Data element: Position data for database insertion
export interface PositionForInsertion {
    lat: number;
    long: number;
    alt: number;
    instantSpeed: number;
    timestamp: number;
    accuracy: number | null;
    runId: number;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Run history retrieval
export class RunHistoryRetriever {
    static async retrieve(userId: string): Promise<RunHistoryItem[]> {
        return await db
            .select()
            .from(runs)
            .where(eq(runs.userId, userId))
            .orderBy(desc(runs.serial));
    }
}

// Task element: Run positions retrieval
export class RunPositionsRetriever {
    static async retrieve(runId: number): Promise<Position[]> {
        return await db
            .select()
            .from(positions)
            .where(eq(positions.runId, runId));
    }
}

// Task element: Run deletion
export class RunDeleter {
    static async delete(runId: number, userId: string): Promise<void> {
        await db
            .delete(runs)
            .where(eq(runs.userId, userId) && eq(runs.id, runId));
    }
}

// Task element: Last run serial retrieval
export class LastRunSerialRetriever {
    static async retrieve(userId: string): Promise<number> {
        const lastRun = await db
            .select({ serial: max(runs.serial) })
            .from(runs)
            .where(eq(runs.userId, userId));
        return lastRun.length === 0 ? 0 : lastRun[0].serial!;
    }
}

// Task element: Run creation
export class RunCreator {
    static async create(
        runData: RunInput,
        topic: string | null,
        intent: string | null,
        userId: string,
        serial: number
    ): Promise<RunCreationResult> {
        const newRow = await db
            .insert(runs)
            .values({
                ...runData,
                topic,
                intent,
                userId,
                serial
            }).returning({ insertedId: runs.id });
        
        return { insertedId: newRow[0].insertedId };
    }
}

// Task element: Position insertion
export class PositionInserter {
    static async insert(positions: PositionForInsertion[]): Promise<void> {
        if (positions.length > 0) {
            await db.insert(positions).values(positions);
        }
    }
}

// Task element: Store cleanup
export class StoreCleaner {
    static async clear(store: UserStore): Promise<void> {
        await store.clear();
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Complete run saving process
export class RunSavingWorkflow {
    static async execute(
        input: RunInput,
        store: UserStore,
        userId: string
    ): Promise<void> {
        // Extract run parameters
        const topic = await store.getValue('topic');
        const intent = await store.getValue('intent');
        
        // Get next serial number
        const lastRunSerial = await LastRunSerialRetriever.retrieve(userId);
        const newSerial = lastRunSerial + 1;
        
        // Create new run
        const runResult = await RunCreator.create(
            input,
            topic,
            intent,
            userId,
            newSerial
        );
        
        // Process and insert positions
        const unfilteredPositions = await store.positions.getAll<Position>();
        const positionsForInsertion = unfilteredPositions.map(p => {
            const { distInc: _, ...rest } = p;
            return { ...rest, runId: runResult.insertedId };
        });
        
        await PositionInserter.insert(positionsForInsertion);
        
        // Log completion and cleanup
        const messages = await store.messages.getAll<Message>();
        logger.debug('Finished a run', { messages });
        await StoreCleaner.clear(store);
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Database operations coordinator
export class DatabaseConnector {
    static async getRunsHistory(userId: string): Promise<RunHistoryItem[]> {
        return await RunHistoryRetriever.retrieve(userId);
    }
    
    static async getRunPositions(runId: number): Promise<Position[]> {
        return await RunPositionsRetriever.retrieve(runId);
    }
    
    static async saveRun(
        input: RunInput,
        store: UserStore,
        userId: string
    ): Promise<void> {
        await RunSavingWorkflow.execute(input, store, userId);
    }
    
    static async deleteRun(runId: number, userId: string): Promise<void> {
        await RunDeleter.delete(runId, userId);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: tRPC procedure handlers
export const dbRouter = createTRPCRouter({
    getRunsHistory: protectedProcedure.query(async ({ ctx: { user } }: { ctx: { user: { userId: string } } }) => {
        return await DatabaseConnector.getRunsHistory(user.userId);
    }),
    
    getRunPositions: protectedProcedure
        .input(z.number())
        .query(async ({ input: id }: { input: number }) => {
            return await DatabaseConnector.getRunPositions(id);
        }),
    
    saveRun: protectedProcedure
        .input(z.object({
            startTime: z.number(),
            endTime: z.number(),
            duration: z.number(),
            distance: z.number(),
            speed: z.number(),
        }))
        .mutation(async ({ input, ctx: { user, store } }: { input: RunInput, ctx: { user: { userId: string }, store: UserStore } }) => {
            await DatabaseConnector.saveRun(input, store, user.userId);
        }),
    
    deleteRun: protectedProcedure
        .input(z.number())
        .mutation(async ({ input: id, ctx: { user: { userId } } }: { input: number, ctx: { user: { userId: string } } }) => {
            await DatabaseConnector.deleteRun(id, userId);
        }),
});
