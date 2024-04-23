import Redis from 'ioredis';
import { exit } from 'node:process';

// Run Redis locally
// https://dev.to/iqquee/how-to-setup-redis-on-linux-4h06
// TODO: .env?
let redis: Redis
try {
    redis = new Redis({
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
        enableAutoPipelining: true,
    });
} catch {
    console.error('Could not connect to Redis')
    exit(-1)
}

export type ListStore = {
    add: (item: any) => Promise<void>;
    getAll: <T = string>() => Promise<T[]>;
    clear: () => Promise<void>;
}

const listStore = (listKey: string) => {
    return {
        async add(item: any) {
            await redis.rpush(listKey, JSON.stringify(item))
        },
        async getAll<T>(): Promise<T[]> {
            const strs = await redis.lrange(listKey, 0, -1)
            return strs.map((s) => JSON.parse(s))
        },
        async clear() {
            await redis.del(listKey)
        }
    }
}

export type UserStore = {
    points: ListStore;
    segments: ListStore;
    messages: ListStore;
    setValue: (key: string, value: any) => Promise<void>;
    getValue: (key: string) => Promise<string | null>;
    deleteValue: (key: string) => Promise<void>;
    retrieveAllValues: () => Promise<{ [key: string]: string }>;
};

export default function getUserStore(userId: string): UserStore {
    const dataKey = `user_data:${userId}`

    return {
        points: listStore(`user_points:${userId}`),
        segments: listStore(`user_segments:${userId}`),
        messages: listStore(`user_messages:${userId}`),
        // Hashmap
        async setValue(key: string, value: any) {
            await redis.hset(dataKey, key, value)
        },
        async getValue(key: string) {
            return await redis.hget(dataKey, key)
        },
        async deleteValue(key: string) {
            await redis.hdel(dataKey, key)
        },
        async retrieveAllValues() {
            return await redis.hgetall(dataKey)
        }
    }
}
