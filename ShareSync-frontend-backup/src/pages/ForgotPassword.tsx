import { useState } from 'react';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const glowPulse = keyframes`
  0% { box-shadow: 0 0 10px ${({ theme }) => theme.glow}; }
  50% { box-shadow: 0 0 20px ${({ theme }) => theme.glow}; }
  100% { box-shadow: 0 0 10px ${({ theme }) => theme.glow}; }
`;

const ForgotPasswordContainer = styled.div`
  background: ${({ theme }) => theme.cardBackground};
  backdrop-filter: blur(10px);
  color: ${({ theme }) => theme.text};
  padding: 40px;
  max-width: 400px;
  margin: 50px auto;
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.shadow};
  animation: ${fadeIn} 1s ease-in-out;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${({ theme }) => theme.glow}, transparent);
    opacity: 0.3;
    z-index: -1;
    animation: ${glowPulse} 5s ease infinite;
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  font-size: 28px;
  color: ${({ theme }) => theme.accent};
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 16px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  outline: none;
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
`;

const Message = styled.p`
  color: ${({ theme }) => theme.accent};
  text-align: center;
  margin-top: 10px;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.warning};
  text-align: center;
  margin-top: 10px;
  text-shadow: 0 0 5px ${({ theme }) => theme.warning};
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentTheme } = useTheme();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    console.log('Frontend: Sending forgot password request with email:', email);
    try {
      const response = await axios.post('/auth/forgot-password', { email }, { withCredentials: true });
      setMessage('A password reset link has been sent to your email (check console for the link).');
      console.log('Reset link:', response.data.resetLink);
    } catch (err: any) {
      console.error('Frontend: Forgot password error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ForgotPasswordContainer theme={currentTheme}>
      <Title>Forgot Password</Title>
      <Form onSubmit={handleForgotPassword}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          theme={currentTheme}
          required
          disabled={loading}
        />
        <Button type="submit" theme={currentTheme} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </Form>
      {message && <Message theme={currentTheme}>{message}</Message>}
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
    </ForgotPasswordContainer>
  );
};

export default ForgotPassword;