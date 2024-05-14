import { z } from "zod";
import { createTRPCRouter, firstNarationUrlErrorMessage, protectedProcedure } from "../trpc";
import * as LLM from '../utils/llm';
import { textToSpeech, voiceGenders } from "../utils/tts";
import { TRPCError } from "@trpc/server";
import { UserStore } from "../utils/redisStore";

const goalInfoSchema = z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string()
})

const startRunSchema = z.object({
    goalInfo: goalInfoSchema,
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
})
export type StartRunParams = z.infer<typeof startRunSchema>

export const narrationRouter = createTRPCRouter({
    startRun: protectedProcedure.input(startRunSchema).mutation(async ({ input, ctx: { store } }) => {
        await store.clear()
        await saveStartParams(input, store)

        await LLM.createStructure(input, store)
        const firstMessage = await LLM.generateNaration(1, undefined, store)
        if (firstMessage) {
            const firstNarationUrl = await textToSpeech(firstMessage, store)
            await store.setValue('firstNarationUrl', firstNarationUrl)
        }
    }),
    getFirst: protectedProcedure
        .query(async ({ ctx }) => {
            const firstNarationUrl = await ctx.store.getValue('firstNarationUrl')
            if (!firstNarationUrl) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: firstNarationUrlErrorMessage
                })
            }
            return firstNarationUrl.toString()
        }),
    getNext: protectedProcedure
        .input(z.object({
            idx: z.number(),
            runDuration: z.string()
        }))
        .query(async ({ input: { idx, runDuration }, ctx: { store } }) => {
            const narationIdx = idx + 1
            console.log(narationIdx + ". getNaration endpoint called")

            const resText = await LLM.generateNaration(narationIdx, runDuration, store)
            if (!resText) {
                return null
            }
            const url = await textToSpeech(resText, store)
            return url.toString()
        })
})


async function saveStartParams({ voice, llmModel, temperature, intent, topic, privateData }: StartRunParams, store: UserStore) {
    // PERF: Can implement wiht Redis Pipelining
    await Promise.all([
        store.setValue('firstNarationUrl', null),
        store.setValue('intent', intent),
        store.setValue('topic', topic),
        store.setValue('voice', voice),
        store.setValue('llmModel', llmModel),
        store.setValue('temperature', temperature),
        store.setValue('curSegmentDistance', 0),
        store.setValue('lastSegToMetres', 0),
        store.setValue('privateMode', privateData === undefined)
    ])
}
