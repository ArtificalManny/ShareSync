import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserDetails, getUserProjects, getProjectMetrics } from '../utils/api';

// Helper function to render a user activity infographic
const UserActivityInfographic = ({ projects, metrics }) => {
  const activeProjects = projects.filter(project => project.status === 'Active').length;
  const completedTasks = metrics.tasksCompleted || 0;

  return (
    <div className="card glassmorphic animate-fade-in mb-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-4">Your Activity</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
          <h3 className="text-lg text-white">Active Projects</h3>
          <p className="text-2xl font-bold text-vibrant-pink">{activeProjects}</p>
          <div className="mt-2 w-full bg-gray-800 rounded-full h-4">
            <div
              className="bg-neon-blue h-4 rounded-full transition-all duration-500"
              style={{ width: `${(activeProjects / projects.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
          <h3 className="text-lg text-white">Tasks Completed</h3>
          <p className="text-2xl font-bold text-vibrant-pink">{completedTasks}</p>
          <div className="mt-2 w-full bg-gray-800 rounded-full h-4">
            <div
              className="bg-vibrant-pink h-4 rounded-full transition-all duration-500"
              style={{ width: `${(completedTasks / 50) * 100}%` }} // Assuming 50 as a max for visualization
            ></div>
          </div>
        </div>
      </div>
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
            setUser(storedUser);
          } else {
            navigate('/login');
            return;
          }
        }

        console.log('Fetching user details...');
        const userDetails = await getUserDetails();
        console.log('User details:', userDetails);
        setUser(userDetails);

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
    setUser(null);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8 animate-fade-in">
        <h1 className="text-4xl font-display text-vibrant-pink">Welcome, {user.username}!</h1>
        <button onClick={handleLogout} className="btn-secondary neumorphic hover:scale-105 transition-transform animate-pulse-glow">
          Logout
        </button>
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
  );
};

export default Home;