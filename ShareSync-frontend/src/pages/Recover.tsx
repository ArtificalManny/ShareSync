import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Recover.css';

const Recover: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        { email },
        { withCredentials: true }
      );
      setMessage(response.data.message || 'A reset link has been sent to your email.');
      setError(null);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('Recover.tsx: Error sending reset link:', err.message, err.response?.data);
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
      setMessage(null);
    }
  };

  return (
    <div className="recover-container">
      <h2>Recover Password - ShareSync</h2>
      <form onSubmit={handleRecover}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p className="message">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Recover;