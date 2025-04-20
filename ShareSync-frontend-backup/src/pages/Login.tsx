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

  const LinkText = styled.a`
    color: #48ffeb;
    cursor: pointer;
    font-size: 0.9rem;
    transition: color 0.3s ease;
    &:hover {
      color: #6b48ff;
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
          <Button type="submit" theme={currentTheme}>
            Login
          </Button>
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