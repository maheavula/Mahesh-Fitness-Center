/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: '#e8ecf2',
          surface: '#e8ecf2',
          text: '#2d3748',
          muted: '#718096',
          primary: '#10b981', // Energetic green accent
          'primary-dark': '#059669',
          secondary: '#3b82f6', // Muted blue accent
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      },
      boxShadow: {
        'neu-raised': '8px 8px 16px #c4c9d4, -8px -8px 16px #ffffff',
        'neu-raised-sm': '4px 4px 10px #c4c9d4, -4px -4px 10px #ffffff',
        'neu-raised-lg': '12px 12px 24px #be8ed4, -12px -12px 24px #ffffff',
        'neu-pressed': 'inset 4px 4px 8px #c4c9d4, inset -4px -4px 8px #ffffff',
        'neu-pressed-sm': 'inset 2px 2px 5px #c4c9d4, inset -2px -2px 5px #ffffff',
        'neu-flat': '4px 4px 8px #d0d5e0, -4px -4px 8px #ffffff',
      },
      borderRadius: {
        'neu': '1.25rem',
        'neu-sm': '0.75rem',
        'neu-lg': '2rem',
      }
    },
  },
  plugins: [],
}
