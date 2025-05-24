import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './ProjectCreate.css';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'Job',
    status: 'Not Started',
  });

  const handleCreate = () => {
    if (!newProject.title) return;
    // Mock creation logic
    const updatedProjects = [
      ...(user.projects || []),
      { ...newProject, id: `${user.projects?.length + 1 || 1}` },
    ];
    user.projects = updatedProjects;
    navigate('/projects');
  };

  return (
    <div className="project-create-container">
      <h1 className="text-4xl font-orbitron text-neon-white mb-8">Create New Project</h1>
      <div className="create-form bg-dark-glass p-8 rounded-xl shadow-glow-cyan">
        <input
          type="text"
          value={newProject.title}
          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
          placeholder="Project Title"
          className="input-field mb-4"
        />
        <textarea
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          placeholder="Project Description"
          className="input-field mb-4"
        />
        <select
          value={newProject.category}
          onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
          className="input-field mb-4"
        >
          <option value="Job">Job</option>
          <option value="School">School</option>
          <option value="Personal">Personal</option>
        </select>
        <select
          value={newProject.status}
          onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
          className="input-field mb-4"
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <div className="flex gap-4">
          <button onClick={handleCreate} className="btn-primary">Create Project</button>
          <Link to="/projects">
            <button className="btn-secondary">Cancel</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;