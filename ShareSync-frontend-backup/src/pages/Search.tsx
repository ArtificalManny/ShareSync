import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import styled from 'styled-components';

const SearchContainer = styled.div`
  padding: 20px;
`;

const SearchResult = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.highlight};
  }
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface SearchResultItem {
  _id: string;
  name: string;
  title: string;
}

const Search = () => {
  const { currentTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    const search = async () => {
      try {
        const response = await axios.get(`${API_URL}/search`, { params: { query } });
        setResults(response.data);
      } catch (err) {
        console.error('Search failed:', err);
      }
    };
    if (query) {
      search();
    }
  }, [query]);

  return (
    <SearchContainer>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search projects or users..."
      />
      {results.map((result) => (
        <SearchResult key={result._id} theme={currentTheme}>
          <h3>{result.name}</h3>
          <p>{result.title}</p>
        </SearchResult>
      ))}
    </SearchContainer>
  );
};

export default Search;