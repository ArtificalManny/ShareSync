import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ThemeContext } from './context/ThemeContext';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import Projects from './components/Projects';
import ProjectHome from './components/ProjectHome';
import Profile from './components/Profile';
import CreateProject from './components/CreateProject';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

const App = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const { currentTheme, toggleTheme } = useContext(ThemeContext);

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '20px', background: '#0d1a26', minHeight: '100vh' }}>Loading...</div>;
  }

  const isAuthenticated = !!user;

  return (
    <Router>
      <div style={{
        background: currentTheme === 'dark' ? 'linear-gradient(45deg, #0d1a26, #1a2b3c)' : 'linear-gradient(45deg, #e0e7ff, #f0f0f0)',
        minHeight: '100vh',
        color: currentTheme === 'dark' ? 'white' : 'black',
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          background: currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        }}>
          <Link to="/" style={{
            fontSize: '1.5em',
            fontWeight: 'bold',
            color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
            textDecoration: 'none',
            border: `2px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
            padding: '5px 15px',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
          }}
          >
            ShareSync
          </Link>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/" style={{
              color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
              textDecoration: 'none',
              fontSize: '1em',
              padding: '5px 15px',
              borderRadius: '5px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
            >
              Home
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/projects" style={{
                  color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
                  textDecoration: 'none',
                  fontSize: '1em',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                >
                  Projects
                </Link>
                <Link to="/profile" style={{
                  color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
                  textDecoration: 'none',
                  fontSize: '1em',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                >
                  Profile
                </Link>
                <button onClick={logout} style={{
                  color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1em',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
                  textDecoration: 'none',
                  fontSize: '1em',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                >
                  Login
                </Link>
                <Link to="/register" style={{
                  color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
                  textDecoration: 'none',
                  fontSize: '1em',
                  padding: '5px 15px',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = currentTheme === 'dark' ? 'rgba(0, 209, 178, 0.2)' : 'rgba(108, 99, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                >
                  Register
                </Link>
              </>
            )}
            <button onClick={toggleTheme} style={{
              padding: '8px 20px',
              background: 'linear-gradient(45deg, #6c63ff, #00d1b2)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '1em',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
              e.target.style.transform = 'scale(1)';
            }}
            >
              Toggle Theme
            </button>
          </div>
        </nav>
        <Routes>
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} />
          <Route path="/reset-password/:token" element={isAuthenticated ? <Navigate to="/" /> : <ResetPassword />} />
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/projects" element={isAuthenticated ? <Projects /> : <Navigate to="/login" />} />
          <Route path="/project/:projectId" element={isAuthenticated ? <ProjectHome /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/create-project" element={isAuthenticated ? <CreateProject /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;