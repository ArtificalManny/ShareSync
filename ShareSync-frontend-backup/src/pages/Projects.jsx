import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FolderKanban, Plus, Brain, Award, Workflow, Share2 } from 'lucide-react';
import './Projects.css';

const mockProjects = [
  { id: '1', title: 'Project Alpha', description: 'A revolutionary project.', status: 'In Progress', tasksCompleted: 5 },
  { id: '2', title: 'Project Beta', description: 'Building the future.', status: 'Completed', tasksCompleted: 10 },
];

const mockLeaderboard = [
  { name: 'Alice', points: 150 },
  { name: 'Bob', points: 120 },
];

const mockAchievements = [
  { name: 'Task Master', description: 'Completed 10 tasks' },
  { name: 'On-Time Hero', description: 'Delivered a project on time' },
];

const mockWorkflowSuggestion = {
  type: 'Kanban',
  reason: 'Best for small, agile teams with frequent updates.',
};

const mockAiSuggestions = {
  '1': { predictedCompletion: '2025-06-01', risks: ['Resource overload'] },
  '2': { predictedCompletion: '2025-05-15', risks: [] },
};

const Projects = () => {
  console.log('Projects - Starting render');

  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [nlpInput, setNlpInput] = useState('');
  const [aiSuggestions] = useState(mockAiSuggestions);
  const [leaderboard] = useState(mockLeaderboard);
  const [achievements] = useState(mockAchievements);
  const [workflowSuggestion] = useState(mockWorkflowSuggestion);

  if (!authContext) {
    return (
      <div className="projects-container">
        <div className="projects-header">
          <h1>Your Projects</h1>
        </div>
        <p className="text-error">Authentication context is not available.</p>
      </div>
    );
  }

  const { isAuthenticated } = authContext;

  useEffect(() => {
    console.log('Projects - useEffect, isAuthenticated:', isAuthenticated);
    const fetchProjects = async () => {
      try {
        setProjects(mockProjects);
      } catch (err) {
        console.error('Projects - Error fetching projects:', err.message, err.stack);
        setError('Failed to fetch projects: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProjects();
    } else {
      console.log('Projects - Not authenticated, navigating to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAutoAssignTasks = (projectId) => {
    console.log('Auto-assigned tasks for project:', projectId);
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, tasks: [{ id: 'task-1', assignee: 'Alice' }] }
          : project
      )
    );
  };

  const handleNlpInput = (e) => {
    e.preventDefault();
    if (!nlpInput) return;
    console.log('NLP task created:', nlpInput);
    setProjects((prev) => [
      ...prev,
      {
        id: `${prev.length + 1}`,
        title: `Project from NLP ${prev.length + 1}`,
        description: nlpInput,
        status: 'Not Started',
        tasksCompleted: 0,
      },
    ]);
    setNlpInput('');
  };

  const handleShare = (project) => {
    const shareText = `Check out my project "${project.title}" on ShareSync! ${project.description}`;
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: shareText,
        url: window.location.href,
      }).catch((err) => console.error('Error sharing:', err));
    } else {
      alert('Sharing not supported on this device. Copy this: ' + shareText);
    }
  };

  if (loading) {
    return <div className="projects-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="projects-container">
        <div className="projects-header">
          <h1>Your Projects</h1>
        </div>
        <p className="text-error">{error}</p>
        {error.includes('token') && (
          <p className="text-secondary">
            Please <Link to="/login">log in</Link> to view your projects.
          </p>
        )}
      </div>
    );
  }

  const totalProjects = projects.length;
  const currentProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Not Started').length;
  const pastProjects = projects.filter((p) => p.status === 'Completed').length;
  const tasksCompleted = projects.reduce((acc, project) => acc + (project.tasksCompleted || 0), 0);

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary">
            <Plus className="icon" /> Create Project
          </button>
        </Link>
      </div>
      <div className="nlp-section">
        <h2><Brain className="icon" /> Smart Task Creation</h2>
        <form onSubmit={handleNlpInput}>
          <input
            type="text"
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            placeholder="e.g., Create a task for designing the logo due next Friday"
            className="nlp-input"
          />
          <button type="submit" className="btn-primary">Create Task</button>
        </form>
      </div>
      {workflowSuggestion && (
        <div className="workflow-section">
          <h2><Workflow className="icon" /> Suggested Workflow</h2>
          <div className="workflow-suggestion holographic">
            <p>Workflow: {workflowSuggestion.type}</p>
            <p>Reason: {workflowSuggestion.reason}</p>
          </div>
        </div>
      )}
      <div className="gamification-section">
        <h2><Award className="icon" /> Achievements</h2>
        <div className="achievements-list">
          {achievements.map((achievement, index) => (
            <div key={index} className="achievement-card holographic">
              <span>{achievement.name}</span>
              <p>{achievement.description}</p>
            </div>
          ))}
        </div>
        <h2>Team Leaderboard</h2>
        <div className="leaderboard-section">
          <ul>
            {leaderboard.map((member, index) => (
              <li key={index} className="leaderboard-item holographic">
                {member.name}: {member.points} points
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="project-metrics">
        <h2>Project Metrics</h2>
        <div className="metrics-infographic">
          <div className="metric-card gradient-bg">
            <span>Total Projects</span>
            <p>{totalProjects}</p>
          </div>
          <div className="metric-card gradient-bg">
            <span>Current Projects</span>
            <p>{currentProjects}</p>
          </div>
          <div className="metric-card gradient-bg">
            <span>Past Projects</span>
            <p>{pastProjects}</p>
          </div>
          <div className="metric-card gradient-bg">
            <span>Tasks Completed</span>
            <p>{tasksCompleted}</p>
          </div>
        </div>
      </div>
      <div className="projects-section">
        <h2><FolderKanban className="icon" /> All Projects</h2>
        {projects.length === 0 ? (
          <div className="no-projects-card card holographic">
            <p className="text-secondary">No projects found. Create one to get started!</p>
            <Link to="/projects/create">
              <button className="btn-primary">
                <Plus className="icon" /> Create Project
              </button>
            </Link>
          </div>
        ) : (
          <div className="projects-list">
            {projects.map((project) => (
              <div key={project.id} className="project-card card holographic">
                <Link to={`/projects/${project.id}`} className="project-card-link">
                  <h3>{project.title || 'Untitled'}</h3>
                  <p className="text-secondary">{project.description || 'No description'}</p>
                </Link>
                <div className="project-actions">
                  <button
                    onClick={() => handleAutoAssignTasks(project.id)}
                    className="btn-primary ai-button"
                  >
                    <Brain className="icon" /> Auto-Assign Tasks
                  </button>
                  <button
                    onClick={() => handleShare(project)}
                    className="btn-primary share-button"
                  >
                    <Share2 className="icon" /> Share
                  </button>
                </div>
                {aiSuggestions[project.id] && (
                  <div className="ai-suggestions">
                    <h4>AI Suggestions</h4>
                    <p>Predicted Completion: {aiSuggestions[project.id].predictedCompletion}</p>
                    {aiSuggestions[project.id].risks && (
                      <p>Risks: {aiSuggestions[project.id].risks.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;