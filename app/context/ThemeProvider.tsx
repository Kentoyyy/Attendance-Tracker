"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', theme);
      // Update document class for global styling
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
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

// Theme color utilities
export const getThemeColors = (isDark: boolean) => {
  if (isDark) {
    return {
      // Dark theme colors
      background: '#121212',
      cardBackground: '#1e1e1e',
      sidebarBackground: '#1e1e1e',
      headerBackground: '#1a1a1a',
      primary: '#006239',
      primaryHover: '#004d2a',
      text: '#fafaeb',
      textSecondary: '#a0a0a0',
      textMuted: '#666666',
      border: '#333333',
      hover: '#2a2a2a',
      hoverSecondary: '#3a3a3a',
      error: '#ff6b6b',
      success: '#006239',
      warning: '#ffa500',
    };
  } else {
    return {
      // Light theme colors
      background: '#ffffff',
      cardBackground: '#ffffff',
      sidebarBackground: '#ffffff',
      headerBackground: '#f8f9fa',
      primary: '#006239',
      primaryHover: '#004d2a',
      text: '#1a1a1a',
      textSecondary: '#4a5568',
      textMuted: '#718096',
      border: '#e2e8f0',
      hover: '#f1f5f9',
      hoverSecondary: '#e2e8f0',
      error: '#dc2626',
      success: '#006239',
      warning: '#ea580c',
      // Light theme specific colors
      lightHover: '#f8fafc',
      lightActive: '#e2e8f0',
      lightButtonHover: '#f1f5f9',
      // Light theme button colors
      lightButton: '#f8f9fa',
      lightButtonActive: '#dee2e6',
    };
  }
};
