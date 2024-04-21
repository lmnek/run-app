import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import * as LLM from '../utils/llm';
import { textToSpeech } from "../utils/tts";
import { TRPCError } from "@trpc/server";

const goalInfoSchema = z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string()
});

const startRunSchema = z.object({
    goalInfo: goalInfoSchema,
    topic: z.string(),
    intent: z.string(),
    entranceCount: z.number()
});
export type StartRunParams = z.infer<typeof startRunSchema>;


let firstNarationUrl: String | null = null

export const narationRouter = createTRPCRouter({
    startRun: protectedProcedure.input(startRunSchema).mutation(async ({ input }) => {
        firstNarationUrl = null
        await LLM.createStructure(input)
        const firstMessage = await LLM.callCompletions(1)
        if (firstMessage) {
            firstNarationUrl = await textToSpeech(firstMessage)
        }
    }),
    getFirst: protectedProcedure
        .query(async () => {
            if (!firstNarationUrl) {
                throw new TRPCError({ code: 'UNPROCESSABLE_CONTENT' })
            }
            return firstNarationUrl.toString()
        }),
    getNext: protectedProcedure
        .input(z.object({
            idx: z.number(),
            runDuration: z.string()
        }))
        .query(async ({ input: { idx, runDuration } }) => {
            const narationIdx = idx + 1
            console.log(narationIdx + ". getNaration endpoint called")

            const resText = await LLM.callCompletions(narationIdx, runDuration)
            if (!resText) {
                return null
            }
            const url = await textToSpeech(resText)
            return url.toString()
        }),
    // NOTE: TESTING ENDPOINTS:
    getMessages: publicProcedure.query(() => LLM.messages),
})
