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
          DEFAULT: '#0B6B3A',
          dark: '#064E2B',
          light: '#1A8F50',
          50: '#f0fdf4',
          100: '#dcfce7',
        },
        cream: '#F8F4E8',
        gold: {
          DEFAULT: '#D6A437',
          light: '#F0C060',
          dark: '#B8861F',
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
