import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';

const Container = styled(motion.div)`
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

const Form = styled.form`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
`;

const Title = styled.h2`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: ${theme.typography.h2.fontWeight};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
`;

const Textarea = styled.textarea`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.textLight};
  border-radius: ${theme.borderRadius.small};
`;

const Button = styled.button`
  width: 100%;
  margin-top: ${theme.spacing.sm};
`;

const Error = styled.p`
  color: ${theme.colors.error};
  font-size: ${theme.typography.caption.fontSize};
  margin-top: ${theme.spacing.sm};
`;

const ProjectCreate = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#00ff00');
  const [sharedWith, setSharedWith] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const sharedWithArray = sharedWith.split(',').map((email: string) => ({
        userId: email.trim(),
        role: 'Editor',
      }));
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/projects`, {
        name,
        description,
        admin: user._id,
        color,
        sharedWith: sharedWithArray,
      });
      navigate(`/project/${response.data._id}`);
    } catch (err) {
      setError('Failed to create project. Please try again.');
    }
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Form onSubmit={handleSubmit}>
        <Title>Create Project</Title>
        <Input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Share with (comma-separated emails)"
          value={sharedWith}
          onChange={(e) => setSharedWith(e.target.value)}
        />
        <Button type="submit">Create Project</Button>
        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
};

export default ProjectCreate;