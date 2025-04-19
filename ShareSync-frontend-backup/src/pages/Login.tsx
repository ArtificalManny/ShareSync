import { useState } from 'react';
import axios from '../axios';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
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

const LoginContainer = styled.div`
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

const ForgotPasswordLink = styled(Link)`
  color: ${({ theme }) => theme.accent};
  text-align: center;
  margin-top: 10px;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.highlight};
  }
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.warning};
  text-align: center;
  margin-top: 10px;
  text-shadow: 0 0 5px ${({ theme }) => theme.warning};
`;

const Login = () => {
  const [email, setEmail] = useState('eamonrivas@gmail.com');
  const [password, setPassword] = useState('S7mR0!%uMZ<$[w%@');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { setUser } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log('Frontend: Sending login request with email:', email, 'and password:', password);
    try {
      const response = await axios.post('/auth/login', { email, password }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Frontend: Login response:', response.data);
      setUser(response.data.user);
      localStorage.setItem('token', response.data.access_token);
      navigate('/projects');
    } catch (err: any) {
      console.error('Frontend: Login error:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer theme={currentTheme}>
      <Title>Login</Title>
      <Form onSubmit={handleLogin}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          theme={currentTheme}
          required
          disabled={loading}
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          theme={currentTheme}
          required
          disabled={loading}
        />
        <Button type="submit" theme={currentTheme} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </Form>
      <ForgotPasswordLink to="/forgot-password" theme={currentTheme}>
        Forgot Password?
      </ForgotPasswordLink>
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
    </LoginContainer>
  );
};

export default Login;