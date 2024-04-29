import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware"
import { LlmModel, Temperature, Voice } from "../trpc";

export const voices: Voice[] = ['Male', 'Female']
export const llmModels: LlmModel[] = ['GPT-4', 'GPT-3.5', 'Llama-3']
export const temperatures: Temperature[] = ['Low', 'Medium', 'High']

export const frequencies = ['Low', 'Medium', 'High'] as const
export type Frequency = typeof frequencies[number]

interface SettingsData {
    privateMode: boolean,
    voice: Voice,
    llmModel: LlmModel,
    temperature: Temperature,
    frequency: Frequency
}

interface SettingsAction {
    setPrivateMode: (privateMode: boolean) => void;
    setVoice: (voice: Voice) => void;
    setLlmModel: (llmModel: LlmModel) => void;
    setTemperature: (temperature: Temperature) => void;
    setFrequency: (frequency: Frequency) => void;
}


// Persistant locally on device!
export const useSettingsStore = create<SettingsData & SettingsAction>()(
    persist((set) => ({
        privateMode: false,
        voice: 'Male',
        llmModel: 'GPT-4',
        temperature: 'Medium',
        frequency: 'Medium',
        setPrivateMode: (privateMode) => set({ privateMode }),
        setVoice: (voice: Voice) => set({ voice }),
        setLlmModel: (llmModel: LlmModel) => set({ llmModel }),
        setTemperature: (temperature: Temperature) => set({ temperature }),
        setFrequency: (frequency: Frequency) => set({ frequency })
    }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage)
        }
    ))


export { Voice, LlmModel, Temperature };

