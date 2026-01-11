/**
 * THEKEY AI - Auth Service
 * Handles authentication API calls and token management
 */

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

export interface User {
    id: string;
    email: string;
    email_verified: boolean;
    is_pro: boolean;
    created_at: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'thekey_access_token';
const REFRESH_TOKEN_KEY = 'thekey_refresh_token';
const USER_KEY = 'thekey_user';

class AuthService {
    /**
     * Signup with email/password
     */
    async signup(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Signup failed');
        }

        const data: AuthResponse = await response.json();
        this.saveTokens(data);
        return data;
    }

    /**
     * Login with email/password
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            console.log('[AuthService] Attempting login to:', `${API_URL}/auth/login`);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            console.log('[AuthService] Login response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error('[AuthService] Login error:', error);
                throw new Error(error.detail || 'Login failed');
            }

            const data: AuthResponse = await response.json();
            this.saveTokens(data);
            console.log('[AuthService] Login successful');
            return data;
        } catch (error) {
            console.error('[AuthService] Login exception:', error);
            // Provide more specific error messages
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.');
            }
            throw error;
        }
    }

    /**
     * Get Google OAuth URL
     */
    async getGoogleAuthUrl(): Promise<string> {
        const response = await fetch(`${API_URL}/auth/google`);

        if (!response.ok) {
            throw new Error('Google OAuth not available');
        }

        const data = await response.json();
        return data.auth_url;
    }

    /**
     * Handle Google OAuth callback
     */
    async handleGoogleCallback(code: string): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/google/callback?code=${encodeURIComponent(code)}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Google login failed');
        }

        const data: AuthResponse = await response.json();
        this.saveTokens(data);
        return data;
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<{ message: string; email: string }> {
        const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
            method: 'POST'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Verification failed');
        }

        return response.json();
    }

    /**
     * Get current user
     */
    async getCurrentUser(retry = true): Promise<User | null> {
        const token = this.getAccessToken();
        if (!token) return null;

        try {
            console.log('[AuthService] Fetching /me...');
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                console.warn('[AuthService] /me status:', response.status);
                if (response.status === 401 && retry) {
                    console.log('[AuthService] Token expired, attempting refresh...');
                    // Try refresh
                    const refreshed = await this.refreshToken();
                    if (!refreshed) {
                        console.log('[AuthService] Refresh failed, logging out...');
                        this.logout();
                        return null;
                    }
                    console.log('[AuthService] Refresh successful, retrying /me...');
                    return this.getCurrentUser(false); // Only retry once
                }
                return null;
            }

            const user: User = await response.json();
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
        } catch {
            return null;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_URL}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
                method: 'POST'
            });

            if (!response.ok) {
                this.logout();
                return false;
            }

            const data = await response.json();
            localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Logout
     */
    async logout(): Promise<void> {
        const token = this.getAccessToken();

        if (token) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch {
                // Ignore errors
            }
        }

        this.clearTokens();
    }

    /**
     * Save tokens to localStorage
     */
    private saveTokens(data: AuthResponse): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    /**
     * Clear tokens from localStorage
     */
    private clearTokens(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    /**
     * Get access token
     */
    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    /**
     * Get refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Get cached user
     */
    getCachedUser(): User | null {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }
}

export const authService = new AuthService();
