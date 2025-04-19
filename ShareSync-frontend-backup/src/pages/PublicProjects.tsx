import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import styled from 'styled-components';

const PublicProjectsContainer = styled.div`
  padding: 20px;
`;

const ProjectItem = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  border-radius: 10px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.highlight};
  }
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Project {
  _id: string;
  name: string;
  title: string;
}

const PublicProjects = () => {
  const { currentTheme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects/public`);
        setProjects(response.data);
      } catch (err) {
        console.error('Failed to fetch public projects:', err);
      }
    };
    fetchPublicProjects();
  }, []);

  return (
    <PublicProjectsContainer>
      {projects.map((project) => (
        <ProjectItem key={project._id} theme={currentTheme}>
          <h3>{project.name}</h3>
          <p>{project.title}</p>
        </ProjectItem>
      ))}
    </PublicProjectsContainer>
  );
};

export default PublicProjects;