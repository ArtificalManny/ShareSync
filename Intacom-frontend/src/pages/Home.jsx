import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

function Home() {
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#000000', sharedWith: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/ArtificalManny`);
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/ArtificalManny`);
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchProjects();
    fetchNotifications();
  }, []);

  const handleCreateProject = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name: newProject.name,
        description: newProject.description,
        admin: 'ArtificalManny', // Replace with actual user ID
        color: newProject.color,
        sharedWith: newProject.sharedWith,
      });
      console.log('Project created:', response.data);
      setShowCreateProjectModal(false);
      setNewProject({ name: '', description: '', color: '#000000', sharedWith: [] });
      navigate(`/project/${response.data.data._id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="home">
      <div className="sidebar">
        <h2>Projects</h2>
        {projects.map((project) => (
          <Link key={project._id} to={`/project/${project._id}`} className="project-link">
            <div className="project-item" style={{ backgroundColor: project.color }}>
              {project.name}
            </div>
          </Link>
        ))}
        <button onClick={() => setShowCreateProjectModal(true)}>Create Project</button>
        <h2>Notifications ({notifications.length})</h2>
        {notifications.map((notification) => (
          <div key={notification._id} className="notification">
            {notification.message} - {new Date(notification.createdAt).toLocaleString()}
          </div>
        ))}
      </div>
      <div className="main-content">
        <h1>Welcome to Intacom</h1>
        <p>Start by creating a project.</p>
      </div>

      {showCreateProjectModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create a New Project</h2>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <input
              type="color"
              value={newProject.color}
              onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
            />
            <button onClick={handleCreateProject}>Create</button>
            <button onClick={() => setShowCreateProjectModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;