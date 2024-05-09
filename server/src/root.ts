import { dbRouter } from "./routers/data";
import { narrationRouter } from "./routers/narration";
import { trackingRouter } from "./routers/tracking";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    narration: narrationRouter,
    tracking: trackingRouter,
    db: dbRouter
})

// export type definition of API
export type AppRouter = typeof appRouter
