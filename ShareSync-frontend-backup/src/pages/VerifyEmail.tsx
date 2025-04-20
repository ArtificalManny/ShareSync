import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const Container = styled.div`
  background: ${({ theme }: { theme: any }) => theme?.cardBackground || 'rgba(255, 255, 255, 0.05)'};
  color: ${({ theme }) => theme?.text || '#e0e7ff'};
  padding: 30px;
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme?.shadow || '0 4px 30px rgba(0, 0, 0, 0.3)'};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme?.border || '#334155'};
  width: 100%;
  max-width: 400px;
  text-align: center;
  margin: 0 auto;
  margin-top: 50px;
`;

const Message = styled.p`
  font-size: 16px;
  color: ${({ theme }: { theme: any }) => theme?.accent || '#10b981'};
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: ${({ theme }: { theme: any }) => theme?.warning || '#e11d48'};
`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const VerifyEmail = () => {
  const { currentTheme } = useTheme();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to verify email');
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <Container theme={currentTheme}>
      <h2>Email Verification</h2>
      {message && <Message theme={currentTheme}>{message}</Message>}
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
    </Container>
  );
};

export default VerifyEmail;