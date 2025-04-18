import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import { UserProvider, useUser } from './contexts/UserContext';
import { lightTheme, darkTheme } from './styles/theme';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

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
    <UserProvider>
      <ThemeProvider value={{ currentTheme, isDarkMode, toggleTheme }}>
        <ErrorBoundary>
          <Router>
            <Header />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/recover" element={<Recover />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route path="/project/:id" element={<ProtectedRoute><ProjectHome /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;