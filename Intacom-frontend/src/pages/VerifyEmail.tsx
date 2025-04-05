import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './VerifyEmail.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/verify-email?token=${token}`);
        setMessage(response.data.message);
        setError('');
        alert('Email verified successfully!');
      } catch (error: any) {
        console.error('Error verifying email:', error);
        setError(error.response?.data?.message || 'Failed to verify email. Please try again.');
        setMessage('');
      }
    };
    verifyEmail();
  }, [searchParams]);

  return (
    <div className="verify-email">
      <h1 style={{ color: theme.colors.primary }}>Verify Email</h1>
      {message && <p style={{ color: theme.colors.success }}>{message}</p>}
      {error && <p className="error" style={{ color: theme.colors.error }}>{error}</p>}
    </div>
  );
}

export default VerifyEmail;