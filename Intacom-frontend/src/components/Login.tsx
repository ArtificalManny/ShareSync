import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';
import { useAppSelector, useAppDispatch } from '../hooks';
import { login } from '../store/slices/authSlice';

interface LoginProps {
  setUser: (user: { _id: string; username: string; email: string } | null) => void;
}

function Login({ setUser }: LoginProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Login.tsx: Logging in with:', { identifier, password });
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, {
        identifier,
        password,
      });
      console.log('Login.tsx: Login response:', response.data);
      const user = response.data.data;
      if (isMounted) {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch(login(user));
        alert('Login successful! Welcome back!');
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login.tsx: Login error:', err.message, err.response?.data);
      if (isMounted) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.message.includes('Network Error')) {
          setError('Unable to connect to the server. Please check your network connection.');
        } else if (err.message.includes('CORS')) {
          setError('A CORS error occurred. Please contact support or try again later.');
        } else {
          setError('An unexpected error occurred during login. Please try again.');
        }
      }
    }
  };

  const togglePasswordVisibility = () => {
    if (isMounted) {
      setShowPassword(!showPassword);
    }
  };

  const handleNavigation = (path: string) => {
    console.log(`Login.tsx: Navigating to ${path}`);
    navigate(path);
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span onClick={togglePasswordVisibility} className="password-toggle">
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
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