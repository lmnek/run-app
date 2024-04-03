import { InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

// play in all circumstances
export const audioSettings = {
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: true,
}
