import express from "express";
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc';
import { appRouter } from "./root";
import { logger } from "./utils/logger";

const app = express()
const port = 3000

// Connect tRPC to the express server
app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: createContext,
    }),
)

// Start the express REST server
app.listen(port, () => logger.info(`Hello from port ${port}`))
