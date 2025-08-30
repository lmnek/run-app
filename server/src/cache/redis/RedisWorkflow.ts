import { StorageWorkflow, StorageConnection, StorageErrorHandler } from '../../cache/index.js';
import { RedisConnection } from './RedisConnection.js';
import { RedisErrorHandler as RedisErrorHandlerImpl } from './RedisErrorHandler.js';

// Workflow element: Redis-specific storage operations workflow
export class RedisWorkflow extends StorageWorkflow {
    constructor(connection: RedisConnection, errorHandler: RedisErrorHandlerImpl) {
        super(connection, errorHandler);
    }
    
    async initialize(): Promise<void> {
        await this.connection.connect();
    }
    
    async cleanup(): Promise<void> {
        await this.connection.disconnect();
    }
    
    async validateOperation(operation: string, data?: any): Promise<boolean> {
        // Basic validation for Redis operations
        if (!this.connection.isConnected()) {
            return false;
        }
        
        // Validate operation types
        const validOperations = ['add', 'get', 'set', 'delete', 'clear'];
        if (!validOperations.includes(operation)) {
            return false;
        }
        
        // Validate data if provided
        if (data !== undefined && data === null) {
            return false;
        }
        
        return true;
    }
}
