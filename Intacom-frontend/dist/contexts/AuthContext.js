import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from 'react';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const login = async (username, password) => {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.reload();
        }
        else {
            throw new Error('Login failed');
        }
    };
    const register = async (username, password, profilePic) => {
        const response = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, profilePic }),
        });
        const data = await response.json();
        if (data) {
            localStorage.setItem('currentUser', JSON.stringify(data));
            window.location.reload();
        }
        else {
            throw new Error('Registration failed');
        }
    };
    const logout = () => {
        localStorage.removeItem('currentUser');
        document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.reload();
    };
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return (_jsx(AuthContext.Provider, { value: { user, login, register, logout }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
export default AuthContext;
