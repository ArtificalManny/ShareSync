import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';
import ProjectForm from '../components/ProjectForm';

const HomeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const Section = styled.div`
  flex: 1;
  min-width: 300px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.glow};
`;

const NotificationSection = styled(Section)`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
`;

const ProjectFormSection = styled(Section)`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
`;

const OverviewSection = styled(Section)`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
`;

const StatsSection = styled(Section)`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
  text-align: center;
`;

const TeamActivitySection = styled(Section)`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border: 1px solid ${({ theme }) => theme.border};
`;

const Button = styled.button`
  background: ${({ theme }: { theme: any }) =>
    `linear-gradient(45deg, ${theme?.primary || '#818cf8'}, ${theme?.secondary || '#f9a8d4'})`};
  color: ${({ theme }) => theme.buttonText || '#0f172a'};
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin: 10px 0;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.glow};
  }
`;

const StatBox = styled.div`
  background: ${({ theme }: { theme: any }) =>
    `linear-gradient(45deg, ${theme?.secondary || '#f9a8d4'}, ${theme?.highlight || '#c4b5fd'})`};
  padding: 15px;
  border-radius: 10px;
  margin: 10px 0;
  box-shadow: ${({ theme }) => theme.glow};
`;

const StatNumber = styled.div`
  font-size: 24px;
  color: ${({ theme }: { theme: any }) => theme.accent};
`;

const Home = () => {
  const { currentTheme } = useTheme();
  const [notifications] = useState<string[]>([]);

  return (
    <HomeContainer theme={currentTheme}>
      <Button theme={currentTheme}>Create Project</Button>
      <NotificationSection theme={currentTheme}>
        <h2>Notifications ({notifications.length})</h2>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          notifications.map((notification, index) => (
            <p key={index}>{notification}</p>
          ))
        )}
      </NotificationSection>

      <ProjectFormSection theme={currentTheme}>
        <h2>Create a New Project</h2>
        <ProjectForm />
      </ProjectFormSection>

      <OverviewSection theme={currentTheme}>
        <h2>Project Overview</h2>
        <StatBox theme={currentTheme}>
          <h3>Total Projects</h3>
          <StatNumber theme={currentTheme}>0</StatNumber>
        </StatBox>
        <StatBox theme={currentTheme}>
          <h3>Current Projects</h3>
          <StatNumber theme={currentTheme}>0</StatNumber>
        </StatBox>
        <StatBox theme={currentTheme}>
          <h3>Past Projects</h3>
          <StatNumber theme={currentTheme}>0</StatNumber>
        </StatBox>
      </OverviewSection>

      <StatsSection theme={currentTheme}>
        <h2>Tasks Completed</h2>
        <StatNumber theme={currentTheme}>14</StatNumber>
      </StatsSection>

      <TeamActivitySection theme={currentTheme}>
        <h2>Team Activity</h2>
        <p>No recent updates.</p>
      </TeamActivitySection>
    </HomeContainer>
  );
};

export default Home;