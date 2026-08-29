import { createGlobalStyle } from 'styled-components';

  const GlobalStyles = createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Inter:wght@400&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #1e1e2f 0%, #2a2a4a 100%);
      color: #e0e7ff;
      line-height: 1.6;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Poppins', sans-serif;
      color: #e0e7ff;
    }

    a {
      color: #48ffeb;
      text-decoration: none;
      &:hover {
        color: #6b48ff;
      }
    }

    button {
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
  `;

  export default GlobalStyles;