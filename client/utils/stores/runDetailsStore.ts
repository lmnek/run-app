import { create } from 'zustand'

// Zustand store that keeps the state 
// of all of the run details for the detail screen

interface DetailData {
    id: number | undefined,
    serial: number | undefined,
    distance: number,
    startTime: number,
    endTime: number,
    duration: number,
    speed: number,
    topic: string | undefined,
    intent: string | undefined,
}

interface DetailAction {
    setAll: (details: DetailData) => void;
}

export const useRunDetailStore = create<DetailData & DetailAction>((set) => ({
    id: undefined, serial: -1, distance: -1, startTime: -1, endTime: -1, duration: -1, speed: -1, topic: undefined, intent: undefined,
    setAll: (details) => set(details)
}))


