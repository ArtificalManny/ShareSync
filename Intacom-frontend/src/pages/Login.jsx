import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login({ setUser }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        identifier,
        password,
      });
      const user = response.data.data.user;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
      // Provide a dopamine hit with a success notification
      alert('Logged in successfully! Welcome back!');
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.response?.data?.message || 'Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="login">
      <h1>Login</h1>
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
      <Link to="/recover">Forgot Password?</Link>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;