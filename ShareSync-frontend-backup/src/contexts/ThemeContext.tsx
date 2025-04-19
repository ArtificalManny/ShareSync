import { createContext, useContext, ReactNode } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';

interface Theme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  border: string;
  buttonBackground: string;
  buttonText: string;
  glow: string;
  accent: string;
  highlight: string;
  warning: string;
  cardBackground: string;
  shadow: string;
}

interface ThemeContextType {
  currentTheme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: darkTheme,
  isDarkMode: true,
  toggleTheme: () => {},
});

// Export ThemeProvider as a named export
export const ThemeProvider = ThemeContext.Provider;

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};