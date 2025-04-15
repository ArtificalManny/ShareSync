import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import CreatePost from '../components/CreatePost';
import PostsList from '../components/PostsList';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  creator: { _id: string; username: string };
  sharedWith: string[];
  teamActivity: { user: string; action: string; timestamp: string }[];
}

interface Post {
  _id: string;
  content: string;
  creator: { _id: string; username: string };
  project: { _id: string; name: string };
  createdAt: string;
}

const ProjectHome: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
      auth: { token: localStorage.getItem('token') },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('ProjectHome.tsx: Connected to WebSocket server');
      if (id) {
        newSocket.emit('joinProject', id);
      }
    });

    newSocket.on('newPost', (post: Post) => {
      console.log('ProjectHome.tsx: New post received:', post);
      setPosts((prevPosts) => [post, ...prevPosts]);
    });

    newSocket.on('teamActivity', (activity: { user: string; action: string; timestamp: string }) => {
      console.log('ProjectHome.tsx: New team activity:', activity);
      setProject((prevProject) =>
        prevProject ? { ...prevProject, teamActivity: [activity, ...(prevProject.teamActivity || [])] } : prevProject
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
        setProject(response.data.data);
      } catch (err) {
        console.error('ProjectHome.tsx: Error fetching project:', err);
        navigate('/projects');
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
        const projectPosts = response.data.data.filter(
          (post: Post) => post.project._id === id
        );
        setPosts(projectPosts);
      } catch (err) {
        console.error('ProjectHome.tsx: Error fetching posts:', err);
      }
    };

    if (id) {
      fetchProject();
      fetchPosts();
    }
  }, [id, navigate]);

  if (!project) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>{project.name}</h1>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Project Overview</h2>
        <p style={styles.description}>{project.description}</p>
        <p style={styles.text}>
          Created by: <span style={styles.highlight}>{project.creator.username}</span>
        </p>
        <p style={styles.text}>
          Shared with: <span style={styles.highlight}>{project.sharedWith.join(', ')}</span>
        </p>
      </div>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Create a Post</h2>
        <CreatePost projectId={project._id} />
      </div>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Posts</h2>
        <PostsList posts={posts} />
      </div>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Team Activity</h2>
        {project.teamActivity && project.teamActivity.length > 0 ? (
          <ul style={styles.list}>
            {project.teamActivity.map((activity, index) => (
              <li key={index} style={styles.listItem}>
                <span style={styles.activityText}>
                  {activity.user} {activity.action}
                </span>
                <span style={styles.activityDate}>
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.noContent}>No team activity yet.</p>
        )}
      </div>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    minHeight: '100vh',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '36px',
    textShadow: '0 0 15px #A2E4FF',
    marginBottom: '40px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '40px',
  },
  subHeading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    textShadow: '0 0 10px #A2E4FF',
    marginBottom: '20px',
    textAlign: 'center',
  },
  description: {
    fontSize: '18px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  text: {
    fontSize: '16px',
    marginBottom: '10px',
    textAlign: 'center',
  },
  highlight: {
    color: '#FF6F91',
    fontWeight: 'bold',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    background: 'rgba(162, 228, 255, 0.1)',
    padding: '15px 20px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: '16px',
    flex: 1,
  },
  activityDate: {
    fontSize: '14px',
    color: '#FF6F91',
    marginLeft: '20px',
  },
  noContent: {
    fontSize: '16px',
    color: '#FF6F91',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(145deg, #1E1E2F, #2A2A4A)',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    textShadow: '0 0 10px #A2E4FF',
  },
};

// Add hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  li:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default ProjectHome;