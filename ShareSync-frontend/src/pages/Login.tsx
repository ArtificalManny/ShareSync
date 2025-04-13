import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  setUser: (user: { _id: string; username: string; email: string }) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      const userData = response.data.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err: any) {
      console.error('Login.tsx: Error logging in:', err.message);
      setError('Failed to log in. Please check your credentials and try again.');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Login - ShareSync</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.submitButton}>Login</button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
      <p>
        Don't have an account?{' '}
        <a href="/register" style={styles.link}>Register</a>
      </p>
      <p>
        Forgot your password?{' '}
        <a href="/recover" style={styles.link}>Recover</a>
      </p>
    </div>
  );
};

// Inline styles with the new color palette
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#2B3A67', // Deep Blue
    color: '#FFFFFF', // White text
    borderRadius: '8px',
    marginTop: '100px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #E3F2FD', // Soft Blue
    fontSize: '16px',
    backgroundColor: '#FFFFFF', // White
    color: '#2B3A67', // Deep Blue
  },
  submitButton: {
    backgroundColor: '#E3F2FD', // Soft Blue
    color: '#2B3A67', // Deep Blue
    border: 'none',
    padding: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  error: {
    color: '#FF6F61', // Coral
    marginTop: '10px',
  },
  link: {
    color: '#E3F2FD', // Soft Blue
    textDecoration: 'underline',
  },
};

export default Login;