import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { UserStore } from "../utils/redisStore.js";
import { createTRPCRouter, FIRST_NARRATION_URL_ERROR_MESSAGE, protectedProcedure } from "../trpc.js";
import * as LLM from '../apis/llm.js';
import { textToSpeech, voiceGenders } from "../apis/tts.js";
import { logger } from "../utils/logger.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Goal information
export interface GoalInfo {
    type: string;
    value: number;
    unit: string;
}

// Data element: Start run parameters
export interface StartRunParams {
    goalInfo: GoalInfo;
    topic?: string;
    intent?: string;
    entranceCount: number;
    voice: string;
    temperature: string;
    llmModel: string;
    privateData?: {
        username: string;
        lat: number;
        long: number;
    };
}

// Data element: Next narration request
export interface NextNarrationRequest {
    idx: number;
    runDuration: string;
}

// Data element: Narration response
export interface NarrationResponse {
    url: string;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Store initialization
export class StoreInitializer {
    static async clear(store: UserStore): Promise<void> {
        await store.clear();
    }
}

// Task element: Parameter persistence
export class ParameterPersister {
    static async saveStartParams(params: StartRunParams, store: UserStore): Promise<void> {
        await Promise.all([
            store.setValue('firstNarationUrl', null),
            store.setValue('intent', params.intent),
            store.setValue('topic', params.topic),
            store.setValue('voice', params.voice),
            store.setValue('llmModel', params.llmModel),
            store.setValue('temperature', params.temperature),
            store.setValue('curSegmentDistance', 0),
            store.setValue('lastSegToMetres', 0),
            store.setValue('privateMode', params.privateData === undefined)
        ]);
    }
}

// Task element: LLM structure creation
export class LLMStructureCreator {
    static async createStructure(params: StartRunParams, userId: string, store: UserStore): Promise<void> {
        await LLM.createStructure(params, userId, store);
    }
}

// Task element: First narration generation
export class FirstNarrationGenerator {
    static async generate(params: StartRunParams, userId: string, store: UserStore): Promise<string | null> {
        const firstMessage = await LLM.generateNaration(1, undefined, store);
        if (firstMessage) {
                    const firstNarrationUrl = await textToSpeech(firstMessage, store);
        await store.setValue('firstNarationUrl', firstNarrationUrl);
        return firstNarrationUrl.toString();
        }
        return null;
    }
}

// Task element: First narration retrieval
export class FirstNarrationRetriever {
    static async retrieve(store: UserStore): Promise<string> {
        const firstNarrationUrl = await store.getValue('firstNarationUrl');
        if (!firstNarrationUrl) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: FIRST_NARRATION_URL_ERROR_MESSAGE
            });
        }
        return firstNarrationUrl;
    }
}

// Task element: Next narration generation
export class NextNarrationGenerator {
    static async generate(idx: number, runDuration: string, store: UserStore): Promise<string | null> {
        const narrationIdx = idx + 1;
        logger.verbose('%d. getNaration endpoint called', narrationIdx);

        const resText = await LLM.generateNaration(narrationIdx, runDuration, store);
        if (!resText) {
            return null;
        }
        const url = await textToSpeech(resText, store);
        return url.toString();
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Complete run start process
export class RunStartWorkflow {
    static async execute(params: StartRunParams, store: UserStore, userId: string): Promise<void> {
        // Initialize store
        await StoreInitializer.clear(store);
        
        // Save parameters
        await ParameterPersister.saveStartParams(params, store);
        
        // Create LLM structure
        await LLMStructureCreator.createStructure(params, userId, store);
        
        // Generate first narration
        await FirstNarrationGenerator.generate(params, userId, store);
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Narration operations coordinator
export class NarrationConnector {
    static async startRun(params: StartRunParams, store: UserStore, userId: string): Promise<void> {
        await RunStartWorkflow.execute(params, store, userId);
    }
    
    static async getFirstNarration(store: UserStore): Promise<string> {
        return await FirstNarrationRetriever.retrieve(store);
    }
    
    static async getNextNarration(idx: number, runDuration: string, store: UserStore): Promise<string | null> {
        return await NextNarrationGenerator.generate(idx, runDuration, store);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: tRPC procedure handlers
export const narrationRouter = createTRPCRouter({
    // Starting the run: 
    // - Initialize the Redis data
    // - Call LLM to create the structure
    // - Call LLM and TTS to generate the first coaching audio
    startRun: protectedProcedure
        .input(z.object({
            goalInfo: z.object({
                type: z.string(),
                value: z.number(),
                unit: z.string()
            }),
            topic: z.string().optional(),
            intent: z.string().optional(),
            entranceCount: z.number(),
            voice: z.enum(voiceGenders),
            temperature: z.enum(LLM.temperatures),
            llmModel: z.enum(LLM.llmModels),
            privateData: z.object({
                username: z.string(),
                lat: z.number(),
                long: z.number()
            }).optional(),
        }))
        .mutation(async ({ input, ctx: { store, user: { userId } } }: { input: StartRunParams, ctx: { store: UserStore, user: { userId: string } } }) => {
            await NarrationConnector.startRun(input, store, userId);
        }),
    
    // Get the first coaching audio
    getFirst: protectedProcedure
        .query(async ({ ctx }: { ctx: { store: UserStore } }) => {
            return await NarrationConnector.getFirstNarration(ctx.store);
        }),
    
    // Generate the next coaching entrance audio
    getNext: protectedProcedure
        .input(z.object({
            idx: z.number(),
            runDuration: z.string()
        }))
        .query(async ({ input: { idx, runDuration }, ctx: { store } }: { input: NextNarrationRequest, ctx: { store: UserStore } }) => {
            return await NarrationConnector.getNextNarration(idx, runDuration, store);
        })
});
