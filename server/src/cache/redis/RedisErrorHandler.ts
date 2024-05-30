import { StorageErrorHandler } from '../../cache/index.js';

// Task element: Redis-specific storage error handling
export class RedisErrorHandler extends StorageErrorHandler {
    handleError(error: any, context: string): never {
        const message = `Redis error in ${context}: ${error}`;
        const customError = this.createError(message, 'REDIS_ERROR');
        throw customError;
    }
    
    createError(message: string, code: string): Error {
        return new Error(`[${code}] ${message}`);
    }
    
    // Redis-specific error handling methods
    handleParseError(value: string, key: string): never {
        const message = `Failed to parse Redis value: ${key}\nObject: ${value}`;
        const customError = this.createError(message, 'REDIS_PARSE_ERROR');
        throw customError;
    }
    
    handleConnectionError(error: any): never {
        const message = `Could not connect to Redis: ${error}`;
        const customError = this.createError(message, 'REDIS_CONNECTION_ERROR');
        throw customError;
    }
}
