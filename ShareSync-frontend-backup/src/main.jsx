// /src/main.jsx  (keep this exactly)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './theme.css';
import './styles/gradients.css';
import './styles/motion.css';

if (import.meta.env.MODE !== 'production') {
  import('./utils/perfLog.js'); // dev-only
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);