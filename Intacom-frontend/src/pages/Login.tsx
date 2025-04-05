import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Login.css';

interface User {
  _id: string;
  username: string;
}

interface LoginProps {
  setUser: (user: User) => void;
}

function Login({ setUser }: LoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        identifier,
        password,
      });
      const user = response.data.data.user;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
      alert('Logged in successfully! Welcome back!');
    } catch (error: any) {
      console.error('Error logging in:', error);
      setError(error.response?.data?.message || 'Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="login">
      <h1 style={{ color: theme.colors.primary }}>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
          Login
        </button>
      </form>
      {error && <p className="error" style={{ color: theme.colors.error }}>{error}</p>}
      <Link to="/recover">Forgot Password?</Link>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;