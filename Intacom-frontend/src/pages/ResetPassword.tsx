import { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the password reset process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful reset.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Fallback to default if VITE_API_URL is undefined.

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  console.log('ResetPassword.tsx: VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('ResetPassword.tsx: API_URL:', API_URL);
  console.log('ResetPassword.tsx: Token from URL:', token);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    try {
      console.log('ResetPassword.tsx: Resetting password with token:', token);
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        token,
        newPassword,
      });
      console.log('ResetPassword.tsx: Reset password response:', response.data);
      setMessage(response.data.message || 'Password reset successful. Please log in with your new password.');
      setError(null);
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful reset.
      alert('Password reset successful! Log in with your new password!'); // Placeholder for a more engaging UI effect.
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('ResetPassword.tsx: Reset password error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An error occurred while resetting the password');
      setMessage(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleResetPassword}>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <span onClick={togglePasswordVisibility} className="password-toggle">
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        <div className="password-container">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span onClick={toggleConfirmPasswordVisibility} className="password-toggle">
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        <button type="submit">Reset Password</button>
      </form>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ResetPassword;