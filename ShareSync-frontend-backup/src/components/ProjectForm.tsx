import { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ProjectForm = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/projects', { name });
    navigate('/projects');
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: currentTheme.background, color: currentTheme.text }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Project Name"
      />
      <button type="submit">Create Project</button>
    </form>
  );
};

export default ProjectForm;