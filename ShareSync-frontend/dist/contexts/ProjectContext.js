import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../services/socket';
const ProjectContext = createContext(undefined);
export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        }
        catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };
    const createProject = async (name, description, admin) => {
        try {
            const response = await api.post('/projects', { name, description, admin });
            setProjects([...projects, response.data]);
        }
        catch (error) {
            console.error('Failed to create project:', error);
        }
    };
    const shareProject = async (projectId, users, admin) => {
        try {
            const response = await api.post(`/projects/${projectId}/share`, { users, admin });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to share project:', error);
        }
    };
    const addAnnouncement = async (projectId, content, media, user) => {
        try {
            const response = await api.post(`/projects/${projectId}/announcements`, { content, media, user });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to add announcement:', error);
        }
    };
    const addTask = async (projectId, title, assignee, dueDate, status, user) => {
        try {
            const response = await api.post(`/projects/${projectId}/tasks`, { title, assignee, dueDate, status, user });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to add task:', error);
        }
    };
    const likeAnnouncement = async (projectId, annId, user) => {
        try {
            const response = await api.post(`/projects/${projectId}/announcements/${annId}/like`, { user });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to like announcement:', error);
        }
    };
    const addAnnouncementComment = async (projectId, annId, text, user) => {
        try {
            const response = await api.post(`/projects/${projectId}/announcements/${annId}/comments`, { text, user });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to add announcement comment:', error);
        }
    };
    const addTaskComment = async (projectId, taskId, text, user) => {
        try {
            const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { text, user });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to add task comment:', error);
        }
    };
    const updateTaskStatus = async (projectId, taskId, status, user) => {
        try {
            const response = await api.put(`/projects/${projectId}/tasks/${taskId}/status`, { status, user });
            setProjects(projects.map(p => (p.id === projectId ? response.data : p)));
        }
        catch (error) {
            console.error('Failed to update task status:', error);
        }
    };
    useEffect(() => {
        fetchProjects();
        socket.on('projectUpdate', (updatedProject) => {
            setProjects(projects.map(p => (p.id === updatedProject.id ? updatedProject : p)));
            if (currentProject && currentProject.id === updatedProject.id) {
                setCurrentProject(updatedProject);
            }
        });
        return () => {
            socket.off('projectUpdate');
        };
    }, []);
    return (_jsx(ProjectContext.Provider, { value: {
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
        }, children: children }));
};
