// ============================================================================
// SHARED TYPES - Common interfaces and types for API modules
// ============================================================================

// Base API response interface
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}

// API configuration interface
export interface ApiConfig {
    baseUrl?: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
}

// Weather data properties
export interface WeatherProperties {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: boolean;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
}

// Weather units
export interface WeatherUnits {
    temperature_2m: string;
    relative_humidity_2m: string;
    apparent_temperature: string;
    precipitation: string;
    rain: string;
    showers: string;
    snowfall: string;
    weather_code: string;
    cloud_cover: string;
    wind_speed_10m: string;
}

// Weather API response
export interface WeatherApiResponse {
    current: WeatherProperties;
    current_units: WeatherUnits;
}

// Geocoding response
export interface GeocodingResponse {
    type: string;
    display_name: string;
}

// LLM message interface
export interface LlmMessage {
    role: string;
    content: string;
}

// LLM model configuration
export interface LlmModelConfig {
    openRouted: boolean;
    model: string;
}

// Temperature configuration
export interface TemperatureConfig {
    value: number;
    label: string;
}

// Voice configuration
export interface VoiceConfig {
    id: string;
    gender: string;
}

// TTS configuration
export interface TtsConfig {
    engine: string;
    outputFormat: string;
    region: string;
    expiresIn: number;
}
