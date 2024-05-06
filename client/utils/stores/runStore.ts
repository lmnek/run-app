import { create } from "zustand";
import * as Location from 'expo-location'
import { getPreciseDistance } from "geolib";

export type Position = {
    lat: number,
    long: number,
    instantSpeed: number,
    timestamp: number
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
    speed: null
}

interface RunAction {
    setStartTime: () => void;
    setEndTime: () => number;
    updatePosition: (newLocation: Location.LocationObject)
        => { newPos: Position, distInc: number };
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
        updatePosition: (newLocation) => {
            let res: undefined | { newPos: Position, distInc: number } = undefined
            set(({ positions: poss, distance: dist }) => {
                const newPos: Position = {
                    lat: newLocation.coords.latitude,
                    long: newLocation.coords.longitude,
                    timestamp: Math.trunc(newLocation.timestamp),
                    instantSpeed: newLocation.coords.speed!
                }
                const newPoss = [...poss, newPos]
                let newDist = dist
                const lastPos = poss[poss.length - 1]
                let distInc = !lastPos || newPos.instantSpeed == 0
                    ? 0
                    : getPreciseDistance(
                        { latitude: newPos.lat, longitude: newPos.long },
                        { latitude: lastPos.lat, longitude: lastPos.long }
                    )
                newDist += distInc
                res = { newPos, distInc }
                return { positions: newPoss, distance: newDist }
            })
            return res!
        },
        setAll: (run) => set({ ...run }),
        clearStore: () => set(defaultRunData)
    }
}
))

