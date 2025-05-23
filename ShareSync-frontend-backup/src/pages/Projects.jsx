import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FolderKanban, Plus } from 'lucide-react';
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

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedPercentage = totalProjects ? (completedProjects / totalProjects) * 100 : 0;
  const inProgressPercentage = totalProjects ? (inProgressProjects / totalProjects) * 100 : 0;

  if (loading) {
    return <div className="projects-container"><p className="text-secondary">Loading...</p></div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary">
            <Plus className="icon" /> Create Project
          </button>
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
      <div className="project-metrics">
        <h2>Project Metrics</h2>
        <div className="metrics-infographic">
          <div className="metric-bar">
            <span>Total Projects: {totalProjects}</span>
          </div>
          <div className="metric-bar">
            <span>Completed Projects: {completedProjects}</span>
            <div className="progress-bar">
              <div
                className="progress-fill gradient-bg"
                style={{ width: `${completedPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="metric-bar">
            <span>In Progress Projects: {inProgressProjects}</span>
            <div className="progress-bar">
              <div
                className="progress-fill gradient-bg"
                style={{ width: `${inProgressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div className="projects-section">
        <h2><FolderKanban className="icon" /> All Projects</h2>
        {projects.length === 0 && !error ? (
          <div className="no-projects-card card">
            <p className="text-secondary">No projects found. Create one to get started!</p>
            <Link to="/projects/create">
              <button className="btn-primary">
                <Plus className="icon" /> Create Project
              </button>
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