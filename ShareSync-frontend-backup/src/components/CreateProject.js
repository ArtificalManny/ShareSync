import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/project.service';

const CreateProject = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('School');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('CreateProject - Submitting form with title:', title);
    try {
      const project = await createProject({ title, description, category });
      console.log('CreateProject - Project created:', project);
      navigate(`/project/${project._id}`);
    } catch (error) {
      console.error('CreateProject - Error creating project:', error);
      setError('Failed to create project');
    }
  };

  console.log('CreateProject - Rendering component, error:', error);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 60px)' }}>
      <div style={{ backgroundColor: '#1a2b3c', padding: '20px', borderRadius: '10px', width: '300px', textAlign: 'center' }}>
        <h2 style={{ color: '#00d1b2', marginBottom: '20px' }}>Create Project</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #00d1b2', backgroundColor: '#0d1a26', color: 'white' }}
            >
              <option value="School">School</option>
              <option value="Job">Job</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#00d1b2', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Create Project
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default CreateProject;