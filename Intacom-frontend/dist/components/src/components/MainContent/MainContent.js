import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './MainContent.css'; // Ensure this CSS file exists in the same folder
const MainContent = ({ children }) => {
    return (_jsxs("main", { className: "main-content", children: [_jsx("h1", { children: "Welcome to Intacom" }), _jsx("p", { children: "Your platform for seamless project management and collaboration." }), children] }));
};
export default MainContent;
