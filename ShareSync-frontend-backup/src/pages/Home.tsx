import { useState } from 'react';
  import { useTheme } from '../contexts/ThemeContext';
  import styled from 'styled-components';
  import ProjectForm from '../components/ProjectForm';

  const HomeContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    padding: 30px;
    min-height: 100vh;
  `;

  const Section = styled.div`
    flex: 1;
    min-width: 300px;
    background: rgba(46, 46, 79, 0.7);
    backdrop-filter: blur(10px);
    padding: 30px;
    border-radius: 15px;
    box-shadow: 0 4px 30px rgba(107, 72, 255, 0.2);
    border: 1px solid rgba(72, 255, 235, 0.2);
    transition: transform 0.3s ease;
    &:hover {
      transform: translateY(-5px);
    }
  `;

  const NotificationSection = styled(Section)`
    flex: 1;
  `;

  const ProjectFormSection = styled(Section)`
    flex: 2;
  `;

  const OverviewSection = styled(Section)`
    flex: 1;
  `;

  const StatsSection = styled(Section)`
    flex: 1;
    text-align: center;
  `;

  const TeamActivitySection = styled(Section)`
    flex: 1;
  `;

  const Button = styled.button`
    background: linear-gradient(45deg, #6b48ff, #48ffeb);
    color: #1e1e2f;
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    margin: 15px 0;
    font-size: 1rem;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 0 15px rgba(107, 72, 255, 0.5);
    }
  `;

  const StatBox = styled.div`
    background: linear-gradient(45deg, #48ffeb, #6b48ff);
    padding: 20px;
    border-radius: 15px;
    margin: 15px 0;
    box-shadow: 0 4px 30px rgba(72, 255, 235, 0.2);
  `;

  const StatNumber = styled.div`
    font-size: 2rem;
    color: #1e1e2f;
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