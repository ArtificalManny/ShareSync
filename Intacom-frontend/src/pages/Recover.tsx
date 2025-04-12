import { useState } from 'react';
import axios from 'axios';
import './Recover.css';

// From "The Customer Service Revolution" and "The Apple Experience":
// - Make the forgot password process seamless and delightful with clear feedback.
// - Apply "Hooked" and Freud's Id/Ego/Superego: Provide a dopamine hit on successful request.
const API_URL = '/auth'; // Use proxy path.

function Recover() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log('Recover.tsx: API_URL:', API_URL);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Recover.tsx: Sending forgot password request for email:', email);
      const response = await axios.post(`${API_URL}/forgot-password`, { email });
      console.log('Recover.tsx: Forgot password response:', response.data);
      setMessage(response.data.message || 'A reset link has been sent to your email.');
      setError(null);
      // From "Hooked" and Freud's Id: Provide a dopamine hit on successful request.
      alert('Reset link sent! Check your email!'); // Placeholder for a more engaging UI effect.
    } catch (err: any) {
      console.error('Recover.tsx: Forgot password error:', err.response?.data || err.message);
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
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Recover;