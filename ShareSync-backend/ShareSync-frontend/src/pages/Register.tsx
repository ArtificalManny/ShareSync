import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        username,
        email,
        password,
        firstName,
        lastName,
      });
      navigate('/login');
    } catch (err: any) {
      console.error('Register.tsx: Error registering:', err.message);
      setError('Failed to register. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Register - ShareSync</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
          required
        />
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
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.submitButton}>Register</button>
        {error && <p style={styles.error}>{error}</p>}
      </form>
      <p style={styles.text}>
        Already have an account?{' '}
        <a href="/login" style={styles.link}>Login</a>
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
    marginTop: '100px',
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
  error: {
    color: '#FF6F91',
    marginTop: '10px',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
    marginTop: '10px',
    textAlign: 'center',
  },
  link: {
    color: '#FF6F91',
    textDecoration: 'underline',
    transition: 'color 0.3s ease',
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
styleSheet.insertRule(`
  a:hover {
    color: #A2E4FF;
  }
`, styleSheet.cssRules.length);

export default Register;