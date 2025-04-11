import { useState } from 'react';
import axios from 'axios';
import './Recover.css';

function Recover() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      console.log('Recover.tsx: Recover response:', response.data);
      setMessage('A reset link has been sent to your email.');
      setError(null);
    } catch (err: any) {
      console.error('Recover.tsx: Recover error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An error occurred while sending the reset link');
      setMessage(null);
    }
  };

  return (
    <div className="recover-container">
      <h2>Forgot Password</h2>
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
      {message && <p className="success" style={{ color: '#00C4B4' }}>{message}</p>}
      {error && <p className="error" style={{ color: '#FF4444' }}>{error}</p>}
    </div>
  );
}

export default Recover;