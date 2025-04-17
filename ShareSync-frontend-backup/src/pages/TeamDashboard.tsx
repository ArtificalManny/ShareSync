import { useState, useEffect } from 'react';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';

const TeamDashboard = () => {
  const [teamData, setTeamData] = useState({ members: [], projects: [] });
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await axios.get('/team/dashboard');
        setTeamData(response.data);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };
    fetchTeamData();
  }, []);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h1>Team Dashboard</h1>
      <h2>Team Members</h2>
      <ul>
        {teamData.members.map((member) => (
          <li key={member._id}>{member.username}</li>
        ))}
      </ul>
      <h2>Team Projects</h2>
      <ul>
        {teamData.projects.map((project) => (
          <li key={project._id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default TeamDashboard;