import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjects, updateProjectAnnouncement, updateProjectSnapshot } from '../services/project.service';

const ProjectHome = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [snapshot, setSnapshot] = useState('');
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projects = await getProjects();
        const selectedProject = projects.find(p => p._id === projectId);
        console.log('ProjectHome - Fetched project:', selectedProject);
        setProject(selectedProject);

        const total = projects.length;
        const current = projects.filter(p => p.status === 'In Progress').length;
        const past = projects.filter(p => p.status === 'Completed').length;
        const tasks = past * 10; // Placeholder: 10 tasks per completed project

        setMetrics({
          totalProjects: total,
          currentProjects: current,
          pastProjects: past,
          tasksCompleted: tasks,
        });
      } catch (error) {
        console.error('ProjectHome - Error fetching project:', error);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleAnnouncementSubmit = async () => {
    try {
      const updatedProject = await updateProjectAnnouncement(projectId, announcement);
      console.log('ProjectHome - Announcement updated:', updatedProject);
      setProject(updatedProject);
      setAnnouncement('');
    } catch (error) {
      console.error('ProjectHome - Error updating announcement:', error);
    }
  };

  const handleSnapshotSubmit = async () => {
    try {
      const updatedProject = await updateProjectSnapshot(projectId, snapshot);
      console.log('ProjectHome - Snapshot updated:', updatedProject);
      setProject(updatedProject);
      setSnapshot('');
    } catch (error) {
      console.error('ProjectHome - Error updating snapshot:', error);
    }
  };

  if (!project) return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '20px',
        fontWeight: 'bold',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
      }}>{project.title}</h2>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '20px',
        borderRadius: '5px',
        marginBottom: '20px',
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
        <p><strong style={{ color: '#00d1b2' }}>Description:</strong> {project.description}</p>
        <p><strong style={{ color: '#00d1b2' }}>Category:</strong> {project.category}</p>
        <p><strong style={{ color: '#00d1b2' }}>Status:</strong> {project.status}</p>
      </div>
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
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '20px',
        borderRadius: '5px',
        marginBottom: '20px',
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
        <h3 style={{ color: '#00d1b2', marginBottom: '10px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Team Activities</h3>
        <p>{project.teamActivities?.length > 0 ? project.teamActivities.map(activity => (
          <div key={activity._id}>{activity.message} - {new Date(activity.timestamp).toLocaleString()}</div>
        )) : 'No team activities yet'}</p>
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '20px',
        borderRadius: '5px',
        marginBottom: '20px',
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
        <h3 style={{ color: '#00d1b2', marginBottom: '10px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Announcements</h3>
        {project.announcements?.length > 0 && project.announcements.map(ann => (
          <div key={ann._id} style={{ marginBottom: '10px' }}>
            <p>{ann.message} - {new Date(ann.timestamp).toLocaleString()}</p>
          </div>
        ))}
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Post an announcement"
            style={{
              width: '70%',
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              marginRight: '10px',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
            onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
          />
          <button
            onClick={handleAnnouncementSubmit}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.3s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
          >
            Post
          </button>
        </div>
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '20px',
        borderRadius: '5px',
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
        <h3 style={{ color: '#00d1b2', marginBottom: '10px', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Current Snapshot</h3>
        <p>{project.snapshot || 'No snapshot available'}</p>
        <div style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={snapshot}
            onChange={(e) => setSnapshot(e.target.value)}
            placeholder="Update snapshot"
            style={{
              width: '70%',
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              marginRight: '10px',
              transition: 'border-color 0.3s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
            onBlur={(e) => e.target.style.borderColor = '#00d1b2'}
          />
          <button
            onClick={handleSnapshotSubmit}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.3s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;