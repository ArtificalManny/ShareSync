import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/project.service';
import { toast } from 'react-toastify';

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);

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

        // Aggregate notifications and team activities from projects
        const allNotifications = data.flatMap(project =>
          project.announcements?.map(ann => ({
            message: `New announcement in ${project.title}: ${ann.message}`,
            timestamp: ann.timestamp,
          })) || []
        );
        setNotifications(allNotifications);

        const allActivities = data.flatMap(project =>
          project.teamActivities?.map(activity => ({
            message: `${activity.message} in ${project.title}`,
            timestamp: activity.timestamp,
          })) || []
        );
        setTeamActivities(allActivities);

        if (allNotifications.length > 0) {
          toast.info(`You have ${allNotifications.length} new notifications!`, { position: 'top-right', autoClose: 3000 });
        }
      } catch (error) {
        console.error('Home - Error fetching projects:', error);
        toast.error('Failed to load dashboard data', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchProjects();
  }, []);

  return (
    <div style={{ padding: '30px', color: 'white', animation: 'fadeIn 1s ease-in-out' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '30px',
        fontWeight: 'bold',
        fontSize: '2.5em',
        textShadow: '0 2px 4px rgba(0, 209, 178, 0.5)',
      }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: 'Total Projects', value: metrics.totalProjects, color: '#00d1b2' },
          { label: 'Current Projects', value: metrics.currentProjects, color: '#6c63ff' },
          { label: 'Past Projects', value: metrics.pastProjects, color: '#ff3860' },
          { label: 'Tasks Completed', value: metrics.tasksCompleted, color: '#ffd700' },
        ].map((metric, index) => (
          <div key={index} style={{
            backgroundColor: '#1a2b3c',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: `0 4px 8px rgba(${metric.color.slice(1)}, 0.3)`,
            border: `1px solid ${metric.color}`,
            transition: 'all 0.3s ease',
            animation: 'pulse 2s infinite',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 8px 16px rgba(${metric.color.slice(1)}, 0.5)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 4px 8px rgba(${metric.color.slice(1)}, 0.3)`;
          }}
          >
            <h3 style={{ color: metric.color, textShadow: `0 1px 2px rgba(${metric.color.slice(1)}, 0.5)`, fontSize: '1.2em' }}>{metric.label}</h3>
            <p style={{ fontSize: '2em', fontWeight: 'bold', color: 'white' }}>{metric.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 300px',
          backgroundColor: '#1a2b3c',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
          border: '1px solid #00d1b2',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em', marginBottom: '15px' }}>Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map((notif, index) => (
              <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#0d1a26', borderRadius: '5px', borderLeft: '3px solid #00d1b2' }}>
                <p style={{ fontSize: '0.9em' }}>{notif.message}</p>
                <p style={{ fontSize: '0.8em', color: '#a0a0a0' }}>{new Date(notif.timestamp).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No notifications yet</p>
          )}
        </div>
        <div style={{
          flex: '1 1 300px',
          backgroundColor: '#1a2b3c',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
          border: '1px solid #00d1b2',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
        }}
        >
          <h3 style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em', marginBottom: '15px' }}>Team Activity</h3>
          {teamActivities.length > 0 ? (
            teamActivities.map((activity, index) => (
              <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#0d1a26', borderRadius: '5px', borderLeft: '3px solid #00d1b2' }}>
                <p style={{ fontSize: '0.9em' }}>{activity.message}</p>
                <p style={{ fontSize: '0.8em', color: '#a0a0a0' }}>{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No recent updates</p>
          )}
        </div>
      </div>
      <Link to="/create-project" style={{
        padding: '12px 24px',
        background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '1em',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
      }}
      onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
      onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
        e.target.style.transform = 'scale(1)';
      }}
      >
        Create New Project
      </Link>
    </div>
  );
};

export default Home;