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
        enableAutoPipelining: true,
        maxRetriesPerRequest: 0 // allow try-catch
    })
    await redis.info()
} catch (err) {
    console.error('Could not connect to Redis')
    exit(-1)
}

export type ListStore = {
    add: (item: any) => Promise<void>;
    getAll: <T = string>() => Promise<T[]>;
    getOnIdx: <T = string>(idx: number) => Promise<T | null>;
    clear: () => Promise<void>;
    length: () => Promise<number>;
}

const listStore = (listKey: string) => {
    return {
        async add(item: any) {
            await redis.rpush(listKey, JSON.stringify(item))
        },
        async getOnIdx<T>(idx: number): Promise<T> {
            const res = await redis.lindex(listKey, idx)
            return res ? JSON.parse(res) : res
        },
        async getAll<T>(): Promise<T[]> {
            const strs = await redis.lrange(listKey, 0, -1)
            return strs.map((s) => JSON.parse(s))
        },
        async clear() {
            await redis.del(listKey)
        },
        async length() {
            return await redis.llen(listKey)
        }
    }
}

export type UserStore = {
    positions: ListStore;
    segments: ListStore;
    messages: ListStore;
    setValue: (key: Keys, value: any) => Promise<void>;
    getValue: (key: Keys) => Promise<string | null>;
    deleteValue: (key: Keys) => Promise<void>;
    retrieveAllValues: () => Promise<{ [key: string]: string }>;
};

export default function getUserStore(userId: string): UserStore {
    const dataKey = `user_data:${userId}`
    return {
        positions: listStore(`user_positions:${userId}`),
        segments: listStore(`user_segments:${userId}`),
        messages: listStore(`user_messages:${userId}`),
        // Hashmap
        async setValue(key: Keys, value: any) {
            await redis.hset(dataKey, key, value)
        },
        async getValue(key: Keys) {
            return await redis.hget(dataKey, key)
        },
        async deleteValue(key: Keys) {
            await redis.hdel(dataKey, key)
        },
        async retrieveAllValues() {
            return await redis.hgetall(dataKey)
        }
    }
}

export enum Keys {
    firstNarationUrl = 'firstNarationUrl',
    curSegmentDistance = 'curSegmentDistance',
    lastSegToMetres = 'lastSegToMetres',
    lastSegEndTime = 'lastSegEndTime',
    topic = 'topic',
    intent = 'intent'
}
