import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
export const AuthForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [profilePic, setProfilePic] = useState(undefined);
    const { login, register } = useAuth();
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
        }
        catch (err) {
            console.error('Login error:', err.message);
            alert('Login failed: ' + err.message);
        }
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await register(username, password, profilePic);
        }
        catch (err) {
            console.error('Registration error:', err.message);
            alert('Registration failed: ' + err.message);
        }
    };
    return (_jsxs("div", { id: "login", style: { display: 'block' }, children: [_jsxs("form", { onSubmit: handleLogin, children: [_jsx("input", { type: "text", id: "username", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Username" }), _jsx("input", { type: "password", id: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Password" }), _jsx("button", { type: "submit", className: "button-primary", children: "Login" })] }), _jsxs("form", { onSubmit: handleRegister, children: [_jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Username" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Password" }), _jsx("input", { type: "url", value: profilePic || '', onChange: (e) => setProfilePic(e.target.value || undefined), placeholder: "Profile Picture URL (optional)" }), _jsx("button", { type: "submit", className: "button-primary", children: "Register" })] })] }));
};
