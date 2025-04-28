import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { registerUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Register - Submitting form with email:', email);
    const result = await registerUser({ firstName, lastName, username, email, password });
    if (result.success) {
      console.log('Register - Registration successful, navigating to /login');
      navigate('/login');
    } else {
      console.log('Register - Registration failed:', result.message);
      setError(result.message);
    }
  };

  console.log('Register - Rendering component, error:', error);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 60px)',
      background: 'linear-gradient(135deg, rgba(13, 26, 38, 0.8), rgba(26, 43, 60, 0.8))',
      animation: 'fadeIn 1s ease-in-out',
    }}>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        width: '350px',
        textAlign: 'center',
        boxShadow: '0 8px 16px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        animation: 'pulse 2s infinite',
      }}>
        <h2 style={{
          color: '#00d1b2',
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '2em',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}>Register</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
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
            Register
          </button>
        </form>
        {error && <p style={{ color: '#ff3860', marginTop: '10px', fontSize: '0.9em', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{error}</p>}
      </div>
    </div>
  );
};

export default Register;