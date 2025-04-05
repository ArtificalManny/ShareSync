import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './Footer.css'; // Optional: Components-specific styles
const Footer = () => {
    return (_jsxs("footer", { className: "footer", children: [_jsxs("div", { className: "footer-links", children: [_jsx("a", { href: "/about", children: "About Us" }), " |", _jsx("a", { href: "/careers", children: "Careers" }), " |", _jsx("a", { href: "/contact", children: "Contact Support" }), " |", _jsx("a", { href: "/privacy", children: "Privacy Policy" }), " |", _jsx("a", { href: "/terms", children: "Terms of Service" })] }), _jsxs("div", { className: "social-media", children: [_jsx("a", { href: "https://facebook.com", children: _jsx("i", { className: "fab fa-facebook-f" }) }), _jsx("a", { href: "https://twitter.com", children: _jsx("i", { className: "fab fa-twitter" }) }), _jsx("a", { href: "https://linkedin.com", children: _jsx("i", { className: "fab fa-linkedin-in" }) })] })] }));
};
export default Footer;
