import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, updateProject } from '../utils/api';

const Projects = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    category: 'Personal',
    status: 'Active',
    admins: [user?.id],
    sharedWith: [],
    announcement: '',
    snapshot: '',
  });
  const [metrics, setMetrics] = useState({ totalProjects: 0, currentProjects: 0, pastProjects: 0, tasksCompleted: 0 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects...');
        const projectList = await getProjects();
        console.log('Projects:', projectList);
        setProjects(projectList);

        // Calculate metrics based on fetched projects
        setMetrics({
          totalProjects: projectList.length,
          currentProjects: projectList.filter(p => p.status === 'Active' || p.status === 'In Progress').length,
          pastProjects: projectList.filter(p => p.status === 'Completed').length,
          tasksCompleted: 20, // Mock data; replace with actual API call if available
        });
      } catch (err) {
        console.error('Failed to fetch projects:', err.message);
        setError(`Failed to load projects: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleInputChange = (e) => {
    setNewProject({ ...newProject, [e.target.name]: e.target.value });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const createdProject = await createProject(newProject);
      setProjects([...projects, createdProject]);
      setNewProject({
        title: '',
        description: '',
        category: 'Personal',
        status: 'Active',
        admins: [user?.id],
        sharedWith: [],
        announcement: '',
        snapshot: '',
      });
      setShowCreateForm(false);
      setMetrics(prev => ({
        ...prev,
        totalProjects: prev.totalProjects + 1,
        currentProjects: prev.currentProjects + 1,
      }));
    } catch (err) {
      console.error('Create project error:', err.message);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleUpdateProject = async (projectId, updateData) => {
    try {
      const updatedProject = await updateProject(projectId, updateData);
      setProjects(projects.map(p => (p._id === projectId ? updatedProject : p)));
      setMetrics(prev => ({
        ...prev,
        currentProjects: projects.filter(p => (p._id === projectId ? updatedProject.status : p.status) === 'Active' || (p._id === projectId ? updatedProject.status : p.status) === 'In Progress').length,
        pastProjects: projects.filter(p => (p._id === projectId ? updatedProject.status : p.status) === 'Completed').length,
      }));
    } catch (err) {
      console.error('Update project error:', err.message);
      setError('Failed to update project. Please try again.');
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`, { state: { user } });
  };

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Your Projects</h2>
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-6 animate-shimmer">
          {error}
        </div>
      )}

      <section className="mb-8 animate-fade-in">
        <div className="card glassmorphic">
          <h3 className="text-xl font-display text-vibrant-pink mb-4">Project Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
              <h4 className="text-lg text-white">Total Projects</h4>
              <p className="text-2xl font-bold text-vibrant-pink">{metrics.totalProjects}</p>
            </div>
            <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
              <h4 className="text-lg text-white">Current Projects</h4>
              <p className="text-2xl font-bold text-vibrant-pink">{metrics.currentProjects}</p>
            </div>
            <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
              <h4 className="text-lg text-white">Past Projects</h4>
              <p className="text-2xl font-bold text-vibrant-pink">{metrics.pastProjects}</p>
            </div>
            <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
              <h4 className="text-lg text-white">Tasks Completed</h4>
              <p className="text-2xl font-bold text-vibrant-pink">{metrics.tasksCompleted}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 animate-fade-in">
        <div className="card glassmorphic">
          <h3 className="text-xl font-display text-vibrant-pink mb-4">Notifications</h3>
          <p className="text-white">No notifications yet.</p>
        </div>
      </section>

      <section className="mb-8 animate-fade-in">
        <div className="card glassmorphic">
          <h3 className="text-xl font-display text-vibrant-pink mb-4">Team Activity</h3>
          <p className="text-white">No recent updates.</p>
        </div>
      </section>

      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow"
        >
          {showCreateForm ? 'Cancel' : 'Create New Project'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card glassmorphic mb-8 animate-fade-in">
          <h3 className="text-xl font-display text-vibrant-pink mb-4">Create a New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-white mb-2 font-medium">Title</label>
              <input
                type="text"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                placeholder="Enter project title"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Description</label>
              <textarea
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                required
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                placeholder="Enter project description"
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Category</label>
              <select
                name="category"
                value={newProject.category}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Collaboration">Collaboration</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">Status</label>
              <select
                name="status"
                value={newProject.status}
                onChange={handleInputChange}
                className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
              Create Project
            </button>
          </form>
        </div>
      )}

      <div className="card glassmorphic animate-fade-in">
        <h3 className="text-xl font-display text-vibrant-pink mb-4">Project List</h3>
        {projects.length === 0 ? (
          <p className="text-white">No projects yet.</p>
        ) : (
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project._id} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow">
                <h4 className="text-lg font-display text-vibrant-pink">{project.title}</h4>
                <p className="text-gray-300 mt-2">{project.description}</p>
                <p className="text-sm text-white mt-2">Category: {project.category}</p>
                <div className="flex items-center mt-2">
                  <p className="text-sm text-white">Status: </p>
                  <select
                    value={project.status}
                    onChange={(e) => handleUpdateProject(project._id, { status: e.target.value })}
                    className="ml-2 p-1 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block text-white mb-2 font-medium">Announcement</label>
                  <textarea
                    value={project.announcement || ''}
                    onChange={(e) => handleUpdateProject(project._id, { announcement: e.target.value })}
                    className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-20"
                    placeholder="Post an announcement..."
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-white mb-2 font-medium">Snapshot</label>
                  <input
                    type="text"
                    value={project.snapshot || ''}
                    onChange={(e) => handleUpdateProject(project._id, { snapshot: e.target.value })}
                    className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    placeholder="Update the project snapshot..."
                  />
                </div>
                <button
                  onClick={() => handleProjectClick(project._id)}
                  className="btn-primary mt-4 neumorphic hover:scale-105 transition-transform animate-pulse-glow"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;