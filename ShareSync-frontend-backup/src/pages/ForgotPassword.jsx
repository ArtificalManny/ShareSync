import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Mail } from 'lucide-react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('ForgotPassword - Component mounted. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (isAuthenticated && !isLoading) {
      console.log('ForgotPassword - User is authenticated, redirecting to /');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('ForgotPassword - Submitting forgot password form with email:', email);
    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }
      console.log('ForgotPassword - Reset link sent:', data);
      setMessage('A password reset link has been sent to your email.');
      setError('');
    } catch (err) {
      console.error('ForgotPassword - Failed to send reset link:', err.message);
      setError(err.message);
      setMessage('');
    }
  };

  if (isLoading) {
    console.log('ForgotPassword - Rendering loading state');
    return <div className="forgot-password-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card card p-8 glassmorphic">
        <h1 className="text-3xl font-inter text-holo-blue mb-6 flex items-center justify-center animate-text-glow">
          <Mail className="w-6 h-6 mr-2" /> Forgot Password
        </h1>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-holo-pink" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full rounded-full animate-glow">Send Reset Link</button>
        </form>
        <p className="text-holo-gray mt-4 text-center">
          Remember your password? <Link to="/login" className="text-holo-blue hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;