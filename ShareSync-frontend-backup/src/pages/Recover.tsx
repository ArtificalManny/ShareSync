import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const RecoverContainer = styled.div`
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

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${({ theme }: { theme: any }) => theme?.border || '#334155'};
  border-radius: 5px;
  background: ${({ theme }) => theme?.cardBackground || 'rgba(255, 255, 255, 0.05)'};
  color: ${({ theme }) => theme?.text || '#e0e7ff'};
`;

const Button = styled.button`
  background: ${({ theme }: { theme: any }) =>
    `linear-gradient(45deg, ${theme?.primary || '#818cf8'}, ${theme?.secondary || '#f9a8d4'})`};
  color: ${({ theme }) => theme?.buttonText || '#0f172a'};
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

const ErrorMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme?.warning || '#e11d48'};
  font-size: 14px;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme?.accent || '#10b981'};
  font-size: 14px;
`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Recover = () => {
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
      const response = await axios.post(`${API_URL}/auth/recover`, { email });
      setSuccess('Recovery email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send recovery email');
    }
  };

  return (
    <RecoverContainer theme={currentTheme}>
      <h2>Recover Account</h2>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          theme={currentTheme}
          required
        />
        <Button type="submit" theme={currentTheme}>
          Send Recovery Email
        </Button>
      </form>
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
      {success && <SuccessMessage theme={currentTheme}>{success}</SuccessMessage>}
    </RecoverContainer>
  );
};

export default Recover;