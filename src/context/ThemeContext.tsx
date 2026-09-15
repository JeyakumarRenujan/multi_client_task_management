import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type SidebarTheme = 'slate' | 'sage' | 'dark' | 'white';
export type AccentColor = 'emerald' | 'rose' | 'blue' | 'purple' | 'amber';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  sidebarTheme: SidebarTheme;
  setSidebarTheme: (theme: SidebarTheme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('meplus_theme') as Theme;
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    // Auto-detect PC/OS preference if not set
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  });

  const [sidebarTheme, setSidebarThemeState] = useState<SidebarTheme>(() => {
    const saved = localStorage.getItem('meplus_sidebar_theme') as SidebarTheme;
    if (saved === 'slate' || saved === 'sage' || saved === 'dark' || saved === 'white') return saved;
    return 'slate'; // Default is modern distinguished slate!
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('meplus_accent_color') as AccentColor;
    if (['emerald', 'rose', 'blue', 'purple', 'amber'].includes(saved)) return saved;
    return 'emerald';
  });

  const setSidebarTheme = (newTheme: SidebarTheme) => {
    setSidebarThemeState(newTheme);
    localStorage.setItem('meplus_sidebar_theme', newTheme);
  };

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor);
    localStorage.setItem('meplus_accent_color', newColor);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-accent-color', newColor);
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-accent-color', accentColor);
    }
  }, [accentColor]);

  // Listen to OS/PC theme changes and apply to DOM
  useEffect(() => {
    const updateTheme = () => {
      let active: 'light' | 'dark' = 'light';
      if (theme === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        active = isDark ? 'dark' : 'light';
      } else {
        active = theme;
      }

      setActualTheme(active);

      const root = document.documentElement;
      if (active === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();
    localStorage.setItem('meplus_theme', theme);

    // Watch for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'dark') return 'light';
      return 'dark';
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        actualTheme,
        toggleTheme,
        setTheme,
        sidebarTheme,
        setSidebarTheme,
        accentColor,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
