import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

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

interface TeamActivity {
  content: string;
  timestamp: string;
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
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', sharedWith: '' });
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:3001', {
      auth: { token: localStorage.getItem('token') },
    });
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

    newSocket.on('teamActivity', (activity: TeamActivity) => {
      console.log('Home.tsx: Received teamActivity event:', activity);
      setTeamActivity((prev) => [...prev, activity]);
    });

    return () => {
      newSocket.disconnect();
      console.log('Home.tsx: WebSocket disconnected');
    };
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
      setProjects(response.data.data || []);
    } catch (err: any) {
      console.error('Home.tsx: Error fetching projects:', err.message);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/${user._id}`);
      setNotifications(response.data.data || []);
    } catch (err: any) {
      console.error('Home.tsx: Error fetching notifications:', err.message);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/user/${user._id}`);
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
        creatorEmail: user.email,
        sharedWith: newProject.sharedWith ? [newProject.sharedWith] : [],
      };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, projectData);
      const createdProject = response.data.data;
      setNewProject({ name: '', description: '', sharedWith: '' });
      setError(null);
      navigate(`/project/${createdProject._id}`);
    } catch (err: any) {
      console.error('Home.tsx: Error creating project:', err.message, err.response?.data);
      setError('Failed to create project. Please ensure you are logged in and try again.');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
    fetchTasks();
  }, [user]);

  if (!user) {
    return <div style={styles.errorMessage}>Please log in to view this page.</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🏠 Home - ShareSync</h1>
      <button onClick={() => fetchProjects()} style={styles.createProjectButton}>Create Project</button>
      <div style={styles.sections}>
        <div style={styles.section}>
          <h2 style={styles.subHeading}>🔔 Notifications ({notifications.length})</h2>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif._id} style={styles.notification}>
                <p style={styles.text}>{notif.content}</p>
                <p style={styles.notificationDate}>{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p style={styles.text}>No notifications yet.</p>
          )}
        </div>
        <div style={styles.section}>
          <h2 style={styles.subHeading}>📝 Create a New Project</h2>
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
          <h2 style={styles.subHeading}>📊 Project Overview</h2>
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id} style={styles.projectCard}>
                <h3 style={styles.cardTitle}>{project.name}</h3>
                <p style={styles.text}>{project.description}</p>
                <p style={styles.text}>Created by: {project.creatorEmail}</p>
                <p style={styles.text}>Created on: {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p style={styles.text}>No projects yet.</p>
          )}
        </div>
        <div style={styles.section}>
          <h2 style={styles.subHeading}>✅ Tasks Completed</h2>
          <p style={styles.stat}>{tasks.filter(task => task.status === 'completed').length}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.subHeading}>📚 Total Projects</h2>
          <p style={styles.stat}>{projects.length}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.subHeading}>🔄 Current Projects</h2>
          <p style={styles.stat}>{projects.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
        </div>
        <div style={styles.section}>
          <h2 style={styles.subHeading}>📜 Past Projects</h2>
          <p style={styles.stat}>{projects.filter(p => new Date(p.createdAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</p>
        </div>
      </div>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>👥 Team Activity</h2>
        {teamActivity.length > 0 ? (
          teamActivity.map((activity, index) => (
            <div key={index} style={styles.activity}>
              <p style={styles.text}>{activity.content}</p>
              <p style={styles.activityDate}>{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p style={styles.text}>No recent updates.</p>
        )}
      </div>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
    animation: 'fadeIn 1s ease-in-out',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '30px',
    textShadow: '0 0 15px #A2E4FF',
  },
  createProjectButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
    marginBottom: '30px',
  },
  sections: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '30px',
    marginBottom: '30px',
  },
  section: {
    flex: '1 1 300px',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.2)',
    border: '1px solid #A2E4FF',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  subHeading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '22px',
    marginBottom: '15px',
    textShadow: '0 0 10px #A2E4FF',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    fontSize: '16px',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    transition: 'box-shadow 0.3s ease',
  },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    fontSize: '16px',
    minHeight: '100px',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    transition: 'box-shadow 0.3s ease',
  },
  submitButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
  error: {
    color: '#FF6F91',
    marginTop: '10px',
    fontFamily: '"Orbitron", sans-serif',
  },
  projectCard: {
    padding: '15px',
    marginBottom: '15px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.1)',
    transition: 'transform 0.3s ease',
  },
  cardTitle: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '18px',
    marginBottom: '10px',
    color: '#A2E4FF',
    textShadow: '0 0 5px #A2E4FF',
  },
  stat: {
    fontSize: '28px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF6F91',
    textShadow: '0 0 10px #FF6F91',
    fontFamily: '"Orbitron", sans-serif',
  },
  notification: {
    padding: '15px',
    marginBottom: '15px',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.1)',
  },
  notificationDate: {
    fontSize: '12px',
    color: '#A2E4FF',
    marginTop: '5px',
    fontFamily: '"Orbitron", sans-serif',
  },
  activity: {
    padding: '15px',
    marginBottom: '15px',
    background: 'linear-gradient(145deg, #2A2A4A, #3F3F6A)',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.1)',
  },
  activityDate: {
    fontSize: '12px',
    color: '#A2E4FF',
    marginTop: '5px',
    fontFamily: '"Orbitron", sans-serif',
  },
  text: {
    fontFamily: '"Orbitron", sans-serif',
    color: '#A2E4FF',
  },
  errorMessage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#FF6F91',
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    textShadow: '0 0 10px #FF6F91',
  },
};

// Add animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  div[style*="flex: 1 1 300px"]:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  div[style*="background: linear-gradient(145deg, #1E1E2F, #2A2A4A)"]:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.3);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  input:focus, textarea:focus {
    box-shadow: 0 0 10px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Home;