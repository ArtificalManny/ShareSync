import { useEffect } from 'react';
import axios from '../axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`/auth/verify-email/${token}`);
        navigate('/login');
      } catch (error) {
        console.error('Email verification failed:', error);
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      Verifying email...
    </div>
  );
};

export default VerifyEmail;