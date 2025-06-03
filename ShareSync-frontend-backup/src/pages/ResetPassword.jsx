import React, { useState, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Lock, AlertCircle } from 'lucide-react';
import './ResetPassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, isAuthenticated, isLoading, authError, setAuthError } = useContext(AuthContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const success = await resetPassword(token, newPassword);
    if (success) {
      setSuccess('Password reset successfully. Please login.');
    } else {
      setError('Failed to reset password. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="reset-password-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading reset password page"></div>
        <span className="text-primary-blue text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card card p-6 glassmorphic">
        <h2 className="text-3xl font-orbitron font-bold text-primary-blue mb-6 text-center">Reset Password</h2>
        {(error || authError) && (
          <p className="text-error-red mb-4 text-center font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {error || authError}
          </p>
        )}
        {success && (
          <p className="text-success-green mb-4 text-center font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {success}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <Lock className="w-5 h-5" aria-hidden="true" /> New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Enter new password"
              aria-label="New Password"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-accent-teal mb-2 font-inter flex items-center gap-2">
              <Lock className="w-5 h-5" aria-hidden="true" /> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Confirm new password"
              aria-label="Confirm Password"
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-gray holographic-effect"
            aria-label="Reset password"
          >
            Reset Password
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-primary-blue hover:underline text-sm font-inter focus:outline-none focus:ring-2 focus:ring-neutral-gray"
            aria-label="Back to login"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;