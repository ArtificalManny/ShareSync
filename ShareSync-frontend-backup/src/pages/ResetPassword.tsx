import { useState } from 'react';
import axios from '../axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/auth/reset-password`, { token, password });
      navigate('/login');
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  };

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleReset}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password"
          style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        />
        <button type="submit" style={{ background: currentTheme.primary, color: currentTheme.buttonText, padding: '5px 10px' }}>
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;