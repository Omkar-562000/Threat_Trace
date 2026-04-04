/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyberPurple: '#a855f7',
        cyberNeon: '#00eaff',
        cyberDark: '#0a0f1f',
        cyberCard: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        neon: '0 0 25px #a855f7, 0 0 40px #00eaff',
      },
    },
  },
  plugins: [],
};
