import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 20px;
`;

const MemberItem = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border-radius: 10px;
`;

const ProjectItem = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border-radius: 10px;
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Member {
  _id: string;
  username: string;
}

interface Project {
  _id: string;
  name: string;
}

const TeamDashboard = () => {
  const { currentTheme } = useTheme();
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const membersResponse = await axios.get(`${API_URL}/team/members`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMembers(membersResponse.data);

        const projectsResponse = await axios.get(`${API_URL}/team/projects`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProjects(projectsResponse.data);
      } catch (err) {
        console.error('Failed to fetch team data:', err);
      }
    };
    fetchTeamData();
  }, []);

  return (
    <DashboardContainer>
      <h2>Team Members</h2>
      {members.map((member) => (
        <MemberItem key={member._id} theme={currentTheme}>
          {member.username}
        </MemberItem>
      ))}

      <h2>Team Projects</h2>
      {projects.map((project) => (
        <ProjectItem key={project._id} theme={currentTheme}>
          {project.name}
        </ProjectItem>
      ))}
    </DashboardContainer>
  );
};

export default TeamDashboard;