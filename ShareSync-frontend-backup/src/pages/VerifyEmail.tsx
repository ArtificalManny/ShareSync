import { useEffect, useState } from 'react';
import axios from '../axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`/auth/verify-email/${token}`);
        navigate('/login');
      } catch (error) {
        console.error('Email verification failed:', error);
        setError('Failed to verify email. Please try again.');
      }
    };
    verifyEmail();
  }, [token, navigate]);

  if (error) {
    return (
      <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      Verifying email...
    </div>
  );
};

export default VerifyEmail;