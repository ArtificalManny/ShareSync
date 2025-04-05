import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './ResetPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const token = searchParams.get('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset`, {
        token,
        password,
      });
      setMessage(response.data.message);
      setError('');
      alert('Password reset successfully!');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
      setMessage('');
    }
  };

  return (
    <div className="reset-password">
      <h1 style={{ color: theme.colors.primary }}>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit" style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
          Reset Password
        </button>
      </form>
      {message && <p style={{ color: theme.colors.success }}>{message}</p>}
      {error && <p className="error" style={{ color: theme.colors.error }}>{error}</p>}
    </div>
  );
}

export default ResetPassword;