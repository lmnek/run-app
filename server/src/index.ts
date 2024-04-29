import express from "express";
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from "./root";
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 3000

app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: createContext,
    }),
)

app.listen(port, () => console.log(`Hello from port ${port}`))
