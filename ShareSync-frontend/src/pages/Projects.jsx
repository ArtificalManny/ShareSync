import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Projects.css';

function Projects({ user }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, [user]);

  return (
    <div className="projects">
      <h1>Projects</h1>
      <div className="project-list">
        {projects.map((project) => (
          <Link key={project._id} to={`/project/${project._id}`} className="project-card">
            <div className="project-card-content" style={{ backgroundColor: project.color }}>
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              <p>Admin: {project.admin}</p>
              <p>Status: {project.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Projects;