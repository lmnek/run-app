import { TRPCError, initTRPC } from '@trpc/server';
import { z } from 'zod';
import * as trpcExpress from '@trpc/server/adapters/express';
import * as LLM from './llm';
import { textToSpeech } from './tts';

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
    goalInfo: goalInfoSchema
});

export let segments = [
    { from: 0, to: 500, distanceUnit: "metres", averageSpeed: "6.1", averageSpeedUnit: "m/s" },
    { from: 500, to: 850, distanceUnit: "metres", averageSpeed: "5.2", averageSpeedUnit: "m/s" },
    { from: 850, to: 1200, distanceUnit: "metres", averageSpeed: "5.5", averageSpeedUnit: "m/s" }
]

export const appRouter = t.router({
    startRun: t.procedure.input(startRunSchema).mutation(({ input }) => {
        LLM.createStructure(input)
    }),
    sendPosition: t.procedure.input(
        z.object({
            lat: z.number(),
            long: z.number(),
            timestamp: z.number()
        })
    ).mutation(({ input }) => {
        // TODO: save point
        console.log(input)
    }),
    getFirstNaration: t.procedure
        .query(async () => {
            const text = LLM.getFirstMessage()
            if (!text) {
                throw new TRPCError({ code: 'UNPROCESSABLE_CONTENT' })
            }
            const res = { url: await textToSpeech(text) }
            return res
        }),
    getNaration: t.procedure
        .query(async () => {
            // const resJson = JSON.parse("{\"text\":\"<speak>Hey there! Great job on hitting the 5 km mark! I noticed that your overall pace is 5:21 min/km, but wow, you really picked it up in the last kilometer with a pace of 5:00 min/km. That's impressive! Remember, consistency is key, but it's also important to listen to your body. If you're feeling good, it's okay to push a little, but don't overdo it. Let's aim to maintain a steady pace for the next segment of your run, balancing effort and endurance. You've got this!</speak>\",\"time\":0}")

            const resJson = await LLM.callCompletions()
            if (!resJson) {
                return null
            }
            resJson.url = await textToSpeech(resJson.text)
            return resJson
        }),
    getMessages: t.procedure.query(() => LLM.messages)
});

// export type definition of API
export type AppRouter = typeof appRouter;

export type StartRunParams = z.infer<typeof startRunSchema>;
