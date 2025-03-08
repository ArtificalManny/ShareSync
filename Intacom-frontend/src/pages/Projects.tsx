import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [admin, setAdmin] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://localhost:3000/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/projects', {
        name,
        description,
        admin,
      });
      setProjects([...projects, response.data]);
      setName('');
      setDescription('');
      setAdmin('');
      alert('Project created successfully');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project Name"
          required
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
        />
        <input
          type="text"
          value={admin}
          onChange={(e) => setAdmin(e.target.value)}
          placeholder="Admin Username"
          required
        />
        <button type="submit">Create Project</button>
      </form>
      <h3>Your Projects</h3>
      <ul>
        {projects.map((project) => (
          <li key={project._id}>
            {project.name} - {project.description} (Admin: {project.admin})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Projects;