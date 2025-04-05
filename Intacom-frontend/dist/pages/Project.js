import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';
import Confetti from 'react-confetti';
const Container = styled.div `
  padding: ${theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
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
const Tabs = styled.div `
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;
const Tab = styled.button `
  background: none;
  border: none;
  font-size: ${theme.typography.body.fontSize};
  padding: ${theme.spacing.sm};
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: ${theme.colors.textLight};
  &.active {
    border-bottom: 2px solid ${theme.colors.primary};
    color: ${theme.colors.primary};
  }
`;
const Section = styled.div `
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.md};
`;
const TaskCard = styled(motion.div) `
  padding: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.textLight};
  &:last-child {
    border-bottom: none;
  }
`;
const TaskTitle = styled.h3 `
  font-size: ${theme.typography.h3.fontSize};
  font-weight: ${theme.typography.h3.fontWeight};
  margin-bottom: ${theme.spacing.sm};
`;
const TaskDetail = styled.p `
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.textLight};
`;
const FeedbackCard = styled.div `
  padding: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.textLight};
  &:last-child {
    border-bottom: none;
  }
`;
const Project = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [showConfetti, setShowConfetti] = useState(false);
    useEffect(() => {
        fetchProject();
        fetchTasks();
        fetchFeedbacks();
    }, [id]);
    const fetchProject = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
            setProject(response.data);
        }
        catch (error) {
            console.error('Error fetching project:', error);
        }
    };
    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/${id}`);
            setTasks(response.data);
        }
        catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };
    const fetchFeedbacks = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/feedback/${id}`);
            setFeedbacks(response.data);
        }
        catch (error) {
            console.error('Error fetching feedbacks:', error);
        }
    };
    const handleTaskComplete = async (taskId) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, { status: 'done' });
            setShowConfetti(true);
            fetchTasks();
        }
        catch (error) {
            console.error('Error completing task:', error);
        }
    };
    return (_jsxs(Container, { children: [showConfetti && _jsx(Confetti, {}), _jsxs(Header, { children: [_jsx(Title, { children: project?.name || 'Project' }), _jsx(Button, { onClick: () => navigate(`/project/${id}/edit`), children: "Edit Project" })] }), _jsxs(Tabs, { children: [_jsx(Tab, { className: activeTab === 'overview' ? 'active' : '', onClick: () => setActiveTab('overview'), children: "Overview" }), _jsx(Tab, { className: activeTab === 'tasks' ? 'active' : '', onClick: () => setActiveTab('tasks'), children: "Tasks" }), _jsx(Tab, { className: activeTab === 'feedback' ? 'active' : '', onClick: () => setActiveTab('feedback'), children: "Feedback" })] }), activeTab === 'overview' && (_jsxs(Section, { children: [_jsx("h2", { children: "Project Overview" }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", project?.description] }), _jsxs("p", { children: [_jsx("strong", { children: "Admin:" }), " ", project?.admin] }), _jsxs("p", { children: [_jsx("strong", { children: "Collaborators:" }), " ", project?.sharedWith.map((c) => c.userId).join(', ')] }), _jsxs("p", { children: [_jsx("strong", { children: "Likes:" }), " ", project?.likes] }), _jsxs("p", { children: [_jsx("strong", { children: "Comments:" }), " ", project?.comments] })] })), activeTab === 'tasks' && (_jsxs(Section, { children: [_jsx("h2", { children: "Tasks" }), tasks.map((task) => (_jsxs(TaskCard, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 }, children: [_jsx(TaskTitle, { children: task.name }), _jsxs(TaskDetail, { children: [_jsx("strong", { children: "Assignee:" }), " ", task.assignee] }), _jsxs(TaskDetail, { children: [_jsx("strong", { children: "Due Date:" }), " ", task.dueDate] }), _jsxs(TaskDetail, { children: [_jsx("strong", { children: "Status:" }), " ", task.status] }), task.status !== 'done' && (_jsx(Button, { onClick: () => handleTaskComplete(task._id), children: "Mark as Done" }))] }, task._id)))] })), activeTab === 'feedback' && (_jsxs(Section, { children: [_jsx("h2", { children: "Feedback" }), feedbacks.map((feedback) => (_jsxs(FeedbackCard, { children: [_jsxs("p", { children: [_jsx("strong", { children: "Rating:" }), " ", feedback.rating, "/5"] }), _jsxs("p", { children: [_jsx("strong", { children: "Message:" }), " ", feedback.message] }), _jsxs("p", { children: [_jsx("strong", { children: "By:" }), " ", feedback.userId] })] }, feedback._id)))] }))] }));
};
export default Project;
