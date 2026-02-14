import express from 'express';
import expressWebsockets from 'express-ws';
import cors from 'cors';
import passport from 'passport';
import http from 'http';
import { config } from './config/index.js';
import './config/passport.js';
import { connectDatabase } from './services/database.js';
import { healthRoutes, documentRoutes, authRoutes, analyticsRoutes, notesRoutes, videoRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import { hocuspocus } from './services/hocuspocus.js';

async function main(): Promise<void> {
    await connectDatabase();

    const { app } = expressWebsockets(express());


    const allowedOrigins = [
        config.clientUrl,
        'https://lumina-frontend-c98f.vercel.app',
        'https://lumina-frontend-c98f.vercel.app/',
    ];

    const corsOptions: cors.CorsOptions = {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(passport.initialize());

    app.use('/api', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/notes', notesRoutes);
    app.use('/api/videos', videoRoutes);



    app.ws('/', (websocket, request) => {

        console.log('TEst Connectiom');
        hocuspocus.handleConnection(websocket, request, {})
    });

    app.use(notFoundHandler);
    app.use(errorHandler);

    const PORT = Number(process.env.PORT) || config.httpPort || 3000;

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Server running on port ${PORT}`);
        console.log(`   - REST API: http://localhost:${PORT}/api`);
        console.log(`   - WebSocket: ws://localhost:${PORT}`);
    });

    console.log(`\nEnvironment Variables:`);
    console.log(`   MONGODB_URI - MongoDB connection string`);
    console.log(`   REDIS_URL   - Redis connection string`);
    console.log(`   PORT        - Server port (current: ${PORT})`);
    console.log(`   JWT_SECRET  - JWT signing secret`);
    console.log(`   GOOGLE_CLIENT_ID - Google OAuth client ID`);
}

main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
