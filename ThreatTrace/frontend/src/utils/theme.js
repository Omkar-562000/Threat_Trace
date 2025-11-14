// src/utils/theme.js
export const getStoredTheme = () => {
  try {
    return localStorage.getItem('threattrace_theme');
  } catch {
    return null;
  }
};

export const storeTheme = (theme) => {
  try {
    localStorage.setItem('threattrace_theme', theme);
  } catch {}
};

export const applyTheme = (theme) => {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};
