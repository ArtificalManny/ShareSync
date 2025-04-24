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
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Header = () => {
  const { user, isAuthenticated, logoutUser, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#1a2b3c', color: 'white' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>ShareSync</Link>
        <Link to="/home" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Home</Link>
        {!isAuthenticated && (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Register</Link>
          </>
        )}
        {isAuthenticated && (
          <>
            <Link to="/projects" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Projects</Link>
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px' }}>Profile</Link>
            <button onClick={logoutUser} style={{ color: 'white', padding: '5px 10px', border: '1px solid #00d1b2', borderRadius: '5px', background: 'none', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        )}
      </div>
      {isAuthenticated && user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'white' }}>
            <img
              src={user.profilePicture || 'https://via.placeholder.com/40'}
              alt="Profile"
              style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
            />
            <span>{user.firstName} {user.lastName}</span>
          </Link>
        </div>
      )}
    </nav>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
};

export default App;