/**
 * Production-safe logger utility
 * Disables console.log in production, keeps it in development
 */

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
    log: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors, even in production
        console.error(...args);
    },
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },
    info: (...args: unknown[]) => {
        if (isDev) {
            console.info(...args);
        }
    }
};

// Disable console.log globally in production
if (!isDev) {
    console.log = () => { };
    console.debug = () => { };
    console.info = () => { };
    // Keep console.warn and console.error for critical issues
}

export default logger;
