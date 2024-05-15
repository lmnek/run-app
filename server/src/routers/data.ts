import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { db } from "../db/db"
import { positions, runs } from '../db/schema';
import { desc, eq, max } from "drizzle-orm";
import { Position } from "./tracking";
import { Message } from "../utils/llm";
import { logger } from "../utils/logger";

// The tRPC router for saving/querring the PostgreSQL database

export const dbRouter = createTRPCRouter({
    getRunsHistory: protectedProcedure.query(async ({ ctx: { user } }) => {
        const res = await db
            .select()
            .from(runs)
            .where(eq(runs.userId, user.userId))
            .orderBy(desc(runs.serial))
        return res
    }),
    getRunPositions: protectedProcedure
        .input(z.number())
        .query(async ({ input: id }) => {
            return await db
                .select()
                .from(positions)
                .where(eq(positions.runId, id))
        }),
    saveRun: protectedProcedure
        .input(
            z.object({
                startTime: z.number(),
                endTime: z.number(),
                duration: z.number(),
                distance: z.number(),
                speed: z.number(),
            }))
        .mutation(async ({ input, ctx: { user, store } }) => {
            const topic = await store.getValue('topic')
            const intent = await store.getValue('intent')
            // NOTE: need to use Pool and websockets for db to use txs
            // await db.transaction(async (tx) => {})
            const lastRun = await db
                .select({ serial: max(runs.serial) })
                .from(runs)
                .where(eq(runs.userId, user.userId))
            const lastRunSerial = lastRun.length === 0 ? 0 : lastRun[0].serial!

            // Create new run in DB
            const newRow = await db
                .insert(runs)
                .values({
                    ...input,
                    topic,
                    intent,
                    userId: user.userId,
                    serial: lastRunSerial + 1
                }).returning({ insertedId: runs.id })

            // Attach route positions to the run entry
            const unfilteredPoss = await store.positions.getAll<Position>()
            const poss = unfilteredPoss.map(p => {
                const { distInc: _, ...rest } = p
                return { ...rest, runId: newRow[0].insertedId }
            })
            if (poss.length > 0) {
                await db.insert(positions).values(poss)
            }

            const messages = await store.messages.getAll<Message>()
            logger.debug('Finished a run', { messages })
            await store.clear() // Delete everything from Redis
        }),
    deleteRun: protectedProcedure
        .input(z.number())
        .mutation(async ({ input: id, ctx: { user: { userId } } }) => {
            return await db
                .delete(runs)
                .where(eq(runs.userId, userId) && eq(runs.id, id))
        }),
})
