/**
 * Phase 9: Theme Context
 * 
 * Provides theme management with light/dark mode support.
 * Persists user preference and applies theme to document root.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from './design-tokens';

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

const THEME_STORAGE_KEY = 'defense_tapboard_theme';

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {
    // Ignore storage errors
  }
  
  // Default to light theme
  return 'light';
}

function applyThemeToDocument(themeName) {
  if (themeName === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(getInitialTheme);
  
  const theme = themeName === 'dark' ? darkTheme : lightTheme;
  
  useEffect(() => {
    applyThemeToDocument(themeName);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeName);
    } catch (e) {
      // Ignore storage errors
    }
  }, [themeName]);
  
  const toggleTheme = () => {
    setThemeName(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const setTheme = (name) => {
    if (name === 'light' || name === 'dark') {
      setThemeName(name);
    }
  };
  
  const value = {
    theme,
    themeName,
    toggleTheme,
    setTheme,
    isDark: themeName === 'dark',
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
