import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = searchParams.get('token');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        token,
        newPassword: password,
      });
      console.log('Reset password response:', response.data);
      setSuccess(response.data.message);
      setError('');
    } catch (error: any) {
      console.error('Error resetting password:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to reset password');
      setSuccess('');
    }
  };

  return (
    <div className="reset-password">
      <h1>Reset Password</h1>
      <form onSubmit={handleResetPassword}>
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
        <button type="submit">Reset Password</button>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default ResetPassword;