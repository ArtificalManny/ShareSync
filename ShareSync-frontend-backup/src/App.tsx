import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import ProjectHome from './pages/ProjectHome';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Recover from './pages/Recover';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import { ThemeProvider } from './contexts/ThemeContext';
import { lightTheme, darkTheme } from './styles/theme';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(isDarkMode ? darkTheme : lightTheme);

  useEffect(() => {
    setCurrentTheme(isDarkMode ? darkTheme : lightTheme);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider value={{ currentTheme, isDarkMode, toggleTheme }}>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/project/:id" element={<ProjectHome />} />
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/recover" element={<Recover />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;