import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const query = new URLSearchParams(location.search);
    const token = query.get('token');
    if (!token) {
      setError('Invalid reset link.');
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        token,
        newPassword: password,
      });
      setMessage('Password reset successfully! You can now log in.');
      setError(null);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      console.error('ResetPassword.tsx: Error resetting password:', err.message);
      setError('Failed to reset password. Please try again.');
      setMessage(null);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Reset Password - ShareSync</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.submitButton}>Reset Password</button>
        {message && <p style={styles.message}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </form>
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
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '28px',
    textAlign: 'center',
    marginBottom: '20px',
    textShadow: '0 0 10px #A2E4FF',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    fontSize: '16px',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    transition: 'box-shadow 0.3s ease',
  },
  submitButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  message: {
    color: '#A2E4FF',
    marginTop: '10px',
    fontFamily: '"Orbitron", sans-serif',
  },
  error: {
    color: '#FF6F91',
    marginTop: '10px',
    fontFamily: '"Orbitron", sans-serif',
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
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  input:focus {
    box-shadow: 0 0 10px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default ResetPassword;