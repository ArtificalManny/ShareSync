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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }
    // Fetch projects from backend
    fetch('/api/projects', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (searchState.query) {
      const suggestions = (user.projects || []).filter(p => p.title.toLowerCase().includes(searchState.query.toLowerCase())).map(p => p.title).slice(0, 5);
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user, dispatchSearch]);

  if (authError) return <div className="projects-container min-h-screen flex items-center justify-center bg-white dark:bg-gray-950"><div className="error-message text-rose-500 text-lg font-sans flex items-center gap-2"><AlertCircle className="w-6 h-6" />{authError}</div></div>;
  if (loading) return <div className="projects-container min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="projects-container min-h-screen bg-white dark:bg-gray-950 flex flex-col ml-10 sm:ml-12 transition-all duration-200">
      {isAuthenticated && (
        <div className="flex flex-1">
          <main className="main-content w-full p-2 sm:p-3 lg:p-4">
            <div className="projects-header mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3"><Briefcase className="w-5 h-5 sm:w-6 h-6 text-purple-500 animate-pulse-slow" /><h1 className="text-xl sm:text-2xl font-sans font-bold text-gray-900 dark:text-gray-100">Projects</h1></div>
            </div>
            <div className="projects-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {projects.length === 0 ? (
                <p className="col-span-full text-gray-600 dark:text-gray-400 flex items-center gap-2"><AlertCircle className="w-5 h-5 sm:w-6 h-6 text-rose-500" />No projects</p>
              ) : (
                projects.map(project => (
                  <Link key={project._id} to={`/projects/${project._id}`} className="project-card bg-white/98 dark:bg-gray-900/98 border border-gray-100 dark:border-gray-800 rounded-xl p-2 sm:p-3 shadow-sm hover:shadow-md hover-glow transition-all duration-200">
                    <div className="flex items-center gap-1 sm:gap-2"><Briefcase className="w-4 h-4 sm:w-5 h-5 text-purple-500" /><span className="text-base font-sans text-gray-900 dark:text-gray-100">{project.title}</span></div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm"><span className="text-emerald-500">Status:</span> {project.status || 'Not Started'}</p>
                  </Link>
                ))
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default Projects;