import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const CreateProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [project, setProject] = useState({ title: '', description: '', category: 'Personal', status: 'In Progress' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...project, userId: user._id }),
    });
    if (response.ok) {
      navigate('/');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Create New Project</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={project.title}
          onChange={(e) => setProject({ ...project, title: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Project Title"
        />
        <textarea
          value={project.description}
          onChange={(e) => setProject({ ...project, description: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Description"
        />
        <select
          value={project.category}
          onChange={(e) => setProject({ ...project, category: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        >
          <option value="School">School</option>
          <option value="Job">Job</option>
          <option value="Personal">Personal</option>
        </select>
        <select
          value={project.status}
          onChange={(e) => setProject({ ...project, status: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
        >
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Create Project
        </button>
      </form>
    </div>
  );
};

export default CreateProject;