import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import './Header.css';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
const Header = ({ toggleDarkMode }) => {
    return (_jsxs("header", { className: "user-bar", children: [_jsx("div", { className: "left-section", children: _jsxs(Link, { to: "/", className: "logo", children: [_jsx("img", { src: "/logo.png", alt: "Intacom Logo", className: "logo-img" }), _jsx("span", { children: "Intacom" })] }) }), _jsx("div", { className: "middle-section", children: _jsxs("div", { className: "search-container", children: [_jsx("input", { type: "text", placeholder: "Search..." }), _jsxs("select", { children: [_jsx("option", { value: "projects", children: "Projects" }), _jsx("option", { value: "teams", children: "Teams" }), _jsx("option", { value: "documents", children: "Documents" })] }), _jsx("button", { type: "button", children: "Search" })] }) }), _jsxs("div", { className: "right-section", children: [_jsxs("div", { className: "notification-bell", children: [_jsx("i", { className: "icon fas fa-bell" }), _jsx("div", { className: "notification-dropdown", children: _jsx("p", { children: "No new notifications" }) })] }), _jsx("div", { className: "settings-icon", children: _jsx("a", { href: "/settings", children: _jsx("i", { className: "icon fas fa-cog" }) }) }), _jsx(IconButton, { onClick: toggleDarkMode, color: "inherit", children: _jsx(Brightness4Icon, {}) }), _jsx("div", { className: "profile-pic", children: _jsx("img", { src: "/profile.jpg", alt: "Profile", className: "profile-img" }) })] })] }));
};
export default Header;
