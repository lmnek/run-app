import { create } from 'zustand'
import * as Location from 'expo-location';
import { getPreciseDistance } from 'geolib';

export enum GoalType { Duration = "Duration", Distance = "Distance" }

export type GoalInfo = {
    type: GoalType,
    value: number,
    unit: string
}

interface GoalData {
    goalInfo: GoalInfo;
    entranceTimestamps: number[];
    topic: string | undefined;
    intent: string | undefined;
}

const defaultGoalData: GoalData =
{
    goalInfo: {
        type: GoalType.Duration,
        unit: "min",
        value: 10
    },
    entranceTimestamps: [],
    topic: undefined,
    intent: undefined
}

interface GoalAction {
    clearData: () => void;
    setTopic: (topic: string | undefined) => void;
    setIntent: (intent: string | undefined) => void;
    setGoalValue: (value: number) => void;
    setGoalType: (type: GoalType) => void;
    setTimestamps: (entranceTimestamps: number[]) => void;
    setAllData: (data: GoalData) => void;
    getAllData: () => GoalData;
}

export const useGoalStore = create<GoalData & { api: GoalAction }>((set, get) => ({
    ...defaultGoalData,
    api: {
        setTopic: (topic) => set({ topic }),
        setIntent: (intent) => set({ intent }),
        clearData: () => set(defaultGoalData),
        setGoalValue: (value) => set(state => ({
            goalInfo: state.goalInfo ? { ...state.goalInfo, value } : undefined
        })),
        setGoalType: (type) => set(state => ({
            goalInfo: state.goalInfo
                ? {
                    value: state.goalInfo.value, type,
                    unit: type === GoalType.Duration ? 'min' : 'km'
                }
                : undefined
        })),
        setTimestamps: (entranceTimestamps) => set({ entranceTimestamps }),
        setAllData: (data) => set({ ...data }),
        getAllData: () => get()
    }
}));

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
                    timestamp: newLocation.timestamp,
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


interface DetailData {
    id: number | undefined,
    serial: number | undefined,
    distance: number,
    startTime: number,
    endTime: number,
    duration: number,
    positions: Position[] | undefined,
    speed: number,
    topic: string | undefined,
    intent: string | undefined,
}

interface DetailAction {
    setAll: (details: DetailData) => void;
}

export const useRunDetailStore = create<DetailData & DetailAction>((set) => ({
    id: undefined, serial: -1, distance: -1, startTime: -1, endTime: -1, duration: -1, positions: [], speed: -1, topic: undefined, intent: undefined,
    setAll: (details) => set(details)
}))


