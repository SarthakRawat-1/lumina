import { Request, Response, NextFunction } from 'express';

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
}

export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({ error: 'Not found' });
}
