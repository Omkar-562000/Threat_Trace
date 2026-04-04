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
        cyberBlue: '#38bdf8',
        cyberDark: '#0a0f1f',
        cyberCard: 'rgba(255,255,255,0.08)',
        neon: '#00eaff',
        glass: 'rgba(255,255,255,0.08)',
        dark: {
          700: '#111827',
          800: '#0f172a',
          900: '#020617',
        },
      },
      boxShadow: {
        neon: '0 0 25px #a855f7, 0 0 40px #00eaff',
      },
      fontFamily: {
        Orbitron: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
