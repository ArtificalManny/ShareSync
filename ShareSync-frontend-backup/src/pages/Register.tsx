import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';

const FormContainer = styled.div`
  background: rgba(46, 46, 79, 0.7);
  backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(107, 72, 255, 0.2);
  border: 1px solid rgba(72, 255, 235, 0.2);
  width: 100%;
  max-width: 450px;
  text-align: center;
  margin: 100px auto;
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-5px);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 15px 0;
  border: 1px solid rgba(72, 255, 235, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #e0e7ff;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  &:focus {
    outline: none;
    border-color: #48ffeb;
    box-shadow: 0 0 10px rgba(72, 255, 235, 0.3);
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, #6b48ff, #48ffeb);
  color: #1e1e2f;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin: 15px 0;
  font-size: 1rem;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(107, 72, 255, 0.5);
  }
`;

const ErrorMessage = styled.p`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-top: 10px;
`;

const SuccessMessage = styled.p`
  color: #48ffeb;
  font-size: 0.9rem;
  margin-top: 10px;
`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Register = () => {
  const { currentTheme } = useTheme();
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      console.log('Register: API_URL:', API_URL);
      console.log('Register: Submitting form with email:', username);
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: username,
        firstName,
        lastName,
        password,
      });
      const { user, access_token } = response.data;
      localStorage.setItem('token', access_token);
      setUser(user);
      setSuccess('Registration successful! Redirecting to home...');
      setTimeout(() => navigate('/home'), 2000);
    } catch (err: any) {
      console.error('Register: Error during registration:', err);
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <FormContainer theme={currentTheme}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Email"
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          theme={currentTheme}
          required
        />
        <Button type="submit" theme={currentTheme}>
          Register
        </Button>
      </form>
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
      {success && <SuccessMessage theme={currentTheme}>{success}</SuccessMessage>}
    </FormContainer>
  );
};

export default Register;