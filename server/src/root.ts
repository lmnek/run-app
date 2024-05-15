import { dbRouter } from "./routers/data";
import { narrationRouter } from "./routers/narration";
import { trackingRouter } from "./routers/tracking";
import { createTRPCRouter } from "./trpc";

// Merge all routers from the ./routers/ directory
export const appRouter = createTRPCRouter({
    narration: narrationRouter,
    tracking: trackingRouter,
    db: dbRouter
})

// Export type definition of API
export type AppRouter = typeof appRouter
