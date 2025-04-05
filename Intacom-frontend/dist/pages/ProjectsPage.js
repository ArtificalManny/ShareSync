import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [errorMessage, setErrorMessage] = useState('');
    useEffect(() => {
        if (user) {
            const fetchProjects = async () => {
                try {
                    const response = await axios.get(`http://localhost:3000/projects/${user.username}`);
                    const projectsData = response.data.data || (Array.isArray(response.data) ? response.data : []);
                    setProjects(projectsData);
                }
                catch (error) {
                    console.error('Failed to fetch projects:', error.response?.data || error.message);
                    setProjects([]);
                    setErrorMessage(error.response?.data?.error || 'Failed to fetch projects. Please ensure the backend server is running.');
                }
            };
            fetchProjects();
        }
    }, [user]);
    console.log('Rendering ProjectsPage');
    return (_jsxs("div", { className: "projects-container", children: [_jsx("h2", { children: "Projects" }), _jsx("p", { children: "View and manage all your projects here." }), errorMessage && _jsx("div", { className: "error-message", children: errorMessage }), projects.length === 0 ? (_jsx("p", { children: "No projects found. Create a project to get started!" })) : (_jsx("div", { className: "project-grid", children: projects.map((project) => (_jsxs("div", { className: "project-card glassmorphic", style: {
                        borderLeft: `4px solid ${project.color || '#3a3a50'}`,
                    }, children: [_jsx(Link, { to: `/project/${project._id}`, children: _jsx("h4", { children: project.name }) }), _jsx("p", { children: project.description || 'No description' })] }, project._id))) }))] }));
};
export default ProjectsPage;
