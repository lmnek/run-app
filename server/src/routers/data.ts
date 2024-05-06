import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { db } from "../db/db"
import { positions, runs } from '../db/schema';
import { desc, eq, max } from "drizzle-orm";
import { Position } from "./tracking";

// For DB manipulation
export const dbRouter = createTRPCRouter({
    getRunsHistory: protectedProcedure.query(async ({ ctx: { user } }) => {
        const res = await db
            .select()
            .from(runs)
            .where(eq(runs.userId, user.userId))
            .orderBy(desc(runs.serial))
        return res
    }),
    getRunPositions: protectedProcedure
        .input(z.number())
        .query(async ({ input: id }) => {
            return await db
                .select()
                .from(positions)
                .where(eq(positions.runId, id))
        }),
    saveRun: protectedProcedure
        .input(
            z.object({
                startTime: z.number(),
                endTime: z.number(),
                duration: z.number(),
                distance: z.number(),
                speed: z.number(),
            }))
        .mutation(async ({ input, ctx: { user, store } }) => {
            const topic = await store.getValue('topic')
            const intent = await store.getValue('intent')
            // NOTE: need to use Pool and websockets for db to use txs
            // await db.transaction(async (tx) => {})
            const lastRun = await db
                .select({ serial: max(runs.serial) })
                .from(runs)
                .where(eq(runs.userId, user.userId))
            const lastRunSerial = lastRun.length === 0 ? 0 : lastRun[0].serial!
            const newRow = await db
                .insert(runs)
                .values({
                    ...input,
                    topic,
                    intent,
                    userId: user.userId,
                    serial: lastRunSerial + 1
                }).returning({ insertedId: runs.id })
            const unfilteredPoss = await store.positions.getAll<Position>()
            const poss = unfilteredPoss.map(p => {
                const { distInc: _, ...rest } = p
                return { ...rest, runId: newRow[0].insertedId }
            })
            if (poss.length > 0) {
                await db.insert(positions).values(poss)
            }
            await store.clear() // delete everything
        }),
})
