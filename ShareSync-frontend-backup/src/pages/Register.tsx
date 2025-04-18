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
  border-radius: 15px;
  box-shadow: 0 0 20px ${({ theme }) => theme.glow};
  animation: fadeIn 1s ease-in-out;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${({ theme }) => theme.glow}, transparent);
    opacity: 0.2;
    z-index: -1;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  font-size: 28px;
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
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ErrorMessage = styled.p`
  color: #ff5555;
  text-align: center;
  margin-top: 10px;
  text-shadow: 0 0 5px rgba(255, 85, 85, 0.5);
`;

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await axios.post('/auth/register', {
        email,
        password,
        username,
        firstName,
        lastName,
        birthday,
      }, { withCredentials: true });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
          disabled={loading}
        />
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          theme={currentTheme}
          required
          disabled={loading}
        />
        <Input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          theme={currentTheme}
          required
          disabled={loading}
        />
        <Input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          theme={currentTheme}
          required
          disabled={loading}
        />
        <Input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          placeholder="Birthday"
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
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </Form>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </RegisterContainer>
  );
};

export default Register;