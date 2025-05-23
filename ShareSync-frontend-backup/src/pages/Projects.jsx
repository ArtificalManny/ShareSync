import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('No access token found');
        }
        const response = await axios.get('http://localhost:3000/api/projects', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Projects - Fetched projects:', response.data);
        setProjects(response.data || []);
      } catch (err) {
        setError('Failed to fetch projects: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div className="projects-container"><p className="text-secondary">Loading...</p></div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary">Create Project</button>
        </Link>
      </div>
      {error && (
        <div>
          <p className="text-error">{error}</p>
          {(error.includes('No access token found') || error.includes('Invalid token')) && (
            <p className="text-secondary">
              Please <Link to="/login">log in</Link> to view your projects.
            </p>
          )}
        </div>
      )}
      <div className="projects-section">
        <h2>All Projects</h2>
        {projects.length === 0 && !error ? (
          <div className="no-projects-card card">
            <p className="text-secondary">No projects found. Create one to get started!</p>
            <Link to="/projects/create">
              <button className="btn-primary">Create Project</button>
            </Link>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map(project => (
              project.id ? (
                <Link to={`/projects/${project.id}`} key={project.id} className="project-card-link">
                  <div className="project-card card">
                    <h3>{project.title || 'Untitled'}</h3>
                    <p className="text-secondary">{project.description || 'No description'}</p>
                  </div>
                </Link>
              ) : (
                <div key={Math.random()} className="project-card card">
                  <p className="text-error">Invalid project ID</p>
                  <p className="text-secondary">{project.title || 'Untitled'}</p>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;