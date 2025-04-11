import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Login.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the login process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful login.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Fallback to default if VITE_API_URL is undefined.

function Login({ setUser }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  console.log('Login.jsx: VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('Login.jsx: API_URL:', API_URL);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log('Login.jsx: Logging in with:', { identifier, password });
      const response = await axios.post(`${API_URL}/auth/login`, {
        identifier,
        password,
      });
      console.log('Login.jsx: Login response:', response.data);
      setUser(response.data.data);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful login.
      alert('Login successful! Welcome back!'); // Placeholder for a more engaging UI effect.
      window.location.href = '/'; // Use window.location.href to force a full page reload.
    } catch (err) {
      console.error('Login.jsx: Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An error occurred during login');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleNavigation = (path) => {
    console.log(`Login.jsx: Navigating to ${path}`);
  };

  return (
    <div className="login-container">
      <h2 style={{ color: '#00c4b4', marginBottom: '20px' }}>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          style={{
            marginBottom: '15px',
            padding: '10px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '10px',
              paddingRight: '30px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <span
            onClick={togglePasswordVisibility}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </span>
        </div>
        <button
          type="submit"
          style={{
            padding: '10px',
            backgroundColor: '#00c4b4',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#009a8a')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#00c4b4')}
        >
          Login
        </button>
      </form>
      {error && (
        <p className="error" style={{ color: '#FF4444', marginTop: '15px' }}>
          {error}
        </p>
      )}
      <p style={{ marginTop: '15px', color: '#fff' }}>
        <Link
          to="/recover"
          onClick={() => handleNavigation('/recover')}
          style={{ color: '#00c4b4', textDecoration: 'none' }}
        >
          Forgot Password?
        </Link>
      </p>
      <p style={{ color: '#fff' }}>
        Don't have an account?{' '}
        <Link
          to="/register"
          onClick={() => handleNavigation('/register')}
          style={{ color: '#00c4b4', textDecoration: 'none' }}
        >
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;