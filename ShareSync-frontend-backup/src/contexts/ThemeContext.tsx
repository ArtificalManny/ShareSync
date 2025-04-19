import { createContext, useContext } from 'react';
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

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: darkTheme, // Default to darkTheme to avoid undefined
  isDarkMode: true,
  toggleTheme: () => {},
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};