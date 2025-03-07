import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Project } from '../types/project';

interface ProjectContextType {
  projects: Project[];
  createProject: (name: string, description: string) => Promise<void>;
  shareProject: (projectId: string, users: string[]) => Promise<void>;
  addAnnouncement: (projectId: string, content: string, media?: string) => Promise<void>;
  addTask: (projectId: string, title: string, assignee: string, dueDate: string, status?: string) => Promise<void>;
  likeAnnouncement: (projectId: string, annId: string) => Promise<void>;
  addAnnouncementComment: (projectId: string, annId: string, text: string) => Promise<void>;
  addTaskComment: (projectId: string, taskId: string, text: string) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: string, status: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('http://localhost:3000/projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  const createProject = async (name: string, description: string) => {
    const response = await fetch('http://localhost:3000/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, admin: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '', sharedWith: [], announcements: [], tasks: [] }),
    });
    const newProject = await response.json();
    setProjects([...projects, newProject]);
  };

  const shareProject = async (projectId: string, users: string[]) => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users, admin: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  const addAnnouncement = async (projectId: string, content: string, media?: string) => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, media, user: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  const addTask = async (projectId: string, title: string, assignee: string, dueDate: string, status: string = 'In Progress') => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, assignee, dueDate, status, user: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  const likeAnnouncement = async (projectId: string, annId: string) => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements/${annId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  const addAnnouncementComment = async (projectId: string, annId: string, text: string) => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements/${annId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  const addTaskComment = async (projectId: string, taskId: string, text: string) => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  const updateTaskStatus = async (projectId: string, taskId: string, status: string) => {
    const response = await fetch(`http://localhost:3000/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, user: JSON.parse(localStorage.getItem('currentUser') || '{}').username || '' }),
    });
    const updatedProject = await response.json();
    setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
  };

  return (
    <ProjectContext.Provider value={{ projects, createProject, shareProject, addAnnouncement, addTask, likeAnnouncement, addAnnouncementComment, addTaskComment, updateTaskStatus }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjects must be used within a ProjectProvider');
  return context;
};

export { ProjectContext, ProjectProvider };