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
      <h2 style={{ color: '#00d1b2', marginBottom: '20px' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a2b3c', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
          <h3>Total Projects</h3>
          <p>{metrics.totalProjects}</p>
        </div>
        <div style={{ backgroundColor: '#1a2b3c', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
          <h3>Current Projects</h3>
          <p>{metrics.currentProjects}</p>
        </div>
        <div style={{ backgroundColor: '#1a2b3c', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
          <h3>Past Projects</h3>
          <p>{metrics.pastProjects}</p>
        </div>
        <div style={{ backgroundColor: '#1a2b3c', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
          <h3>Tasks Completed</h3>
          <p>{metrics.tasksCompleted}</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1a2b3c', padding: '10px', borderRadius: '5px', width: '48%' }}>
          <h3>Notifications</h3>
          <p>No notifications yet</p>
        </div>
        <div style={{ backgroundColor: '#1a2b3c', padding: '10px', borderRadius: '5px', width: '48%' }}>
          <h3>Team Activity</h3>
          <p>No recent updates</p>
        </div>
      </div>
      <Link to="/create-project" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', textDecoration: 'none' }}>
        Create New Project
      </Link>
    </div>
  );
};

export default Home;