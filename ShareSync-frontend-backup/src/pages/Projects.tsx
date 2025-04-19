import { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import { useUser } from '../contexts/UserContext';
import styled from 'styled-components';
import { FaBell, FaCheckCircle, FaFolderPlus, FaChartBar, FaTasks, FaHistory, FaUsers } from 'react-icons/fa';

const ProjectsContainer = styled.div`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 40px;
  min-height: calc(100vh - 70px);
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 20px;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, ${({ theme }) => theme.glow}, transparent);
    opacity: 0.2;
    z-index: -1;
  }
`;

const Sidebar = styled.div`
  background: ${({ theme }) => theme.background === '#121212' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 0 15px ${({ theme }) => theme.glow};
`;

const SidebarTitle = styled.h3`
  font-size: 20px;
  margin-bottom: 15px;
  color: ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 18px; /* Smaller icon size for a clean look */
    color: ${({ theme }) => theme.accent}; /* Match the title color */
  }
`;

const NotificationList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const NotificationItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  transition: background 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.background === '#121212' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const Avatar = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
`;

const NotificationMessage = styled.p`
  flex: 1;
  font-size: 14px;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.background === '#121212' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 0 15px ${({ theme }) => theme.glow};
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 25px ${({ theme }) => theme.glow};
  }
`;

const CardTitle = styled.h4`
  font-size: 16px;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  svg {
    font-size: 16px; /* Smaller icon size for a clean look */
    color: ${({ theme }) => theme.accent}; /* Match the title color */
  }
`;

const CardValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }) => theme.secondary};
`;

const TaskList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
`;

const TaskItem = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  transition: background 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.background === '#121212' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  }
`;

const ProjectList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ProjectItem = styled.li`
  padding: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  transition: background 0.3s ease, transform 0.1s ease, text-shadow 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.background === '#121212' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
    transform: scale(1.02);
    text-shadow: 0 0 5px ${({ theme }) => theme.glow};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  }
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  resize: none;
  height: 100px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ErrorMessage = styled.p`
  color: #ff5555;
  font-size: 14px;
  margin-top: 10px;
  text-shadow: 0 0 5px rgba(255, 85, 85, 0.5);
`;

interface Project {
  _id: string;
  name: string;
  description: string;
  creator: string;
}

interface Task {
  _id: string;
  projectId: string;
  title: string;
  completedBy: string;
  completedAt: Date;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', shareWith: '' });
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { notifications } = useSocket();
  const { user } = useUser();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/projects', {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch projects.');
      }
    };

    const fetchCompletedTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/tasks/completed', {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        setCompletedTasks(response.data);
      } catch (err: any) {
        console.error('Failed to fetch completed tasks:', err);
      }
    };

    fetchProjects();
    fetchCompletedTasks();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/projects', {
        name: newProject.name,
        description: newProject.description,
        shareWith: newProject.shareWith ? [newProject.shareWith] : [],
      }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects([...projects, response.data]);
      setNewProject({ name: '', description: '', shareWith: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Please log in to create a project.');
    }
  };

  return (
    <ProjectsContainer theme={currentTheme}>
      <Sidebar theme={currentTheme}>
        <SidebarTitle theme={currentTheme}>
          <FaFolderPlus /> Create Project
        </SidebarTitle>
        <Form onSubmit={handleCreateProject}>
          <Input
            type="text"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="Project Name"
            theme={currentTheme}
            required
          />
          <Textarea
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="Description"
            theme={currentTheme}
            required
          />
          <Input
            type="email"
            value={newProject.shareWith}
            onChange={(e) => setNewProject({ ...newProject, shareWith: e.target.value })}
            placeholder="Share with (email)"
            theme={currentTheme}
          />
          <Button type="submit" theme={currentTheme}>Create Project</Button>
        </Form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <SidebarTitle theme={currentTheme} style={{ marginTop: '20px' }}>
          <FaBell /> Notifications ({notifications.length})
        </SidebarTitle>
        <NotificationList>
          {notifications.map((notif, index) => (
            <NotificationItem key={index} theme={currentTheme}>
              <Avatar src="https://via.placeholder.com/30" alt="User avatar" />
              <NotificationMessage>{notif.message}</NotificationMessage>
            </NotificationItem>
          ))}
          {notifications.length === 0 && <NotificationMessage>No notifications yet.</NotificationMessage>}
        </NotificationList>
      </Sidebar>
      <MainContent>
        <Card theme={currentTheme}>
          <CardTitle theme={currentTheme}>
            <FaChartBar /> Project Overview
          </CardTitle>
          <CardValue theme={currentTheme}>Total Projects<br />{projects.length}</CardValue>
        </Card>
        <Card theme={currentTheme}>
          <CardTitle theme={currentTheme}>
            <FaCheckCircle /> Tasks Completed
          </CardTitle>
          <TaskList>
            {completedTasks.map((task) => (
              <TaskItem key={task._id} theme={currentTheme}>
                <Avatar src="https://via.placeholder.com/30" alt="User avatar" />
                <NotificationMessage>
                  {user?.email} completed task "{task.title}" in project {task.projectId}
                </NotificationMessage>
              </TaskItem>
            ))}
            {completedTasks.length === 0 && <NotificationMessage>No tasks completed yet.</NotificationMessage>}
          </TaskList>
        </Card>
        <Card theme={currentTheme}>
          <CardTitle theme={currentTheme}>
            <FaTasks /> Current Projects
          </CardTitle>
          <CardValue theme={currentTheme}>{projects.length}</CardValue>
        </Card>
        <Card theme={currentTheme}>
          <CardTitle theme={currentTheme}>
            <FaHistory /> Past Projects
          </CardTitle>
          <CardValue theme={currentTheme}>0</CardValue>
        </Card>
        <Card theme={currentTheme}>
          <CardTitle theme={currentTheme}>
            <FaUsers /> Team Activity
          </CardTitle>
          <NotificationMessage>No recent activities.</NotificationMessage>
        </Card>
        <Card theme={currentTheme}>
          <CardTitle theme={currentTheme}>
            <FaFolderPlus /> Your Projects
          </CardTitle>
          <ProjectList>
            {projects.map((project) => (
              <ProjectItem
                key={project._id}
                onClick={() => navigate(`/project/${project._id}`)}
                theme={currentTheme}
              >
                {project.name}
              </ProjectItem>
            ))}
          </ProjectList>
        </Card>
      </MainContent>
    </ProjectsContainer>
  );
};

export default Projects;