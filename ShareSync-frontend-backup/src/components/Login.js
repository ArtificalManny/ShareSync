import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('eamonrivas@gmail.com');
  const [password, setPassword] = useState('S7mR0!%uMZ<$[w%@');
  const [error, setError] = useState(null);
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login - Submitting form with email:', email);
    const result = await loginUser(email, password);
    if (result.success) {
      console.log('Login - Login successful, navigating to /home');
      navigate('/home');
    } else {
      console.log('Login - Login failed:', result.message);
      setError(result.message);
    }
  };

  console.log('Login - Rendering component, error:', error);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 60px)',
      background: 'linear-gradient(135deg, rgba(13, 26, 38, 0.8), rgba(26, 43, 60, 0.8))',
    }}>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '20px',
        borderRadius: '10px',
        width: '300px',
        textAlign: 'center',
        boxShadow: '0 8px 16px rgba(0, 209, 178, 0.2)',
        border: '1px solid #00d1b2',
        backdropFilter: 'blur(5px)',
      }}>
        <h2 style={{
          color: '#00d1b2',
          marginBottom: '20px',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
              onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '5px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
              onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
            />
          </div>
          <button type="submit" style={{
            padding: '10px 20px',
            background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'transform 0.1s, box-shadow 0.3s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.4)'}
          onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
          >
            Login
          </button>
        </form>
        <p style={{ marginTop: '10px' }}>
          <Link to="/forgot-password" style={{ color: '#00d1b2', textDecoration: 'none', transition: 'color 0.3s' }}
          onMouseEnter={(e) => e.target.style.color = '#6c63ff'}
          onMouseLeave={(e) => e.target.style.color = '#00d1b2'}
          >Forgot Password?</Link>
        </p>
        {error && <p style={{ color: 'red', marginTop: '10px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;