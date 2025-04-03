import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';

const Container = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
`;

const Message = styled.div`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
  text-align: center;
`;

const Title = styled.h2`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: ${theme.typography.h2.fontWeight};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
`;

const Link = styled.a`
  color: ${theme.colors.primary};
  font-size: ${theme.typography.body.fontSize};
  cursor: pointer;
`;

const VerifyEmail = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setMessage('Invalid verification link.');
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/verify-email?token=${token}`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Failed to verify email. Please try again.');
    }
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Message>
        <Title>Email Verification</Title>
        <p>{message}</p>
        <Link onClick={() => navigate('/login')}>Go to Login</Link>
      </Message>
    </Container>
  );
};

export default VerifyEmail;