import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HomeContainer = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${({ theme }) => theme.glow}, transparent);
    opacity: 0.3;
    z-index: -1;
    animation: pulse 10s ease infinite;

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.5); opacity: 0.1; }
      100% { transform: scale(1); opacity: 0.3; }
    }
  }
`;

const Title = styled.h1`
  font-size: 64px;
  margin-bottom: 20px;
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px ${({ theme }) => theme.glow};
  animation: glow 3s ease-in-out infinite;

  @keyframes glow {
    0% { text-shadow: 0 0 15px ${({ theme }) => theme.glow}; }
    50% { text-shadow: 0 0 25px ${({ theme }) => theme.glow}; }
    100% { text-shadow: 0 0 15px ${({ theme }) => theme.glow}; }
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.8;
  text-shadow: 0 0 5px ${({ theme }) => theme.glow};
`;

const ActionLink = styled(Link)`
  color: ${({ theme }) => theme.text};
  text-decoration: none;
  font-size: 18px;
  margin: 0 15px;
  padding: 10px 20px;
  border-radius: 25px;
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px ${({ theme }) => theme.glow};
  }
`;

interface User {
  _id: string;
  username: string;
}

interface HomeProps {
  user?: User;
}

const Home = ({ user }: HomeProps) => {
  const { currentTheme } = useTheme();

  return (
    <HomeContainer theme={currentTheme}>
      <Title>Welcome to ShareSync{user ? `, ${user.username}` : ''}</Title>
      <Subtitle>Collaborate, manage projects, and connect with your team in a seamless, futuristic workspace.</Subtitle>
      <div>
        <ActionLink to="/login" theme={currentTheme}>Login</ActionLink>
        <ActionLink to="/register" theme={currentTheme}>Register</ActionLink>
      </div>
      <ActionLink to="/projects" theme={currentTheme} style={{ marginTop: '30px' }}>
        Explore Projects
      </ActionLink>
    </HomeContainer>
  );
};

export default Home;