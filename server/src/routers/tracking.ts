import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { UserStore } from "../utils/redisStore";

const SEGMENT_DISTANCE = 200 // metres

export interface Segment {
    fromMetres: number,
    toMetres: number,
    startTime: number,
    endTime: number,
    duration: string,
    speed: string
}

async function addPosition(position: Position, store: UserStore) {
    const posLen = await store.positions.length()
    if (posLen === 0) {
        await store.setValue('lastSegEndTime', position.timestamp)
    }
    await store.positions.add(position)

    const prevDist = await store.getValue('curSegmentDistance')
    const newDist = prevDist
        ? parseInt(prevDist) + position.distInc
        : position.distInc

    store.setValue('curSegmentDistance', newDist)

    if (newDist >= SEGMENT_DISTANCE) {
        closeSegment(store, position)
    }
}

export async function closeSegment(store: UserStore, newPosition: Position | undefined = undefined) {
    const fromMetresStr = await store.getValue('lastSegToMetres')
    const startTimeStr = await store.getValue('lastSegEndTime')
    const fromMetres = parseInt(fromMetresStr!)
    const startTime = parseInt(startTimeStr!)

    const endTime = newPosition ? newPosition.timestamp : (new Date).getTime()
    const duration = (endTime - startTime) / 1000

    const curSegDistStr = await store.getValue('curSegmentDistance')
    const curSegDist = curSegDistStr ? parseInt(curSegDistStr) : 0
    const toMetres = fromMetres + curSegDist

    const newSegment: Segment = {
        fromMetres,
        toMetres,
        duration: duration.toFixed(1),
        speed: (curSegDist / duration).toFixed(2),
        startTime,
        endTime
    }
    await Promise.all([
        store.segments.add(newSegment),
        store.setValue('curSegmentDistance', 0),
        store.setValue('lastSegToMetres', toMetres),
        store.setValue('lastSegEndTime', endTime)
    ])
}

export async function clearSegments(store: UserStore) {
    const lastSegment = await store.segments.getOnIdx<Segment>(-1)
    if (lastSegment) {
        await store.setValue('lastSegEndTime', lastSegment.endTime)
        await store.setValue('lastSegToMetres', lastSegment.toMetres)
    } else {
        const lastPos = await store.positions.getOnIdx<Position>(-1)
        await store.setValue('lastSegEndTime', lastPos?.timestamp)
        const curSegDistance = await store.getValue('curSegmentDistance')
        const lastSegToMetres = await store.getValue('lastSegToMetres')
        await store.setValue('lastSegToMetres', parseInt(lastSegToMetres!) + parseInt(curSegDistance!))
    }
    await store.segments.clear()
}

const positionSchema = z.object({
    lat: z.number(),
    long: z.number(),
    timestamp: z.number(),
    instantSpeed: z.number(),
    distInc: z.number().optional().default(0)
})

export type Position = z.infer<typeof positionSchema>;

export const trackingRouter = createTRPCRouter({
    sendPosition: protectedProcedure.input(positionSchema).mutation(async ({ input, ctx }) => {
        await addPosition(input, ctx.store)
    })
})
