import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserDetails, getUserProjects, getProjectMetrics } from '../utils/api';

// Helper function to render a user activity infographic with circular progress
const UserActivityInfographic = ({ projects, metrics }) => {
  const [showGrokModal, setShowGrokModal] = useState(false);
  const [grokQuery, setGrokQuery] = useState('');
  const [grokResponse, setGrokResponse] = useState('');
  const [grokError, setGrokError] = useState('');

  const handleGrokQuery = async (e) => {
    e.preventDefault();
    try {
      setGrokError('');
      setGrokResponse('');
      // Mock API call - replace with actual xAI API call
      const response = await mockGrokApi(grokQuery);
      setGrokResponse(response);
    } catch (err) {
      setGrokError('Failed to get a response from Grok. Please try again.');
      console.error('Grok API error:', err.message);
    }
  };

  const mockGrokApi = async (query) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Mock response from Grok: I analyzed the query "${query}". Here's a summary...`);
      }, 1000);
    });
  };

  const activeProjects = projects.filter(project => project.status === 'Active').length;
  const completedTasks = metrics.tasksCompleted || 0;
  const activeProjectsPercentage = projects.length > 0 ? (activeProjects / projects.length) * 100 : 0;
  const completedTasksPercentage = (completedTasks / 50) * 100; // Assuming 50 as max for visualization

  return (
    <div className="card glassmorphic animate-fade-in mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display text-vibrant-pink">Your Activity</h2>
        <button
          onClick={() => setShowGrokModal(true)}
          className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow"
        >
          Ask Grok
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow flex flex-col items-center">
          <h3 className="text-lg text-white mb-2">Active Projects</h3>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="fill-none stroke-gray-800 stroke-2"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="fill-none stroke-neon-blue stroke-2"
                strokeDasharray={`${activeProjectsPercentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20" className="text-vibrant-pink text-sm font-bold" textAnchor="middle">{activeProjects}</text>
            </svg>
          </div>
        </div>
        <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow flex flex-col items-center">
          <h3 className="text-lg text-white mb-2">Tasks Completed</h3>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="fill-none stroke-gray-800 stroke-2"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="fill-none stroke-vibrant-pink stroke-2"
                strokeDasharray={`${completedTasksPercentage}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20" className="text-vibrant-pink text-sm font-bold" textAnchor="middle">{completedTasks}</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Grok Modal */}
      {showGrokModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowGrokModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="modal glassmorphic p-6">
              <h2 className="text-2xl font-display text-vibrant-pink mb-4">Ask Grok</h2>
              <p className="text-white text-sm mb-4">
                Powered by <a href="https://x.ai" target="_blank" rel="noopener noreferrer" className="text-vibrant-pink hover:text-neon-blue">xAI</a>.
              </p>
              <form onSubmit={handleGrokQuery} className="space-y-4">
                <textarea
                  value={grokQuery}
                  onChange={(e) => setGrokQuery(e.target.value)}
                  placeholder="Ask Grok (e.g., 'Summarize my projects')"
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                />
                <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                  Send to Grok
                </button>
              </form>
              {grokResponse && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-lg text-vibrant-pink mb-2">Grok's Response</h3>
                  <p className="text-white">{grokResponse}</p>
                </div>
              )}
              {grokError && (
                <div className="mt-4 p-4 bg-red-500 rounded-lg">
                  <p className="text-white">{grokError}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({ totalProjects: 0, currentProjects: 0, pastProjects: 0, tasksCompleted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser) {
            if (typeof setUser === 'function') {
              setUser(storedUser);
            } else {
              throw new Error('setUser is not a function');
            }
          } else {
            navigate('/login');
            return;
          }
        }

        console.log('Fetching user details...');
        const userDetails = await getUserDetails();
        console.log('User details:', userDetails);
        if (typeof setUser === 'function') {
          setUser(userDetails);
        } else {
          throw new Error('setUser is not a function');
        }

        console.log('Fetching user projects...');
        const userProjects = await getUserProjects();
        console.log('User projects:', userProjects);
        setProjects(userProjects);

        console.log('Fetching project metrics...');
        const projectMetrics = await getProjectMetrics();
        console.log('Project metrics:', projectMetrics);
        setMetrics(projectMetrics);
      } catch (err) {
        console.error('Fetch data error:', err.message);
        setError(`Failed to load data: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, setUser, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof setUser === 'function') {
      setUser(null);
    }
    navigate('/login');
  };

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  // Extract the first name (hardcoding "Manny" as per your example)
  const firstName = user.username?.split(' ')[0] || 'Manny';

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-dark-navy p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-display text-vibrant-pink">ShareSync</h1>
        <div className="flex items-center space-x-4">
          <Link to="/profile" className="text-white hover:text-vibrant-pink transition-colors">
            Profile
          </Link>
          <button onClick={handleLogout} className="btn-secondary neumorphic hover:scale-105 transition-transform animate-pulse-glow">
            Logout
          </button>
          <Link to="/profile">
            <img
              src={user?.profilePicture || 'https://via.placeholder.com/40'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-vibrant-pink"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
            />
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8 animate-fade-in">
          <div className="flex items-center space-x-4">
            <img
              src={user?.profilePicture || 'https://via.placeholder.com/40'}
              alt="User Avatar"
              className="w-12 h-12 rounded-full border-2 border-vibrant-pink"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
            />
            <h1 className="text-4xl font-display text-vibrant-pink">Welcome, {firstName}!</h1>
          </div>
        </header>

        {/* User Activity Infographic */}
        <UserActivityInfographic projects={projects} metrics={metrics} />

        <section className="card glassmorphic animate-fade-in mb-8">
          <h2 className="text-2xl font-display text-vibrant-pink mb-4">Your Projects</h2>
          {projects.length === 0 ? (
            <p className="text-white">No projects yet. Start by creating a new project!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Link
                  key={project._id}
                  to={`/project/${project._id}`}
                  className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow"
                >
                  <h3 className="text-lg font-display text-vibrant-pink">{project.title}</h3>
                  <p className="text-gray-300 mt-2">{project.description}</p>
                  <p className="text-sm text-white mt-2">Status: {project.status}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="text-center animate-fade-in">
          <Link to="/projects/create" className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow">
            Create New Project
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Home;