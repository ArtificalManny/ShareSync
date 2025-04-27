import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, updateProjectAnnouncement, updateProjectSnapshot, updateProjectStatus } from '../services/project.service';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [snapshot, setSnapshot] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        console.log('Projects - Fetched projects:', data);
        setProjects(data);
      } catch (error) {
        console.error('Projects - Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleAnnouncementSubmit = async (projectId) => {
    try {
      const updatedProject = await updateProjectAnnouncement(projectId, announcement);
      console.log('Projects - Announcement updated:', updatedProject);
      setProjects(projects.map(project => project._id === projectId ? updatedProject : project));
      setAnnouncement('');
    } catch (error) {
      console.error('Projects - Error updating announcement:', error);
    }
  };

  const handleSnapshotSubmit = async (projectId) => {
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
    } catch (error) {
      console.error('Projects - Error updating status:', error);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2 style={{ color: '#00d1b2', marginBottom: '20px' }}>Projects</h2>
      <Link to="/create-project" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        Create New Project
      </Link>
      {projects.map(project => (
        <div key={project._id} style={{ backgroundColor: '#1a2b3c', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
          <p><strong>Title:</strong> {project.title}</p>
          <p><strong>Description:</strong> {project.description}</p>
          <p><strong>Category:</strong> {project.category}</p>
          <p><strong>Status:</strong> {project.status}</p>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(project._id, e.target.value)}
              style={{ padding: '5px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Post an announcement"
              style={{ width: '70%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white', marginRight: '10px' }}
            />
            <button
              onClick={() => handleAnnouncementSubmit(project._id)}
              style={{ padding: '8px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Post
            </button>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={snapshot}
              onChange={(e) => setSnapshot(e.target.value)}
              placeholder="Update snapshot"
              style={{ width: '70%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white', marginRight: '10px' }}
            />
            <button
              onClick={() => handleSnapshotSubmit(project._id)}
              style={{ padding: '8px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Update
            </button>
          </div>
          <Link to={`/project/${project._id}`} style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', textDecoration: 'none' }}>
            View Details
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Projects;