/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'background': '#0D0E12',
                'panel': '#1C1C1E',
                'divider': 'rgba(255, 255, 255, 0.1)',

                // Flat Dark UI Palette
                'accent-primary': '#4A90E2',
                'accent-glow': 'rgba(74, 144, 226, 0.5)',
                'accent-red': '#FF3B30',
                'accent-yellow': '#FFCC00',
                'accent-green': '#34C759',

                'text-main': '#F5F5F7',
                'text-secondary': '#8A8A8E',

                'gray-900': '#1C1C1E',
                'gray-800': '#2C2C2E',
                'gray-700': '#3A3A3C',
                'gray-600': '#555558',
                'gray-400': '#8A8A8E',
                'gray-200': '#F5F5F7',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        }
    },
    plugins: [],
}
