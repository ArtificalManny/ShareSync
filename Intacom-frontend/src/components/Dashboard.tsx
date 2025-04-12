import React, { useState, useEffect, FormEvent } from 'react';
import { styled } from '@mui/material/styles';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
import { theme } from '../styles/theme';
import { useNavigate } from 'react-router-dom';

// Styled components using the theme
const Sidebar = styled('div')(({ theme }) => ({
  width: '250px',
  backgroundColor: theme.colors.secondary,
  color: theme.colors.text,
  padding: theme.spacing.medium,
  position: 'fixed',
  height: '100vh',
  overflowY: 'auto',
}));

const SidebarItem = styled('div')(({ theme }) => ({
  padding: theme.spacing.small,
  margin: theme.spacing.small + ' 0',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.colors.primary,
    borderRadius: '4px',
  },
}));

const MainContent = styled('div')(({ theme }) => ({
  marginLeft: '250px',
  padding: theme.spacing.medium,
  backgroundColor: theme.colors.background,
  minHeight: '100vh',
}));

const PostContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.colors.secondary,
  padding: theme.spacing.medium,
  marginBottom: theme.spacing.medium,
  borderRadius: '8px',
}));

const PostContent = styled('p')(({ theme }) => ({
  color: theme.colors.text,
  marginBottom: theme.spacing.small,
}));

const ActionButton = styled('button')(({ theme }) => ({
  backgroundColor: theme.colors.primary,
  color: theme.colors.text,
  border: 'none',
  padding: theme.spacing.small,
  marginRight: theme.spacing.small,
  borderRadius: '4px',
  cursor: 'pointer',
  '&:hover': {
    opacity: 0.8,
  },
}));

// Define interfaces for Post and User
interface Post {
  _id: string;
  content: string;
  likes: number;
  comments: number;
}

interface User {
  _id: string;
  username: string;
}

// Define props for Dashboard component
interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newPost, setNewPost] = useState('');
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const projectId = 'some-project-id'; // Replace with actual project ID logic
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/project/${projectId}?page=${page}`);
      const newPosts: Post[] = response.data.data;
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setPage((prevPage) => prevPage + 1);
      setHasMore(newPosts.length > 0);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const userId = user?._id;
      if (!userId) throw new Error('User not logged in');
      await axios.post(`${import.meta.env.VITE_API_URL}/posts/like/${postId}`, { userId });
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        content: newPost,
        projectId: 'some-project-id', // Replace with actual project ID
        userId: user?._id,
      });
      const newPostData: Post = response.data.data;
      setPosts((prevPosts) => [newPostData, ...prevPosts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div>
      <Sidebar>
        <SidebarItem onClick={() => navigate('/')}>Home</SidebarItem>
        <SidebarItem onClick={() => navigate(`/profile/${user?.username || ''}`)}>Profile</SidebarItem>
        <SidebarItem onClick={() => navigate('/projects')}>Projects</SidebarItem>
        <SidebarItem onClick={() => navigate('/notifications')}>Notifications</SidebarItem>
        <SidebarItem onClick={() => navigate('/leaderboard')}>Leaderboard</SidebarItem>
        <SidebarItem onClick={() => navigate('/logout')}>Logout</SidebarItem>
      </Sidebar>
      <MainContent>
        <form onSubmit={handlePostSubmit}>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
          />
          <button type="submit">Post</button>
        </form>
        <InfiniteScroll
          dataLength={posts.length}
          next={fetchPosts}
          hasMore={hasMore}
          loader={<h4>Loading...</h4>}
        >
          {posts.map((post) => (
            <PostContainer key={post._id}>
              <PostContent>{post.content}</PostContent>
              <ActionButton onClick={() => handleLike(post._id)}>
                Like ({post.likes})
              </ActionButton>
              <ActionButton>Comment ({post.comments})</ActionButton>
            </PostContainer>
          ))}
        </InfiniteScroll>
      </MainContent>
    </div>
  );
};

export default Dashboard;