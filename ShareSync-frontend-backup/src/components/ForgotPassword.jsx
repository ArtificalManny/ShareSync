import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword } = useContext(AuthContext) || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)'
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          backgroundColor: '#16213e', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
          width: '300px',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <h2 style={{ color: '#e94560', textAlign: 'center', marginBottom: '20px' }}>Forgot Password</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: 'none', 
              backgroundColor: '#0f3460', 
              color: 'white',
              transition: 'background-color 0.3s'
            }}
            onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
            onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
            required
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#0f3460', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1a4b84'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0f3460'}
        >
          Send Reset Email
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;