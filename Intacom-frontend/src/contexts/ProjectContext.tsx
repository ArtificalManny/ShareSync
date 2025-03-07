import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import socket from '../services/socket';

interface Project {
  id: string;
  name: string;
  description: string;
  admin: string;
  sharedWith: string[];
  announcements: { id: string; content: string; media?: string; user: string; likes: number; comments: { user: string; text: string }[] }[];
  tasks: { id: string; title: string; assignee: string; dueDate: Date; status: string; user: string; comments: { user: string; text: string }[] }[];
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description: string, admin: string) => Promise<void>;
  shareProject: (projectId: string, users: string[], admin: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  addAnnouncement: (projectId: string, content: string, media: string, user: string) => Promise<void>;
  addTask: (projectId: string, title: string, assignee: string, dueDate: Date, status: string, user: string) => Promise<void>;
  likeAnnouncement: (projectId: string, annId: string, user: string) => Promise<void>;
  addAnnouncementComment: (projectId: string, annId: string, text: string, user: string) => Promise<void>;
  addTaskComment: (projectId: string, taskId: string, text: string, user: string) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, status: string, user: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const createProject = async (name: string, description: string, admin: string) => {
    try {
      const response = await api.post('/projects', { name, description, admin });
      setProjects([...projects, response.data]);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const shareProject = async (projectId: string, users: string[], admin: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/share`, { users, admin });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to share project:', error);
    }
  };

  const addAnnouncement = async (projectId: string, content: string, media: string, user: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/announcements`, { content, media, user });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to add announcement:', error);
    }
  };

  const addTask = async (projectId: string, title: string, assignee: string, dueDate: Date, status: string, user: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, { title, assignee, dueDate, status, user });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const likeAnnouncement = async (projectId: string, annId: string, user: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/announcements/${annId}/like`, { user });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to like announcement:', error);
    }
  };

  const addAnnouncementComment = async (projectId: string, annId: string, text: string, user: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/announcements/${annId}/comments`, { text, user });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to add announcement comment:', error);
    }
  };

  const addTaskComment = async (projectId: string, taskId: string, text: string, user: string) => {
    try {
      const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { text, user });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to add task comment:', error);
    }
  };

  const updateTaskStatus = async (projectId: string, taskId: string, status: string, user: string) => {
    try {
      const response = await api.put(`/projects/${projectId}/tasks/${taskId}/status`, { status, user });
      setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    socket.on('projectUpdate', (updatedProject: Project) => {
      setProjects(projects.map(p => (p.id === updatedProject.id ? updatedProject : p)));
      if (currentProject && currentProject.id === updatedProject.id) {
        setCurrentProject(updatedProject);
      }
    });

    return () => {
      socket.off('projectUpdate');
    };
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        fetchProjects,
        createProject,
        shareProject,
        setCurrentProject,
        addAnnouncement,
        addTask,
        likeAnnouncement,
        addAnnouncementComment,
        addTaskComment,
        updateTaskStatus,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};