import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const Announcement = ({ announcement, onLike, onComment }) => {
    const [comment, setComment] = React.useState('');
    return (_jsxs("div", { className: "p-4 bg-gray-100 rounded mb-4", children: [_jsx("p", { className: "text-gray-800", children: announcement.content }), announcement.media && _jsx("img", { src: announcement.media, alt: "Announcement media", className: "mt-2 max-w-full rounded" }), _jsxs("p", { className: "text-gray-600", children: ["By: ", announcement.user] }), _jsxs("p", { className: "text-gray-600", children: ["Likes: ", announcement.likes] }), _jsx("button", { onClick: onLike, className: "mt-2 py-1 px-3 bg-blue-500 text-white rounded hover:bg-blue-600", children: "Like" }), _jsxs("div", { className: "mt-2", children: [_jsx("input", { type: "text", value: comment, onChange: (e) => setComment(e.target.value), placeholder: "Add a comment...", className: "w-full p-2 border rounded" }), _jsx("button", { onClick: () => onComment && onComment(comment), className: "mt-2 py-1 px-3 bg-green-500 text-white rounded hover:bg-green-600", children: "Comment" })] }), _jsx("div", { className: "mt-2", children: announcement.comments.map((c, index) => (_jsxs("p", { className: "text-gray-700", children: ["-", c.user, ": ", c.text] }, index))) })] }));
};
export default Announcement;
