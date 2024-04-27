import { create } from 'zustand'

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

