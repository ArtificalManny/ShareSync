import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(email, password);
      console.log('Login response:', response);
      localStorage.setItem('token', response.access_token);
      console.log('Token stored:', localStorage.getItem('token'));
      console.log('Redirecting to Home page...');
      navigate('/', { replace: true });
    } catch (err) {
      setError(`Failed to login: ${err.message}`);
      console.error('Login error:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-display text-vibrant-pink mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Login
          </button>
        </form>
        <p className="text-white mt-4 text-center">
          Don't have an account?{' '}
          <span className="text-vibrant-pink cursor-pointer" onClick={() => navigate('/register')}>
            Register
          </span>
        </p>
        <p className="text-white mt-2 text-center">
          Forgot your password?{' '}
          <span className="text-vibrant-pink cursor-pointer" onClick={() => navigate('/forgot-password')}>
            Reset Password
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;