import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { AuthContextProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthContextProvider>
      <ThemeProvider>
        <App />
        <ToastContainer />
      </ThemeProvider>
    </AuthContextProvider>
  </React.StrictMode>
);