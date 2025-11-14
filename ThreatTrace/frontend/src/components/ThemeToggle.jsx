// src/components/ThemeToggle.jsx
import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, storeTheme } from '../utils/theme';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getStoredTheme() || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  const toggle = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="px-3 py-1 rounded-md focus:outline-none border dark:border-gray-700"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.47 4.54l1.79 1.8 1.5-1.5zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.24-18.16l1.79-1.8-1.49-1.5-1.8 1.79 1.5 1.5zM20 11v2h3v-2h-3zM6.76 19.16l-1.79 1.8 1.49 1.5 1.8-1.79-1.5-1.5zM12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>
          <span className="hidden sm:inline">Light</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor"><path d="M9.37 5.51A7 7 0 1018.49 14.63 7 7 0 009.37 5.51z" /></svg>
          <span className="hidden sm:inline">Dark</span>
        </span>
      )}
    </button>
  );
}
