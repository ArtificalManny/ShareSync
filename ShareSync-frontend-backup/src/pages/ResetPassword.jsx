import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../utils/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(token, newPassword);
      setMessage('Password reset successfully. Please login with your new password.');
      setError('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(`Failed to reset password: ${err.message}`);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-display text-vibrant-pink mb-6 text-center">Reset Password</h2>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;