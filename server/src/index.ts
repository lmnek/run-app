import express from "express";
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from "./root";
import dotenv from 'dotenv'
import { renderTrpcPanel } from "trpc-panel";

dotenv.config()

const app = express();
const port = process.env.PORT;

app.use("/panel", (_, res) => {
    return res.send(
        renderTrpcPanel(appRouter, {
            url: "http://localhost:8081/trpc",
            transformer: 'superjson'
        })
    );
});
console.log()

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: createContext,
    }),
);

app.listen(port, () => console.log(`Hello from port ${port}`));
