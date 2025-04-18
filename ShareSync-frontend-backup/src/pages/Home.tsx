import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
}

interface HomeProps {
  user?: User;
}

const Home = ({ user }: HomeProps) => {
  const { currentTheme } = useTheme();

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h1>Welcome to ShareSync{user ? `, ${user.username}` : ''}</h1>
      <p>
        <Link to="/login" style={{ color: currentTheme.primary }}>Login</Link> or{' '}
        <Link to="/register" style={{ color: currentTheme.primary }}>Register</Link> to get started.
      </p>
      <p>
        Explore <Link to="/projects" style={{ color: currentTheme.primary }}>Projects</Link>.
      </p>
    </div>
  );
};

export default Home;