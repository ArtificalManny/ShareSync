import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Briefcase, AlertCircle } from 'lucide-react';
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
  const { user, isAuthenticated, authError } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }
    setProjects(user.projects || []);
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (searchState.query) {
      const suggestions = (user.projects || []).filter(p => p.title.toLowerCase().includes(searchState.query.toLowerCase())).map(p => p.title).slice(0, 5);
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user, dispatchSearch]);

  if (authError) return <div className="projects-container min-h-screen"><div className="error-message flex items-center justify-center min-h-screen"><p className="text-rose-500 text-lg font-sans flex items-center gap-2"><AlertCircle className="w-6 h-6" />{authError}</p></div></div>;

  return (
    <div className="projects-container min-h-screen bg-white dark:bg-gray-900 relative ml-16">
      {isAuthenticated && (
        <div className="flex flex-1">
          <main className="main-content w-full p-4 sm:p-6 lg:p-8">
            <div className="projects-header mb-6">
              <div className="flex items-center gap-3"><Briefcase className="w-6 h-6 text-purple-500 animate-pulse-slow" /><h1 className="text-2xl font-sans font-bold text-gray-900 dark:text-white">Projects</h1></div>
            </div>
            <div className="projects-list space-y-4">
              {projects.length === 0 ? <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-rose-500" />No projects</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map(project => (
                    <Link key={project._id} to={`/projects/${project._id}`} className="project-card bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-md hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-500" /><span className="text-base font-sans text-gray-900 dark:text-gray-200">{project.title}</span></div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm"><span className="text-emerald-500">Status:</span> {project.status || 'Not Started'}</p>
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