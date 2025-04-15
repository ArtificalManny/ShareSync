import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import ProjectForm from '../components/ProjectForm';
import PostsList from '../components/PostsList';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Post {
  _id: string;
  content: string;
  creator: { _id: string; username: string };
  project: { _id: string; name: string };
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  creator: { _id: string; username: string };
  sharedWith: string[];
}

const Home: React.FC<{ user: User }> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      auth: { token: localStorage.getItem('token') },
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Home.tsx: Connected to WebSocket server');
      newSocket.emit('joinUser', user._id);
    });

    newSocket.on('newPost', (post: Post) => {
      console.log('Home.tsx: New post received:', post);
      setPosts((prevPosts) => [post, ...prevPosts]);
    });

    newSocket.on('newProject', (project: Project) => {
      console.log('Home.tsx: New project received:', project);
      setProjects((prevProjects) => [project, ...prevProjects]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user._id]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${user.username}`);
        setProjects(response.data.data);
      } catch (err) {
        console.error('Home.tsx: Error fetching projects:', err);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/posts`);
        setPosts(response.data.data);
      } catch (err) {
        console.error('Home.tsx: Error fetching posts:', err);
      }
    };

    fetchProjects();
    fetchPosts();
  }, [user.username]);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome, {user.username}!</h1>
      <ProjectForm user={user} />
      <PostsList posts={posts} />
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
};

export default Home;