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

const urlStoreName = 'firstNarationUrl'

export let temperature = 1.0

export const narationRouter = createTRPCRouter({
    setTemperature: publicProcedure.input(z.number()).query(({ input }) => {
        temperature = input
    }),
    startRun: protectedProcedure.input(startRunSchema).mutation(async ({ input, ctx }) => {
        await ctx.store.setValue(urlStoreName, null)
        await LLM.createStructure(input, ctx.store)
        const firstMessage = await LLM.callCompletions(1, undefined, ctx.store)
        if (firstMessage) {
            const firstNarationUrl = await textToSpeech(firstMessage)
            await ctx.store.setValue(urlStoreName, firstNarationUrl)
        }
    }),
    // BUG: ? no audio with 2nd run
    getFirst: protectedProcedure
        .query(async ({ ctx }) => {
            const firstNarationUrl = await ctx.store.getValue(urlStoreName)
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
        .query(async ({ input: { idx, runDuration }, ctx }) => {
            const narationIdx = idx + 1
            console.log(narationIdx + ". getNaration endpoint called")

            const resText = await LLM.callCompletions(narationIdx, runDuration, ctx.store)
            if (!resText) {
                return null
            }
            const url = await textToSpeech(resText)
            return url.toString()
        }),
    // NOTE: TESTING ENDPOINTS:
    getMessages: protectedProcedure.query(({ ctx }) => JSON.stringify(ctx.store.messages.getAll())),
})
