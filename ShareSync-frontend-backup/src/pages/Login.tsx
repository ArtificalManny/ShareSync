import { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/auth/login', { email, password });
      navigate('/projects');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        />
        <button type="submit" style={{ background: currentTheme.primary, color: currentTheme.buttonText, padding: '5px 10px' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;