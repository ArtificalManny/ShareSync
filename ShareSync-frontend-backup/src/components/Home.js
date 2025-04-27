import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/project.service';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        console.log('Home - Fetched projects:', data);
        setProjects(data);

        const total = data.length;
        const current = data.filter(project => project.status === 'In Progress').length;
        const past = data.filter(project => project.status === 'Completed').length;
        const tasks = past * 10; // Placeholder: 10 tasks per completed project

        setMetrics({
          totalProjects: total,
          currentProjects: current,
          pastProjects: past,
          tasksCompleted: tasks,
        });
      } catch (error) {
        console.error('Home - Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '20px',
        fontWeight: 'bold',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          backgroundColor: '#1a2b3c',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
          border: '1px solid #00d1b2',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Total Projects</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{metrics.totalProjects}</p>
        </div>
        <div style={{
          backgroundColor: '#1a2b3c',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
          border: '1px solid #00d1b2',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Current Projects</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{metrics.currentProjects}</p>
        </div>
        <div style={{
          backgroundColor: '#1a2b3c',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
          border: '1px solid #00d1b2',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Past Projects</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{metrics.pastProjects}</p>
        </div>
        <div style={{
          backgroundColor: '#1a2b3c',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
          border: '1px solid #00d1b2',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Tasks Completed</h3>
          <p style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{metrics.tasksCompleted}</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{
          backgroundColor: '#1a2b3c',
          padding: '10px',
          borderRadius: '5px',
          width: '48%',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
          border: '1px solid #00d1b2',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Notifications</h3>
          <p>No notifications yet</p>
        </div>
        <div style={{
          backgroundColor: '#1a2b3c',
          padding: '10px',
          borderRadius: '5px',
          width: '48%',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.1)',
          border: '1px solid #00d1b2',
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.1)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Team Activity</h3>
          <p>No recent updates</p>
        </div>
      </div>
      <Link to="/create-project" style={{
        padding: '10px 20px',
        background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'transform 0.1s, box-shadow 0.3s',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
      onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
      onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
      onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.4)'}
      onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
      >
        Create New Project
      </Link>
    </div>
  );
};

export default Home;