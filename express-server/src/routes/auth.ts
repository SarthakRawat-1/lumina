import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { UserModel, IUser } from '../models/User.js';
import { config } from '../config/index.js';

const router = Router();

function generateToken(user: IUser): string {
    const payload = { sub: user._id, email: user.email };
    const secret = config.jwtSecret;
    const options = { expiresIn: config.jwtExpiresIn };
    return jwt.sign(payload, secret, options as jwt.SignOptions);
}

function sanitizeUser(user: IUser) {
    return {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };
}

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const user = await UserModel.create({ email, password, name });

        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: sanitizeUser(user),
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', { session: false }, (err: any, user: IUser | false, info: any) => {
        if (err) {
            return res.status(500).json({ error: 'Login failed' });
        }

        if (!user) {
            return res.status(401).json({ error: info?.message || 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: sanitizeUser(user),
        });
    })(req, res, next);
});

router.get('/me', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
    const user = req.user as IUser;
    res.json({ user: sanitizeUser(user) });
});

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${config.clientUrl}/login?error=google_failed` }),
    (req: Request, res: Response) => {
        const user = req.user as IUser;
        const token = generateToken(user);
        res.redirect(`${config.clientUrl}/auth/callback?token=${token}`);
    }
);

router.post('/logout', (req: Request, res: Response) => {
    res.json({ message: 'Logout successful' });
});

export default router;
