import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Home.css';

interface User {
  _id: string;
  username: string;
}

interface Project {
  _id: string;
  name: string;
  color: string;
  status: string;
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
}

interface HomeProps {
  user: User | null;
}

function Home({ user }: HomeProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: theme.colors.primary,
    sharedWith: [] as { userId: string; role: string }[],
  });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      try {
        console.log('Fetching projects for username:', user.username);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
        console.log('Projects fetch response:', response.data);
        setProjects(response.data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching projects:', error.response?.data || error.message);
        if (error.response?.status === 404) {
          setError('No projects found.');
        } else if (error.response?.status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError('Failed to load projects. Please try again.');
        }
      }
    };

    const fetchNotifications = async () => {
      if (!user) return;
      try {
        console.log('Fetching notifications for user ID:', user._id);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
        console.log('Notifications fetch response:', response.data);
        setNotifications(response.data);
      } catch (error: any) {
        console.error('Error fetching notifications:', error.response?.data || error.message);
      }
    };

    fetchProjects();
    fetchNotifications();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) {
      alert('Please log in to create a project');
      navigate('/login');
      return;
    }
    try {
      console.log('Creating project with data:', { ...newProject, admin: user._id });
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name: newProject.name,
        description: newProject.description,
        admin: user._id,
        color: newProject.color,
        sharedWith: newProject.sharedWith,
      });
      console.log('Project creation response:', response.data);
      setShowCreateProjectModal(false);
      setNewProject({ name: '', description: '', color: theme.colors.primary, sharedWith: [] });
      navigate(`/project/${response.data.data._id}`);
      alert('Project created successfully!');
    } catch (error: any) {
      console.error('Error creating project:', error.response?.data || error.message);
      alert('Failed to create project. Please try again.');
    }
  };

  return (
    <div className="home">
      <div className="sidebar">
        <h2 style={{ color: theme.colors.primary }}>Projects</h2>
        {error ? (
          <p className="error" style={{ color: theme.colors.error }}>{error}</p>
        ) : projects.length === 0 ? (
          <p>No projects yet! Create a project to get started!</p>
        ) : (
          projects.map((project) => (
            <Link key={project._id} to={`/project/${project._id}`} className="project-link">
              <div className="project-item" style={{ backgroundColor: project.color }}>
                {project.name}
              </div>
            </Link>
          ))
        )}
        <button
          onClick={() => setShowCreateProjectModal(true)}
          style={{ backgroundColor: theme.colors.secondary, color: theme.colors.text }}
        >
          Create Project
        </button>
        <h2 style={{ color: theme.colors.primary }}>Notifications ({notifications.length})</h2>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification._id} className="notification">
              {notification.message} - {new Date(notification.createdAt).toLocaleString()}
            </div>
          ))
        )}
      </div>
      <div className="main-content">
        <h1 style={{ color: theme.colors.primary }}>Home</h1>
        <div className="overview">
          <div className="overview-item">
            <h2 style={{ color: theme.colors.accent }}>Project Overview</h2>
            <div className="overview-stats">
              <div>
                <h3 style={{ color: theme.colors.secondary }}>Total Projects</h3>
                <p>{projects.length}</p>
              </div>
              <div>
                <h3 style={{ color: theme.colors.secondary }}>Current Projects</h3>
                <p>{projects.filter((p) => p.status === 'current').length}</p>
              </div>
              <div>
                <h3 style={{ color: theme.colors.secondary }}>Past Projects</h3>
                <p>{projects.filter((p) => p.status === 'past').length}</p>
              </div>
            </div>
          </div>
          <div className="overview-item">
            <h2 style={{ color: theme.colors.accent }}>Tasks Completed</h2>
            <p>0</p>
          </div>
          <div className="overview-item">
            <h2 style={{ color: theme.colors.accent }}>Team Activity</h2>
            <p>0 updates</p>
          </div>
        </div>
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
            <input
              type="text"
              placeholder="Share with (email)"
              onChange={(e) => {
                const email = e.target.value;
                setNewProject({
                  ...newProject,
                  sharedWith: email ? [{ userId: email, role: 'viewer' }] : [],
                });
              }}
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