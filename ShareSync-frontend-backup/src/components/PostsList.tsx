import { useEffect, useState } from 'react';
import axios from '../axios';
import PostItem from './PostItem';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const PostsListContainer = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

interface Post {
  _id: string;
  content: string;
  projectId: string;
  likes: number;
}

interface PostsListProps {
  projectId: string;
}

const PostsList = ({ projectId }: PostsListProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/posts/project/${projectId}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, [projectId]);

  return (
    <PostsListContainer theme={currentTheme}>
      {posts.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
    </PostsListContainer>
  );
};

export default PostsList;