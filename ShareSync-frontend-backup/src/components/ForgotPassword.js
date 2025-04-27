import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const { forgotPasswordUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('ForgotPassword - Submitting form with email:', email);
    const result = await forgotPasswordUser(email);
    if (result.success) {
      console.log('ForgotPassword - Success:', result.message);
      setMessage(result.message);
      setError(null);
    } else {
      console.log('ForgotPassword - Failed:', result.message);
      setError(result.message);
      setMessage(null);
    }
  };

  console.log('ForgotPassword - Rendering component, message:', message, 'error:', error);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ backgroundColor: '#1a2b3c', padding: '20px', borderRadius: '10px', width: '300px', textAlign: 'center' }}>
        <h2 style={{ color: '#00d1b2', marginBottom: '20px' }}>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Send Reset Link
          </button>
        </form>
        {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;