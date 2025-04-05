import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Project from './pages/Project';
import ProjectEdit from './pages/ProjectEdit';
import ProjectCreate from './pages/ProjectCreate';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Projects from './pages/Projects';
function App() {
    return (_jsxs(_Fragment, { children: [_jsx(GlobalStyles, {}), _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/verify-email", element: _jsx(VerifyEmail, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPassword, {}) }), _jsx(Route, { path: "/profile/:username", element: _jsx(Profile, {}) }), _jsx(Route, { path: "/profile/:username/edit", element: _jsx(ProfileEdit, {}) }), _jsx(Route, { path: "/project/:id", element: _jsx(Project, {}) }), _jsx(Route, { path: "/project/:id/edit", element: _jsx(ProjectEdit, {}) }), _jsx(Route, { path: "/project/create", element: _jsx(ProjectCreate, {}) }), _jsx(Route, { path: "/projects", element: _jsx(Projects, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/leaderboard", element: _jsx(Leaderboard, {}) }), _jsx(Route, { path: "/notifications", element: _jsx(Notifications, {}) })] }) })] }));
}
export default App;
