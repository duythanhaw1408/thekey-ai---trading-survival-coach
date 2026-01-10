/**
 * THEKEY AI - Protected Route
 * Higher-order component to protect routes that require authentication
 */

import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPage } from './index';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, refreshUser } = useAuth();

    // Optionally refresh user data when accessing a protected route
    useEffect(() => {
        if (isAuthenticated) {
            refreshUser().catch(console.error);
        }
    }, [isAuthenticated, refreshUser]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 animate-pulse text-sm">🔒 Đang bảo mật kết nối...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthPage />;
    }

    return <>{children}</>;
};
