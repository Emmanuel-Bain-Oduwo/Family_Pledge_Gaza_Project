import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F6D8C',
          dark: '#15516B',
          light: '#2F8FB3',
          50: '#EFF8FC',
          100: '#D9EEF7',
        },
        cream: '#F7F9FC',
        pink: {
          DEFAULT: '#E77BA3',
          light: '#FCE7F0',
          dark: '#C94F80',
        },
        gold: {
          DEFAULT: '#E77BA3',
          light: '#F8B8CF',
          dark: '#C94F80',
        },
        emergency: '#D94A38',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
