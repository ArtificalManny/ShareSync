import { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Recover = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/auth/forgot-password', { email });
      navigate('/login');
    } catch (error) {
      console.error('Password recovery failed:', error);
    }
  };

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h2>Recover Password</h2>
      <form onSubmit={handleRecover}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        />
        <button type="submit" style={{ background: currentTheme.primary, color: currentTheme.buttonText, padding: '5px 10px' }}>
          Recover Password
        </button>
      </form>
    </div>
  );
};

export default Recover;