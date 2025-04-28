import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const ProjectForm = () => {
  const { user } = useContext(AuthContext);
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ title, description, category }),
      });

      if (!response.ok) throw new Error('Failed to create project');
      const project = await response.json();
      toast.success('Project created successfully!', { position: 'top-right', autoClose: 3000 });
      navigate(`/project/${project._id}`);
    } catch (error) {
      console.error('ProjectForm - Error creating project:', error);
      toast.error('Failed to create project', { position: 'top-right', autoClose: 3000 });
    }
  };

  return (
    <div style={{
      backgroundColor: currentTheme === 'dark' ? '#1a2b3c' : '#f0f0f0',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
      border: `2px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h2 style={{
        color: currentTheme === 'dark' ? '#00d1b2' : '#6c63ff',
        marginBottom: '20px',
        fontWeight: 'bold',
        fontSize: '2em',
        textShadow: `0 2px 4px rgba(${currentTheme === 'dark' ? '0, 209, 178' : '108, 99, 255'}, 0.5)`,
      }}>
        Create a New Project
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project Title"
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
            backgroundColor: currentTheme === 'dark' ? '#0d1a26' : '#ffffff',
            color: currentTheme === 'dark' ? 'white' : 'black',
            fontSize: '1em',
            transition: 'all 0.3s ease',
            boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = currentTheme === 'dark' ? '#6c63ff' : '#00d1b2';
            e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = currentTheme === 'dark' ? '#00d1b2' : '#6c63ff';
            e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
          }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project Description"
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
            backgroundColor: currentTheme === 'dark' ? '#0d1a26' : '#ffffff',
            color: currentTheme === 'dark' ? 'white' : 'black',
            fontSize: '1em',
            transition: 'all 0.3s ease',
            boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
            minHeight: '120px',
            resize: 'vertical',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = currentTheme === 'dark' ? '#6c63ff' : '#00d1b2';
            e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = currentTheme === 'dark' ? '#00d1b2' : '#6c63ff';
            e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
          }}
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (optional)"
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme === 'dark' ? '#00d1b2' : '#6c63ff'}`,
            backgroundColor: currentTheme === 'dark' ? '#0d1a26' : '#ffffff',
            color: currentTheme === 'dark' ? 'white' : 'black',
            fontSize: '1em',
            transition: 'all 0.3s ease',
            boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = currentTheme === 'dark' ? '#6c63ff' : '#00d1b2';
            e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = currentTheme === 'dark' ? '#00d1b2' : '#6c63ff';
            e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          Create Project
        </button>
      </div>
    </div>
  );
};

export default ProjectForm;