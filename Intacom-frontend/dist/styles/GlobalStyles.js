import { jsx as _jsx } from "react/jsx-runtime";
import { css, Global } from '@emotion/react';
import { theme } from './theme';
const globalStyles = css `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
  }

  a {
    text-decoration: none;
    color: ${theme.colors.primary};
  }

  button {
    cursor: pointer;
    border: none;
    border-radius: ${theme.borderRadius.medium};
    background-color: ${theme.colors.primary};
    color: ${theme.colors.white};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: ${theme.colors.secondary};
  }

  input, textarea {
    border: 1px solid ${theme.colors.textLight};
    border-radius: ${theme.borderRadius.small};
    padding: ${theme.spacing.sm};
    font-size: ${theme.typography.body.fontSize};
  }
`;
export const GlobalStyles = () => _jsx(Global, { styles: globalStyles });
