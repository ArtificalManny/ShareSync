import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Sun, Moon } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, intendedRoute, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      const redirectTo = login(user, intendedRoute || '/');
      console.log('Login - Redirecting to:', redirectTo);
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-holo-bg-light text-holo-blue hover:text-holo-pink transition-all"
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
      <div className="login-content">
        <h2 className="text-3xl font-inter text-holo-blue mb-6 text-center animate-text-glow">Login to ShareSync</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="card p-6 glassmorphic">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="input-field w-full rounded-full"
                required
                tabIndex={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field w-full rounded-full"
                required
                tabIndex={2}
              />
            </div>
            <Link to="/forgot-password" className="text-holo-blue hover:text-holo-pink transition-all block text-center" tabIndex={3}>
              Forgot Password?
            </Link>
            <button onClick={handleSubmit} className="btn-primary rounded-full w-full animate-glow" tabIndex={4}>Login</button>
            <p className="text-holo-gray text-center">
              Don’t have an account?{' '}
              <Link to="/register" className="text-holo-blue hover:text-holo-pink transition-all" tabIndex={5}>
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;