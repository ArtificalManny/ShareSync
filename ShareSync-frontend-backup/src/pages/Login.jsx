import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(email, password);
      console.log('Login - Full response:', response);
      const accessToken = response.access_token;
      if (!accessToken) {
        throw new Error('Access token not received from server');
      }
      localStorage.setItem('access_token', accessToken);
      console.log('Login - Access token set in localStorage:', localStorage.getItem('access_token'));
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      console.error('Login - Error:', err.message);
      setError('Failed to log in: ' + (err.response?.data?.message || err.message || 'Please check your credentials or server connection.'));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <h1>Login to ShareSync</h1>
        <p className="text-secondary">Join a community of innovators today!</p>
        {error && <p className="text-secondary error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Login</button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <Link to="/register">Create an Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;