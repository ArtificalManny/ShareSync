import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const verifyEmail = async () => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid verification link.');
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/verify-email`,
        { token },
        { withCredentials: true }
      );
      setMessage(response.data.message || 'Email verified successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('VerifyEmail.tsx: Error verifying email:', err.message, err.response?.data);
      setError(err.response?.data?.message || 'Failed to verify email. Please try again.');
    }
  };

  useEffect(() => {
    verifyEmail();
  }, []);

  return (
    <div style={styles.container}>
      <h1>Email Verification - ShareSync</h1>
      {message && <p style={styles.message}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!message && !error && <p>Verifying your email...</p>}
    </div>
  );
};

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#0A192F',
    color: '#FFFFFF',
  },
  message: {
    color: '#00C4B4',
    fontSize: '18px',
  },
  error: {
    color: '#EF5350',
    fontSize: '18px',
  },
};

export default VerifyEmail;