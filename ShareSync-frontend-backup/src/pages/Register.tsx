import { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const RegisterContainer = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 40px;
  max-width: 400px;
  margin: 50px auto;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const Button = styled.button`
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonText};
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover {
    background: ${({ theme }) => theme.secondary};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ErrorMessage = styled.p`
  color: #ff5555;
  text-align: center;
  margin-top: 10px;
`;

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post('/auth/register', { email, password }, { withCredentials: true });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <RegisterContainer theme={currentTheme}>
      <Title>Register</Title>
      <Form onSubmit={handleRegister}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          theme={currentTheme}
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          theme={currentTheme}
          required
        />
        <Button type="submit" theme={currentTheme}>Register</Button>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </RegisterContainer>
  );
};

export default Register;