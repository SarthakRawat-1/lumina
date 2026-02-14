import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../services/database.js';
import { getRedisStatus } from '../services/redis.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            mongodb: getDatabaseStatus(),
            redis: getRedisStatus(),
        },
    });
});

export default router;
