import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Import the custom instance.
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the password reset process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful reset.
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
  const email = searchParams.get('email');

  console.log('ResetPassword.tsx: Token from URL:', token);
  console.log('ResetPassword.tsx: Email from URL:', email);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token || !email) {
      setError('Invalid or missing reset token or email');
      return;
    }
    try {
      console.log('ResetPassword.tsx: Resetting password with token:', token);
      const response = await axiosInstance.post('/reset-password', {
        token,
        newPassword,
        email,
      });
      console.log('ResetPassword.tsx: Reset password response:', response.data);
      setMessage(response.data.message || 'Password reset successful. Please log in with your new password.');
      setError(null);
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful reset.
      alert('Password reset successful! Log in with your new password!'); // Placeholder for a more engaging UI effect.
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('ResetPassword.tsx: Reset password error:', err.response?.data || err.message);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 0) {
        setError('Unable to connect to the server. Please check your network connection.');
      } else {
        setError('An unexpected error occurred while resetting the password');
      }
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
      <h2>Reset Password for {email || 'User'}</h2>
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