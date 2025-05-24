import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FolderKanban, Plus, Award, Workflow, Edit2, CheckCircle } from 'lucide-react';
import './Projects.css';

const mockProjects = [
  { id: '1', title: 'Project Alpha', description: 'A revolutionary project.', category: 'Job', status: 'In Progress', tasksCompleted: 5, announcements: [], snapshots: [] },
  { id: '2', title: 'Project Beta', description: 'Building the future.', category: 'School', status: 'Completed', tasksCompleted: 10, announcements: [], snapshots: [] },
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

const Projects = () => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [announcementInputs, setAnnouncementInputs] = useState({});
  const [snapshotInputs, setSnapshotInputs] = useState({});

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

  const handlePostAnnouncement = (projectId) => {
    const announcementText = announcementInputs[projectId];
    if (!announcementText) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, announcements: [...(project.announcements || []), { text: announcementText, date: new Date().toISOString() }] }
          : project
      )
    );
    setAnnouncementInputs((prev) => ({ ...prev, [projectId]: '' }));
  };

  const handleUpdateSnapshot = (projectId) => {
    const snapshotText = snapshotInputs[projectId];
    if (!snapshotText) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, snapshots: [...(project.snapshots || []), { text: snapshotText, date: new Date().toISOString() }] }
          : project
      )
    );
    setSnapshotInputs((prev) => ({ ...prev, [projectId]: '' }));
  };

  const handleStatusChange = (projectId, newStatus) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId ? { ...project, status: newStatus } : project
      )
    );
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
        <h1 className="text-4xl font-orbitron text-neon-white">Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary">
            <Plus className="icon" /> Create Project
          </button>
        </Link>
      </div>
      {workflowSuggestion && (
        <div className="workflow-section">
          <h2 className="text-2xl font-orbitron text-neon-cyan mb-4 flex items-center"><Workflow className="icon mr-2" /> Suggested Workflow</h2>
          <div className="workflow-suggestion holographic">
            <p className="text-neon-white">Workflow: {workflowSuggestion.type}</p>
            <p className="text-secondary">Reason: {workflowSuggestion.reason}</p>
          </div>
        </div>
      )}
      <div className="gamification-section">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4 flex items-center"><Award className="icon mr-2" /> Achievements</h2>
        <div className="achievements-list">
          {mockAchievements.map((achievement, index) => (
            <div key={index} className="achievement-card holographic">
              <span className="text-neon-white font-bold">{achievement.name}</span>
              <p className="text-secondary">{achievement.description}</p>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-orbitron text-neon-cyan mt-8 mb-4">Team Leaderboard</h2>
        <div className="leaderboard-section">
          <ul>
            {mockLeaderboard.map((member, index) => (
              <li key={index} className="leaderboard-item holographic">
                {member.name}: {member.points} points
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="project-metrics">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Project Metrics</h2>
        <div className="metrics-infographic">
          <div className="metric-card gradient-bg">
            <span className="text-neon-white">Total Projects</span>
            <p className="text-3xl font-bold">{totalProjects}</p>
          </div>
          <div className="metric-card gradient-bg">
            <span className="text-neon-white">Current Projects</span>
            <p className="text-3xl font-bold">{currentProjects}</p>
          </div>
          <div className="metric-card gradient-bg">
            <span className="text-neon-white">Past Projects</span>
            <p className="text-3xl font-bold">{pastProjects}</p>
          </div>
          <div className="metric-card gradient-bg">
            <span className="text-neon-white">Tasks Completed</span>
            <p className="text-3xl font-bold">{tasksCompleted}</p>
          </div>
        </div>
      </div>
      <div className="notifications-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Notifications</h2>
        <p className="text-secondary">No notifications yet.</p>
      </div>
      <div className="team-activity-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Team Activity</h2>
        <p className="text-secondary">No recent updates.</p>
      </div>
      <div className="projects-section">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4 flex items-center"><FolderKanban className="icon mr-2" /> All Projects</h2>
        {projects.length === 0 ? (
          <div className="no-projects-card holographic">
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
              <div key={project.id} className="project-card holographic">
                <Link to={`/projects/${project.id}`} className="project-card-link">
                  <h3 className="text-xl font-bold text-neon-white">{project.title || 'Untitled'}</h3>
                  <p className="text-secondary">{project.description || 'No description'}</p>
                  <p className="text-neon-cyan">Category: {project.category}</p>
                  <p className="text-neon-magenta">Status: {project.status}</p>
                </Link>
                <div className="project-actions">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.id, e.target.value)}
                    className="input-field"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <Link to={`/projects/${project.id}`}>
                    <button className="btn-primary"><CheckCircle className="icon" /> View Details</button>
                  </Link>
                </div>
                <div className="announcement-section mt-4">
                  <h4 className="text-neon-cyan">Announcements</h4>
                  {project.announcements && project.announcements.length > 0 ? (
                    project.announcements.map((ann, idx) => (
                      <p key={idx} className="text-secondary">{ann.text} - {new Date(ann.date).toLocaleString()}</p>
                    ))
                  ) : (
                    <p className="text-secondary">No announcements yet.</p>
                  )}
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={announcementInputs[project.id] || ''}
                      onChange={(e) =>
                        setAnnouncementInputs({ ...announcementInputs, [project.id]: e.target.value })
                      }
                      placeholder="Post an announcement..."
                      className="input-field flex-1 mr-2"
                    />
                    <button
                      onClick={() => handlePostAnnouncement(project.id)}
                      className="btn-primary"
                    >
                      Post
                    </button>
                  </div>
                </div>
                <div className="snapshot-section mt-4">
                  <h4 className="text-neon-cyan">Snapshots</h4>
                  {project.snapshots && project.snapshots.length > 0 ? (
                    project.snapshots.map((snap, idx) => (
                      <p key={idx} className="text-secondary">{snap.text} - {new Date(snap.date).toLocaleString()}</p>
                    ))
                  ) : (
                    <p className="text-secondary">No snapshots yet.</p>
                  )}
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={snapshotInputs[project.id] || ''}
                      onChange={(e) =>
                        setSnapshotInputs({ ...snapshotInputs, [project.id]: e.target.value })
                      }
                      placeholder="Update snapshot..."
                      className="input-field flex-1 mr-2"
                    />
                    <button
                      onClick={() => handleUpdateSnapshot(project.id)}
                      className="btn-primary"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;