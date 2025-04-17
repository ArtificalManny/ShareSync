import { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Search = () => {
  const [results, setResults] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (query) {
        const response = await axios.get(`/search?q=${query}`);
        setResults(response.data);
      }
    };
    fetchSearchResults();
  }, [query]);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h1>Search Results for "{query}"</h1>
      <ul>
        {results.map((item) => (
          <li key={item._id}>{item.name || item.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default Search;