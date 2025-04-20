import { useNavigate } from 'react-router-dom';
  import { useTheme } from '../contexts/ThemeContext';
  import { useUser } from '../contexts/UserContext';
  import styled from 'styled-components';

  const HeaderContainer = styled.header`
    background: rgba(46, 46, 79, 0.7);
    backdrop-filter: blur(10px);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 30px rgba(107, 72, 255, 0.2);
    border-bottom: 1px solid rgba(72, 255, 235, 0.2);
  `;

  const Logo = styled.h1`
    background: transparent;
    color: #e0e7ff;
    margin: 0;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 8px 16px;
    border: 2px solid #48ffeb;
    border-radius: 8px;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(72, 255, 235, 0.3);
    }
  `;

  const Nav = styled.nav`
    display: flex;
    gap: 20px;
  `;

  const NavLink = styled.a`
    background: transparent;
    color: #a1a1d6;
    cursor: pointer;
    padding: 8px 16px;
    border: 2px solid #48ffeb;
    border-radius: 8px;
    transition: transform 0.3s ease;
    &:hover {
      color: #48ffeb;
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(72, 255, 235, 0.3);
    }
  `;

  const ThemeButton = styled.button`
    background: linear-gradient(45deg, #6b48ff, #48ffeb);
    color: #1e1e2f;
    padding: 10px 20px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(107, 72, 255, 0.5);
    }
  `;

  const Header = () => {
    console.log('Header: Starting render');
    const { currentTheme, toggleTheme } = useTheme();
    console.log('Header: Theme context:', currentTheme);
    const { user, setUser } = useUser();
    console.log('Header: User context:', user);
    const navigate = useNavigate();
    console.log('Header: Navigate function retrieved');

    const handleLogout = () => {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    };

    console.log('Header: Rendering component');
    return (
      <HeaderContainer theme={currentTheme}>
        <Logo theme={currentTheme} onClick={() => navigate('/')}>
          ShareSync
        </Logo>
        <Nav>
          <NavLink theme={currentTheme} onClick={() => navigate('/home')}>
            Home
          </NavLink>
          <NavLink theme={currentTheme} onClick={() => navigate('/login')}>
            Login
          </NavLink>
          <NavLink theme={currentTheme} onClick={() => navigate('/register')}>
            Register
          </NavLink>
          <NavLink theme={currentTheme} onClick={() => navigate('/projects')}>
            Projects
          </NavLink>
          <NavLink theme={currentTheme} onClick={() => navigate('/profile')}>
            Profile
          </NavLink>
          {user && (
            <NavLink theme={currentTheme} onClick={handleLogout}>
              Logout
            </NavLink>
          )}
        </Nav>
        <ThemeButton theme={currentTheme} onClick={toggleTheme}>
          Toggle Theme
        </ThemeButton>
      </HeaderContainer>
    );
  };

  export default Header;