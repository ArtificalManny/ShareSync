import React, { useState, useEffect } from 'react';
import { getProjects, addAnnouncement, updateSnapshot, updateStatus } from '../services/project.service';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [snapshot, setSnapshot] = useState('');

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

  const handleAnnouncementSubmit = async (projectId) => {
    try {
      await addAnnouncement(projectId, announcement);
      setAnnouncement('');
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (err) {
      setError(err.message || 'Failed to add announcement');
    }
  };

  const handleSnapshotSubmit = async (projectId) => {
    try {
      await updateSnapshot(projectId, snapshot);
      setSnapshot('');
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (err) {
      setError(err.message || 'Failed to update snapshot');
    }
  };

  const handleStatusChange = async (projectId, status) => {
    try {
      await updateStatus(projectId, status);
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#00d1b2' }}>Projects</h2>
      <Link to="/create-project">
        <button style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}>
          Create New Project
        </button>
      </Link>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        projects.map(project => (
          <div key={project._id} style={{ padding: '20px', border: '1px solid #00d1b2', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#1a2b3c' }}>
            <h3 style={{ margin: 0, color: '#00d1b2' }}>{project.title}</h3>
            <p style={{ color: '#ccc' }}>{project.description || 'No description'}</p>
            <p>Category: {project.category || 'Personal'}</p>
            <p>Status: {project.status}</p>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(project._id, e.target.value)}
              style={{ padding: '5px', borderRadius: '5px', marginBottom: '10px' }}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <Link to={`/project/${project._id}`} style={{ marginLeft: '10px', color: '#00d1b2', textDecoration: 'none' }}>
              View Project
            </Link>

            {/* Announcements */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#00d1b2' }}>Announcements</h4>
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
                  onClick={() => handleAnnouncementSubmit(project._id)}
                  style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
                >
                  Post Announcement
                </button>
              </div>
            </div>

            {/* Snapshot */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#00d1b2' }}>Current Snapshot</h4>
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
                  onClick={() => handleSnapshotSubmit(project._id)}
                  style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
                >
                  Update Snapshot
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Projects;