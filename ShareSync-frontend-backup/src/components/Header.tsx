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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.secondary};
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: ${({ theme }) => theme.primary};
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.secondary};
  }
`;

const ThemeButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonText};
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.secondary};
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoutButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme.primary};
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.secondary};
  }
`;

const Header = () => {
  const { currentTheme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
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