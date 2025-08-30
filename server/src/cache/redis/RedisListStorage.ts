import { ListStorage } from '../../cache/index.js';
import { RedisConnection } from './RedisConnection.js';
import { RedisErrorHandler } from './RedisErrorHandler.js';

// Task element: Redis-specific list storage operations
export class RedisListStorage extends ListStorage {
    private connection: RedisConnection;
    private errorHandler: RedisErrorHandler;
    private listKey: string;
    
    constructor(connection: RedisConnection, errorHandler: RedisErrorHandler, listKey: string) {
        super();
        this.connection = connection;
        this.errorHandler = errorHandler;
        this.listKey = listKey;
    }
    
    async add<T>(item: T): Promise<void> {
        try {
            const redis = this.connection.getRedis();
            await redis.rpush(this.listKey, JSON.stringify(item));
        } catch (error) {
            this.errorHandler.handleError(error, `adding item to list ${this.listKey}`);
        }
    }
    
    async getAll<T>(): Promise<T[]> {
        try {
            const redis = this.connection.getRedis();
            const strings = await redis.lrange(this.listKey, 0, -1);
            return strings.map((s: string) => this.tryParsing<T>(s));
        } catch (error) {
            this.errorHandler.handleError(error, `getting all items from list ${this.listKey}`);
        }
    }
    
    async getOnIdx<T>(idx: number): Promise<T | null> {
        try {
            const redis = this.connection.getRedis();
            const result = await redis.lindex(this.listKey, idx);
            return result ? this.tryParsing<T>(result) : null;
        } catch (error) {
            this.errorHandler.handleError(error, `getting item at index ${idx} from list ${this.listKey}`);
        }
    }
    
    async clear(): Promise<void> {
        try {
            const redis = this.connection.getRedis();
            await redis.del(this.listKey);
        } catch (error) {
            this.errorHandler.handleError(error, `clearing list ${this.listKey}`);
        }
    }
    
    async length(): Promise<number> {
        try {
            const redis = this.connection.getRedis();
            return await redis.llen(this.listKey);
        } catch (error) {
            this.errorHandler.handleError(error, `getting length of list ${this.listKey}`);
        }
    }
    
    // Helper method for parsing Redis values
    private tryParsing<T>(value: string): T {
        try {
            return JSON.parse(value);
        } catch (error) {
            this.errorHandler.handleParseError(value, this.listKey);
        }
    }
}
