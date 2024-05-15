import { create } from "zustand";
import * as Location from 'expo-location'
import { getPreciseDistance } from "geolib";

// Zustand store that keeps the state 
// of the intermediate data while the run
// is happening

export type Position = {
    lat: number,
    long: number,
    alt: number,
    instantSpeed: number,
    timestamp: number,
    accuracy: number | null
}

interface RunData {
    distance: number,
    startTime: number | null,
    endTime: number | null,
    duration: number | null,
    positions: Position[],
    speed: number | null
}

const defaultRunData: RunData = {
    distance: 0,
    startTime: null,
    endTime: null,
    duration: null,
    positions: [],
    speed: null,
}

interface RunAction {
    setStartTime: () => void;
    setEndTime: () => number;
    updatePosition: (newLocation: Location.LocationObject)
        => { newPos: Position, distInc: number } | undefined;
    setAll: (run: RunData) => void;
    clearStore: () => void;
}

export const useRunStore = create<RunData & { api: RunAction }>((set) => ({
    ...defaultRunData,
    api: {
        setStartTime: () => set({ startTime: (new Date()).getTime() }),
        setEndTime: () => {
            const endTime = (new Date()).getTime()
            set({ endTime })
            return endTime
        },
        // Processing the GPS location when it is returned by the device!
        updatePosition: (newLocation) => {
            let res: undefined | { newPos: Position, distInc: number } = undefined
            // Convert to own object
            const newPos: Position = {
                lat: newLocation.coords.latitude,
                long: newLocation.coords.longitude,
                alt: newLocation.coords.altitude!,
                timestamp: Math.trunc(newLocation.timestamp),
                instantSpeed: newLocation.coords.speed!,
                accuracy: newLocation.coords.accuracy!
            }
            set(({ positions: poss, distance: dist }) => {
                const newPoss = [...poss, newPos]
                let newDist = dist
                const lastPos = poss[poss.length - 1]
                // Compute distance between this and previous position
                let distInc = !lastPos ? 0
                    : getPreciseDistance(
                        { latitude: newPos.lat, longitude: newPos.long },
                        { latitude: lastPos.lat, longitude: lastPos.long },
                        0.1 // acurracy of the calculation 10 cm
                    )
                // Filter out when user is staying still
                if (newPos.instantSpeed < 0.2 && distInc < 3) {
                    return {}
                }
                newDist += distInc
                res = { newPos, distInc }
                // Adding new position and setting new distance covered
                return { positions: newPoss, distance: newDist }
            })
            return res
        },
        setAll: (run) => set({ ...run }),
        clearStore: () => set(defaultRunData)
    }
}
))

