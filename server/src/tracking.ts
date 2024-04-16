import { Position } from "./trpc"

const SEGMENT_DISTANCE = 200 // 200 metres

let goal = null

let curSegmentPoints: any[] = []
let curSegmentDistance = 0

export let segments: {
    fromMetres: number,
    toMetres: number,
    time: string,
    avgSpeed: string
}[] = []

// for testting
export function getInfo() {
    return {
        segments,
        curSegmentDistance,
        curSegmentPoints,
    }
}

export function setGoal(newGoal: any) {
    goal = newGoal
    clear()
}

export function addPoint(point: Position) {
    curSegmentPoints.push(point)
    curSegmentDistance += point.distInc
    if (curSegmentDistance >= SEGMENT_DISTANCE) {
        closeSegment()
    }
}

export function closeSegment() {
    const fromMetres = segments.length === 0 ? 0 : segments[segments.length - 1].toMetres
    const time = curSegmentPoints.length < 2 ? 0
        : (curSegmentPoints[curSegmentPoints.length - 1].timestamp - curSegmentPoints[0].timestamp) / 1000
    segments.push({
        fromMetres,
        toMetres: fromMetres + curSegmentDistance,
        time: time.toFixed(1),
        avgSpeed: (curSegmentDistance / time).toFixed(2)
    })
    curSegmentPoints = []
    curSegmentDistance = 0
}

export function clear() {
    segments = []
    curSegmentPoints = []
    curSegmentDistance = 0
}

export function clearSegment() {
    segments = []
}
