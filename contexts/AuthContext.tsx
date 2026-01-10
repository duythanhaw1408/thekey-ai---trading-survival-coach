/**
 * THEKEY AI - Auth Context
 * React context for authentication state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type User, type AuthResponse } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    handleGoogleCallback: (code: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check for cached user first
                const cachedUser = authService.getCachedUser();
                if (cachedUser) {
                    setUser(cachedUser);
                }

                // Then verify with server
                if (authService.isAuthenticated()) {
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                }
            } catch (error) {
                console.error('[Auth] Failed to initialize:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = React.useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.login(email, password);
            setUser(response.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signup = React.useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.signup(email, password);
            setUser(response.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithGoogle = React.useCallback(async () => {
        try {
            const authUrl = await authService.getGoogleAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('[Auth] Google login failed:', error);
            throw error;
        }
    }, []);

    const handleGoogleCallback = React.useCallback(async (code: string) => {
        setIsLoading(true);
        try {
            const response = await authService.handleGoogleCallback(code);
            setUser(response.user);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = React.useCallback(async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshUser = React.useCallback(async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    }, []);

    const value: AuthContextType = React.useMemo(() => ({
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGoogle,
        handleGoogleCallback,
        logout,
        refreshUser
    }), [user, isLoading, login, signup, loginWithGoogle, handleGoogleCallback, logout, refreshUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
