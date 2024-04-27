import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { db } from "../db/db"
import { positions, runs } from '../db/schema';
import { eq } from "drizzle-orm";
import { Position } from "./tracking";
import { Keys } from "../utils/redisStore";

// For DB manipulation
export const dbRouter = createTRPCRouter({
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
            const topic = await store.getValue(Keys.topic)
            const intent = await store.getValue(Keys.intent)
            // NOTE: need to use Pool and websockets for db to use txs
            // await db.transaction(async (tx) => {})
            const newRow = await db
                .insert(runs)
                .values({
                    ...input,
                    topic,
                    intent,
                    userId: user.userId
                }).returning({ insertedId: runs.id })
            const unfilteredPoss = await store.positions.getAll<Position>()
            const poss = unfilteredPoss.map(p => {
                const { distInc: _, ...rest } = p
                return { ...rest, runId: newRow[0].insertedId }
            })
            if (poss.length > 0) {
                await db.insert(positions).values(poss)
            }
        }),
    getRunsHistory: protectedProcedure.query(async ({ ctx: { user } }) => {
        const res = await db
            .select({
                id: runs.id,
                serial: runs.serial,
                startTime: runs.startTime,
                duration: runs.duration,
                distance: runs.distance
            })
            .from(runs)
            .where(eq(runs.userId, user.userId))
        return res
    }),
    getRunDetails: protectedProcedure
        .input(z.number())
        .query(async ({ input: id }) => {
            const res = await db.query.runs.findFirst({
                where: eq(runs.id, id),
                with: {
                    positions: true
                }
            })
            return res
        })
})