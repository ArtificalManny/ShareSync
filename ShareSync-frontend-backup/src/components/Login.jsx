import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useContext(AuthContext);
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Login failed');
      toast.error('Login failed', { position: 'top-right', autoClose: 3000 });
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 80px)',
      background: 'transparent',
    }}>
      <div style={{
        background: currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 8px 16px rgba(0, 209, 178, 0.3)',
        backdropFilter: 'blur(10px)',
        width: '400px',
        textAlign: 'center',
      }}>
        <h2 style={{
          color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
          marginBottom: '20px',
          fontSize: '2em',
          textShadow: `0 2px 4px rgba(${currentTheme === 'dark' ? '0, 209, 178' : '108, 99, 255'}, 0.5)`,
        }}>
          Login
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '10px',
              border: `2px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
              backgroundColor: currentTheme === 'dark' ? '#0d1a26' : '#ffffff',
              color: currentTheme === 'dark' ? 'white' : 'black',
              fontSize: '1em',
              transition: 'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = currentTheme === 'dark' ? '#6c63ff' : '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = currentTheme === 'dark' ? '#00d1b2' : '#6c63ff';
              e.target.style.boxShadow = 'none';
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '10px',
              border: `2px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
              backgroundColor: currentTheme === 'dark' ? '#0d1a26' : '#ffffff',
              color: currentTheme === 'dark' ? 'white' : 'black',
              fontSize: '1em',
              transition: 'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = currentTheme === 'dark' ? '#6c63ff' : '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = currentTheme === 'dark' ? '#00d1b2' : '#6c63ff';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(45deg, #6c63ff, #00d1b2)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Login
          </button>
        </form>
        <div style={{ marginTop: '15px' }}>
          <Link to="/forgot-password" style={{
            color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
            textDecoration: 'none',
            fontSize: '0.9em',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Forgot Password?
          </Link>
        </div>
        {error && (
          <p style={{ color: '#ff3860', marginTop: '10px', fontSize: '0.9em' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;