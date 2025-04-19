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

const ErrorMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme.warning};
  font-size: 14px;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme.accent};
  font-size: 14px;
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const Register = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        username,
        firstName,
        lastName,
        birthday,
        password,
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <FormContainer theme={currentTheme}>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          theme={currentTheme}
          required
        />
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          theme={currentTheme}
          required
        />
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          theme={currentTheme}
          required
        />
        <Input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          theme={currentTheme}
          required
        />
        <Input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          placeholder="Birthday"
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
      </form>
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
      {success && <SuccessMessage theme={currentTheme}>{success}</SuccessMessage>}
    </FormContainer>
  );
};

export default Register;