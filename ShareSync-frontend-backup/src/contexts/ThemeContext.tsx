import { createContext, useContext } from 'react';

interface Theme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  border?: string;
  buttonBackground?: string;
  buttonText?: string;
}

interface ThemeContextType {
  currentTheme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  currentTheme: {
    background: '#ffffff',
    text: '#000000',
    primary: '#007bff',
    secondary: '#6c757d',
  },
  isDarkMode: false,
  toggleTheme: () => {},
});

export const ThemeProvider = ThemeContext.Provider;

export const useTheme = () => useContext(ThemeContext);