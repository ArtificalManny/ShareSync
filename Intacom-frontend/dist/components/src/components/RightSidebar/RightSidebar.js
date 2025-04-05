import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './RightSidebar.css'; //Optional: Component-specific styles
const RightSidebar = () => {
    return (_jsxs("aside", { className: "right-sidebar", children: [_jsx("div", { className: "chat-panel", children: _jsx("h3", { children: "Chat" }) }), _jsx("div", { className: "upcoming-events", children: _jsx("h3", { children: "Upcoming Events" }) }), _jsxs("div", { className: "quick-access", children: [_jsx("h3", { children: "Quick Access" }), _jsxs("ul", { children: [_jsx("li", { children: "Recent Documents" }), _jsx("li", { children: "Pinned Tasks" })] })] })] }));
};
export default RightSidebar;
