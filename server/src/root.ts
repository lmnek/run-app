import { narationRouter } from "./routers/naration";
import { trackingRouter } from "./routers/tracking";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    naration: narationRouter,
    tracking: trackingRouter
})

// export type definition of API
export type AppRouter = typeof appRouter;
