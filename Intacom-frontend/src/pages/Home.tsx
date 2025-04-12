import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface Notification {
  _id: string;
  message: string;
  read: boolean;
}

interface User {
  _id: string;
  username: string;
}

interface HomeProps {
  user: User | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name: projectName,
        description: projectDescription,
        owner: user._id,
      });
      setProjects([...projects, response.data.data]);
      setShowCreateProject(false);
      setProjectName('');
      setProjectDescription('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
  }, [user]);

  return (
    <div>
      <h1>Welcome, {user?.username || 'Guest'}</h1>
      <button onClick={() => setShowCreateProject(true)}>Create New Project</button>

      {showCreateProject && (
        <form onSubmit={handleCreateProject}>
          <input
            type="text"
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <textarea
            placeholder="Project Description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            required
          />
          <button type="submit">Create Project</button>
          <button type="button" onClick={() => setShowCreateProject(false)}>Cancel</button>
        </form>
      )}

      <h2>Your Projects</h2>
      {projects.map((project) => (
        <div key={project._id} onClick={() => navigate(`/project/${project._id}`)}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </div>
      ))}

      <h2>Notifications</h2>
      {notifications.map((notification) => (
        <div key={notification._id}>
          <p>{notification.message}</p>
          <p>{notification.read ? 'Read' : 'Unread'}</p>
        </div>
      ))}
    </div>
  );
};

export default Home;