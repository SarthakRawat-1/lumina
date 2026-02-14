import Redis from 'ioredis';
import { config } from '../config/index.js';

// @ts-expect-error - ioredis ESM/CJS interop issue, works at runtime
export const redisClient = new Redis(config.redisUrl, {
    retryStrategy: (times: number): number | void => {
        if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return;
        }
        return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('error', (err: Error) => console.error('Redis error:', err));

export function getRedisStatus(): 'connected' | 'disconnected' | 'connecting' {
    const status = redisClient.status;
    if (status === 'ready') return 'connected';
    if (status === 'connecting' || status === 'reconnecting') return 'connecting';
    return 'disconnected';
}
