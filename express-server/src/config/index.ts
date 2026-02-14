import dotenv from 'dotenv';
dotenv.config();

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname || 'localhost',
            port: parseInt(parsed.port || '6379', 10),
            password: parsed.password || undefined,
        };
    } catch {
        return { host: 'localhost', port: 6379 };
    }
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConfig = parseRedisUrl(redisUrl);

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    httpPort: parseInt(process.env.HTTP_PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lumina',

    redis: redisConfig,
    redisUrl: redisUrl,

    jwtSecret: process.env.JWT_SECRET || 'lumina-dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/api/auth/google/callback',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    hocuspocus: {
        debounce: 5000,
        maxDebounce: 30000,
        prefix: 'lumina:doc:',
    },
} as const;

export type Config = typeof config;
