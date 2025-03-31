import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/verify-email?token=${token}`);
        setMessage(response.data.message);
        setTimeout(() => navigate('/'), 3000); // Redirect to login after 3 seconds
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#f5f5f5' }}>
      <h2>Email Verification</h2>
      <p>{message}</p>
      {message.includes('successfully') && <p>You will be redirected to the login page shortly...</p>}
    </div>
  );
};

export default VerifyEmail;