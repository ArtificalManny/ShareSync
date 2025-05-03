import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Projects - Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      color: 'white', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
      minHeight: '100vh',
      fontFamily: "'Arial', sans-serif"
    }}>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        backgroundColor: '#16213e', 
        padding: '10px', 
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        marginBottom: '20px'
      }}>
        <div>
          <Link to="/" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px', fontWeight: 'bold' }}>ShareSync</Link>
          <Link to="/" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Home</Link>
          <Link to="/login" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Login</Link>
          <Link to="/register" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Register</Link>
          <Link to="/projects" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Projects</Link>
          <Link to="/profile" style={{ color: '#e94560', textDecoration: 'none', marginRight: '10px' }}>Profile</Link>
          <button onClick={() => navigate('/login')} style={{ color: '#e94560', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            backgroundColor: '#e94560', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '5px', 
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#ff6b81'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#e94560'}
        >
          Toggle Theme
        </button>
      </nav>

      <div style={{ 
        backgroundColor: '#16213e', 
        padding: '20px', 
        borderRadius: '10px', 
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        transition: 'transform 0.3s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <h1 style={{ color: '#e94560', textAlign: 'center', marginBottom: '20px' }}>Projects</h1>
        {projects.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No projects available.</p>
        ) : (
          projects.map((project, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: '#0f3460', 
                padding: '10px', 
                margin: '10px 0', 
                borderRadius: '5px',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a4b84'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0f3460'}
            >
              <h3 style={{ color: '#e94560', margin: 0 }}>{project.title}</h3>
              <p>{project.description}</p>
              <small style={{ color: '#a0a0a0' }}>Shared with: {project.sharedWith.join(', ')}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;