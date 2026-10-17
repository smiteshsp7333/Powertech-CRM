import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        enquiry: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1d4ed8',
          bg: '#eff6ff',
          glow: 'rgba(37, 99, 235, 0.15)',
        },
        quotation: {
          DEFAULT: '#7c3aed',
          light: '#8b5cf6',
          dark: '#6d28d9',
          bg: '#f5f3ff',
          glow: 'rgba(124, 58, 237, 0.15)',
        },
        orders: {
          DEFAULT: '#ea580c',
          light: '#f97316',
          dark: '#c2410c',
          bg: '#fff7ed',
          glow: 'rgba(234, 88, 12, 0.15)',
        },
        dispatch: {
          DEFAULT: '#0d9488',
          light: '#14b8a6',
          dark: '#0f766e',
          bg: '#f0fdfa',
          glow: 'rgba(13, 148, 136, 0.15)',
        },
        billing: {
          DEFAULT: '#16a34a',
          light: '#22c55e',
          dark: '#15803d',
          bg: '#f0fdf4',
          glow: 'rgba(22, 163, 74, 0.15)',
        },
        purchase: {
          DEFAULT: '#dc2626',
          light: '#ef4444',
          dark: '#b91c1c',
          bg: '#fef2f2',
          glow: 'rgba(220, 38, 38, 0.15)',
        },
        reports: {
          DEFAULT: '#475569',
          light: '#64748b',
          dark: '#334155',
          bg: '#f8fafc',
          glow: 'rgba(71, 85, 105, 0.15)',
        },
        brand: {
          navy: '#0b1329',
          card: '#111d3d',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
