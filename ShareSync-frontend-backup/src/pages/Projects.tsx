import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const ProjectsContainer = styled.div`
  padding: 20px;
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const ProjectCard = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: ${({ theme }) => theme.glow};
  cursor: pointer;
  &:hover {
    transform: scale(1.02);
    transition: transform 0.3s ease;
  }
`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Project {
  _id: string;
  name: string;
  description: string;
}

const Projects = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_URL}/projects`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProjects(response.data);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      }
    };
    fetchProjects();
  }, []);

  return (
    <ProjectsContainer theme={currentTheme}>
      <h2>Projects</h2>
      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        projects.map((project) => (
          <ProjectCard
            key={project._id}
            theme={currentTheme}
            onClick={() => navigate(`/project/${project._id}`)}
          >
            <h3>{project.name}</h3>
            <p>{project.description}</p>
          </ProjectCard>
        ))
      )}
    </ProjectsContainer>
  );
};

export default Projects;