import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjects, addAnnouncement, updateSnapshot, updateStatus } from '../services/project.service';

const ProjectHome = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [snapshot, setSnapshot] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projects = await getProjects();
        const project = projects.find(p => p._id === projectId);
        if (!project) {
          throw new Error('Project not found');
        }
        setProject(project);
      } catch (err) {
        setError(err.message || 'Failed to load project');
      }
    };
    fetchProject();
  }, [projectId]);

  const handleAnnouncementSubmit = async () => {
    try {
      await addAnnouncement(projectId, announcement);
      setAnnouncement('');
      const projects = await getProjects();
      const updatedProject = projects.find(p => p._id === projectId);
      setProject(updatedProject);
    } catch (err) {
      setError(err.message || 'Failed to add announcement');
    }
  };

  const handleSnapshotSubmit = async () => {
    try {
      await updateSnapshot(projectId, snapshot);
      setSnapshot('');
      const projects = await getProjects();
      const updatedProject = projects.find(p => p._id === projectId);
      setProject(updatedProject);
    } catch (err) {
      setError(err.message || 'Failed to update snapshot');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await updateStatus(projectId, status);
      const projects = await getProjects();
      const updatedProject = projects.find(p => p._id === projectId);
      setProject(updatedProject);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!project) {
    return <p>Loading...</p>;
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
    </div>
  );
};

export default ProjectHome;