import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';
const Container = styled(motion.div) `
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;
const Form = styled.form `
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
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
const Textarea = styled.textarea `
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
const Error = styled.p `
  color: ${theme.colors.error};
  font-size: ${theme.typography.caption.fontSize};
  margin-top: ${theme.spacing.sm};
`;
const ProfileEdit = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [bio, setBio] = useState('');
    const [hobbies, setHobbies] = useState('');
    const [skills, setSkills] = useState('');
    const [experience, setExperience] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        fetchUser();
    }, [username]);
    const fetchUser = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/by-username/${username}`);
            const user = response.data.data;
            setBio(user.bio || '');
            setHobbies(user.hobbies?.join(', ') || '');
            setSkills(user.skills?.join(', ') || '');
            setExperience(user.experience?.join(', ') || '');
        }
        catch (error) {
            console.error('Error fetching user:', error);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.put(`${import.meta.env.VITE_API_URL}/users/${user._id}`, {
                bio,
                hobbies: hobbies.split(',').map((hobby) => hobby.trim()),
                skills: skills.split(',').map((skill) => skill.trim()),
                experience: experience.split(',').map((exp) => exp.trim()),
            });
            navigate(`/profile/${username}`);
        }
        catch (err) {
            setError('Failed to update profile. Please try again.');
        }
    };
    return (_jsx(Container, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 }, children: _jsxs(Form, { onSubmit: handleSubmit, children: [_jsx(Title, { children: "Edit Profile" }), _jsx(Textarea, { placeholder: "Bio", value: bio, onChange: (e) => setBio(e.target.value) }), _jsx(Input, { type: "text", placeholder: "Hobbies (comma-separated)", value: hobbies, onChange: (e) => setHobbies(e.target.value) }), _jsx(Input, { type: "text", placeholder: "Skills (comma-separated)", value: skills, onChange: (e) => setSkills(e.target.value) }), _jsx(Input, { type: "text", placeholder: "Experience (comma-separated)", value: experience, onChange: (e) => setExperience(e.target.value) }), _jsx(Button, { type: "submit", children: "Update Profile" }), error && _jsx(Error, { children: error })] }) }));
};
export default ProfileEdit;
