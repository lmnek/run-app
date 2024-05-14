import { AudioMode, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { z } from "zod";

// play in all circumstances
export const audioSettings: AudioMode = {
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: true,
    allowsRecordingIOS: false
}

const envSchema = z.object({
    EXPO_PUBLIC_TRPC_URL: z.string(),
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string()
})
export const ENV = envSchema.parse(process.env)

