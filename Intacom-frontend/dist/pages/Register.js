import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const Select = styled.select `
  width: 100%;
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.textLight};
  border-radius: ${theme.borderRadius.small};
`;
const Button = styled.button `
  width: 100%;
  margin-top: ${theme.spacing.sm};
`;
const Link = styled.a `
  display: block;
  margin-top: ${theme.spacing.sm};
  color: ${theme.colors.textLight};
  font-size: ${theme.typography.caption.fontSize};
`;
const Error = styled.p `
  color: ${theme.colors.error};
  font-size: ${theme.typography.caption.fontSize};
  margin-top: ${theme.spacing.sm};
`;
const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState('');
    const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
                firstName,
                lastName,
                username,
                email,
                password,
                gender,
                birthday,
            });
            navigate('/login');
        }
        catch (err) {
            setError('Unable to register. Please try again.');
        }
    };
    return (_jsx(Container, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 }, children: _jsxs(Form, { onSubmit: handleSubmit, children: [_jsx(Title, { children: "Register" }), _jsx(Input, { type: "text", placeholder: "First Name", value: firstName, onChange: (e) => setFirstName(e.target.value), required: true }), _jsx(Input, { type: "text", placeholder: "Last Name", value: lastName, onChange: (e) => setLastName(e.target.value), required: true }), _jsx(Input, { type: "text", placeholder: "Username", value: username, onChange: (e) => setUsername(e.target.value), required: true }), _jsx(Input, { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(Input, { type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsxs(Select, { value: gender, onChange: (e) => setGender(e.target.value), required: true, children: [_jsx("option", { value: "", children: "Select Gender" }), _jsx("option", { value: "male", children: "Male" }), _jsx("option", { value: "female", children: "Female" }), _jsx("option", { value: "other", children: "Other" })] }), _jsxs("div", { style: { display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.md }, children: [_jsxs(Select, { value: birthday.month, onChange: (e) => setBirthday({ ...birthday, month: e.target.value }), required: true, children: [_jsx("option", { value: "", children: "Month" }), Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((month) => (_jsx("option", { value: month, children: month }, month)))] }), _jsxs(Select, { value: birthday.day, onChange: (e) => setBirthday({ ...birthday, day: e.target.value }), required: true, children: [_jsx("option", { value: "", children: "Day" }), Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((day) => (_jsx("option", { value: day, children: day }, day)))] }), _jsxs(Select, { value: birthday.year, onChange: (e) => setBirthday({ ...birthday, year: e.target.value }), required: true, children: [_jsx("option", { value: "", children: "Year" }), Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i)).map((year) => (_jsx("option", { value: year, children: year }, year)))] })] }), _jsx(Button, { type: "submit", children: "Register" }), _jsx(Link, { href: "/login", children: "Already have an account? Login" }), error && _jsx(Error, { children: error })] }) }));
};
export default Register;
