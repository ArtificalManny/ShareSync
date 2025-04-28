import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, updateProjectAnnouncement, updateProjectSnapshot, updateProjectStatus } from '../services/project.service';
import { toast } from 'react-toastify';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [snapshot, setSnapshot] = useState('');
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
        console.log('Projects - Fetched projects:', data);
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
        console.error('Projects - Error fetching projects:', error);
        toast.error('Failed to load projects', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchProjects();
  }, []);

  const handleAnnouncementSubmit = async (projectId) => {
    if (!announcement.trim()) {
      toast.error('Announcement cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const updatedProject = await updateProjectAnnouncement(projectId, { message: announcement, type: 'text' });
      console.log('Projects - Announcement updated:', updatedProject);
      setProjects(projects.map(project => project._id === projectId ? updatedProject : project));
      setAnnouncement('');
    } catch (error) {
      console.error('Projects - Error updating announcement:', error);
    }
  };

  const handleSnapshotSubmit = async (projectId) => {
    if (!snapshot.trim()) {
      toast.error('Snapshot cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const updatedProject = await updateProjectSnapshot(projectId, snapshot);
      console.log('Projects - Snapshot updated:', updatedProject);
      setProjects(projects.map(project => project._id === projectId ? updatedProject : project));
      setSnapshot('');
    } catch (error) {
      console.error('Projects - Error updating snapshot:', error);
    }
  };

  const handleStatusChange = async (projectId, status) => {
    try {
      const updatedProject = await updateProjectStatus(projectId, status);
      console.log('Projects - Status updated:', updatedProject);
      setProjects(projects.map(project => project._id === projectId ? updatedProject : project));
      setMetrics(prev => ({
        ...prev,
        currentProjects: projects.filter(p => p._id === projectId ? status === 'In Progress' : p.status === 'In Progress').length,
        pastProjects: projects.filter(p => p._id === projectId ? status === 'Completed' : p.status === 'Completed').length,
        tasksCompleted: status === 'Completed' ? prev.tasksCompleted + 10 : prev.tasksCompleted,
      }));
    } catch (error) {
      console.error('Projects - Error updating status:', error);
    }
  };

  return (
    <div style={{ padding: '30px', color: 'white', animation: 'fadeIn 1s ease-in-out' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '30px',
        fontWeight: 'bold',
        fontSize: '2.5em',
        textShadow: '0 2px 4px rgba(0, 209, 178, 0.5)',
      }}>Projects</h2>
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
        marginBottom: '30px',
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
      {projects.map(project => (
        <div key={project._id} style={{
          backgroundColor: '#1a2b3c',
          padding: '30px',
          borderRadius: '15px',
          marginBottom: '20px',
          boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
          border: '2px solid #00d1b2',
          backdropFilter: 'blur(10px)',
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
          <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Title:</strong> {project.title}</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Description:</strong> {project.description}</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Category:</strong> {project.category}</p>
          <p style={{ marginBottom: '15px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Status:</strong> {project.status}</p>
          <div style={{ marginBottom: '15px' }}>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(project._id, e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '0.9em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Post an announcement"
              style={{
                flex: '1',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
            <button
              onClick={() => handleAnnouncementSubmit(project._id)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
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
              Post
            </button>
          </div>
          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={snapshot}
              onChange={(e) => setSnapshot(e.target.value)}
              placeholder="Update snapshot"
              style={{
                flex: '1',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
            <button
              onClick={() => handleSnapshotSubmit(project._id)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
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
              Update
            </button>
          </div>
          <Link to={`/project/${project._id}`} style={{
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
            View Details
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Projects;