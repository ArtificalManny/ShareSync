import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: ${({ theme }) => theme.background};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 0 20px ${({ theme }) => theme.glow};
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled.h1`
  font-size: 24px;
  color: ${({ theme }) => (theme.background === '#d1d8f0' ? theme.text : theme.accent)}; /* Solid color in light mode */
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
`;

const NavLink = styled(Link)`
  color: ${({ theme }) => (theme.background === '#d1d8f0' ? theme.text : theme.accent)}; /* Solid color in light mode */
  font-size: 16px;
  transition: color 0.3s ease, transform 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.highlight};
    transform: scale(1.1);
  }
`;

const ThemeButton = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Header = () => {
  const { toggleTheme } = useTheme();
  const { user, logout } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <HeaderContainer>
      <Logo>ShareSync</Logo>
      <Nav>
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/register">Register</NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        {user && <NavLink to="/login" onClick={handleLogout}>Logout</NavLink>}
      </Nav>
      <ThemeButton onClick={toggleTheme}>Toggle Theme</ThemeButton>
    </HeaderContainer>
  );
};

export default Header;