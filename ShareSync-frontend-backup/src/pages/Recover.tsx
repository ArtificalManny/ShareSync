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
      await axios.post('/auth/recover', { email });
      navigate('/login');
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  };

  return (
    <form onSubmit={handleRecover} style={{ background: currentTheme.background, color: currentTheme.text }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Recover Password</button>
    </form>
  );
};

export default Recover;