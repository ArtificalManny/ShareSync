import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import ProjectsPage from './pages/ProjectsPage';
import Upload from './Upload';
import Settings from './Settings';
import ProjectHome from './pages/ProjectHome';
import Profile from './pages/Profile';
const AppRoutes = ({ projects, showCreateProject, setShowCreateProject, projectName, setProjectName, projectDescription, setProjectDescription, projectColor, setProjectColor, sharedUsers, handleAddSharedUser, handleRemoveSharedUser, handleCreateProject, }) => {
    console.log('Rendering AppRoutes with projects:', projects);
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx("div", { children: "Redirecting to login..." }) }), _jsx(Route, { path: "/home", element: _jsx(Home, { projects: projects, showCreateProject: showCreateProject, setShowCreateProject: setShowCreateProject, projectName: projectName, setProjectName: setProjectName, projectDescription: projectDescription, setProjectDescription: setProjectDescription, projectColor: projectColor, setProjectColor: setProjectColor, sharedUsers: sharedUsers, handleAddSharedUser: handleAddSharedUser, handleRemoveSharedUser: handleRemoveSharedUser, handleCreateProject: handleCreateProject }) }), _jsx(Route, { path: "/projects", element: _jsx(ProjectsPage, {}) }), _jsx(Route, { path: "/upload", element: _jsx(Upload, {}) }), _jsx(Route, { path: "/settings", element: _jsx(Settings, {}) }), _jsx(Route, { path: "/project/:id", element: _jsx(ProjectHome, { projects: projects }) }), _jsx(Route, { path: "/profile", element: _jsx(Profile, {}) })] }));
};
export default AppRoutes;
