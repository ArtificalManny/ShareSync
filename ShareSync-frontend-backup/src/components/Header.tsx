import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px ${({ theme }) => theme.glow};
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled.div`
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
  text-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s ease, text-shadow 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.primary};
    text-shadow: 0 0 5px ${({ theme }) => theme.glow};
  }
`;

const ThemeButton = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  border: none;
  padding: 8px 16px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoutButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme.text};
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s ease, text-shadow 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.primary};
    text-shadow: 0 0 5px ${({ theme }) => theme.glow};
  }
`;

const Header = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <HeaderContainer theme={currentTheme}>
      <Link to="/">
        <Logo theme={currentTheme}>ShareSync</Logo>
      </Link>
      <Nav>
        <NavLink to="/" theme={currentTheme}>Home</NavLink>
        {user && <NavLink to="/projects" theme={currentTheme}>Projects</NavLink>}
        {!user ? (
          <>
            <NavLink to="/login" theme={currentTheme}>Login</NavLink>
            <NavLink to="/register" theme={currentTheme}>Register</NavLink>
          </>
        ) : (
          <UserInfo>
            <span>{user.email}</span>
            <LogoutButton onClick={handleLogout} theme={currentTheme}>Logout</LogoutButton>
          </UserInfo>
        )}
        <ThemeButton onClick={toggleTheme} theme={currentTheme}>
          Toggle Theme
        </ThemeButton>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;