import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Theme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  variables?: Record<string, string>;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const themes: Record<string, Theme> = {
  neon: {
    id: 'neon',
    name: 'Neon (Dark)',
    mode: 'dark',
    variables: {
        '--bg-app': '#0a0a0f',
        '--bg-card': 'rgba(255, 255, 255, 0.03)',
        '--primary-500': '#06b6d4',
        '--primary-glow': 'rgba(6, 182, 212, 0.5)',
    },
    colors: {
        primary: '#06b6d4',
        secondary: '#0891b2',
        accent: '#22d3ee',
    }
  },
  light: {
    id: 'light',
    name: 'Daylight (Light)',
    mode: 'light',
    variables: {
        '--bg-app': '#f8fafc',
        '--bg-card': '#ffffff',
        '--bg-card-hover': '#f1f5f9',
        '--neutral-50': '#0f172a',
        '--neutral-100': '#1e293b',
        '--neutral-200': '#334155',
        '--neutral-500': '#64748b',
        '--neutral-700': '#cbd5e1',
        '--border-subtle': '#e2e8f0',
        '--border-strong': '#cbd5e1',
        '--primary-500': '#0891b2',
        '--primary-glow': 'rgba(8, 145, 178, 0.3)',
    },
    colors: {
        primary: '#0891b2',
        secondary: '#64748b',
        accent: '#0ea5e9',
    }
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    mode: 'dark',
    variables: {
        '--bg-app': '#0d0208',
        '--bg-card': 'rgba(255, 0, 255, 0.05)',
        '--primary-500': '#ff00ff',
        '--primary-glow': 'rgba(255, 0, 255, 0.5)',
        '--color-success': '#00ff00',
        '--color-warning': '#ff8800',
    },
    colors: {
        primary: '#ff00ff',
        secondary: '#00ff00',
        accent: '#ff8800',
    }
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    mode: 'dark',
    variables: {
        '--bg-app': '#000000',
        '--bg-card': 'rgba(0, 255, 65, 0.05)',
        '--primary-500': '#00ff41',
        '--primary-glow': 'rgba(0, 255, 65, 0.5)',
        '--neutral-50': '#00ff41',
        '--neutral-200': '#008f11',
    },
    colors: {
        primary: '#00ff41',
        secondary: '#008f11',
        accent: '#003b00',
    }
  }
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (themeId: string) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>('neon');

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('kalashi-theme');
    if (saved && themes[saved]) {
      setCurrentThemeId(saved);
    }
  }, []);

  const theme = themes[currentThemeId];

  // Apply theme variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Set data-theme attribute
    root.setAttribute('data-theme', theme.mode);
    
    // Reset standard variables first (from CSS)
    // Then apply overrides from theme config
    if (theme.variables) {
        Object.entries(theme.variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    } else {
        // Clear inline styles if switching back to a theme without overrides
        // This is a simplification; ideally we'd track what we set.
        // For now, we assume all themes might set some vars.
    }

    localStorage.setItem('kalashi-theme', theme.id);
  }, [theme]);

  const setTheme = (id: string) => {
    if (themes[id]) setCurrentThemeId(id);
  };

  const toggleMode = () => {
      // Simple toggle logic
      if (theme.mode === 'dark') setTheme('light');
      else setTheme('neon');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
