/**
 * THEKEY AI - Auth Page
 * Main auth page that switches between Login and Signup
 */

import React, { useState, useEffect } from 'react';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { EmailVerificationPage } from './EmailVerificationPage';
import { useAuth } from '../../contexts/AuthContext';

type AuthView = 'login' | 'signup' | 'verify';

interface AuthPageProps {
    initialView?: AuthView;
    onAuthSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView = 'login', onAuthSuccess }) => {
    const [view, setView] = useState<AuthView>(() => {
        if (window.location.pathname.includes('/verify-email')) return 'verify';
        return initialView;
    });
    const { isAuthenticated, handleGoogleCallback } = useAuth();

    const hasCalledCallback = React.useRef(false);

    // Handle Google OAuth callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code && !hasCalledCallback.current) {
            hasCalledCallback.current = true;
            console.log('[Auth] Processing Google callback...');

            const cleanup = () => {
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            };

            handleGoogleCallback(code)
                .then(() => {
                    console.log('[Auth] Google login successful');
                    cleanup();
                })
                .catch(err => {
                    console.error('[Auth] Callback failed:', err);
                    cleanup();
                });
        }
    }, [handleGoogleCallback]);

    // Redirect when authenticated
    useEffect(() => {
        if (isAuthenticated && onAuthSuccess) {
            onAuthSuccess();
        }
    }, [isAuthenticated, onAuthSuccess]);

    if (view === 'signup') {
        return <SignupPage onSwitchToLogin={() => setView('login')} />;
    }

    if (view === 'verify') {
        return <EmailVerificationPage />;
    }

    return (
        <LoginPage
            onSwitchToSignup={() => setView('signup')}
        />
    );
};

export { LoginPage } from './LoginPage';
export { SignupPage } from './SignupPage';
export { AuthLayout } from './AuthLayout';
