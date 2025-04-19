export interface Theme {
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

export const lightTheme: Theme = {
  background: '#d1d8f0',
  text: '#0f172a',
  primary: '#4f46e5',
  secondary: '#ec4899',
  border: '#93c5fd',
  buttonBackground: '#4f46e5',
  buttonText: '#f8fafc',
  glow: 'rgba(79, 70, 229, 0.5)',
  accent: '#22d3ee',
  highlight: '#8b5cf6',
  warning: '#f43f5e',
  cardBackground: 'rgba(255, 255, 255, 0.3)',
  shadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
};

export const darkTheme: Theme = {
  background: '#0f172a',
  text: '#e0e7ff',
  primary: '#818cf8',
  secondary: '#f9a8d4',
  border: '#334155',
  buttonBackground: '#818cf8',
  buttonText: '#0f172a',
  glow: 'rgba(129, 140, 248, 0.5)',
  accent: '#10b981',
  highlight: '#c4b5fd',
  warning: '#e11d48',
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  shadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
};