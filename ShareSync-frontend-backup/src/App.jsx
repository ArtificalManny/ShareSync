import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import ProjectHome from './pages/ProjectHome';
import CreateProject from './pages/CreateProject';

const App = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(window.location.pathname);

  return (
    <Router>
      <div className="min-h-screen bg-dark-navy">
        {isAuthenticated && !isAuthPage && <Navbar />}
        <div className="flex">
          {isAuthenticated && !isAuthPage && <Sidebar />}
          <main className={isAuthenticated && !isAuthPage ? 'main-content' : 'auth-page'}>
            <Suspense fallback={<div className="text-white text-center mt-10">Loading...</div>}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route
                  path="/"
                  element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
                />
                <Route
                  path="/profile"
                  element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
                />
                <Route
                  path="/projects"
                  element={isAuthenticated ? <Projects /> : <Navigate to="/login" />}
                />
                <Route
                  path="/project/:id"
                  element={isAuthenticated ? <ProjectHome /> : <Navigate to="/login" />}
                />
                <Route
                  path="/create-project"
                  element={isAuthenticated ? <CreateProject /> : <Navigate to="/login" />}
                />
                <Route path="*" element={<div className="text-white text-center mt-10">Not Found</div>} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;