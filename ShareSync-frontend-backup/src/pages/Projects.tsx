import { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

interface Project {
  _id: string;
  name: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h1>Your Projects</h1>
      <ul>
        {projects.map((project) => (
          <li
            key={project._id}
            onClick={() => navigate(`/project/${project._id}`)}
            style={{ cursor: 'pointer', padding: '5px' }}
          >
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;