const THEME_KEY = "threattrace_theme";

export const getStoredTheme = () => {
  const value = localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : null;
};

export const getPreferredTheme = () => {
  const stored = getStoredTheme();
  if (stored) return stored;

  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
};

export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (!root) return;

  if (theme === "light") {
    root.classList.add("theme-light");
  } else {
    root.classList.remove("theme-light");
  }

  localStorage.setItem(THEME_KEY, theme);
};

export const initTheme = () => {
  const theme = getPreferredTheme();
  applyTheme(theme);
  return theme;
};

export const toggleTheme = (currentTheme) => {
  const next = currentTheme === "light" ? "dark" : "light";
  applyTheme(next);
  return next;
};

