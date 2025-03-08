import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`http://localhost:3000${url}`, {
        username,
        password,
        profilePic: isLogin ? undefined : profilePic,
      });
      setUser(response.data.user);
      alert(isLogin ? 'Login successful' : 'Registration successful');
      navigate('/dashboard'); // Redirect to dashboard after successful login/register
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'An error occurred');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setProfilePic('');
    navigate('/');
  };

  return (
    <>
      <header>
        <h1>Intacom - Project Management</h1>
        {user && (
          <button onClick={handleLogout} style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            Logout
          </button>
        )}
      </header>
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          {user && (
            <>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/projects">Projects</a></li>
              <li><a href="/upload">Upload</a></li>
            </>
          )}
        </ul>
      </nav>
      <main>
        {!user ? (
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {!isLogin && (
              <>
                <label htmlFor="profilePic">Profile Picture URL (optional)</label>
                <input
                  id="profilePic"
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="Profile Picture URL (optional)"
                />
              </>
            )}
            <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              Switch to {isLogin ? 'Register' : 'Login'}
            </button>
          </form>
        ) : (
          <div>
            <h2>Welcome, {user.username}!</h2>
            <p>Please navigate to the dashboard or projects to continue.</p>
          </div>
        )}
      </main>
      <footer>
        <p>&copy; 2025 Intacom. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;