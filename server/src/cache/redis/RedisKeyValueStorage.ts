import { KeyValueStorage, StorageKey } from '../../cache/index.js';
import { RedisConnection } from './RedisConnection.js';
import { RedisErrorHandler } from './RedisErrorHandler.js';

// Task element: Redis-specific key-value storage operations
export class RedisKeyValueStorage extends KeyValueStorage {
    private connection: RedisConnection;
    private errorHandler: RedisErrorHandler;
    private dataKey: string;
    
    constructor(connection: RedisConnection, errorHandler: RedisErrorHandler, dataKey: string) {
        super();
        this.connection = connection;
        this.errorHandler = errorHandler;
        this.dataKey = dataKey;
    }
    
    async setValue(key: StorageKey, value: any): Promise<void> {
        try {
            const redis = this.connection.getRedis();
            await redis.hset(this.dataKey, key, value);
        } catch (error) {
            this.errorHandler.handleError(error, `setting value for key ${key}`);
        }
    }
    
    async getValue(key: StorageKey): Promise<string | null> {
        try {
            const redis = this.connection.getRedis();
            return await redis.hget(this.dataKey, key);
        } catch (error) {
            this.errorHandler.handleError(error, `getting value for key ${key}`);
        }
    }
    
    async deleteValue(key: StorageKey): Promise<void> {
        try {
            const redis = this.connection.getRedis();
            await redis.hdel(this.dataKey, key);
        } catch (error) {
            this.errorHandler.handleError(error, `deleting value for key ${key}`);
        }
    }
    
    async retrieveAllValues(): Promise<{ [key: string]: string }> {
        try {
            const redis = this.connection.getRedis();
            return await redis.hgetall(this.dataKey);
        } catch (error) {
            this.errorHandler.handleError(error, 'retrieving all values');
        }
    }
}
