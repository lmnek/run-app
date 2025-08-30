// ============================================================================
// WEATHER API - Weather data retrieval using OpenMeteo API
// ============================================================================

import { HttpClient, createHttpClient } from "./httpClient.js";
import { WeatherApiResponse, WeatherProperties, WeatherUnits } from "./types.js";
import { logger } from "../utils/logger.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Weather properties configuration
export class WeatherPropertiesConfig {
    private static readonly properties = [
        "temperature_2m",
        "relative_humidity_2m", 
        "apparent_temperature",
        "is_day",
        "precipitation",
        "rain",
        "showers",
        "snowfall",
        "weather_code",
        "cloud_cover",
        "wind_speed_10m"
    ];

    static getProperties(): string[] {
        return [...this.properties];
    }

    static getPropertiesString(): string {
        return this.properties.join(",");
    }
}

// Data element: Weather location coordinates
export interface WeatherLocation {
    latitude: number;
    longitude: number;
}

// Data element: Formatted weather string
export interface FormattedWeatherString {
    value: string;
    timestamp: number;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Weather data retrieval
export class WeatherDataRetriever {
    private httpClient: HttpClient;

    constructor(httpClient?: HttpClient) {
        this.httpClient = httpClient || createHttpClient();
    }

    async retrieve(location: WeatherLocation): Promise<WeatherApiResponse | null> {
        const propertiesString = WeatherPropertiesConfig.getPropertiesString();
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=${propertiesString}`;

        const response = await this.httpClient.get<WeatherApiResponse>(url);
        
        if (!response.success || !response.data) {
            logger.warn('Weather API request failed', { location, error: response.error });
            return null;
        }

        return response.data;
    }
}

// Task element: Weather data formatting
export class WeatherDataFormatter {
    static format(weatherData: WeatherApiResponse): FormattedWeatherString {
        const properties = WeatherPropertiesConfig.getProperties();
        
        const formattedString = properties.reduce((acc, property) => {
            const value = weatherData.current[property as keyof WeatherProperties];
            const unit = weatherData.current_units[property as keyof WeatherUnits];
            return `${acc}${property}: ${value}${unit}; `;
        }, "");

        return {
            value: formattedString.trim(),
            timestamp: Date.now()
        };
    }
}

// Task element: Weather data validation
export class WeatherDataValidator {
    static validate(weatherData: any): weatherData is WeatherApiResponse {
        return (
            weatherData &&
            typeof weatherData === 'object' &&
            weatherData.current &&
            weatherData.current_units &&
            typeof weatherData.current === 'object' &&
            typeof weatherData.current_units === 'object'
        );
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Complete weather retrieval process
export class WeatherRetrievalWorkflow {
    private dataRetriever: WeatherDataRetriever;

    constructor(dataRetriever?: WeatherDataRetriever) {
        this.dataRetriever = dataRetriever || new WeatherDataRetriever();
    }

    async execute(location: WeatherLocation): Promise<string> {
        try {
            // Retrieve weather data
            const weatherData = await this.dataRetriever.retrieve(location);
            
            if (!weatherData) {
                logger.warn('No weather data retrieved', { location });
                return '';
            }

            // Validate data structure
            if (!WeatherDataValidator.validate(weatherData)) {
                logger.warn('Invalid weather data structure', { weatherData });
                return '';
            }

            // Format data for display
            const formattedWeather = WeatherDataFormatter.format(weatherData);
            
            logger.debug('Weather data formatted successfully', { 
                location, 
                timestamp: formattedWeather.timestamp 
            });

            return formattedWeather.value;
        } catch (error) {
            logger.error('Weather retrieval workflow failed', { location, error });
            return '';
        }
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Weather API coordinator
export class WeatherApiConnector {
    private workflow: WeatherRetrievalWorkflow;

    constructor(workflow?: WeatherRetrievalWorkflow) {
        this.workflow = workflow || new WeatherRetrievalWorkflow();
    }

    async getWeatherString(lat: number, long: number): Promise<string> {
        const location: WeatherLocation = { latitude: lat, longitude: long };
        return await this.workflow.execute(location);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: Default weather API export (maintains backward compatibility)
export default async function getWeatherStr(lat: number, long: number): Promise<string> {
    const connector = new WeatherApiConnector();
    return await connector.getWeatherString(lat, long);
}
