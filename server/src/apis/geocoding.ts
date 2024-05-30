// ============================================================================
// GEOCODING API - Location data retrieval using OpenStreetMap API
// ============================================================================

import { HttpClient, createHttpClient } from "./httpClient.js";
import { GeocodingResponse } from "./types.js";
import { logger } from "../utils/logger.js";

// ============================================================================
// DATA ELEMENTS - Encapsulated data structures with version transparency
// ============================================================================

// Data element: Geocoding configuration
export class GeocodingConfig {
    private static readonly zoom = 17; // minor street level
    private static readonly format = "jsonv2";
    private static readonly layer = "address,poi,natural,manmade";
    private static readonly language = "en-US";

    static getZoom(): number {
        return this.zoom;
    }

    static getFormat(): string {
        return this.format;
    }

    static getLayer(): string {
        return this.layer;
    }

    static getLanguage(): string {
        return this.language;
    }
}

// Data element: Geocoding location coordinates
export interface GeocodingLocation {
    latitude: number;
    longitude: number;
}

// Data element: Geocoding request parameters
export interface GeocodingRequestParams {
    format: string;
    lat: number;
    lon: number;
    zoom: number;
    layer: string;
    headers: Record<string, string>;
}

// ============================================================================
// TASK ELEMENTS - Single functional tasks with encapsulated arguments
// ============================================================================

// Task element: Geocoding request builder
export class GeocodingRequestBuilder {
    static buildParams(location: GeocodingLocation): GeocodingRequestParams {
        return {
            format: GeocodingConfig.getFormat(),
            lat: location.latitude,
            lon: location.longitude,
            zoom: GeocodingConfig.getZoom(),
            layer: GeocodingConfig.getLayer(),
            headers: {
                "Accept-Language": GeocodingConfig.getLanguage(),
            },
        };
    }

    static buildUrl(params: GeocodingRequestParams): string {
        const queryParams = new URLSearchParams({
            format: params.format,
            lat: params.lat.toString(),
            lon: params.lon.toString(),
            zoom: params.zoom.toString(),
            layer: params.layer,
        });

        return `https://nominatim.openstreetmap.org/reverse?${queryParams.toString()}`;
    }
}

// Task element: Geocoding data retrieval
export class GeocodingDataRetriever {
    private httpClient: HttpClient;

    constructor(httpClient?: HttpClient) {
        this.httpClient = httpClient || createHttpClient();
    }

    async retrieve(location: GeocodingLocation): Promise<GeocodingResponse | null> {
        const params = GeocodingRequestBuilder.buildParams(location);
        const url = GeocodingRequestBuilder.buildUrl(params);

        const response = await this.httpClient.get<GeocodingResponse>(url, {
            headers: params.headers,
        });

        if (!response.success || !response.data) {
            logger.warn('Geocoding API request failed', { location, error: response.error });
            return null;
        }

        return response.data;
    }
}

// Task element: Geocoding data validation
export class GeocodingDataValidator {
    static validate(data: any): data is GeocodingResponse {
        return (
            data &&
            typeof data === 'object' &&
            typeof data.type === 'string' &&
            typeof data.display_name === 'string'
        );
    }
}

// Task element: Geocoding data processing
export class GeocodingDataProcessor {
    static process(data: GeocodingResponse): { type: string; display_name: string } {
        return {
            type: data.type,
            display_name: data.display_name,
        };
    }
}

// ============================================================================
// WORKFLOW ELEMENTS - Orchestrating sequences of actions
// ============================================================================

// Workflow element: Complete geocoding process
export class GeocodingWorkflow {
    private dataRetriever: GeocodingDataRetriever;

    constructor(dataRetriever?: GeocodingDataRetriever) {
        this.dataRetriever = dataRetriever || new GeocodingDataRetriever();
    }

    async execute(location: GeocodingLocation): Promise<{ type: string; display_name: string } | undefined> {
        try {
            // Retrieve geocoding data
            const geocodingData = await this.dataRetriever.retrieve(location);
            
            if (!geocodingData) {
                logger.warn('No geocoding data retrieved', { location });
                return undefined;
            }

            // Validate data structure
            if (!GeocodingDataValidator.validate(geocodingData)) {
                logger.warn('Invalid geocoding data structure', { geocodingData });
                return undefined;
            }

            // Process data
            const processedData = GeocodingDataProcessor.process(geocodingData);
            
            logger.debug('Geocoding data processed successfully', { 
                location, 
                result: processedData 
            });

            return processedData;
        } catch (error) {
            logger.error('Geocoding workflow failed', { location, error });
            return undefined;
        }
    }
}

// ============================================================================
// CONNECTOR ELEMENTS - External system interactions
// ============================================================================

// Connector element: Geocoding API coordinator
export class GeocodingApiConnector {
    private workflow: GeocodingWorkflow;

    constructor(workflow?: GeocodingWorkflow) {
        this.workflow = workflow || new GeocodingWorkflow();
    }

    async reverseGeocode(lat: number, long: number): Promise<{ type: string; display_name: string } | undefined> {
        const location: GeocodingLocation = { latitude: lat, longitude: long };
        return await this.workflow.execute(location);
    }
}

// ============================================================================
// TRIGGER ELEMENTS - Control when actions are triggered
// ============================================================================

// Trigger element: Default geocoding API export (maintains backward compatibility)
export default async function reverseGeocode(lat: number, long: number): Promise<{ type: string; display_name: string } | undefined> {
    const connector = new GeocodingApiConnector();
    return await connector.reverseGeocode(lat, long);
}
