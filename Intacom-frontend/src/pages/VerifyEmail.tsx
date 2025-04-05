import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid verification link');
        return;
      }
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email`, { token });
        setSuccess(response.data.message);
        setError('');
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to verify email');
        setSuccess('');
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="verify-email">
      <h1>Verify Email</h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
}

export default VerifyEmail;