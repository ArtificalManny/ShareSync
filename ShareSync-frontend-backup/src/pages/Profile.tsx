import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
}

interface Post {
  _id: string;
  content: string;
  creator: { _id: string; username: string };
  project: { _id: string; name: string };
  createdAt: string;
}

const Profile: React.FC<{ user: User }> = ({ user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchUserProjects = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/projects/${user.username}`);
        setProjects(response.data.data);
      } catch (err) {
        console.error('Profile.tsx: Error fetching user projects:', err);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/posts`);
        const userPosts = response.data.data.filter(
          (post: Post) => post.creator._id === user._id
        );
        setPosts(userPosts);
      } catch (err) {
        console.error('Profile.tsx: Error fetching user posts:', err);
      }
    };

    fetchUserProjects();
    fetchUserPosts();
  }, [user.username, user._id]);

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Profile - {user.username}</h1>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Your Projects</h2>
        {projects.length > 0 ? (
          <ul style={styles.list}>
            {projects.map((project) => (
              <li key={project._id} style={styles.listItem}>
                <span style={styles.projectName}>{project.name}</span>
                <span style={styles.description}>{project.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.noContent}>You haven't created any projects yet.</p>
        )}
      </div>
      <div style={styles.section}>
        <h2 style={styles.subHeading}>Your Posts</h2>
        {posts.length > 0 ? (
          <ul style={styles.list}>
            {posts.map((post) => (
              <li key={post._id} style={styles.listItem}>
                <span style={styles.postContent}>{post.content}</span>
                <span style={styles.postDetails}>
                  In {post.project.name} -{' '}
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.noContent}>You haven't created any posts yet.</p>
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
  projectName: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  description: {
    fontSize: '16px',
    color: '#FF6F91',
    marginLeft: '20px',
  },
  postContent: {
    fontSize: '16px',
    flex: 1,
  },
  postDetails: {
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
};

// Add hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  li:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default Profile;