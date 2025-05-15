import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../utils/api';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useUsername, setUseUsername] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginData = useUsername
        ? { username: formData.username, password: formData.password }
        : { email: formData.email, password: formData.password };

      console.log('Attempting login with:', loginData);
      const data = await loginApi(
        useUsername ? formData.username : formData.email,
        formData.password
      );
      console.log('Login API response data:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user); // Set user state synchronously
      console.log('Login successful, navigating to homepage with user:', data.user);
      navigate('/', { state: { user: data.user } }); // Pass user data via navigation state
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('Failed to fetch')) {
        setError('Unable to reach the server. Please ensure the backend is running on http://localhost:3000.');
      } else if (err.message.includes('401')) {
        setError('Invalid credentials. Please check your email/username and password.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card glassmorphic animate-fade-in">
        <h2 className="text-3xl font-display text-vibrant-pink mb-6">Login to ShareSync</h2>
        {error && (
          <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={useUsername}
              onChange={(e) => setUseUsername(e.target.checked)}
              className="mr-2 h-5 w-5 text-vibrant-pink focus:ring-vibrant-pink rounded"
            />
            <label className="text-white">Use Username Instead of Email</label>
          </div>
          {useUsername ? (
            <div>
              <label className="block text-white mb-2 font-medium">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                placeholder="Enter your username"
              />
            </div>
          ) : (
            <div>
              <label className="block text-white mb-2 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                placeholder="Enter your email"
              />
            </div>
          )}
          <div>
            <label className="block text-white mb-2 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full neumorphic hover:scale-105 transition-transform"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/forgot-password" className="text-vibrant-pink hover:text-neon-blue transition-colors">
            Forgot Password?
          </Link>
        </div>
        <div className="mt-3 text-center">
          <p className="text-white">
            Don't have an account?{' '}
            <Link to="/register" className="text-vibrant-pink hover:text-neon-blue transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;