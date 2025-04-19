import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { FaUsers, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import styled from 'styled-components';

const ProjectsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.glow};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.border};
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 20px;
`;

const ProjectCard = styled.div`
  flex: 1;
  min-width: 300px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  box-shadow: ${({ theme }) => theme.glow};
`;

const Section = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const SectionTitle = styled.h2`
  color: ${({ theme }: { theme: any }) => theme.text};
  margin-bottom: 10px;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  color: ${({ theme }: { theme: any }) => theme.text};
  padding: 5px 0;
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin: 5px;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.glow};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${({ theme }: { theme: any }) => theme.border};
  border-radius: 5px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
`;

const ErrorMessage = styled.p`
  color: ${({ theme }: { theme: any }) => theme.warning};
  font-size: 14px;
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Project {
  _id: string;
  name: string;
  description: string;
  members: string[];
}

const Projects = () => {
  const { currentTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProjects(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch projects');
      }
    };
    fetchProjects();
  }, []);

  const handleAddMember = async (projectId: string) => {
    try {
      await axios.post(
        `${API_URL}/projects/${projectId}/add-member`,
        { email: newMemberEmail },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setProjects(projects.map(project =>
        project._id === projectId
          ? { ...project, members: [...project.members, newMemberEmail] }
          : project
      ));
      setNewMemberEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  return (
    <ProjectsContainer theme={currentTheme}>
      {projects.map((project) => (
        <ProjectCard key={project._id} theme={currentTheme}>
          <Section theme={currentTheme}>
            <SectionTitle theme={currentTheme}>{project.name}</SectionTitle>
            <List>
              <ListItem theme={currentTheme}>Description: {project.description}</ListItem>
              <ListItem theme={currentTheme}>Members: {project.members.length}</ListItem>
            </List>
            <Input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Add member by email"
              theme={currentTheme}
            />
            <Button theme={currentTheme} onClick={() => handleAddMember(project._id)}>
              <FaUserPlus /> Add Member
            </Button>
          </Section>
        </ProjectCard>
      ))}
      {error && <ErrorMessage theme={currentTheme}>{error}</ErrorMessage>}
    </ProjectsContainer>
  );
};

export default Projects;