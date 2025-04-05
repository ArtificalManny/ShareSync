import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import './Sidebar.css'; // Optional: Component-specific styles
const Sidebar = () => {
    return (_jsxs("aside", { className: "sidebar", children: [_jsx("div", { className: "search-bar", children: _jsx("input", { type: "text", placeholder: "Search..." }) }), _jsx("nav", { className: "quick-links", children: _jsxs("ul", { children: [_jsx("li", { children: _jsx(Link, { to: "/", children: "Home" }) }), _jsx("li", { children: _jsx(Link, { to: "/my-projects", children: "My Projects" }) }), _jsx("li", { children: _jsx(Link, { to: "/create-project", children: "Create New Project" }) }), _jsx("li", { children: _jsx(Link, { to: "/global-feed", children: "Global Feed" }) }), _jsx("li", { children: _jsx(Link, { to: "/calendar", children: "Calendar" }) }), _jsx("li", { children: _jsx(Link, { to: "/tasks", children: "Tasks" }) })] }) }), _jsxs("div", { className: "teams-list", children: [_jsx("h3", { children: "Teams" }), _jsxs("ul", { children: [_jsx("li", { children: _jsx(Link, { to: "/teams/team1", children: "Team 1" }) }), _jsx("li", { children: _jsx(Link, { to: "/teams/team2", children: "Team 2" }) })] })] })] }));
};
export default Sidebar;
