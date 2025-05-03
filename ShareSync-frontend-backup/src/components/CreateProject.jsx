import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateProject = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sharedWith, setSharedWith] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, sharedWith: sharedWith ? [sharedWith] : [] }),
      });
      if (!response.ok) throw new Error('Failed to create project');
      toast.success('Project created successfully!', { position: 'top-right', autoClose: 3000 });
      navigate('/projects');
    } catch (error) {
      console.error('CreateProject - Error creating project:', error);
      toast.error('Failed to create project', { position: 'top-right', autoClose: 3000 });
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)'
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          backgroundColor: '#16213e', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 0 20px rgba(0,0,0,0.5)', 
          width: '300px',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <h2 style={{ color: '#e94560', textAlign: 'center', marginBottom: '20px' }}>Create a New Project</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project Name"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: 'none', 
              backgroundColor: '#0f3460', 
              color: 'white',
              transition: 'background-color 0.3s'
            }}
            onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
            onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: 'none', 
              backgroundColor: '#0f3460', 
              color: 'white', 
              height: '100px',
              transition: 'background-color 0.3s'
            }}
            onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
            onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            value={sharedWith}
            onChange={(e) => setSharedWith(e.target.value)}
            placeholder="Share with (email)"
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '5px', 
              border: 'none', 
              backgroundColor: '#0f3460', 
              color: 'white',
              transition: 'background-color 0.3s'
            }}
            onFocus={(e) => e.target.style.backgroundColor = '#1a4b84'}
            onBlur={(e) => e.target.style.backgroundColor = '#0f3460'}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#0f3460', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1a4b84'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0f3460'}
        >
          Create Project
        </button>
      </form>
    </div>
  );
};

export default CreateProject;