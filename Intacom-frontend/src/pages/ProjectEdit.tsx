import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [sharedWith, setSharedWith] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
      const project = response.data;
      setName(project.name);
      setDescription(project.description);
      setColor(project.color);
      setSharedWith(project.sharedWith);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/projects/${id}`, {
        name,
        description,
        color,
        sharedWith,
      });
      navigate(`/project/${id}`);
    } catch (err) {
      setError('Failed to update project. Please try again.');
    }
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Form onSubmit={handleSubmit}>
        <Title>Edit Project</Title>
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
        <Button type="submit">Update Project</Button>
        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
};

export default ProjectEdit;