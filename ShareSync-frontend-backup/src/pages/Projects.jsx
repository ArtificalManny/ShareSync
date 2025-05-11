import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjectMetrics, getProjects, updateProject } from '../utils/api';

const Projects = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
  });
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState({ id: null, type: null, value: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project metrics
        try {
          console.log('Fetching project metrics...');
          const metricsData = await getProjectMetrics();
          setMetrics(metricsData);
        } catch (err) {
          console.error('Failed to fetch project metrics:', err.message);
          setError(prev => prev ? `${prev}; Project metrics failed: ${err.message}` : `Project metrics failed: ${err.message}`);
          setMetrics({ totalProjects: 0, currentProjects: 0, pastProjects: 0, tasksCompleted: 0 });
        }

        // Fetch projects
        try {
          console.log('Fetching projects...');
          const projectsData = await getProjects();
          setProjects(projectsData);
        } catch (err) {
          console.error('Failed to fetch projects:', err.message);
          setError(prev => prev ? `${prev}; Projects failed: ${err.message}` : `Projects failed: ${err.message}`);
          setProjects([]);
        }
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
        console.error('Projects page unexpected error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateProject = () => {
    navigate('/create-project');
  };

  const handleUpdateAnnouncement = async (projectId, announcement) => {
    try {
      await updateProject(projectId, { announcement });
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
      setEditing({ id: null, type: null, value: '' });
    } catch (err) {
      setError(`Failed to update announcement: ${err.message}`);
      console.error('Update announcement error:', err.message);
    }
  };

  const handleUpdateSnapshot = async (projectId, snapshot) => {
    try {
      await updateProject(projectId, { snapshot });
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
      setEditing({ id: null, type: null, value: '' });
    } catch (err) {
      setError(`Failed to update snapshot: ${err.message}`);
      console.error('Update snapshot error:', err.message);
    }
  };

  const handleUpdateStatus = async (projectId, status) => {
    try {
      await updateProject(projectId, { status });
      const updatedProjects = await getProjects();
      setProjects(updatedProjects);
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
      console.error('Update status error:', err.message);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
      {/* Center Content */}
      <div className="md:col-span-2">
        <header className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-display text-vibrant-pink">Projects</h1>
        </header>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <section className="mb-6 animate-fade-in">
          <button
            onClick={handleCreateProject}
            className="btn-primary w-full mb-4"
          >
            Create New Project
          </button>
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Your Progress</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Total Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.totalProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Current Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.currentProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Past Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.pastProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Tasks Completed</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.tasksCompleted}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-display text-vibrant-pink mb-4 animate-fade-in">Your Projects</h2>
          {projects.length === 0 ? (
            <div className="card text-center animate-fade-in">
              <p className="text-white">No projects yet. Create one to get started!</p>
              <button onClick={handleCreateProject} className="btn-primary mt-4">
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project._id} className="card animate-fade-in">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    <h3 className="text-lg font-display text-vibrant-pink">{project.title}</h3>
                    <p className="text-gray-300">{project.description}</p>
                    <p className="text-sm mt-2 text-white">Category: {project.category}</p>
                  </div>

                  <div className="mt-2">
                    <label className="block text-white mb-1">Status:</label>
                    <select
                      value={project.status}
                      onChange={(e) => handleUpdateStatus(project._id, e.target.value)}
                      className="w-full"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="mt-2">
                    <label className="block text-white mb-1">Announcement:</label>
                    {editing.id === project._id && editing.type === 'announcement' ? (
                      <div>
                        <textarea
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-full"
                        />
                        <button
                          onClick={() => handleUpdateAnnouncement(project._id, editing.value)}
                          className="btn-primary mt-2 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing({ id: null, type: null, value: '' })}
                          className="btn-secondary mt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white">{project.announcement || 'No announcement'}</p>
                        <button
                          onClick={() => setEditing({ id: project._id, type: 'announcement', value: project.announcement || '' })}
                          className="text-vibrant-pink hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <label className="block text-white mb-1">Snapshot:</label>
                    {editing.id === project._id && editing.type === 'snapshot' ? (
                      <div>
                        <input
                          type="text"
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          className="w-full"
                        />
                        <button
                          onClick={() => handleUpdateSnapshot(project._id, editing.value)}
                          className="btn-primary mt-2 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing({ id: null, type: null, value: '' })}
                          className="btn-secondary mt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-white">{project.snapshot || 'No snapshot'}</p>
                        <button
                          onClick={() => setEditing({ id: project._id, type: 'snapshot', value: project.snapshot || '' })}
                          className="text-vibrant-pink hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right Sidebar */}
      <div className="md:col-span-1">
        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-2">Notifications</h2>
            <p className="text-white">No notifications yet.</p>
          </div>
        </section>
        <section className="animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-2">Team Activity</h2>
            <p className="text-white">No recent updates.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Projects;