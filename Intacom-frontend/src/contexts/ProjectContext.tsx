import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project } from '../types/project';
import { createProject, getProjects, shareProject, addAnnouncement, addTask, likeAnnouncement, addAnnouncementComment, addTaskComment, updateTaskStatus } from '../services/api';

interface ProjectContextType {
  projects: Project[];
  createProject: (data: any) => Promise<void>;
  shareProject: (projectId: string, users: string[]) => Promise<void>;
  addAnnouncement: (projectId: string, data: any) => Promise<void>;
  addTask: (projectId: string, data: any) => Promise<void>;
  likeAnnouncement: (projectId: string, annId: number) => Promise<void>;
  addAnnouncementComment: (projectId: string, annId: number, text: string) => Promise<void>;
  addTaskComment: (projectId: string, taskId: number, text: string) => Promise<void>;
  updateTaskStatus: (projectId: string, taskId: number, status: string) => Promise<void>;
  loadProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjects = async () => {
    const response = await getProjects();
    setProjects(response.data);
  };

  const createProject = async (data: any) => {
    const response = await createProject(data);
    setProjects([...projects, response.data]);
  };

  const shareProject = async (projectId: string, users: string[]) => {
    const response = await shareProject(projectId, users);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const addAnnouncement = async (projectId: string, data: any) => {
    const response = await addAnnouncement(projectId, data);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const addTask = async (projectId: string, data: any) => {
    const response = await addTask(projectId, data);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const likeAnnouncement = async (projectId: string, annId: number) => {
    const response = await likeAnnouncement(projectId, annId);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const addAnnouncementComment = async (projectId: string, annId: number, text: string) => {
    const response = await addAnnouncementComment(projectId, annId, text);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const addTaskComment = async (projectId: string, taskId: number, text: string) => {
    const response = await addTaskComment(projectId, taskId, text);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const updateTaskStatus = async (projectId: string, taskId: number, status: string) => {
    const response = await updateTaskStatus(projectId, taskId, status);
    setProjects(projects.map(p => p.id === parseInt(projectId) ? response.data : p));
  };

  const value = { projects, createProject, shareProject, addAnnouncement, addTask, likeAnnouncement, addAnnouncementComment, addTaskComment, updateTaskStatus, loadProjects };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};