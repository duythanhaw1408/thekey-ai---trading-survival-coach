// tests/setup.ts
/**
 * Test setup file for Vitest
 * Configures global testing utilities and mocks
 */

import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
    }),
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Notification API
Object.defineProperty(window, 'Notification', {
    value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
    },
});

// Mock import.meta.env
vi.stubGlobal('import.meta', {
    env: {
        VITE_API_URL: 'http://localhost:8000',
        VITE_GEMINI_API_KEY: 'test-key',
        MODE: 'test',
        DEV: true,
        PROD: false,
    },
});

// Silence console.error during tests (optional)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (args[0]?.includes?.('Warning:')) return;
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });
