import { dbRouter } from "./routers/data.js";
import { narrationRouter } from "./routers/narration.js";
import { trackingRouter } from "./routers/tracking.js";
import { createTRPCRouter } from "./trpc.js";

// ============================================================================
// DATA ELEMENTS - Router configuration
// ============================================================================

// Data element: Router configuration mapping
export interface RouterConfiguration {
    narration: typeof narrationRouter;
    tracking: typeof trackingRouter;
    db: typeof dbRouter;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Router merger
export class RouterMerger {
    static mergeRouters(): RouterConfiguration {
        return {
            narration: narrationRouter,
            tracking: trackingRouter,
            db: dbRouter
        };
    }
}

// Task element: Main router creation
export class MainRouterCreator {
    static create(): ReturnType<typeof createTRPCRouter> {
        const routerConfig = RouterMerger.mergeRouters();
        return createTRPCRouter(routerConfig);
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Main application router
export const appRouter = MainRouterCreator.create();

// ============================================================================
// TYPE EXPORTS - Maintain backward compatibility
// ============================================================================

// Export type definition of API for client consumption
export type AppRouter = typeof appRouter;
