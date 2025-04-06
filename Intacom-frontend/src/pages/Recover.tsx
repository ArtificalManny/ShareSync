import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Recover.css';

function Recover() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/recover`, {
        params: { email },
      });
      console.log('Recover response:', response.data);
      setSuccess('A reset link has been generated. Check your email for the link. (For testing, the token is: ' + response.data.resetToken + ')');
      setError('');
    } catch (error: any) {
      console.error('Error recovering password:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to send reset link');
      setSuccess('');
    }
  };

  return (
    <div className="recover">
      <h1>Recover Password</h1>
      <form onSubmit={handleRecover}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <p>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
}

export default Recover;