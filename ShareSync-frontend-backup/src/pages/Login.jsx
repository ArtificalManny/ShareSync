import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, authError, setAuthError } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Login failed. Please check your credentials.');
    }
  };

  if (isLoading) {
    return (
      <div className="login-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading login page"></div>
        <span className="text-primary-blue text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card card p-6 glassmorphic">
        <h2 className="text-3xl font-orbitron font-bold text-primary-blue mb-6 text-center">Login to ShareSync</h2>
        {(error || authError) && (
          <p className="text-error-red mb-4 text-center font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {error || authError}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <Mail className="w-5 h-5" aria-hidden="true" /> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your email"
              aria-label="Email"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <Lock className="w-5 h-5" aria-hidden="true" /> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter your password"
              aria-label="Password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-gray holographic-effect"
            aria-label="Login"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-primary-blue hover:underline text-sm font-inter focus:outline-none focus:ring-2 focus:ring-neutral-gray"
            aria-label="Forgot password"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="mt-2 text-center">
          <p className="text-secondary-gray font-inter">
            Don’t have an account?{' '}
            <Link
              to="/register"
              className="text-primary-blue hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              aria-label="Go to register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;