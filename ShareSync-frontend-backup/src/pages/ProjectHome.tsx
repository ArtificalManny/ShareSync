import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';

const ProjectContainer = styled.div`
  padding: 20px;
  background: ${({ theme }: { theme: any }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const Section = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: ${({ theme }) => theme.glow};
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Project {
  _id: string;
  name: string;
  description: string;
  members: string[];
}

const ProjectHome = () => {
  const { currentTheme } = useTheme();
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectResponse = await axios.get(`${API_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProject(projectResponse.data);

        const tasksResponse = await axios.get(`${API_URL}/tasks/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTasks(tasksResponse.data);

        const messagesResponse = await axios.get(`${API_URL}/chat/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setMessages(messagesResponse.data);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
      }
    };

    fetchProjectData();
  }, [id]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <ProjectContainer theme={currentTheme}>
      <Section theme={currentTheme}>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
      </Section>

      <Section theme={currentTheme}>
        <h3>Tasks</h3>
        {tasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id}>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <p>Status: {task.status}</p>
            </div>
          ))
        )}
      </Section>

      <Section theme={currentTheme}>
        <h3>Chat</h3>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div key={message._id}>
              <p>{message.senderId}: {message.message}</p>
            </div>
          ))
        )}
      </Section>
    </ProjectContainer>
  );
};

export default ProjectHome;