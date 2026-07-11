/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF5FF',
          100: '#D9E8FF',
          200: '#BCDAFF',
          300: '#8EC4FF',
          400: '#59A3FF',
          500: '#3380FF',
          600: '#1B5DF5',
          700: '#1448E1',
          800: '#173AB6',
          900: '#19358F',
          950: '#142257',
        },
        secondary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
        light: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['PlusJakartaSans-Regular', 'Inter'],
        mono: ['SpaceMono'],
        'sans-medium': ['PlusJakartaSans-Medium'],
        'sans-bold': ['PlusJakartaSans-Bold'],
        'sans-extrabold': ['PlusJakartaSans-ExtraBold'],
      },
    },
  },
  plugins: [],
};
