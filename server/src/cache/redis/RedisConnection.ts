import Redis from 'ioredis';
import { StorageConnection, StorageConfig } from '../../cache/index.js';

// Task element: Redis-specific storage connection
export class RedisConnection extends StorageConnection {
    private redis: Redis | null = null;
    private connected: boolean = false;
    
    constructor(config: StorageConfig) {
        super(config);
    }
    
    async connect(): Promise<void> {
        try {
            this.redis = new Redis(this.config.url);
            await this.redis.info();
            this.connected = true;
        } catch (error) {
            this.connected = false;
            throw new Error(`Failed to connect to Redis: ${error}`);
        }
    }
    
    async disconnect(): Promise<void> {
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
        }
        this.connected = false;
    }
    
    isConnected(): boolean {
        return this.connected && this.redis !== null;
    }
    
    async healthCheck(): Promise<boolean> {
        try {
            if (!this.redis) return false;
            await this.redis.ping();
            return true;
        } catch {
            return false;
        }
    }
    
    // Redis-specific getter
    getRedis(): Redis {
        if (!this.redis) {
            throw new Error('Redis connection not established');
        }
        return this.redis;
    }
}
