// src/context/ThemeContext.jsx
//
// Lightweight theme provider (light / dark / system). The chosen mode is
// persisted to localStorage and reflected as the `dark` class on <html>,
// which the CSS-variable palette in index.css keys off. A matching inline
// script in index.html applies the stored theme before first paint so there
// is no flash of the wrong theme.
//
// The marketing landing page is deliberately light-only: it paints with
// hardcoded hex colors rather than the design tokens, so the `dark` class
// never changes how it looks. Dark mode is therefore an app/dashboard
// concern, surfaced through the navbar toggle.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

const STORAGE_KEY = "bethere-theme";

const ThemeContext = createContext(undefined);

const getSystemTheme = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const readStoredTheme = (fallback) => {
  try {
    return localStorage.getItem(STORAGE_KEY) || fallback;
  } catch {
    return fallback;
  }
};

export const ThemeProvider = ({ children, defaultTheme = "system" }) => {
  // "light" | "dark" | "system"
  const [theme, setThemeState] = useState(() => readStoredTheme(defaultTheme));
  // The concrete theme actually painted ("light" | "dark").
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const stored = readStoredTheme(defaultTheme);
    return stored === "system" ? getSystemTheme() : stored;
  });

  // Apply the class and keep it in sync with the OS setting while in
  // "system" mode.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = theme === "system" ? (mql.matches ? "dark" : "light") : theme;
      document.documentElement.classList.toggle("dark", resolved === "dark");
      setResolvedTheme(resolved);
    };

    apply();

    if (theme === "system") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the class still applies.
    }
    setThemeState(next);
  }, []);

  // Flip to the opposite of whatever is currently painted. Resolving from
  // the live class keeps "system" toggles intuitive.
  const toggleTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }, [setTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTheme: PropTypes.oneOf(["light", "dark", "system"]),
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
