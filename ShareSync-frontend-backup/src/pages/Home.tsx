import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HomeContainer = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 40px;
  min-height: calc(100vh - 70px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Title = styled.h1`
  font-size: 48px;
  margin-bottom: 20px;
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 18px;
  margin-bottom: 20px;
  opacity: 0.8;
`;

const ActionLink = styled(Link)`
  color: ${({ theme }) => theme.primary};
  text-decoration: none;
  font-size: 18px;
  margin: 0 10px;
  transition: color 0.3s ease, transform 0.1s ease;

  &:hover {
    color: ${({ theme }) => theme.secondary};
    transform: scale(1.05);
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
      <Subtitle>Collaborate, manage projects, and connect with your team seamlessly.</Subtitle>
      <div>
        <ActionLink to="/login" theme={currentTheme}>Login</ActionLink> or{' '}
        <ActionLink to="/register" theme={currentTheme}>Register</ActionLink> to get started.
      </div>
      <ActionLink to="/projects" theme={currentTheme} style={{ marginTop: '20px' }}>
        Explore Projects
      </ActionLink>
    </HomeContainer>
  );
};

export default Home;