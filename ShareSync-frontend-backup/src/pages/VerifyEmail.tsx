import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const VerifyContainer = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  padding: 30px;
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.shadow};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.border};
  width: 100%;
  max-width: 400px;
  text-align: center;
  margin: 0 auto;
  margin-top: 50px;
`;

const Message = styled.p`
  color: ${({ theme }: { theme: any }) => theme.accent};
  font-size: 16px;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme.warning};
  font-size: 16px;
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

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
        setMessage(response.data.message);
        setTimeout(() => navigate('/login'), 2000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Verification failed');
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <VerifyContainer theme={currentTheme}>
      {message && <Message theme={currentTheme}>{message}</Message>}
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
    </VerifyContainer>
  );
};

export default VerifyEmail;