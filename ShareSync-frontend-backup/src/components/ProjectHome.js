import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { getProjects, addAnnouncement, updateSnapshot, updateStatus } from '../services/project.service';

const ProjectHome = () => {
  const { loading: authLoading } = useContext(AuthContext);
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [snapshot, setSnapshot] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projectList = await getProjects();
        setProjects(projectList);
        const foundProject = projectList.find(p => p._id === projectId);
        if (!foundProject) {
          throw new Error('Project not found');
        }
        setProject(foundProject);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    if (!authLoading) {
      fetchProject();
    }
  }, [projectId, authLoading]);

  const handleAnnouncementSubmit = async () => {
    try {
      await addAnnouncement(projectId, announcement);
      setAnnouncement('');
      const projectList = await getProjects();
      setProjects(projectList);
      const updatedProject = projectList.find(p => p._id === projectId);
      setProject(updatedProject);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSnapshotSubmit = async () => {
    try {
      await updateSnapshot(projectId, snapshot);
      setSnapshot('');
      const projectList = await getProjects();
      setProjects(projectList);
      const updatedProject = projectList.find(p => p._id === projectId);
      setProject(updatedProject);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateStatus(projectId, status);
      const projectList = await getProjects();
      setProjects(projectList);
      const updatedProject = projectList.find(p => p._id === projectId);
      setProject(updatedProject);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (authLoading) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}><p>Loading...</p></div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!project) {
    return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}><p>Loading...</p></div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#00d1b2' }}>{project.title}</h2>
      <p style={{ color: '#ccc' }}>{project.description || 'No description'}</p>
      <p>Category: {project.category || 'Personal'}</p>
      <p>Status: {project.status}</p>
      <select
        value={project.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        style={{ padding: '5px', borderRadius: '5px', marginBottom: '20px' }}
      >
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      {/* Team Activities */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00d1b2' }}>Team Activities</h3>
        {project.teamActivities && project.teamActivities.length > 0 ? (
          project.teamActivities.map((activity, index) => (
            <div key={index} style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', marginBottom: '10px' }}>
              <p style={{ margin: 0 }}>{activity.message}</p>
              <p style={{ margin: 0, color: '#ccc', fontSize: '0.9em' }}>
                {activity.type} on {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p>No team activities yet.</p>
        )}
      </div>

      {/* Announcements */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00d1b2' }}>Announcements</h3>
        {project.announcements && project.announcements.length > 0 ? (
          project.announcements.map((ann, index) => (
            <div key={index} style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', marginBottom: '10px' }}>
              <p style={{ margin: 0 }}>{ann.message}</p>
              <p style={{ margin: 0, color: '#ccc', fontSize: '0.9em' }}>
                Posted by {ann.postedBy} on {new Date(ann.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p>No announcements yet.</p>
        )}
        <div style={{ marginTop: '10px' }}>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Post an announcement..."
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
          <button
            onClick={handleAnnouncementSubmit}
            style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
          >
            Post Announcement
          </button>
        </div>
      </div>

      {/* Snapshot */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00d1b2' }}>Current Snapshot</h3>
        {project.snapshot ? (
          <p>{project.snapshot}</p>
        ) : (
          <p>No snapshot available.</p>
        )}
        <div style={{ marginTop: '10px' }}>
          <textarea
            value={snapshot}
            onChange={(e) => setSnapshot(e.target.value)}
            placeholder="Update project snapshot..."
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2' }}
          />
          <button
            onClick={handleSnapshotSubmit}
            style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
          >
            Update Snapshot
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00d1b2' }}>Project Overview</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Total Projects</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>{projects.length}</p>
          </div>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Current Projects</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>{projects.filter(p => p.status === 'In Progress').length}</p>
          </div>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Past Projects</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>{projects.filter(p => p.status === 'Completed').length}</p>
          </div>
          <div style={{ padding: '10px', border: '1px solid #00d1b2', borderRadius: '5px', backgroundColor: '#1a2b3c', flex: '1', minWidth: '150px', textAlign: 'center' }}>
            <h4 style={{ color: '#ccc', margin: 0 }}>Tasks Completed</h4>
            <p style={{ color: '#00d1b2', fontSize: '1.5rem', margin: 0 }}>14</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;