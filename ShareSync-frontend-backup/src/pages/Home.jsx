import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserDetails, getProjectMetrics, getProjects } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickProjectTitle, setQuickProjectTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user details
        try {
          console.log('Fetching user details...');
          const userData = await getUserDetails();
          setUser(userData);
        } catch (err) {
          console.error('Failed to fetch user details:', err.message);
          setError(prev => prev ? `${prev}; User details failed: ${err.message}` : `User details failed: ${err.message}`);
        }

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
        console.error('Home page unexpected error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuickCreate = () => {
    if (quickProjectTitle.trim()) {
      navigate('/create-project', { state: { title: quickProjectTitle } });
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
      {/* Center Content */}
      <div className="md:col-span-2">
        <section className="mb-6 animate-fade-in">
          <div className="relative rounded-lg shadow-lg p-8 text-center bg-gradient-to-r from-deep-blue to-vibrant-pink">
            <div className="absolute inset-0 opacity-10 bg-pattern" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/asfalt-dark.png')" }}></div>
            <div className="relative flex items-center justify-center space-x-4">
              <img
                src={user?.profilePicture || 'https://via.placeholder.com/60'}
                alt="User Avatar"
                className="w-16 h-16 rounded-full border-4 border-white shadow-md animate-pulse-glow"
              />
              <div>
                <h1 className="text-3xl font-display text-white">
                  Welcome, {user ? `${user.firstName} ${user.lastName}` : 'User'}!
                </h1>
                <p className="text-gray-200 mt-2">Manage your projects with transparency and ease.</p>
              </div>
            </div>
          </div>
        </section>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Quick Create Project</h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={quickProjectTitle}
                onChange={(e) => setQuickProjectTitle(e.target.value)}
                placeholder="Enter project title..."
              />
              <button onClick={handleQuickCreate} className="btn-primary">
                Create
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-display text-vibrant-pink mb-4 animate-fade-in">Your Projects</h2>
          {projects.length === 0 ? (
            <div className="card text-center animate-fade-in">
              <p className="text-white">No projects yet. Create one to get started!</p>
              <button
                onClick={() => navigate('/create-project')}
                className="btn-primary mt-4"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div
                  key={project._id}
                  className="card transform hover:scale-105 transition-transform cursor-pointer animate-fade-in"
                  onClick={() => navigate(`/project/${project._id}`)}
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src="https://via.placeholder.com/80"
                      alt="Project Icon"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-display text-vibrant-pink">{project.title}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project._id}`);
                          }}
                          className="btn-primary"
                        >
                          View
                        </button>
                      </div>
                      <p className="text-gray-300 mt-1">{project.description}</p>
                      <div className="flex space-x-4 mt-2">
                        <p className="text-sm text-white">Category: {project.category}</p>
                        <p className="text-sm text-white">Status: {project.status}</p>
                      </div>
                    </div>
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
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Your Progress</h2>
            <div className="space-y-4">
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

export default Home;