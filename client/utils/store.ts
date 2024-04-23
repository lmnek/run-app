import { create } from 'zustand'
import * as Location from 'expo-location';
import { getPreciseDistance } from 'geolib';

export enum GoalType { Duration = "Duration", Distance = "Distance" }

export type GoalInfo = {
    type: GoalType,
    value: number,
    unit: string
}

interface GoalState {
    goalInfo: GoalInfo;
    entranceTimestamps: number[];
    topic: string;
    intent: string;
}

interface GoalAction {
    clearData: () => void;
    setTopic: (topic: string | null) => void;
    setIntent: (intent: string | undefined) => void;
    setGoalValue: (value: number) => void;
    setGoalType: (type: GoalType) => void;
    setTimestamps: (entranceTimestamps: number[]) => void;
    getAllData: () => GoalState;
}

const defaultGoalInfo = {
    type: GoalType.Duration,
    unit: "min",
    value: 10
}

export const useGoalStore = create<GoalState & { api: GoalAction }>((set, get) => ({
    goalInfo: defaultGoalInfo,
    entranceTimestamps: [],
    topic: '',
    intent: '',
    api: {
        clearData: () => set({
            goalInfo: defaultGoalInfo, entranceTimestamps: [], topic: '', intent: ''
        }),
        setTopic: (topic) => set({ topic: topic ? topic : '' }),
        setIntent: (intent) => set({ intent: intent ? intent : '' }),
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
        getAllData: () => get()
    }
}));

type Position = {
    lat: number,
    long: number,
    timestamp: number
}

interface RunData {
    distance: number,
    startTime: number | null,
    endTime: number | null,
    positions: Position[]
}

interface RunAction {
    setStartTime: () => void;
    updatePosition: (newLocation: Location.LocationObject)
        => { newPos: Position, distInc: number };
    clearStore: () => void;
}

export const useRunStore = create<RunData & { api: RunAction }>((set) => ({
    distance: 0,
    startTime: null,
    endTime: null,
    positions: [],
    api: {
        setStartTime: () => set({ startTime: (new Date()).getTime() }),
        updatePosition: (newLocation) => {
            let res: undefined | { newPos: Position, distInc: number } = undefined
            set(({ positions: poss, distance: dist }) => {
                const newPos: Position = {
                    lat: newLocation.coords.latitude, long: newLocation.coords.longitude,
                    timestamp: newLocation.timestamp
                }
                const newPoss = [...poss, newPos]
                let newDist = dist
                const lastPos = poss[poss.length - 1]
                // console.log("Speed: " + newLocation.coords.speed)
                let distInc = !lastPos || newLocation.coords.speed == 0
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
        clearStore: () => set({
            distance: 0,
            startTime: (new Date).getTime(),
            endTime: null,
            positions: []
        })
    }
}
))
