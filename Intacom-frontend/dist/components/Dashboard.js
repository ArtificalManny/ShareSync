import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';
const Container = styled.div `
  display: flex;
  min-height: 100vh;
`;
const Sidebar = styled(motion.div) `
  width: 250px;
  background: ${theme.colors.primary};
  color: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  position: fixed;
  height: 100vh;
`;
const SidebarItem = styled.div `
  margin-bottom: ${theme.spacing.md};
  cursor: pointer;
  font-size: ${theme.typography.body.fontSize};
  &:hover {
    color: ${theme.colors.accent};
  }
`;
const MainContent = styled.div `
  margin-left: 250px;
  padding: ${theme.spacing.lg};
  flex: 1;
`;
const Header = styled.header `
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;
const Title = styled.h1 `
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  color: ${theme.colors.primary};
`;
const Button = styled.button `
  background: ${theme.colors.secondary};
`;
const Feed = styled.div `
  max-width: 600px;
  margin: 0 auto;
`;
const PostCard = styled(motion.div) `
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.md};
`;
const PostContent = styled.p `
  font-size: ${theme.typography.body.fontSize};
  margin-bottom: ${theme.spacing.sm};
`;
const PostActions = styled.div `
  display: flex;
  gap: ${theme.spacing.sm};
`;
const ActionButton = styled.button `
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
        }
        catch (error) {
            console.error('Error fetching posts:', error);
        }
    };
    const handleLike = async (postId) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/posts/like/${postId}`, { userId: JSON.parse(localStorage.getItem('user'))._id });
            fetchPosts(); // Refresh the feed
        }
        catch (error) {
            console.error('Error liking post:', error);
        }
    };
    return (_jsxs(Container, { children: [_jsxs(Sidebar, { initial: { x: -250 }, animate: { x: 0 }, transition: { duration: 0.5 }, children: [_jsx(SidebarItem, { onClick: () => navigate('/dashboard'), children: "Dashboard" }), _jsx(SidebarItem, { onClick: () => navigate('/projects'), children: "Projects" }), _jsx(SidebarItem, { onClick: () => navigate('/notifications'), children: "Notifications" }), _jsx(SidebarItem, { onClick: () => navigate('/leaderboard'), children: "Leaderboard" }), _jsx(SidebarItem, { onClick: () => navigate(`/profile/${JSON.parse(localStorage.getItem('user')).username}`), children: "Profile" }), _jsx(SidebarItem, { onClick: () => { localStorage.removeItem('user'); navigate('/login'); }, children: "Logout" })] }), _jsxs(MainContent, { children: [_jsxs(Header, { children: [_jsx(Title, { children: "Dashboard" }), _jsx(Button, { onClick: () => navigate('/project/create'), children: "Create Project" })] }), _jsx(InfiniteScroll, { dataLength: posts.length, next: fetchPosts, hasMore: hasMore, loader: _jsx("h4", { children: "Loading..." }), endMessage: _jsx("p", { children: "No more posts to show" }), children: _jsx(Feed, { children: posts.map((post) => (_jsxs(PostCard, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, children: [_jsx(PostContent, { children: post.content }), _jsxs(PostActions, { children: [_jsxs(ActionButton, { onClick: () => handleLike(post._id), children: ["Like (", post.likes, ")"] }), _jsxs(ActionButton, { children: ["Comment (", post.comments, ")"] })] })] }, post._id))) }) })] })] }));
};
export default Dashboard;
