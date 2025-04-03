import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';
import Confetti from 'react-confetti';

const Container = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
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

const Tabs = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

const Tab = styled.button`
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

const Section = styled.div`
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  margin-bottom: ${theme.spacing.md};
`;

const TaskCard = styled(motion.div)`
  padding: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.textLight};
  &:last-child {
    border-bottom: none;
  }
`;

const TaskTitle = styled.h3`
  font-size: ${theme.typography.h3.fontSize};
  font-weight: ${theme.typography.h3.fontWeight};
  margin-bottom: ${theme.spacing.sm};
`;

const TaskDetail = styled.p`
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.textLight};
`;

const FeedbackCard = styled.div`
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
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/${id}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/feedback/${id}`);
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, { status: 'done' });
      setShowConfetti(true);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <Container>
      {showConfetti && <Confetti />}
      <Header>
        <Title>{project?.name || 'Project'}</Title>
        <Button onClick={() => navigate(`/project/${id}/edit`)}>Edit Project</Button>
      </Header>
      <Tabs>
        <Tab
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Tab>
        <Tab
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks
        </Tab>
        <Tab
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </Tab>
      </Tabs>
      {activeTab === 'overview' && (
        <Section>
          <h2>Project Overview</h2>
          <p><strong>Description:</strong> {project?.description}</p>
          <p><strong>Admin:</strong> {project?.admin}</p>
          <p><strong>Collaborators:</strong> {project?.sharedWith.map((c: any) => c.userId).join(', ')}</p>
          <p><strong>Likes:</strong> {project?.likes}</p>
          <p><strong>Comments:</strong> {project?.comments}</p>
        </Section>
      )}
      {activeTab === 'tasks' && (
        <Section>
          <h2>Tasks</h2>
          {tasks.map((task: any) => (
            <TaskCard
              key={task._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <TaskTitle>{task.name}</TaskTitle>
              <TaskDetail><strong>Assignee:</strong> {task.assignee}</TaskDetail>
              <TaskDetail><strong>Due Date:</strong> {task.dueDate}</TaskDetail>
              <TaskDetail><strong>Status:</strong> {task.status}</TaskDetail>
              {task.status !== 'done' && (
                <Button onClick={() => handleTaskComplete(task._id)}>Mark as Done</Button>
              )}
            </TaskCard>
          ))}
        </Section>
      )}
      {activeTab === 'feedback' && (
        <Section>
          <h2>Feedback</h2>
          {feedbacks.map((feedback: any) => (
            <FeedbackCard key={feedback._id}>
              <p><strong>Rating:</strong> {feedback.rating}/5</p>
              <p><strong>Message:</strong> {feedback.message}</p>
              <p><strong>By:</strong> {feedback.userId}</p>
            </FeedbackCard>
          ))}
        </Section>
      )}
    </Container>
  );
};

export default Project;