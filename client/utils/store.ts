import { create } from 'zustand'

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

const useGoalStore = create<GoalState & GoalAction>((set, get) => ({
    goalInfo: defaultGoalInfo,
    entranceTimestamps: [],
    topic: '',
    intent: '',
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
}));

export default useGoalStore;

