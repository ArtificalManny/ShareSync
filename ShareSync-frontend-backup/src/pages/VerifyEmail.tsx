import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVerify = async () => {
      const query = new URLSearchParams(location.search);
      const token = query.get('token');

      if (!token) {
        setError('Invalid or missing verification token.');
        return;
      }

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/verify-email`, { token });
        setMessage(response.data.message);
        setError(null);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
        setMessage(null);
      }
    };

    handleVerify();
  }, [location.search, navigate]);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Verify Email</h1>
      {message && <p style={styles.message}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
      <p style={styles.text}>
        <a href="/login" style={styles.link}>Return to Login</a>
      </p>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    borderRadius: '15px',
    marginTop: '150px',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    border: '1px solid #A2E4FF',
    animation: 'fadeIn 1s ease-in-out',
    textAlign: 'center',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '28px',
    marginBottom: '20px',
    textShadow: '0 0 10px #A2E4FF',
  },
  message: {
    color: '#A2E4FF',
    marginBottom: '20px',
    fontFamily: '"Orbitron", sans-serif',
  },
  error: {
    color: '#FF6F91',
    marginBottom: '20px',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
  link: {
    color: '#FF6F91',
    textDecoration: 'underline',
    transition: 'color 0.3s ease',
  },
};

// Add keyframes for animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  a:hover {
    color: #A2E4FF;
  }
`, styleSheet.cssRules.length);

export default VerifyEmail;