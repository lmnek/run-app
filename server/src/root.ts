import { dbRouter } from "./routers/data.js";
import { narrationRouter } from "./routers/narration.js";
import { trackingRouter } from "./routers/tracking.js";
import { createTRPCRouter } from "./trpc.js";

// Merge all routers from the ./routers/ directory
export const appRouter = createTRPCRouter({
    narration: narrationRouter,
    tracking: trackingRouter,
    db: dbRouter
})

// Export type definition of API
export type AppRouter = typeof appRouter
