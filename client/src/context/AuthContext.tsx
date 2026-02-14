import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => void;
    logout: () => void;
}

// =============================================================================
// API Base URL
// =============================================================================

const AUTH_API_BASE = import.meta.env.VITE_EXPRESS_API_URL || 'http://localhost:3002/api';

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('lumina_token');
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load user on mount or when token changes
    useEffect(() => {
        async function loadUser() {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${AUTH_API_BASE}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    // Token invalid
                    localStorage.removeItem('lumina_token');
                    setToken(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadUser();
    }, [token]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await fetch(`${AUTH_API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('lumina_token', data.token);
        setToken(data.token);
        setUser(data.user);
    }, []);

    const register = useCallback(async (email: string, password: string, name: string) => {
        const response = await fetch(`${AUTH_API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        const data = await response.json();
        localStorage.setItem('lumina_token', data.token);
        setToken(data.token);
        setUser(data.user);
    }, []);

    const loginWithGoogle = useCallback(() => {
        // Redirect to Google OAuth
        window.location.href = `${AUTH_API_BASE}/auth/google`;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('lumina_token');
        setToken(null);
        setUser(null);
    }, []);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// =============================================================================
// Helper to get auth header for API calls
// =============================================================================

export function getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('lumina_token');
    if (token) {
        return { 'Authorization': `Bearer ${token}` };
    }
    return {};
}
