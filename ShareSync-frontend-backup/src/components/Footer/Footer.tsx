import { useTheme } from '../../contexts/ThemeContext';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  text-align: center;
  position: fixed;
  bottom: 0;
  width: 100%;
`;

const Footer = () => {
  const { currentTheme } = useTheme();

  return (
    <FooterContainer theme={currentTheme}>
      <p>&copy; 2025 ShareSync. All rights reserved.</p>
    </FooterContainer>
  );
};

export default Footer;