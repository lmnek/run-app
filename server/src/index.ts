import express from "express";
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter, createContext } from './trpc';

const app = express();
const port = 8080;

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: createContext,
    }),
);

app.listen(port, () => console.log(`Hello from port ${port}`));
