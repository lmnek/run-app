import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import * as trpcExpress from '@trpc/server/adapters/express';
import { callCompletions } from './llm';
import { textToSpeech } from './tts';

export const createContext = ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.create();

export const appRouter = t.router({
    completeAi: t.procedure
        //.input(z.number())
        .query(async () => {

            const res = await callCompletions()
            const correct = res.choices[0].finish_reason === "stop"
            if (correct) {
                const resJson = JSON.parse(res.choices[0].message.tool_calls![0].function.arguments)
                resJson.url = await textToSpeech(resJson.text)
                return resJson
            }
            return null
        }),
    getUser: t.procedure.input(z.string()).query((opts) => {
        return { id: opts.input, name: 'Bilbo' };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
