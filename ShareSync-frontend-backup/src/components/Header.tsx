import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: ${({ theme }: { theme: any }) => theme.background};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${({ theme }) => theme.glow};
`;

const Logo = styled.h1`
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
  margin: 0;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.accent};
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
`;

const NavLink = styled.a`
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.accent};
  &:hover {
    color: ${({ theme }) => theme.accent};
  }
`;

const ThemeButton = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.glow};
  }
`;

const Header = () => {
  console.log('Header: Starting render');
  const { currentTheme, toggleTheme } = useTheme();
  console.log('Header: Theme context:', currentTheme);
  const { user, setUser } = useUser();
  console.log('Header: User context:', user);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  console.log('Header: Rendering component');
  return (
    <HeaderContainer theme={currentTheme}>
      <Logo theme={currentTheme} onClick={() => navigate('/')}>ShareSync</Logo>
      <Nav>
        <NavLink theme={currentTheme} onClick={() => navigate('/home')}>Home</NavLink>
        <NavLink theme={currentTheme} onClick={() => navigate('/login')}>Login</NavLink>
        <NavLink theme={currentTheme} onClick={() => navigate('/register')}>Register</NavLink>
        <NavLink theme={currentTheme} onClick={() => navigate('/projects')}>Projects</NavLink>
        <NavLink theme={currentTheme} onClick={() => navigate('/profile')}>Profile</NavLink>
        {user && <NavLink theme={currentTheme} onClick={handleLogout}>Logout</NavLink>}
      </Nav>
      <ThemeButton theme={currentTheme} onClick={toggleTheme}>Toggle Theme</ThemeButton>
    </HeaderContainer>
  );
};

export default Header;