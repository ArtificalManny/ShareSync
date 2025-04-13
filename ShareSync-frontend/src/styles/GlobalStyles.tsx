import React from 'react';
import { Global, css } from '@emotion/react';
import { theme } from './theme';

const globalStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  button {
    cursor: pointer;
  }

  input, textarea, select {
    font-family: inherit;
  }
`;

export const GlobalStyles: React.FC = () => <Global styles={globalStyles} />;