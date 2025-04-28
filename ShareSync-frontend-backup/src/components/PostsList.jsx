import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const PostsList = ({ projectId }) => {
  const { currentTheme } = useContext(ThemeContext);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('PostsList - Failed to fetch posts:', error);
      }
    };
    fetchPosts();
  }, [projectId]);

  return (
    <div>
      <PostsContainer theme={currentTheme}>
        {posts.map(post => (
          <PostItem key={post._id} post={post} />
        ))}
      </PostsContainer>
    </div>
  );
};

const PostsContainer = ({ theme, children }) => (
  <div style={{
    backgroundColor: theme === 'dark' ? '#1a2b3c' : '#f0f0f0',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
    border: `2px solid ${theme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
  }}>
    {children}
  </div>
);

const PostItem = ({ post }) => (
  <div style={{
    marginBottom: '15px',
    padding: '15px',
    backgroundColor: '#0d1a26',
    borderRadius: '5px',
    borderLeft: '3px solid #ffd700',
  }}>
    <h4 style={{ color: '#ffd700', fontSize: '1em', marginBottom: '5px' }}>{post.title}</h4>
    <p style={{ fontSize: '0.9em', color: 'white' }}>{post.content}</p>
    {post.category && (
      <p style={{ fontSize: '0.8em', color: '#a0a0a0' }}>
        Category: {post.category}
      </p>
    )}
  </div>
);

export default PostsList;