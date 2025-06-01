import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
      setMessage(response.data.message || 'Password reset link sent to your email.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-container flex items-center justify-center min-h-screen">
      <div className="forgot-password-card card p-6 glassmorphic max-w-md w-full">
        <h2 className="text-2xl font-inter text-holo-blue mb-4 text-center">Forgot Password</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-holo-gray mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-blue"
              placeholder="Enter your email"
              required
              aria-label="Email Address"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full rounded-full animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
            aria-label={isSubmitting ? "Submitting..." : "Send Reset Link"}
          >
            {isSubmitting ? 'Submitting...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-holo-gray text-center mt-4">
          Remember your password?{' '}
          <Link to="/login" className="text-holo-blue hover:underline focus:outline-none focus:ring-2 focus:ring-holo-blue">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;