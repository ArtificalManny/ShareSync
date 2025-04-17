import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.get(`/auth/verify-email/${token}`);
        navigate('/login');
      } catch (error) {
        console.error('Verification failed:', error);
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return <div style={{ background: currentTheme.background, color: currentTheme.text }}>Verifying email...</div>;
};

export default VerifyEmail;