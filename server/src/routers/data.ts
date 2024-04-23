import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { db } from "../db/db"
import { runs } from '../db/schema';
import { eq } from "drizzle-orm";

export const dataRouter = createTRPCRouter({
    saveRun: protectedProcedure
        .input(
            z.object({
                time: z.string(),
                distance: z.number()
            }))
        .mutation(async ({ input, ctx: { user } }) => {
            await db
                .insert(runs)
                .values({ ...input, userId: user.userId })
        }),
    getRunHistory: protectedProcedure.query(async ({ ctx: { user } }) => {
        const res = await db
            .select()
            .from(runs)
            .where(eq(runs.userId, user.userId))
        return res
    })
})
