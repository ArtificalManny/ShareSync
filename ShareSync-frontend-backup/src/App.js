import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import CreateProject from './components/CreateProject';
import Profile from './components/Profile';
import Projects from './components/Projects';
import ProjectHome from './components/ProjectHome';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Home from './components/Home';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading);
  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Header = () => {
  const { user, isAuthenticated, logoutUser, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px',
      backgroundColor: '#1a2b3c',
      color: 'white',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      borderBottom: '1px solid #00d1b2',
    }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link to="/" style={{
          color: 'white',
          textDecoration: 'none',
          padding: '5px 10px',
          border: '1px solid #00d1b2',
          borderRadius: '5px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s, transform 0.1s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#00d1b2'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          ShareSync
        </Link>
        <Link to="/home" style={{
          color: 'white',
          textDecoration: 'none',
          padding: '5px 10px',
          border: '1px solid #00d1b2',
          borderRadius: '5px',
          transition: 'background-color 0.3s, transform 0.1s',
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#00d1b2'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          Home
        </Link>
        {!isAuthenticated && (
          <>
            <Link to="/login" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '5px 10px',
              border: '1px solid #00d1b2',
              borderRadius: '5px',
              transition: 'background-color 0.3s, transform 0.1s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00d1b2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Login
            </Link>
            <Link to="/register" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '5px 10px',
              border: '1px solid #00d1b2',
              borderRadius: '5px',
              transition: 'background-color 0.3s, transform 0.1s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00d1b2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Register
            </Link>
          </>
        )}
        {isAuthenticated && (
          <>
            <Link to="/projects" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '5px 10px',
              border: '1px solid #00d1b2',
              borderRadius: '5px',
              transition: 'background-color 0.3s, transform 0.1s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00d1b2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Projects
            </Link>
            <Link to="/profile" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '5px 10px',
              border: '1px solid #00d1b2',
              borderRadius: '5px',
              transition: 'background-color 0.3s, transform 0.1s',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#00d1b2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Profile
            </Link>
            <button
              onClick={logoutUser}
              style={{
                color: 'white',
                padding: '5px 10px',
                border: '1px solid #00d1b2',
                borderRadius: '5px',
                background: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.3s, transform 0.1s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#ff3860'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              Logout
            </button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button style={{
          padding: '5px 10px',
          background: 'linear-gradient(45deg, #6c63ff, #00d1b2)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'transform 0.1s, box-shadow 0.3s',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)'}
        onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
        >
          Toggle Theme
        </button>
        {isAuthenticated && user && (
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'white' }}>
            <img
              src={user.profilePicture || 'https://via.placeholder.com/40'}
              alt="Profile"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                marginRight: '10px',
                border: '2px solid #00d1b2',
                transition: 'transform 0.3s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            />
            <span style={{ fontWeight: 'bold' }}>{user.firstName} {user.lastName}</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

const App = () => {
  console.log('App - Rendering');
  return (
    <AuthProvider>
      <Router>
        <div style={{
          background: 'linear-gradient(135deg, #0d1a26 0%, #1a2b3c 100%)',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}>
          <Header />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/project/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-project"
              element={
                <ProtectedRoute>
                  <CreateProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/home" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;