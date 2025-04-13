import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!token || !email) {
      setError('Invalid reset link.');
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        { token, newPassword: password, email },
        { withCredentials: true }
      );
      setMessage(response.data.message || 'Password reset successful! Redirecting to login...');
      setError(null);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('ResetPassword.tsx: Error resetting password:', err.message, err.response?.data);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      setMessage(null);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password - ShareSync</h2>
      <form onSubmit={handleResetPassword}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ResetPassword;