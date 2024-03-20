import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import * as trpcExpress from '@trpc/server/adapters/express';

export const createContext = ({
    req,
    res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.create();

export const appRouter = t.router({
    test: t.procedure.query(() => {
        return { payloadLol: "lolol" }
    }),
    getUser: t.procedure.input(z.string()).query((opts) => {
        return { id: opts.input, name: 'Bilbo' };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
