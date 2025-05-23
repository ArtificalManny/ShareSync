import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setMessage(response.message || 'A reset link has been sent to your email.');
    } catch (err) {
      setError('Failed to send reset link: ' + (err.response?.data?.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card card">
        <h1>Forgot Password</h1>
        <p className="text-secondary">Enter your email to receive a reset link.</p>
        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}
        {loading ? (
          <p className="text-secondary">Sending reset link...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading} className="btn-primary">
              Send Reset Link
            </button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;