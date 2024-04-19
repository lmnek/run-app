import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'zod';
import * as trpcExpress from '@trpc/server/adapters/express';
import * as LLM from './llm';
import { textToSpeech } from './tts';
import { addPoint, getInfo } from './tracking';

// TODO: authorization
export const createContext = ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.create();

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

const sendPositionSchema = z.object({
    lat: z.number(),
    long: z.number(),
    timestamp: z.number(),
    distInc: z.number().optional().default(0)
})

let firstNarationUrl: String | null = null

export const appRouter = t.router({
    startRun: t.procedure.input(startRunSchema).mutation(async ({ input }) => {
        firstNarationUrl = null
        await LLM.createStructure(input)
        const firstMessage = await LLM.callCompletions(1)
        if (firstMessage) {
            firstNarationUrl = await textToSpeech(firstMessage)
        }
    }),
    sendPosition: t.procedure.input(sendPositionSchema).mutation(({ input }) => {
        addPoint(input)
    }),
    getFirstNaration: t.procedure
        .query(async () => {
            if (!firstNarationUrl) {
                throw new TRPCError({ code: 'UNPROCESSABLE_CONTENT' })
            }
            return firstNarationUrl.toString()
        }),
    getNaration: t.procedure
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
    getMessages: t.procedure.query(() => LLM.messages),
    getSegments: t.procedure.query(() => getInfo())
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type StartRunParams = z.infer<typeof startRunSchema>;
export type Position = z.infer<typeof sendPositionSchema>;
