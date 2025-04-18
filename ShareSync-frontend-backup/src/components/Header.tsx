import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <header style={{ background: currentTheme.background, color: currentTheme.text, padding: '10px' }}>
      <nav>
        <Link to="/" style={{ color: currentTheme.primary, marginRight: '10px' }}>Home</Link>
        <Link to="/projects" style={{ color: currentTheme.primary, marginRight: '10px' }}>Projects</Link>
        <Link to="/login" style={{ color: currentTheme.primary, marginRight: '10px' }}>Login</Link>
        <button onClick={toggleTheme} style={{ background: currentTheme.primary, color: currentTheme.buttonText, padding: '5px 10px' }}>
          Toggle Theme
        </button>
      </nav>
    </header>
  );
};

export default Header;