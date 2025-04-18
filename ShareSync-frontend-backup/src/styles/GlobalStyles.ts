import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Orbitron:wght@700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
  }

  body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    line-height: 1.6;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Orbitron', sans-serif;
    letter-spacing: 1px;
    background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 10px ${({ theme }) => theme.glow};
    animation: textGlow 2s ease-in-out infinite;

    @keyframes textGlow {
      0% { text-shadow: 0 0 10px ${({ theme }) => theme.glow}; }
      50% { text-shadow: 0 0 20px ${({ theme }) => theme.glow}; }
      100% { text-shadow: 0 0 10px ${({ theme }) => theme.glow}; }
    }
  }

  a {
    text-decoration: none;
    transition: color 0.3s ease, text-shadow 0.3s ease;

    &:hover {
      text-shadow: 0 0 5px ${({ theme }) => theme.glow};
    }
  }

  button {
    transition: all 0.3s ease;
  }
`;

export default GlobalStyles;