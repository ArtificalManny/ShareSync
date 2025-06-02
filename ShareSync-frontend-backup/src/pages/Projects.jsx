import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Folder, Plus, AlertCircle, BarChart2, Award } from 'lucide-react';
import './Projects.css';

const Projects = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, addProject } = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
    activeMembers: 0,
    filesShared: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userProjects = user.projects || [];
      setProjects(userProjects);

      // Calculate metrics
      const totalProjects = userProjects.length;
      const currentProjects = userProjects.filter(p => p.status !== 'Completed').length;
      const pastProjects = totalProjects - currentProjects;
      const tasksCompleted = userProjects.reduce((sum, p) => sum + (p.tasks?.filter(t => t.status === 'Completed').length || 0), 0);
      const activeMembers = userProjects.reduce((sum, p) => sum + (p.members?.length || 0), 0);
      const filesShared = userProjects.reduce((sum, p) => sum + (p.files?.length || 0), 0);

      setMetrics({
        totalProjects,
        currentProjects,
        pastProjects,
        tasksCompleted,
        activeMembers,
        filesShared,
      });

      // Fetch leaderboard data
      const fetchLeaderboards = async () => {
        try {
          const projectLeaderboards = await Promise.all(
            userProjects.map(async (project) => {
              const response = await axios.get(`http://localhost:3000/api/projects/${project._id}/leaderboard`);
              return response.data;
            })
          );

          const aggregated = {};
          projectLeaderboards.forEach(leaderboard => {
            leaderboard.forEach(entry => {
              if (aggregated[entry.email]) {
                aggregated[entry.email].points += entry.points;
              } else {
                aggregated[entry.email] = { ...entry };
              }
            });
          });

          const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 5);
          setLeaderboard(leaderboardArray);
        } catch (err) {
          console.error('Failed to fetch leaderboard:', err);
          setLeaderboard([]);
        }
      };

      fetchLeaderboards();
    }
  }, [isLoading, isAuthenticated, user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Project title is required.');
      return;
    }

    try {
      const projectData = {
        title,
        description,
        category,
        status: 'Not Started',
      };
      const newProject = await addProject(projectData);
      if (!newProject || !newProject._id) {
        throw new Error('Project creation failed: No project ID returned.');
      }
      setTitle('');
      setDescription('');
      setCategory('Personal');
      navigate(`/projects/${newProject._id}`);
    } catch (err) {
      setError('Failed to create project: ' + (err.message || 'Please try again.'));
    }
  };

  if (isLoading) {
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading projects"></div>
        <span className="text-neon-magenta text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  if (authError) {
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg font-orbitron">{authError}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="projects-container flex items-center justify-center min-h-screen">
        <p className="text-cyber-teal text-lg font-orbitron">Unable to load user data. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-orbitron font-bold text-neon-magenta mb-4 animate-text-glow">Your Projects</h1>
        <p className="text-cyber-teal text-lg font-inter mb-4">Manage and collaborate on your projects.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center font-orbitron">{error}</p>}

        {/* Metrics Dashboard */}
        <div className="metrics-dashboard mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-holo-silver" aria-hidden="true" /> Metrics Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Total Projects</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.totalProjects}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Current Projects</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.currentProjects}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Past Projects</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.pastProjects}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Tasks Completed</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.tasksCompleted}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Active Members</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.activeMembers}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Files Shared</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.filesShared}</p>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Overall Leaderboard
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No leaderboard data available.
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={index} className="leaderboard-item card p-3 glassmorphic flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-orbitron ${index === 0 ? 'text-holo-silver' : index === 1 ? 'text-cyber-teal' : 'text-neon-magenta'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-light-text font-inter">{entry.username}</span>
                  </div>
                  <span className="text-light-text font-inter">{entry.points} points</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Activity (Placeholder) */}
        <div className="team-activity-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4">Team Activity</h2>
          <p className="text-cyber-teal font-inter">No recent updates.</p>
        </div>

        {/* Create Project Form */}
        <form onSubmit={handleCreateProject} className="mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Create New Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-cyber-teal mb-2 font-inter">Project Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                placeholder="Enter project title"
                aria-label="Project Title"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-cyber-teal mb-2 font-inter">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Project Category"
              >
                <option value="Personal">Personal</option>
                <option value="School">School</option>
                <option value="Job">Job</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="description" className="block text-cyber-teal mb-2 font-inter">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
              placeholder="Enter project description"
              rows="3"
              aria-label="Project Description"
            ></textarea>
          </div>
          <button
            type="submit"
            className="btn-primary mt-4 rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
            aria-label="Create Project"
          >
            <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Create Project
          </button>
        </form>

        {/* Project List */}
        <div className="projects-list">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> All Projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-cyber-teal flex items-center gap-2 font-inter">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No projects yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <Link
                  key={project._id}
                  to={`/projects/${project._id}`}
                  className="project-card card p-4 glassmorphic holographic-effect shadow-md focus:outline-none focus:ring-2 focus:ring-holo-silver animate-fade-in"
                  aria-label={`View project ${project.title}`}
                >
                  <h3 className="text-lg font-orbitron font-bold text-neon-magenta">{project.title || 'Untitled Project'}</h3>
                  <p className="text-cyber-teal text-sm mb-1 font-inter">{project.description || 'No description'}</p>
                  <p className="text-cyber-teal text-sm font-inter">Category: {project.category || 'Unknown'}</p>
                  <p className="text-cyber-teal text-sm font-inter">Status: {project.status || 'Not Started'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;