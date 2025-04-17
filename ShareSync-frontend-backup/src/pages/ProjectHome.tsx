import { useEffect, useState } from 'react';
import axios from '../axios';
import CreatePost from '../components/CreatePost';
import PostsList from '../components/PostsList';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ProjectHome = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchProject = async () => {
      const response = await axios.get(`/projects/${id}`);
      setProject(response.data);
    };
    fetchProject();
  }, [id]);

  if (!project) return <div>Loading...</div>;

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text }}>
      <h1>{project.name}</h1>
      <CreatePost projectId={id!} />
      <PostsList projectId={id!} />
    </div>
  );
};

export default ProjectHome;