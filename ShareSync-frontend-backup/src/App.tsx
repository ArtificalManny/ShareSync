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
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { SocketProvider } from './contexts/SocketContext';
import { lightTheme, darkTheme } from './styles/theme';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalStyles from './styles/GlobalStyles';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.background || '#121212'}; /* Fallback background */
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, ${({ theme }) => theme.primary || '#ab47bc'}, ${({ theme }) => theme.secondary || '#f06292'});
    opacity: 0.1;
    z-index: -1;
    animation: gradientShift 15s ease infinite;

    @keyframes gradientShift {
      0% { transform: translateX(0); }
      50% { transform: translateX(50%); }
      100% { transform: translateX(0); }
    }
  }
`;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  console.log('ProtectedRoute: User context value:', user);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  console.log('App: Starting render');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(isDarkMode ? darkTheme : lightTheme);

  useEffect(() => {
    console.log('App: useEffect - Updating theme, isDarkMode:', isDarkMode);
    setCurrentTheme(isDarkMode ? darkTheme : lightTheme);
  }, [isDarkMode]);

  const toggleTheme = () => {
    console.log('App: Toggling theme');
    setIsDarkMode(!isDarkMode);
  };

  console.log('App: Rendering with currentTheme:', currentTheme);

  return (
    <UserProvider>
      <SocketProvider>
        <ThemeProvider value={{ currentTheme, isDarkMode, toggleTheme }}>
          <GlobalStyles />
          <ErrorBoundary>
            <AppContainer theme={currentTheme}>
              <Router>
                <Header />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/recover" element={<Recover />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email/:token" element={<VerifyEmail />} />
                  <Route path="/project/:id" element={<ProtectedRoute><ProjectHome /></ProtectedRoute>} />
                  <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                </Routes>
              </Router>
            </AppContainer>
          </ErrorBoundary>
        </ThemeProvider>
      </SocketProvider>
    </UserProvider>
  );
}

export default App;