import React, { useState, useEffect } from 'react';
import { getProjects } from '../services/project.service';
import { Link } from 'react-router-dom';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectList = await getProjects();
        setProjects(projectList);
      } catch (err) {
        setError(err.message || 'Failed to load projects');
      }
    };
    fetchProjects();
  }, []);

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#00d1b2' }}>Welcome to ShareSync</h2>
      <p style={{ color: '#ccc' }}>Collaborate on projects with transparency and ease.</p>
      <h3 style={{ color: '#00d1b2' }}>Your Recent Projects</h3>
      {projects.length === 0 ? (
        <p>No projects yet. Start by creating one!</p>
      ) : (
        projects.slice(0, 3).map(project => (
          <Link key={project._id} to={`/project/${project._id}`} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '20px', border: '1px solid #00d1b2', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#1a2b3c' }}>
              <h4 style={{ margin: 0, color: '#00d1b2' }}>{project.title}</h4>
              <p style={{ color: '#ccc' }}>{project.description || 'No description'}</p>
              <p>Status: {project.status}</p>
              {project.snapshot && (
                <div style={{ marginTop: '10px' }}>
                  <h5 style={{ color: '#00d1b2', margin: 0 }}>Latest Snapshot</h5>
                  <p style={{ color: '#ccc' }}>{project.snapshot}</p>
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  );
};

export default Home;