import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import axios from 'axios';
const Settings = () => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [postNotifications, setPostNotifications] = useState(true);
    const [commentNotifications, setCommentNotifications] = useState(true);
    const [likeNotifications, setLikeNotifications] = useState(true);
    const [taskNotifications, setTaskNotifications] = useState(true);
    const [memberRequestNotifications, setMemberRequestNotifications] = useState(true);
    const [theme, setTheme] = useState('dark');
    const [privacy, setPrivacy] = useState('public');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    useEffect(() => {
        if (user && user.settings) {
            setEmailNotifications(user.settings.emailNotifications);
            setPostNotifications(user.settings.postNotifications);
            setCommentNotifications(user.settings.commentNotifications);
            setLikeNotifications(user.settings.likeNotifications);
            setTaskNotifications(user.settings.taskNotifications);
            setMemberRequestNotifications(user.settings.memberRequestNotifications);
            setTheme(user.settings.theme);
            setPrivacy(user.settings.privacy);
        }
    }, [user]);
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const updatedUser = {
                ...user,
                settings: {
                    emailNotifications,
                    postNotifications,
                    commentNotifications,
                    likeNotifications,
                    taskNotifications,
                    memberRequestNotifications,
                    theme,
                    privacy,
                },
            };
            const response = await axios.put(`http://localhost:3000/users/${user?._id}`, updatedUser);
            const newUserData = response.data.data.user;
            setUser(newUserData);
            localStorage.setItem('user', JSON.stringify(newUserData));
            setSuccessMessage('Settings updated successfully');
        }
        catch (error) {
            console.error('Settings update error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'An error occurred while updating settings.');
        }
    };
    return (_jsxs("div", { className: "settings-container", children: [_jsx("h2", { children: "Settings" }), _jsxs("form", { onSubmit: handleSaveSettings, children: [_jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Notification Preferences" }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: emailNotifications, onChange: (e) => setEmailNotifications(e.target.checked) }), "Receive Email Notifications"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: postNotifications, onChange: (e) => setPostNotifications(e.target.checked) }), "Notify on New Posts"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: commentNotifications, onChange: (e) => setCommentNotifications(e.target.checked) }), "Notify on New Comments"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: likeNotifications, onChange: (e) => setLikeNotifications(e.target.checked) }), "Notify on Likes"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: taskNotifications, onChange: (e) => setTaskNotifications(e.target.checked) }), "Notify on Task Updates"] }) }), _jsx("div", { className: "form-group", children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: memberRequestNotifications, onChange: (e) => setMemberRequestNotifications(e.target.checked) }), "Notify on Member Requests"] }) })] }), _jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Appearance" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "theme", children: "Theme" }), _jsxs("select", { id: "theme", value: theme, onChange: (e) => setTheme(e.target.value), children: [_jsx("option", { value: "dark", children: "Dark" }), _jsx("option", { value: "light", children: "Light" })] })] })] }), _jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Privacy" }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "privacy", children: "Profile Visibility" }), _jsxs("select", { id: "privacy", value: privacy, onChange: (e) => setPrivacy(e.target.value), children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "private", children: "Private" }), _jsx("option", { value: "connections", children: "Connections Only" })] })] })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Save Settings" })] }), errorMessage && _jsx("div", { className: "error-message", children: errorMessage }), successMessage && _jsx("div", { className: "success-message", children: successMessage })] }));
};
export default Settings;
