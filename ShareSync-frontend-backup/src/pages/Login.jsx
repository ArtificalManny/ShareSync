import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './Login.css';

const Login = () => {
  console.log('Login - Starting render');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  console.log('Login - AuthContext:', authContext);

  if (!authContext || !authContext.login) {
    return (
      <div className="login-container">
        <div className="login-card card holographic">
          <h1>Login to ShareSync</h1>
          <p className="text-secondary error">Authentication context is not available.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Login - Submitting:', { email, password });

    try {
      const mockResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: { email, id: 'user-1', name: 'Test User' },
      };
      authContext.login(mockResponse.access_token, mockResponse.refresh_token, mockResponse.user);
      console.log('Login - Navigation to home');
      navigate('/');
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      console.error('Login - Error:', errorMessage, err.stack);
      setError(errorMessage);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card holographic">
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
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
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