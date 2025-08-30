import express from "express";
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc.js';
import { appRouter } from "./root.js";
import { logger } from "./utils/logger.js";

// ============================================================================
// CONSTANTS - Configuration values
// ============================================================================

const DEFAULT_PORT = 3000;
const TRPC_PATH = '/trpc';

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Express server creation
export class ExpressServerCreator {
    static create(): express.Application {
        return express();
    }
}

// Task element: tRPC middleware setup
export class TRPCMiddlewareSetup {
    static setup(app: express.Application, router: any, createContextFn: any): void {
        app.use(
            TRPC_PATH,
            trpcExpress.createExpressMiddleware({
                router: router,
                createContext: createContextFn,
            }),
        );
    }
}

// Task element: Server startup
export class ServerStartup {
    static start(app: express.Application, port: number): void {
        app.listen(port, () => {
            logger.info(`Server started successfully on port ${port}`);
        });
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Server initialization workflow
export class ServerInitializationWorkflow {
    static async execute(): Promise<void> {
        try {
            // Create Express app
            const app = ExpressServerCreator.create();
            
            // Setup tRPC middleware
            TRPCMiddlewareSetup.setup(app, appRouter, createContext);
            
            // Start server
            const port = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;
            ServerStartup.start(app, port);
            
            logger.info('Server initialization completed successfully');
        } catch (error) {
            logger.error('Failed to initialize server', { error });
            process.exit(1);
        }
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: Main server startup
ServerInitializationWorkflow.execute().catch((error) => {
    logger.error('Unhandled error during server startup', { error });
    process.exit(1);
});
