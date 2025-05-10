import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, theme, toggleTheme } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  const isDarkTheme = theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1e 0%, #1c2526 100%)',
      fontFamily: '"Inter", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Holographic Background Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%)',
        zIndex: 0
      }} />

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{
            fontFamily: '"Orbitron", sans-serif',
            color: '#00f0ff',
            textDecoration: 'none',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
            marginRight: '20px'
          }}>
            ShareSync
          </Link>
          <Link to="/" style={{
            color: '#a0a0ff',
            textDecoration: 'none',
            fontSize: '16px',
            marginRight: '15px',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#00f0ff'}
          onMouseLeave={(e) => e.target.style.color = '#a0a0ff'}>
            Home
          </Link>
          <Link to="/login" style={{
            color: '#a0a0ff',
            textDecoration: 'none',
            fontSize: '16px',
            marginRight: '15px',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#00f0ff'}
          onMouseLeave={(e) => e.target.style.color = '#a0a0ff'}>
            Login
          </Link>
          <Link to="/register" style={{
            color: '#a0a0ff',
            textDecoration: 'none',
            fontSize: '16px',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#00f0ff'}
          onMouseLeave={(e) => e.target.style.color = '#a0a0ff'}>
            Register
          </Link>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
            transition: 'transform 0.2s, box-shadow 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
          }}
        >
          {isDarkTheme ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
      }}>
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            width: '400px',
            transition: 'transform 0.3s',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Holographic Glow Effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(0, 240, 255, 0.1), rgba(255, 0, 255, 0.1))',
            pointerEvents: 'none',
            zIndex: -1,
            animation: 'glow 3s infinite alternate'
          }} />
          <style>
            {`
              @keyframes glow {
                0% { opacity: 0.3; }
                100% { opacity: 0.6; }
              }
            `}
          </style>

          <h2 style={{
            fontFamily: '"Orbitron", sans-serif',
            color: '#00f0ff',
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '28px',
            textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
          }}>
            Login
          </h2>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00f0ff';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#00f0ff';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
              transition: 'transform 0.2s, box-shadow 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.5)';
            }}
          >
            Login
          </button>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Link to="/forgot-password" style={{
              color: '#a0a0ff',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#00f0ff'}
            onMouseLeave={(e) => e.target.style.color = '#a0a0ff'}>
              Forgot Password?
            </Link>
          </div>
          {error && <p style={{
            color: '#ff4d4d',
            textAlign: 'center',
            marginTop: '15px',
            fontSize: '14px'
          }}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;