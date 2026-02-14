import mongoose from 'mongoose';
import { config } from '../config/index.js';

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(config.mongoUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' {
    const states: Record<number, 'disconnected' | 'connected' | 'connecting'> = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
    };
    return states[mongoose.connection.readyState] || 'disconnected';
}
