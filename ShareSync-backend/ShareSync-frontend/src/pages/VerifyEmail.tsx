import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const email = query.get('email');
    if (email) {
      // Simulate email verification (since this is a placeholder)
      setTimeout(() => {
        setMessage('Email verified successfully! You can now log in.');
      }, 2000);
    } else {
      setMessage('Invalid verification link.');
    }
  }, [location]);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Verify Email - ShareSync</h1>
      <p style={styles.text}>{message}</p>
      {message.includes('successfully') && (
        <a href="/login" style={styles.link}>Go to Login</a>
      )}
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    borderRadius: '15px',
    marginTop: '150px',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    border: '1px solid #A2E4FF',
    textAlign: 'center',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '28px',
    marginBottom: '20px',
    textShadow: '0 0 10px #A2E4FF',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
    fontSize: '18px',
    marginBottom: '20px',
  },
  link: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
};

// Add animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  a:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);

export default VerifyEmail;