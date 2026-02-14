/**
 * Auth API - Client functions for authentication endpoints (Express)
 */

import { getAuthHeader } from '@/context/AuthContext';

const API_BASE = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3002/api';

interface LoginResponse {
    token: string;
    user: any;
}

interface RegisterResponse {
    token: string;
    user: any;
}

// =============================================================================
// Helper function for authenticated JSON requests
// =============================================================================

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

// =============================================================================
// Auth API Functions
// =============================================================================

export const authApi = {
    // Get current user
    async me(): Promise<any> {
        return fetchJson('/auth/me');
    },

    // Login
    async login(email: string, password: string): Promise<LoginResponse> {
        return fetchJson<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    // Register
    async register(email: string, password: string, name: string): Promise<RegisterResponse> {
        return fetchJson<RegisterResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
    },

    // Logout
    async logout(): Promise<void> {
        await fetchJson('/auth/logout', { method: 'POST' });
    },

    // Google Login URL
    getGoogleLoginUrl(): string {
        return `${API_BASE}/auth/google`;
    }
};
