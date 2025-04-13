import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface LoginProps {
  setUser: (user: User | null) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/auth';

function Login({ setUser }: LoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  console.log('Login.jsx: VITE_API_URL:', import.meta.env.VITE_API_URL);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, {
        identifier,
        password,
      });
      const user = response.data.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      console.error('Login.jsx: Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An error occurred during login');
    }
  };

  const handleNavigation = (path: string) => {
    console.log(`Login.jsx: Navigating to ${path}`);
    navigate(path);
  };

  return (
    <div className="login-container">
      <h2>Login to ShareSync</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        <Link to="/recover" onClick={() => handleNavigation('/recover')}>
          Forgot Password?
        </Link>
      </p>
      <p>
        Don't have an account?{' '}
        <Link to="/register" onClick={() => handleNavigation('/register')}>
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;