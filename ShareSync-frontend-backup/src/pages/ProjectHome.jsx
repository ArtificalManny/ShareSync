import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectById } from '../services/auth';
import { CheckCircle } from 'lucide-react';
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
        console.log('ProjectHome - Access token before fetch:', accessToken);
        const projectData = await getProjectById(id);
        console.log('ProjectHome - Fetched project data:', projectData);
        setProject(projectData);
      } catch (err) {
        console.error('ProjectHome - Error fetching project:', err.message);
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
          {(error.includes('No access token found') || error.includes('Invalid token') || error.includes('Session expired')) ? (
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

  const statusProgress = project.status === 'Completed' ? 100 : project.status === 'In Progress' ? 50 : 0;

  return (
    <div className="project-home-container">
      <div className="project-home-header">
        <h1>{project.title || 'Untitled'}</h1>
      </div>
      <div className="project-details">
        <p className="text-secondary">{project.description || 'No description'}</p>
        <div className="project-overview">
          <h2>Project Overview</h2>
          <div className="overview-infographic">
            <div className="stat-bar">
              <span>
                <CheckCircle className="icon" /> Status: {project.status || 'Unknown'}
              </span>
              <div className="progress-bar">
                <div
                  className="progress-fill gradient-bg"
                  style={{ width: `${statusProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;