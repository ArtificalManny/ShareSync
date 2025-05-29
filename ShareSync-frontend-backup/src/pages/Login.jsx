import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { User, Lock } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, intendedRoute } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Login - Component mounted. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (isAuthenticated && !isLoading) {
      console.log('Login - User is authenticated, redirecting to:', intendedRoute || '/');
      navigate(intendedRoute || '/', { replace: true });
    }
  }, [isAuthenticated, isLoading, intendedRoute, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login - Submitting form with email:', email);
    try {
      const redirectTo = await login(email, password);
      console.log('Login - Login successful, redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login - Login failed:', err.message);
      setError('Login failed: ' + (err.message || 'Please try again.'));
    }
  };

  if (isLoading) {
    console.log('Login - Rendering loading state');
    return <div className="login-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  return (
    <div className="login-container">
      <div className="login-card card p-8 glassmorphic">
        <h1 className="text-3xl font-inter text-holo-blue mb-6 flex items-center justify-center animate-text-glow">
          <User className="w-6 h-6 mr-2" /> Login
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
          <div className="flex items-center gap-2 w-full max-w-xs">
            <User className="w-5 h-5 text-holo-pink" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2 w-full max-w-xs">
            <Lock className="w-5 h-5 text-holo-pink" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full max-w-xs rounded-full animate-glow">Login</button>
        </form>
        <p className="text-holo-gray mt-4 text-center">
          Forgot your password? <Link to="/forgot-password" className="text-holo-blue hover:underline">Reset it</Link>
        </p>
        <p className="text-holo-gray mt-2 text-center">
          Don't have an account? <Link to="/register" className="text-holo-blue hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;