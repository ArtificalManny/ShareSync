import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage('Invalid verification link');
        return;
      }
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email`, { token });
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'An error occurred while verifying your email');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div>
      <h1>Email Verification</h1>
      {message ? <p>{message}</p> : <p>Verifying your email...</p>}
    </div>
  );
};

export default VerifyEmail;