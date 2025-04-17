import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { currentTheme, isDarkMode, toggleTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) navigate(`/search?q=${searchQuery}`);
  };

  return (
    <header style={{ background: currentTheme.primary, color: currentTheme.text, padding: '10px' }}>
      <nav>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          style={{ marginRight: '10px' }}
        />
        <button onClick={handleSearch}>Search</button>
        <button onClick={toggleTheme}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
      </nav>
    </header>
  );
};

export default Header;