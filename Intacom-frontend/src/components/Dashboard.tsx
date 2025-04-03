import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled(motion.div)`
  width: 250px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  position: fixed;
  height: 100vh;
`;

const SidebarItem = styled.div`
  margin-bottom: ${theme.spacing.md};
  cursor: pointer;
  font-size: ${theme.typography.body.fontSize};
  &:hover {
    color: ${theme.colors.accent};
  }
`;

const MainContent = styled.div`
  margin-left: 250px;
  padding: ${theme.spacing.lg};
  flex: 1;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  color: ${theme.colors.primary};
`;

const Button = styled.button`
  background: ${theme.colors.secondary};
`;

const Feed = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const PostCard = styled(motion.div)`
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.md};
`;

const PostContent = styled.p`
  font-size: ${theme.typography.body.fontSize};
  margin-bottom: ${theme.spacing.sm};
`;

const PostActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ActionButton = styled.button`
  background: none;
  color: ${theme.colors.textLight};
  font-size: ${theme.typography.caption.fontSize};
  &:hover {
    color: ${theme.colors.primary};
  }
`;

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/project/:projectId?page=${page}`);
      const newPosts = response.data;
      setPosts([...posts, ...newPosts]);
      setPage(page + 1);
      if (newPosts.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/posts/like/${postId}`, { userId: JSON.parse(localStorage.getItem('user'))._id });
      fetchPosts(); // Refresh the feed
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <Container>
      <Sidebar
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SidebarItem onClick={() => navigate('/dashboard')}>Dashboard</SidebarItem>
        <SidebarItem onClick={() => navigate('/projects')}>Projects</SidebarItem>
        <SidebarItem onClick={() => navigate('/notifications')}>Notifications</SidebarItem>
        <SidebarItem onClick={() => navigate('/leaderboard')}>Leaderboard</SidebarItem>
        <SidebarItem onClick={() => navigate(`/profile/${JSON.parse(localStorage.getItem('user')).username}`)}>Profile</SidebarItem>
        <SidebarItem onClick={() => { localStorage.removeItem('user'); navigate('/login'); }}>Logout</SidebarItem>
      </Sidebar>
      <MainContent>
        <Header>
          <Title>Dashboard</Title>
          <Button onClick={() => navigate('/project/create')}>Create Project</Button>
        </Header>
        <InfiniteScroll
          dataLength={posts.length}
          next={fetchPosts}
          hasMore={hasMore}
          loader={<h4>Loading...</h4>}
          endMessage={<p>No more posts to show</p>}
        >
          <Feed>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PostContent>{post.content}</PostContent>
                <PostActions>
                  <ActionButton onClick={() => handleLike(post._id)}>
                    Like ({post.likes})
                  </ActionButton>
                  <ActionButton>Comment ({post.comments})</ActionButton>
                </PostActions>
              </PostCard>
            ))}
          </Feed>
        </InfiniteScroll>
      </MainContent>
    </Container>
  );
};

export default Dashboard;