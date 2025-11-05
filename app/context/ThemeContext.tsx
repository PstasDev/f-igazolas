'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useFrontendConfig } from './FrontendConfigContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const { config, updateConfig, loading } = useFrontendConfig();

  // Initialize theme from frontend config or localStorage
  useEffect(() => {
    if (loading || isInitialized) return;

    // Try to get theme from frontend config first
    const configTheme = config.appearance?.themeMode;
    
    if (configTheme) {
      setTheme(configTheme);
    } else {
      // Fallback to localStorage or system preference
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (prefersDark) {
        setTheme('dark');
      }
    }
    
    setIsInitialized(true);
  }, [config, loading, isInitialized]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Keep localStorage in sync as backup
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Persist to backend via frontend config
    try {
      await updateConfig({
        appearance: {
          themeMode: newTheme,
        },
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Theme is already updated locally, so just log the error
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
