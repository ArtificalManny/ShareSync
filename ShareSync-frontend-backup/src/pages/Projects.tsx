import { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import ProjectForm from '../components/ProjectForm';
import { useTheme } from '../contexts/ThemeContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchProjects = async () => {
      const response = await axios.get('/projects');
      setProjects(response.data);
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text }}>
      <ProjectForm />
      <ul>
        {projects.map((project) => (
          <li key={project._id} onClick={() => navigate(`/project/${project._id}`)}>
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;