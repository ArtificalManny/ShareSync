import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('main.jsx - Starting render process...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('main.jsx - Root element not found!');
} else {
  console.log('main.jsx - Root element found, rendering App...');
  try {
    ReactDOM.createRoot(rootElement).render(<App />);
    console.log('main.jsx - App rendered successfully.');
  } catch (error) {
    console.error('main.jsx - Failed to render App:', error);
  }
}