import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Recover from './pages/Recover';
import ResetPassword from './pages/ResetPassword';

interface User {
  _id: string;
  username: string;
  email: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div>
        {user && <Header />}
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/recover" element={<Recover />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
          <Route path="/projects" element={user ? <Projects user={user} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <Notifications user={user} /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
          <Route path="/logout" element={<Navigate to="/login" replace state={{ logout: handleLogout }} />} />
          <Route path="*" element={<Navigate to={user ? '/' : '/login'} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;