import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Index.tsx: Starting to render the app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Index.tsx: Root element not found!');
  document.body.innerHTML = '<div style="color: red; font-size: 24px; text-align: center; padding: 20px;">Error: Root element not found!</div>';
  throw new Error('Root element not found');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Index.tsx: App rendered successfully.');
} catch (error) {
  console.error('Index.tsx: Error rendering app:', error);
  rootElement.innerHTML = '<div style="color: red; font-size: 24px; text-align: center; padding: 20px;">Error rendering app: ' + error.message + '</div>';
}