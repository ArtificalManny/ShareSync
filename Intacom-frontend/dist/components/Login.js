import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { loginUser } from '../store/slices/authSlice';
import { TextField, Button, Typography, Container, Box } from '@mui/material';
const Login = () => {
    const dispatch = useAppDispatch();
    const authState = useAppSelector((state) => state.auth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = () => {
        dispatch(loginUser({ email, password }));
    };
    return (_jsx(Container, { maxWidth: "sm", children: _jsxs(Box, { mt: 5, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "Login" }), authState.error && (_jsx(Typography, { color: "error", children: authState.error })), _jsx(TextField, { label: "Email", variant: "outlined", fullWidth: true, margin: "normal", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(TextField, { label: "Password", variant: "outlined", type: "password", fullWidth: true, margin: "normal", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx(Button, { variant: "contained", color: "primary", fullWidth: true, onClick: handleSubmit, disabled: authState.loading, children: authState.loading ? 'Logging in...' : 'Login' })] }) }));
};
export default Login;
