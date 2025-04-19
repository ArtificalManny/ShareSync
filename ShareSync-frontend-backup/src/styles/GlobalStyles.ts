import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Orbitron', sans-serif;
    background: ${({ theme }) => {
      console.log('GlobalStyles: Theme value:', theme);
      return theme?.background || '#121212'; // Fallback to a default color
    }};
    color: ${({ theme }) => theme?.text || '#e0e0e0'};
    overflow-x: hidden;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: 'Orbitron', sans-serif;
    cursor: pointer;
  }

  input, textarea {
    font-family: 'Orbitron', sans-serif;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme?.background || '#121212'};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme?.primary || '#ab47bc'};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme?.secondary || '#f06292'};
  }
`;

export default GlobalStyles;