import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';
const Container = styled(motion.div) `
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
`;
const Form = styled.form `
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
  width: 100%;
  max-width: 400px;
  text-align: center;
`;
const Title = styled.h2 `
  font-size: ${theme.typography.h2.fontSize};
  font-weight: ${theme.typography.h2.fontWeight};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
`;
const Input = styled.input `
  width: 100%;
  margin-bottom: ${theme.spacing.md};
`;
const Button = styled.button `
  width: 100%;
  margin-top: ${theme.spacing.sm};
`;
const Error = styled.p `
  color: ${theme.colors.error};
  font-size: ${theme.typography.caption.fontSize};
  margin-top: ${theme.spacing.sm};
`;
const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setError('Invalid reset link.');
        }
    }, [searchParams]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        try {
            const token = searchParams.get('token');
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset`, {
                token,
                password,
            });
            setMessage(response.data.message);
            setTimeout(() => navigate('/login'), 2000);
        }
        catch (err) {
            setError('Failed to reset password. Please try again.');
        }
    };
    return (_jsx(Container, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 }, children: _jsxs(Form, { onSubmit: handleSubmit, children: [_jsx(Title, { children: "Reset Password" }), message ? (_jsx("p", { children: message })) : (_jsxs(_Fragment, { children: [_jsx(Input, { type: "password", placeholder: "New Password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx(Input, { type: "password", placeholder: "Confirm Password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true }), _jsx(Button, { type: "submit", children: "Reset Password" }), error && _jsx(Error, { children: error })] }))] }) }));
};
export default ResetPassword;
