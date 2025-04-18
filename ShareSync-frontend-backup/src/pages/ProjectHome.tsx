import { useEffect, useState } from 'react';
import axios from '../axios';
import { useParams } from 'react-router-dom';
import CreatePost from '../components/CreatePost';
import PostsList from '../components/PostsList';
import { useTheme } from '../contexts/ThemeContext';

interface Project {
  _id: string;
  name: string;
}

const ProjectHome = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`/projects/by-id/${id}`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };
    fetchProject();
  }, [id]);

  if (!project) return <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h1>{project.name}</h1>
      <CreatePost projectId={id!} />
      <PostsList projectId={id!} />
    </div>
  );
};

export default ProjectHome;