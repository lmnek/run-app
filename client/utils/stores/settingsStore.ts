import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware"

export enum LlmModels {
    GPT4 = 'GPT-4',
    GPT35 = 'GPT-3.5',
    Llama3 = 'Llama-3'
}

export enum Voices {
    Male = 'Male',
    Female = 'Female'
}

export enum Temperatures {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High'
}

interface SettingsData {
    privateMode: boolean,
    voice: Voices,
    llmModel: LlmModels,
    temperature: Temperatures
}

interface SettingsAction {
    setPrivateMode: (privateMode: boolean) => void;
    setVoice: (voice: Voices) => void;
    setLlmModel: (llmModel: LlmModels) => void;
    setTemperature: (temperature: Temperatures) => void;
}

// Persistant locally on device!
export const useSettingsStore = create<SettingsData & SettingsAction>()(
    persist((set) => ({
        privateMode: false,
        voice: Voices.Male,
        llmModel: LlmModels.GPT4,
        temperature: Temperatures.Medium,
        setPrivateMode: (privateMode) => set({ privateMode }),
        setVoice: (voice: Voices) => set({ voice }),
        setLlmModel: (llmModel: LlmModels) => set({ llmModel }),
        setTemperature: (temperature: Temperatures) => set({ temperature })
    }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage)
        }
    ))


