import { StorageConnector, StorageConnection, StorageErrorHandler, ListStorage, KeyValueStorage } from '../../cache/index.js';
import { RedisConnection } from './RedisConnection.js';
import { RedisErrorHandler as RedisErrorHandlerImpl } from './RedisErrorHandler.js';
import { RedisWorkflow } from './RedisWorkflow.js';
import { RedisListStorage } from './RedisListStorage.js';
import { RedisKeyValueStorage } from './RedisKeyValueStorage.js';

// Connector element: Redis-specific storage operations coordinator
export class RedisConnector extends StorageConnector {
    private redisConnection: RedisConnection;
    private redisErrorHandler: RedisErrorHandlerImpl;
    
    constructor(
        connection: RedisConnection,
        errorHandler: RedisErrorHandlerImpl,
        workflow: RedisWorkflow
    ) {
        super(workflow);
        this.redisConnection = connection;
        this.redisErrorHandler = errorHandler;
    }
    
    getConnection(): StorageConnection {
        return this.redisConnection;
    }
    
    getErrorHandler(): StorageErrorHandler {
        return this.redisErrorHandler;
    }
    
    createListStorage(key: string): ListStorage {
        return new RedisListStorage(this.redisConnection, this.redisErrorHandler, key);
    }
    
    createKeyValueStorage(prefix: string): KeyValueStorage {
        return new RedisKeyValueStorage(this.redisConnection, this.redisErrorHandler, prefix);
    }
    
    // Redis-specific method for creating user store
    createUserStore(userId: string): {
        positions: ListStorage;
        segments: ListStorage;
        messages: ListStorage;
        setValue: (key: any, value: any) => Promise<void>;
        getValue: (key: any) => Promise<string | null>;
        deleteValue: (key: any) => Promise<void>;
        retrieveAllValues: () => Promise<{ [key: string]: string }>;
        clear: () => Promise<void>;
    } {
        const dataKey = `user_data:${userId}`;
        const keyValueStorage = this.createKeyValueStorage(dataKey);
        
        return {
            positions: this.createListStorage(`user_positions:${userId}`),
            segments: this.createListStorage(`user_segments:${userId}`),
            messages: this.createListStorage(`user_messages:${userId}`),
            setValue: (key: any, value: any) => keyValueStorage.setValue(key, value),
            getValue: (key: any) => keyValueStorage.getValue(key),
            deleteValue: (key: any) => keyValueStorage.deleteValue(key),
            retrieveAllValues: () => keyValueStorage.retrieveAllValues(),
            clear: async () => {
                const redis = this.redisConnection.getRedis();
                await Promise.all([
                    redis.del(dataKey),
                    this.createListStorage(`user_positions:${userId}`).clear(),
                    this.createListStorage(`user_segments:${userId}`).clear(),
                    this.createListStorage(`user_messages:${userId}`).clear()
                ]);
            }
        };
    }
}
