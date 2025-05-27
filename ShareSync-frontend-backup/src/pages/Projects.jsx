import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, PlusCircle, Users, BarChart, Eye } from 'lucide-react';
import axios from 'axios';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, socket, isLoading: authLoading, setIntendedRoute, autoAssignTasks } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [arMode, setArMode] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      if (authLoading) {
        console.log('Projects - Waiting for AuthContext to finish loading');
        return;
      }

      if (!isAuthenticated) {
        console.log('Projects - User not authenticated, redirecting to login');
        setIntendedRoute('/projects');
        navigate('/login', { replace: true });
        return;
      }

      if (!user || !user.email) {
        console.log('Projects - User data not available');
        setError('User data not available. Please log in again.');
        setIntendedRoute('/projects');
        navigate('/login', { replace: true });
        return;
      }

      console.log('Projects - Fetching projects for user:', user.email);
      const userProjects = Array.isArray(user.projects) ? user.projects : [];
      setProjects(userProjects);

      const response = await axios.get('http://localhost:3000/api/leaderboard');
      setLeaderboard(response.data);
    } catch (err) {
      console.error('Projects - Error fetching projects:', err.message, err.stack);
      setError('Failed to load projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading, navigate, setIntendedRoute]);

  useEffect(() => {
    fetchProjects();

    if (!socket) return;

    socket.on('project-create', (project) => {
      setProjects((prev) => [...prev, project]);
    });

    socket.on('notification', (notification) => {
      console.log('Projects - Received notification:', notification);
    });

    socket.on('metric-update', (update) => {
      console.log('Projects - Metric update:', update);
    });

    return () => {
      socket.off('project-create');
      socket.off('notification');
      socket.off('metric-update');
    };
  }, [socket, fetchProjects]);

  const handleAutoAssign = async (projectId) => {
    try {
      await autoAssignTasks(projectId);
      console.log('Projects - Tasks auto-assigned for project:', projectId);
    } catch (err) {
      console.error('Projects - Error auto-assigning tasks:', err.message);
      setError('Failed to auto-assign tasks: ' + err.message);
    }
  };

  const toggleArMode = () => {
    if (!arMode) {
      alert('AR Mode: Imagine viewing project details in an augmented reality environment! (Requires WebAR support)');
    }
    setArMode(!arMode);
  };

  if (loading) return <div className="projects-container"><p className="text-holo-gray">Loading projects...</p></div>;

  if (error) {
    return (
      <div className="projects-container">
        <p className="text-red-500">{error}</p>
        {(error.includes('token') || error.includes('User data not available')) && (
          <p className="text-holo-gray">
            Please <Link to="/login" className="text-holo-blue hover:underline">log in</Link> to view projects.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">Projects</h1>
        <div className="flex justify-center gap-4">
          <Link to="/projects/create" className="btn-primary rounded-full flex items-center animate-glow">
            <PlusCircle className="w-5 h-5 mr-2" /> Create New Project
          </Link>
          <button onClick={toggleArMode} className="btn-primary rounded-full flex items-center animate-glow">
            <Eye className="w-5 h-5 mr-2" /> {arMode ? 'Exit AR Mode' : 'Enter AR Mode'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="projects-list card p-6 mb-6 glassmorphic">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Your Projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-holo-gray">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div key={project.id} className={`project-card card p-4 glassmorphic holographic-effect ${arMode ? 'ar-preview' : ''}`}>
                  <div className="flex items-center gap-3">
                    <Folder className="w-6 h-6 text-holo-pink" />
                    <div className="flex-1">
                      <Link to={`/projects/${project.id}`}>
                        <h3 className="text-lg font-inter text-holo-blue animate-text-glow">{project.title}</h3>
                      </Link>
                      <p className="text-holo-gray text-sm">{project.description || 'No description'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="w-4 h-4 text-holo-pink" />
                        <span className="text-holo-gray text-sm">{project.members?.length || 0} members</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAutoAssign(project.id)}
                      className="btn-primary rounded-full flex items-center animate-glow"
                    >
                      Auto-Assign Tasks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="leaderboard card p-6 glassmorphic">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-holo-gray">No leaderboard data available.</p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((entry, index) => (
                <li key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-holo-bg-dark transition-all">
                  <span className="text-holo-blue font-semibold">{index + 1}.</span>
                  <span className="text-primary">{entry.email}</span>
                  <span className="text-holo-gray ml-auto">{entry.points} points</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;