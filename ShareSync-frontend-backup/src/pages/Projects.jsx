import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Briefcase, AlertCircle, Users } from 'lucide-react';
import './Projects.css';

const Projects = ({
  searchState,
  dispatchSearch,
  isDarkMode,
  setIsDarkMode,
  accentColor,
  setAccentColor,
  notifications,
  setNotifications,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.email) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchProjects = () => {
      try {
        const userProjects = user.projects || [];
        setProjects(userProjects);
      } catch (err) {
        setError('Failed to load projects: ' + (err.message || 'Please try again.'));
      }
    };

    fetchProjects();
  }, [isAuthenticated, isLoading, navigate, user]);

  useEffect(() => {
    if (searchState.query.length > 0) {
      const suggestions = (user?.projects || [])
        .filter(project => project.title.toLowerCase().includes(searchState.query.toLowerCase()))
        .map(project => project.title)
        .slice(0, 5);
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user, dispatchSearch]);

  if (isLoading) {
    return (
      <div className="projects-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading projects page"></div>
          <span className="text-gray-600 dark:text-gray-400 text-xl font-sans ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="projects-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-rose-500 text-lg font-sans flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {authError || error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`projects-container flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} relative`}>
      {/* Fallback UI if not authenticated */}
      {(!isAuthenticated || !user) && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loader mx-auto mb-4" aria-label="Redirecting to login"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-sans">
              Redirecting to login...
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isAuthenticated && user && (
        <div className="flex flex-1 mt-14 relative z-10">
          <main className="main-content flex-1 p-4 sm:p-6">
            <div className="projects-header mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-5 h-5 text-purple-500" aria-hidden="true" />
                <h1 className="text-lg sm:text-xl font-sans font-bold text-gray-900 dark:text-white">
                  Your Projects
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-sans">
                Manage and view all your projects here.
              </p>
            </div>

            <div className="projects-list">
              {projects.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-sans text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-500" aria-hidden="true" /> No projects found.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(project => (
                    <Link
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className="project-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4 shadow-lg hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-transform duration-200 transform hover:scale-102"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-purple-500" aria-hidden="true" />
                        <h3 className="text-md font-sans font-medium text-gray-900 dark:text-gray-200">
                          {project.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-sans mb-2">
                        Status: {project.status || 'Not Started'}
                      </p>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                        <span className="text-gray-600 dark:text-gray-400 text-xs font-sans">
                          {project.members?.length || 0} members
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default Projects;