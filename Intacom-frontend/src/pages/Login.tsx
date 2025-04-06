import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

interface LoginProps {
  setUser: (user: any) => void;
}

function Login({ setUser }: LoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Logging in with:', { identifier, password });
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        identifier,
        password,
      });
      console.log('Login response:', response.data);
      const user = response.data.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
      alert('Login successful!');
    } catch (error: any) {
      console.error('Error logging in:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="login">
      <h1>INTACOM</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username or Email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p className="error">{error}</p>}
      <p>
        <Link to="/recover">Forgot Password?</Link>
      </p>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;