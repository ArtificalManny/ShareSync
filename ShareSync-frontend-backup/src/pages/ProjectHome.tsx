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
`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 20px;
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
        const response = await axios.get(`/projects/by-id/${id}`, { withCredentials: true });
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
        <p>{error}</p>
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
      <p>{project.description}</p>
      <CreatePost projectId={id!} />
      <PostsList projectId={id!} />
    </ProjectHomeContainer>
  );
};

export default ProjectHome;