import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { resetPasswordUser } = useContext(AuthContext);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('ResetPassword - Submitting form with token:', token);
    const result = await resetPasswordUser(token, newPassword);
    if (result.success) {
      console.log('ResetPassword - Success:', result.message);
      setMessage(result.message);
      setError(null);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      console.log('ResetPassword - Failed:', result.message);
      setError(result.message);
      setMessage(null);
    }
  };

  console.log('ResetPassword - Rendering component, message:', message, 'error:', error);

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
        }}>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
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
            Reset Password
          </button>
        </form>
        {message && <p style={{ color: '#00d1b2', marginTop: '10px', fontSize: '0.9em', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{message}</p>}
        {error && <p style={{ color: '#ff3860', marginTop: '10px', fontSize: '0.9em', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;