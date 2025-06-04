import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Mail, AlertCircle } from 'lucide-react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, isAuthenticated, isLoading, authError, setAuthError } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAuthError(null);

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    const success = await forgotPassword(email);
    if (success) {
      setSuccess('Password reset link sent to your email.');
    } else {
      setError('Failed to send reset link. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="forgot-password-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading forgot password page"></div>
        <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card card p-6 glassmorphic card-3d">
        <h2 className="text-3xl font-orbitron font-bold text-emerald-green mb-6 text-center">Forgot Password</h2>
        {(error || authError) && (
          <p className="text-crimson-red mb-4 text-center font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {error || authError}
          </p>
        )}
        {success && (
          <p className="text-emerald-green mb-4 text-center font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {success}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-saffron-yellow mb-2 font-inter flex items-center gap-2">
              <Mail className="w-5 h-5" aria-hidden="true" /> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
              placeholder="Enter your email"
              aria-label="Email"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
            aria-label="Send reset link"
          >
            Send Reset Link
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-indigo-vivid hover:underline text-sm font-inter focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
            aria-label="Back to login"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;