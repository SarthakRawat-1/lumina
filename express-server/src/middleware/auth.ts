import { Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';
import { IUser } from '../models/User.js';

declare global {
    namespace Express {
        interface User extends IUser { }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false }, (err: any, user: IUser | false) => {
        if (err) {
            return res.status(500).json({ error: 'Authentication error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        req.user = user;
        next();
    })(req, res, next);
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false }, (err: any, user: IUser | false) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
}

export function getUserId(req: Request): string {
    if (!req.user) {
        throw new Error('User not authenticated');
    }
    return (req.user as IUser)._id.toString();
}
