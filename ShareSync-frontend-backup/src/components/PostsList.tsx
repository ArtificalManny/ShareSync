import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import PostItem from './PostItem';
import styled from 'styled-components';

const PostsContainer = styled.div`
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  border-radius: 10px;
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Post {
  _id: string;
  content: string;
  creator: { _id: string; firstName: string; lastName: string };
  likes: string[];
}

const PostsList = ({ projectId }: { projectId: string }) => {
  const { currentTheme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/posts/${projectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPosts(response.data);
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      }
    };
    fetchPosts();
  }, [projectId]);

  return (
    <PostsContainer theme={currentTheme}>
      {posts.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
    </PostsContainer>
  );
};

export default PostsList;