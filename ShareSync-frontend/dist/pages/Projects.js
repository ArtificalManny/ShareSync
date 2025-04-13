import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';
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
const ProjectList = styled.div `
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${theme.spacing.md};
`;
const ProjectCard = styled(motion.div) `
  background: ${theme.colors.white};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.small};
  cursor: pointer;
`;
const ProjectTitle = styled.h3 `
  font-size: ${theme.typography.h3.fontSize};
  font-weight: ${theme.typography.h3.fontWeight};
  margin-bottom: ${theme.spacing.sm};
`;
const ProjectDetail = styled.p `
  font-size: ${theme.typography.caption.fontSize};
  color: ${theme.colors.textLight};
`;
const Projects = () => {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        fetchProjects();
    }, []);
    const fetchProjects = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/${user.username}`);
            setProjects(response.data);
        }
        catch (error) {
            console.error('Error fetching projects:', error);
        }
    };
    return (_jsxs(Container, { children: [_jsxs(Header, { children: [_jsx(Title, { children: "My Projects" }), _jsx(Button, { onClick: () => navigate('/project/create'), children: "Create Project" })] }), _jsx(ProjectList, { children: projects.map((project, index) => (_jsxs(ProjectCard, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, onClick: () => navigate(`/project/${project._id}`), children: [_jsx(ProjectTitle, { children: project.name }), _jsx(ProjectDetail, { children: project.description }), _jsxs(ProjectDetail, { children: [_jsx("strong", { children: "Status:" }), " ", project.status] }), _jsxs(ProjectDetail, { children: [_jsx("strong", { children: "Likes:" }), " ", project.likes] })] }, project._id))) })] }));
};
export default Projects;
