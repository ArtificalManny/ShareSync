import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const { currentTheme } = useTheme();

  return (
    <footer style={{ background: currentTheme.background, color: currentTheme.text, padding: '10px', textAlign: 'center' }}>
      <p>&copy; 2025 ShareSync. All rights reserved.</p>
    </footer>
  );
};

export default Footer;