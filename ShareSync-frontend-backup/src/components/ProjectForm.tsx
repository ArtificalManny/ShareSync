import { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${({ theme }: { theme: any }) => theme.border};
  border-radius: 5px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid ${({ theme }: { theme: any }) => theme.border};
  border-radius: 5px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  &:hover {
    transform: scale(1.05);
  }
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const ProjectForm = () => {
  const { currentTheme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shareWith, setShareWith] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/projects`,
        { name, description, shareWith },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setName('');
      setDescription('');
      setShareWith('');
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project Name"
        theme={currentTheme}
        required
      />
      <TextArea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        theme={currentTheme}
        required
      />
      <Input
        type="email"
        value={shareWith}
        onChange={(e) => setShareWith(e.target.value)}
        placeholder="Share with (email)"
        theme={currentTheme}
      />
      <Button type="submit" theme={currentTheme}>Create Project</Button>
    </Form>
  );
};

export default ProjectForm;