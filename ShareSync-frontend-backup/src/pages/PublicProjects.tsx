import { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PublicProjects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        const response = await axios.get('/projects/public');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching public projects:', error);
      }
    };
    fetchPublicProjects();
  }, []);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <h1>Public Projects</h1>
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

export default PublicProjects;