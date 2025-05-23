import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById } from '../services/auth';
import './ProjectHome.css';

const ProjectHome = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('ProjectHome - Fetching project with ID:', id);
        if (!id) {
          throw new Error('Project ID is missing');
        }
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('No access token found');
        }
        const projectData = await getProjectById(id);
        console.log('ProjectHome - Fetched project data:', projectData);
        setProject(projectData);
      } catch (err) {
        setError('Failed to load project: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return <div className="project-home-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="project-home-container">
        <p className="text-error">{error}</p>
        <p className="text-secondary">
          {(error.includes('No access token found') || error.includes('Invalid token')) ? (
            <>Please <Link to="/login">log in</Link> to view this project.</>
          ) : (
            'The project may not exist or there was a server error.'
          )}
        </p>
        <Link to="/projects">
          <button className="btn-primary">Back to Projects</button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return <div className="project-home-container"><p className="text-secondary">Project not found.</p></div>;
  }

  return (
    <div className="project-home-container">
      <div className="project-home-header">
        <h1>{project.title || 'Untitled'}</h1>
      </div>
      <div className="project-details">
        <p className="text-secondary">{project.description || 'No description'}</p>
      </div>
    </div>
  );
};

export default ProjectHome;