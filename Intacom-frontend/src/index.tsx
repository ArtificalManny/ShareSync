// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import './global.css';

// Get the DOM element to mount your app
const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

// Create a root.
const root = createRoot(container);

// Render the application.
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
