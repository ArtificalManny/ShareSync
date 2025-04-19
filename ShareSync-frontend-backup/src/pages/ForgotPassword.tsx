import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const FormContainer = styled.div`
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

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${({ theme }: { theme: any }) => theme.border};
  border-radius: 5px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin: 10px 0;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
  }
`;

const SuccessMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme.accent};
  font-size: 14px;
`;

const ErrorMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme.warning};
  font-size: 14px;
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const ForgotPassword = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSuccess(response.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    }
  };

  return (
    <FormContainer theme={currentTheme}>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          theme={currentTheme}
          required
        />
        <Button type="submit" theme={currentTheme}>Send Reset Link</Button>
      </form>
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
      {success && <SuccessMessage theme={currentTheme}>{success}</SuccessMessage>}
    </FormContainer>
  );
};

export default ForgotPassword;