import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface Project {
  _id: string;
  name: string;
  description: string;
  creatorEmail: string;
  createdAt: string;
}

interface Notification {
  _id: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Task {
  _id: string;
  title: string;
  status: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
}

interface HomeProps {
  user: User | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', creatorEmail: '', sharedWith: '' });
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:3001', { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Home.tsx: WebSocket connected');
      newSocket.emit('joinUser', { userId: user._id });
    });

    newSocket.on('projectCreated', (project: Project) => {
      console.log('Home.tsx: Received projectCreated event:', project);
      setProjects((prev) => [...prev, project]);
    });

    newSocket.on('notificationCreated', (notification: Notification) => {
      console.log('Home.tsx: Received notificationCreated event:', notification);
      setNotifications((prev) => [...prev, notification]);
    });

    newSocket.on('taskCompleted', (task: Task) => {
      console.log('Home.tsx: Received taskCompleted event:', task);
      setTasks((prev) => {
        const updatedTasks = prev.filter((t) => t._id !== task._id);
        if (task.status === 'completed') {
          return [...updatedTasks, task];
        }
        return updatedTasks;
      });
    });

    return () => {
      newSocket.disconnect();
      console.log('Home.tsx: WebSocket disconnected');
    };
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`, {
        withCredentials: true,
      });
      setProjects(response.data.data || []);
    } catch (err: any) {
      console.error('Home.tsx: Error fetching projects:', err.message);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`, {
        withCredentials: true,
      });
      setNotifications(response.data.data || []);
    } catch (err: any) {
      console.error('Home.tsx: Error fetching notifications:', err.message);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/user/${user._id}`, {
        withCredentials: true,
      });
      setTasks(response.data.data || []);
    } catch (err: any) {
      console.error('Home.tsx: Error fetching tasks:', err.message);
    }
  };

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to create a project.');
      return;
    }
    if (!newProject.name || !newProject.description) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      const projectData = {
        name: newProject.name,
        description: newProject.description,
        creatorEmail: user.email, // Ensure creatorEmail is sent
        sharedWith: newProject.sharedWith ? [newProject.sharedWith] : [],
      };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, projectData, {
        withCredentials: true,
      });
      const createdProject = response.data.data;
      // Emit WebSocket event
      if (socket) {
        socket.emit('createProject', createdProject);
      }
      setNewProject({ name: '', description: '', creatorEmail: '', sharedWith: '' });
      setError(null);
      fetchProjects(); // Refresh project list
    } catch (err: any) {
      console.error('Home.tsx: Error creating project:', err.message, err.response?.data);
      setError('Failed to create project. Please ensure the backend is running and try again.');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
    fetchTasks();
  }, [user]);

  if (!user) {
    return <div style={styles.container}>Please log in to view this page.</div>;
  }

  return (
    <div style={styles.container}>
      <h1>🏠 Home - ShareSync</h1>
      <button onClick={() => fetchProjects()} style={styles.createProjectButton}>Create Project</button>
      <div style={styles.sections}>
        <div style={styles.section}>
          <h2>🔔 Notifications ({notifications.length})</h2>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif._id} style={styles.notification}>
                <p>{notif.content}</p>
                <p style={styles.notificationDate}>{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p>No notifications yet.</p>
          )}
        </div>
        <div style={styles.section}>
          <h2>📝 Create a New Project</h2>
          <form onSubmit={handleCreateProject} style={styles.form}>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              style={styles.textarea}
              required
            />
            <input
              type="email"
              placeholder="Creator Email"
              value={user.email}
              readOnly
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Share with (email)"
              value={newProject.sharedWith}
              onChange={(e) => setNewProject({ ...newProject, sharedWith: e.target.value })}
              style={styles.input}
            />
            <button type="submit" style={styles.submitButton}>Create Project</button>
            {error && <p style={styles.error}>{error}</p>}
          </form>
        </div>
        <div style={styles.section}>
          <h2>📊 Project Overview</h2>
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id} style={styles.projectCard}>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <p>Created by: {project.creatorEmail}</p>
                <p>Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p>No projects yet.</p>
          )}
        </div>
        <div style={styles.section}>
          <h2>✅ Tasks Completed</h2>
          <p style={styles.stat}>{tasks.filter(task => task.status === 'completed').length}</p>
        </div>
        <div style={styles.section}>
          <h2>📚 Total Projects</h2>
          <p style={styles.stat}>{projects.length}</p>
        </div>
        <div style={styles.section}>
          <h2>🔄 Current Projects</h2>
          <p style={styles.stat}>{projects.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
        </div>
        <div style={styles.section}>
          <h2>📜 Past Projects</h2>
          <p style={styles.stat}>{projects.filter(p => new Date(p.createdAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
        </div>
      </div>
      <div style={styles.section}>
        <h2>👥 Team Activity</h2>
        <p>No recent updates.</p>
      </div>
    </div>
  );
};

// Inline styles with updated color palette
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#2B3A67', // Deep Blue
    color: '#FFFFFF', // White text
  },
  createProjectButton: {
    backgroundColor: '#E3F2FD', // Soft Blue
    color: '#2B3A67', // Deep Blue
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginBottom: '20px',
  },
  sections: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '20px',
  },
  section: {
    flex: '1 1 300px',
    backgroundColor: '#3F51B5', // Indigo
    padding: '20px',
    borderRadius: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #E3F2FD', // Soft Blue
    fontSize: '16px',
    backgroundColor: '#FFFFFF', // White
    color: '#2B3A67', // Deep Blue
  },
  textarea: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #E3F2FD', // Soft Blue
    fontSize: '16px',
    minHeight: '100px',
    backgroundColor: '#FFFFFF', // White
    color: '#2B3A67', // Deep Blue
  },
  submitButton: {
    backgroundColor: '#E3F2FD', // Soft Blue
    color: '#2B3A67', // Deep Blue
    border: 'none',
    padding: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  error: {
    color: '#FF6F61', // Coral
    marginTop: '10px',
  },
  projectCard: {
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#2B3A67', // Deep Blue
    borderRadius: '4px',
  },
  stat: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E3F2FD', // Soft Blue
  },
  notification: {
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#3F51B5', // Indigo
    borderRadius: '4px',
  },
  notificationDate: {
    fontSize: '12px',
    color: '#E3F2FD', // Soft Blue
  },
};

export default Home;