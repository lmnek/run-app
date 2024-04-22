import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { UserStore } from "../utils/redisStore";

const SEGMENT_DISTANCE = 200 // metres

export interface Segment {
    fromMetres: number,
    toMetres: number,
    time: string,
    avgSpeed: string
}

enum Keys {
    curSegmentDistance = 'curSegmentDistance'
}

async function addPoint(point: Point, store: UserStore) {
    await store.points.add(point)
    const prevDist = await store.getValue(Keys.curSegmentDistance)
    const newDist = prevDist
        ? parseInt(prevDist) + point.distInc
        : point.distInc

    store.setValue(Keys.curSegmentDistance, newDist)

    if (newDist >= SEGMENT_DISTANCE) {
        closeSegment(store)
    }
}

export async function closeSegment(store: UserStore) {
    const segments = await store.segments.getAll<Segment>()
    const fromMetres = segments.length === 0
        ? 0
        : segments[segments.length - 1].toMetres

    const curSegPoints = await store.points.getAll<Point>()
    const time = curSegPoints.length < 2
        ? 0
        : (curSegPoints[curSegPoints.length - 1].timestamp - curSegPoints[0].timestamp) / 1000

    const curSegDistStr = await store.getValue(Keys.curSegmentDistance)
    const curSegDist = curSegDistStr ? parseInt(curSegDistStr) : 0

    const newSegment: Segment = {
        fromMetres,
        toMetres: fromMetres + curSegDist,
        time: time.toFixed(1),
        avgSpeed: (curSegDist / time).toFixed(2)
    }
    await Promise.all([
        store.segments.add(newSegment),
        store.points.clear(),
        store.setValue(Keys.curSegmentDistance, 0)
    ])
}

export async function clear(store: UserStore) {
    await Promise.all([
        store.segments.clear(),
        store.points.clear(),
        store.setValue(Keys.curSegmentDistance, 0)
    ])
}

const sendPositionSchema = z.object({
    lat: z.number(),
    long: z.number(),
    timestamp: z.number(),
    distInc: z.number().optional().default(0)
})

export type Point = z.infer<typeof sendPositionSchema>;

export const trackingRouter = createTRPCRouter({
    sendPosition: protectedProcedure.input(sendPositionSchema).mutation(async ({ input, ctx }) => {
        await addPoint(input, ctx.store)
    }),
    // NOTE: test endpoint
    getData: protectedProcedure.query(async ({ ctx: { store } }) => ({
        segments: await store.segments.getAll(),
        curSegmentPoints: await store.points.getAll(),
        curSegmentDist: await store.getValue(Keys.curSegmentDistance),
    }))
})
