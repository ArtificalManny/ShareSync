import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, PlusCircle } from 'lucide-react';
import './CreateProject.css';

const CreateProject = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, socket, isLoading, setIntendedRoute, addProject } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('CreateProject - Component mounted. isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
    if (!isAuthenticated && !isLoading) {
      console.log('CreateProject - User not authenticated, redirecting to login');
      setIntendedRoute('/projects/create');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, setIntendedRoute]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('CreateProject - Submitting create project form with title:', title);
    try {
      if (!user?.email) {
        throw new Error('User email not available');
      }

      const newProject = {
        id: `project-${Date.now()}`,
        title,
        description,
        members: [{ email: user.email, role: 'Owner', profilePicture: user.profilePicture || 'https://via.placeholder.com/150' }],
        tasks: [],
        tasksCompleted: 0,
        totalTasks: 0,
        status: 'Not Started',
        posts: [],
        comments: [],
        activityLog: [{ message: `${user.email} created the project`, timestamp: new Date().toISOString() }],
      };

      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project');
      }

      console.log('CreateProject - Project created:', data);
      addProject(newProject);
      socket.emit('project-create', newProject);
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('CreateProject - Failed to create project:', err.message);
      setError(err.message);
    }
  };

  if (isLoading) {
    console.log('CreateProject - Rendering loading state');
    return <div className="create-project-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  return (
    <div className="create-project-container">
      <div className="create-project-card card p-8 glassmorphic">
        <h1 className="text-3xl font-inter text-holo-blue mb-6 flex items-center justify-center animate-text-glow">
          <PlusCircle className="w-6 h-6 mr-2" /> Create Project
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-holo-pink" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project Title"
              className="input-field w-full rounded-full"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project Description"
              className="input-field w-full h-24"
            />
          </div>
          <button type="submit" className="btn-primary w-full rounded-full animate-glow">Create Project</button>
        </form>
        <p className="text-holo-gray mt-4 text-center">
          Back to <Link to="/projects" className="text-holo-blue hover:underline">Projects</Link>
        </p>
      </div>
    </div>
  );
};

export default CreateProject;