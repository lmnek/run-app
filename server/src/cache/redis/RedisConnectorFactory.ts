import { StorageConnectorFactory, StorageConnector, StorageConfig } from '../../cache/index.js';
import { RedisConnector } from './RedisConnector.js';
import { RedisConnection } from './RedisConnection.js';
import { RedisErrorHandler } from './RedisErrorHandler.js';
import { RedisWorkflow } from './RedisWorkflow.js';

// Factory element: Redis-specific storage connector factory
export class RedisConnectorFactory extends StorageConnectorFactory {
    async createConnector(config: StorageConfig): Promise<StorageConnector> {
        const connection = new RedisConnection(config);
        const errorHandler = new RedisErrorHandler();
        const workflow = new RedisWorkflow(connection, errorHandler);
        
        return new RedisConnector(connection, errorHandler, workflow);
    }
    
    getSupportedTechnologies(): string[] {
        return ['redis', 'ioredis'];
    }
}
