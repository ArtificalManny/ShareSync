import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';

const Container = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
`;

const Form = styled.form`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: ${theme.typography.h2.fontWeight};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
`;

const Button = styled.button`
  width: 100%;
  margin-top: ${theme.spacing.sm};
`;

const Link = styled.a`
  display: block;
  margin-top: ${theme.spacing.sm};
  color: ${theme.colors.textLight};
  font-size: ${theme.typography.caption.fontSize};
`;

const Error = styled.p`
  color: ${theme.colors.error};
  font-size: ${theme.typography.caption.fontSize};
  margin-top: ${theme.spacing.sm};
`;

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        identifier,
        password,
      });
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError('Unable to reach the server. Please check your internet connection and try again.');
    }
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Form onSubmit={handleSubmit}>
        <Title>Login</Title>
        <Input
          type="text"
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Login</Button>
        <Link href="/register">Don't have an account? Register</Link>
        <Link href="/recover">Forgot Password?</Link>
        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
};

export default Login;