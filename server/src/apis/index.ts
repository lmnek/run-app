// ============================================================================
// API MODULES INDEX - Centralized exports for all API functionality
// ============================================================================

// Shared types and utilities
export * from "./types.js";
export * from "./httpClient.js";

// Weather API
export * from "./weather.js";
export { default as getWeatherStr } from "./weather.js";

// Geocoding API
export * from "./geocoding.js";
export { default as reverseGeocode } from "./geocoding.js";

// TTS API
export * from "./tts.js";
export { textToSpeech, voiceGenders } from "./tts.js";

// LLM API
export * from "./llm.js";
export { 
    createStructure, 
    generateNaration, 
    llmModels, 
    temperatures, 
    openai, 
    openRouter,
    type Message 
} from "./llm.js";

// Prompts API
export * from "./prompts.js";
export { 
    systemInstructions,
    flowInstructions,
    stylePrompt,
    firstNarrationPrompt,
    createStructurePrompt,
    runContextStr,
    entrancePrompt
} from "./prompts.js";
