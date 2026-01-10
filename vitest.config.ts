/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['components/**/*.tsx', 'services/**/*.ts', 'hooks/**/*.ts'],
            exclude: ['node_modules', 'dist']
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './'),
            '@components': resolve(__dirname, './components'),
            '@services': resolve(__dirname, './services'),
            '@hooks': resolve(__dirname, './hooks'),
        }
    }
})
