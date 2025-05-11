import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await forgotPassword(email);
      setMessage('Password reset link sent to your email. Please check your inbox.');
      setError('');
      console.log('Reset Token:', response.resetToken); // For testing purposes
    } catch (err) {
      setError(`Failed to send reset link: ${err.message}`);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-display text-vibrant-pink mb-6 text-center">Forgot Password</h2>
        {message && <p className="text-green-500 mb-4">{message}</p>}
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
          <button type="submit" className="btn-primary w-full">
            Send Reset Link
          </button>
        </form>
        <p className="text-white mt-4 text-center">
          Back to{' '}
          <span className="text-vibrant-pink cursor-pointer" onClick={() => navigate('/login')}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;