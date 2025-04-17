import { useState } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/auth/reset-password/${token}`, { password });
      navigate('/login');
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return (
    <form onSubmit={handleReset} style={{ background: currentTheme.background, color: currentTheme.text }}>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New Password"
      />
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default ResetPassword;