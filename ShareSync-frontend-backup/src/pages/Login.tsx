import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
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

const LinkText = styled.a`
  color: ${({ theme }: { theme: any }) => theme.accent};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.highlight};
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

const Login = () => {
  console.log('Login: Starting render');
  const { currentTheme } = useTheme();
  console.log('Login: Theme context:', currentTheme);
  const { setUser } = useUser();
  console.log('Login: User context setUser function retrieved');
  const navigate = useNavigate();
  console.log('Login: Navigate function retrieved');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      console.log('Login: Submitting form with email:', email);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, access_token } = response.data;
      localStorage.setItem('token', access_token);
      setUser(user);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/projects'), 1000);
    } catch (err: any) {
      console.error('Login: Error during login:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  console.log('Login: Rendering form with email:', email, 'password:', password);
  return (
    <FormContainer theme={currentTheme}>
      <h2>Login</h2>
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          theme={currentTheme}
          required
        />
        <Button type="submit" theme={currentTheme}>Login</Button>
      </form>
      <LinkText theme={currentTheme} onClick={() => navigate('/forgot-password')}>
        Forgot Password?
      </LinkText>
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
      {success && <SuccessMessage theme={currentTheme}>{success}</SuccessMessage>}
    </FormContainer>
  );
};

export default Login;