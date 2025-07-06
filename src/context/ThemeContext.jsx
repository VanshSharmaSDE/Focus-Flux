import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get saved theme from localStorage, default to 'light' if not set
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [isInitialized, setIsInitialized] = useState(false);

  const applyTheme = (newTheme) => {
    const html = document.documentElement;
    
    // Clear existing classes
    html.classList.remove('dark');
    
    if (newTheme === 'dark') {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (newTheme === 'light') {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else if (newTheme === 'system') {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
      }
      localStorage.setItem('theme', 'system');
    }
    
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    // Simple toggle between light and dark
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  };

  const getCurrentTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const isDark = getCurrentTheme() === 'dark';

  // Initialize theme on component mount
  useEffect(() => {
    if (!isInitialized) {
      // Apply the saved theme immediately on first load
      const savedTheme = localStorage.getItem('theme') || 'light';
      applyTheme(savedTheme);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: applyTheme,
    toggleTheme,
    getCurrentTheme,
    isDark,
    isInitialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
