import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FolderPlus, Folder, AlertCircle, X, Lightbulb } from 'lucide-react';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, addProject, setIntendedRoute } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [arMode, setArMode] = useState(false);
  const titleInputRef = useRef(null);
  const createButtonRef = useRef(null);
  const suggestionButtonRef = useRef(null);
  const arButtonRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
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

    console.log('Projects - Fetching user projects:', user.projects);
    if (user.projects && Array.isArray(user.projects)) {
      setProjects(user.projects);
      console.log('Projects - Projects state updated:', user.projects.map(p => p.id));
    } else {
      console.log('Projects - No projects found for user');
      setProjects([]);
    }

    const mockSuggestions = [
      { title: "Virtual Reality Campaign", description: "Launch a VR-based marketing campaign", matchScore: 0.92 },
      { title: "AI Workflow Automation", description: "Automate team workflows with AI", matchScore: 0.87 },
      { title: "Augmented Reality Training", description: "Develop AR training modules", matchScore: 0.85 },
    ];
    setAiSuggestions(mockSuggestions);
  }, [isAuthenticated, user, isLoading, navigate, setIntendedRoute]);

  useEffect(() => {
    if (showCreateForm && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showCreateForm]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) {
      setError('Project title is required.');
      return;
    }

    setIsCreating(true);
    setError('');

    const newProject = {
      title: newProjectTitle,
      description: newProjectDescription || 'A new project',
    };

    try {
      console.log('Projects - Creating new project:', newProject);
      const createdProject = await addProject(newProject);
      console.log('Projects - Project created successfully:', createdProject);
      const updatedProjects = [...projects, createdProject];
      setProjects(updatedProjects);
      console.log('Projects - Updated projects state after creation:', updatedProjects.map(p => p.id));
      setShowCreateForm(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      navigate(`/projects/${createdProject.id}`, { replace: true });
    } catch (err) {
      console.error('Projects - Failed to create project:', err.message, err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(`Failed to create project: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseSuggestion = (suggestion) => {
    setNewProjectTitle(suggestion.title);
    setNewProjectDescription(suggestion.description);
    setShowSuggestions(false);
    setShowCreateForm(true);
  };

  const toggleArMode = () => {
    setArMode(!arMode);
    if (!arMode) {
      alert('AR Mode: Imagine viewing your projects in augmented reality! (Mock implementation)');
    }
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  if (isLoading) {
    console.log('Projects - Rendering loading state');
    return <div className="projects-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  if (authError) {
    console.log('Projects - Rendering auth error state:', authError);
    return (
      <div className="projects-container">
        <p className="text-red-500">{authError}</p>
        <Link to="/login" className="text-holo-blue hover:underline">Login</Link>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">Your Projects</h1>
        <p className="text-holo-gray mb-4">Manage your projects with ease.</p>
        <div className="flex justify-center gap-4">
          <button
            ref={createButtonRef}
            onClick={() => setShowCreateForm(true)}
            onKeyDown={(e) => handleKeyDown(e, () => setShowCreateForm(true))}
            className="btn-primary rounded-full flex items-center mx-auto animate-glow z-20"
            aria-label="Create New Project"
          >
            <FolderPlus className="w-5 h-5 mr-2" /> Create New Project
          </button>
          <button
            ref={suggestionButtonRef}
            onClick={() => setShowSuggestions(true)}
            onKeyDown={(e) => handleKeyDown(e, () => setShowSuggestions(true))}
            className="btn-primary rounded-full flex items-center mx-auto animate-glow z-20"
            aria-label="View AI Suggestions"
          >
            <Lightbulb className="w-5 h-5 mr-2" /> AI Suggestions
          </button>
          <button
            ref={arButtonRef}
            onClick={toggleArMode}
            onKeyDown={(e) => handleKeyDown(e, toggleArMode)}
            className="btn-primary rounded-full flex items-center mx-auto animate-glow z-20"
            aria-label="Toggle AR Mode"
          >
            <span role="img" aria-label="AR">🕶️</span> {arMode ? 'Exit AR Mode' : 'Enter AR Mode'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {projects.length === 0 ? (
          <p className="text-holo-gray flex items-center gap-2 justify-center">
            <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No projects yet. Create one to get started!
          </p>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${arMode ? 'ar-mode' : ''}`}>
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card card p-6 glassmorphic holographic-effect z-10"
                aria-label={`View project ${project.title}`}
              >
                <h2 className="text-xl font-inter text-holo-blue mb-2 flex items-center">
                  <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> {project.title || 'Untitled Project'}
                </h2>
                <p className="text-holo-gray text-sm mb-2">{project.description || 'No description'}</p>
                <p className="text-holo-gray text-sm">Status: {project.status || 'Not Started'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-holo-bg-light p-6 rounded-lg max-w-md w-full glassmorphic relative z-[60]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-inter text-holo-blue">Create a New Project</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-holo-gray hover:text-holo-blue z-70" aria-label="Close Create Project Form">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-holo-gray text-sm" htmlFor="project-title">Project Title</label>
                <input
                  id="project-title"
                  type="text"
                  ref={titleInputRef}
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="input-field w-full rounded-full z-70"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label className="text-holo-gray text-sm" htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Enter project description (optional)"
                  className="input-field w-full h-24 rounded-lg z-70"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary rounded-full w-full animate-glow flex items-center justify-center z-70"
                aria-label="Create Project"
              >
                {isCreating ? (
                  <span>Creating...</span>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5 mr-2" /> Create Project
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-holo-bg-light p-6 rounded-lg max-w-md w-full glassmorphic relative z-[60]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-inter text-holo-blue">AI Project Suggestions</h2>
              <button onClick={() => setShowSuggestions(false)} className="text-holo-gray hover:text-holo-blue z-70" aria-label="Close AI Suggestions">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-card card p-4 glassmorphic">
                  <h3 className="text-lg font-inter text-holo-blue">{suggestion.title}</h3>
                  <p className="text-holo-gray text-sm mb-2">{suggestion.description}</p>
                  <p className="text-holo-gray text-sm">Match Score: {(suggestion.matchScore * 100).toFixed(0)}%</p>
                  <button
                    onClick={() => handleUseSuggestion(suggestion)}
                    onKeyDown={(e) => handleKeyDown(e, () => handleUseSuggestion(suggestion))}
                    className="btn-primary rounded-full mt-2 animate-glow"
                    aria-label={`Use suggestion ${suggestion.title}`}
                  >
                    Use This Idea
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;