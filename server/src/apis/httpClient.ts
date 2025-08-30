// ============================================================================
// HTTP CLIENT - Shared HTTP request functionality
// ============================================================================

import fetch from "node-fetch";
import { logger } from "../utils/logger.js";
import { ApiConfig, ApiResponse } from "./types.js";

// Task element: HTTP request execution
export class HttpClient {
    private config: ApiConfig;

    constructor(config: ApiConfig = {}) {
        this.config = {
            timeout: 10000,
            retries: 3,
            headers: {
                "Content-Type": "application/json",
            },
            ...config,
        };
    }

    // Task element: Execute HTTP GET request
    async get<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        return this.executeRequest<T>(url, {
            method: "GET",
            ...options,
        });
    }

    // Task element: Execute HTTP POST request
    async post<T>(url: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
        return this.executeRequest<T>(url, {
            method: "POST",
            body: JSON.stringify(data),
            ...options,
        });
    }

    // Task element: Execute HTTP request with retry logic
    private async executeRequest<T>(
        url: string,
        options: RequestInit,
        attempt: number = 1
    ): Promise<ApiResponse<T>> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.config.headers,
                    ...options.headers,
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                data,
                timestamp: Date.now(),
            };
        } catch (error) {
            logger.warn(`HTTP request failed (attempt ${attempt})`, { url, error });

            if (attempt < this.config.retries) {
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.executeRequest<T>(url, options, attempt + 1);
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: Date.now(),
            };
        }
    }
}

// Task element: Create HTTP client with default configuration
export function createHttpClient(config?: ApiConfig): HttpClient {
    return new HttpClient(config);
}
