import { useEffect, useState } from 'react';
import axios from '../axios';
import { useParams } from 'react-router-dom';
import CreatePost from '../components/CreatePost';
import PostsList from '../components/PostsList';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const ProjectHomeContainer = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 40px;
  min-height: calc(100vh - 70px);
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${({ theme }) => theme.glow}, transparent);
    opacity: 0.2;
    z-index: -1;
  }
`;

const Title = styled.h1`
  font-size: 36px;
  margin-bottom: 20px;
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px ${({ theme }) => theme.glow};
`;

const Description = styled.p`
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 20px;
  text-shadow: 0 0 5px ${({ theme }) => theme.glow};
`;

interface Project {
  _id: string;
  name: string;
  description: string;
  creator: string;
}

const ProjectHome = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/projects/by-id/${id}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch project.');
      }
    };
    fetchProject();
  }, [id]);

  if (error) {
    return (
      <ProjectHomeContainer theme={currentTheme}>
        <Title>Error</Title>
        <Description>{error}</Description>
      </ProjectHomeContainer>
    );
  }

  if (!project) {
    return (
      <ProjectHomeContainer theme={currentTheme}>
        <Title>Loading...</Title>
      </ProjectHomeContainer>
    );
  }

  return (
    <ProjectHomeContainer theme={currentTheme}>
      <Title>{project.name}</Title>
      <Description>{project.description}</Description>
      <CreatePost projectId={id!} />
      <PostsList projectId={id!} />
    </ProjectHomeContainer>
  );
};

export default ProjectHome;