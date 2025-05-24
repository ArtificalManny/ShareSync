import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, Plus, Award, Workflow, Edit2, CheckCircle } from 'lucide-react';
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
          <h1 className="text-3xl font-inter text-primary">Your Projects</h1>
        </div>
        <p className="text-red-500">Authentication context is not available.</p>
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
    return <div className="projects-container"><p className="text-gray-400">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="projects-container">
        <div className="projects-header">
          <h1 className="text-3xl font-inter text-primary">Your Projects</h1>
        </div>
        <p className="text-red-500">{error}</p>
        {error.includes('token') && (
          <p className="text-gray-400">
            Please <Link to="/login" className="text-accent-teal hover:underline">log in</Link> to view your projects.
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
        <h1 className="text-3xl font-inter text-primary">Your Projects</h1>
        <Link to="/projects/create">
          <button className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Create Project
          </button>
        </Link>
      </div>
      {mockWorkflowSuggestion && (
        <div className="workflow-section">
          <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center"><Workflow className="w-5 h-5 mr-2" /> Suggested Workflow</h2>
          <div className="workflow-suggestion bg-glass p-6 rounded-lg shadow-soft">
            <p className="text-primary">Workflow: {mockWorkflowSuggestion.type}</p>
            <p className="text-gray-400">Reason: {mockWorkflowSuggestion.reason}</p>
          </div>
        </div>
      )}
      <div className="gamification-section">
        <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center"><Award className="w-5 h-5 mr-2" /> Achievements</h2>
        <div className="achievements-list flex flex-wrap gap-4">
          {mockAchievements.map((achievement, index) => (
            <div key={index} className="achievement-card bg-glass p-4 rounded-lg shadow-soft">
              <span className="text-primary font-semibold">{achievement.name}</span>
              <p className="text-gray-400">{achievement.description}</p>
            </div>
          ))}
        </div>
        <h2 className="text-xl font-inter text-accent-teal mt-8 mb-4">Team Leaderboard</h2>
        <div className="leaderboard-section">
          <ul>
            {mockLeaderboard.map((member, index) => (
              <li key={index} className="leaderboard-item bg-glass p-4 rounded-lg mb-2 shadow-soft">
                {member.name}: {member.points} points
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="project-metrics">
        <h2 className="text-xl font-inter text-accent-teal mb-4">Project Metrics</h2>
        <div className="metrics-infographic flex flex-wrap gap-4">
          <div className="metric-card bg-glass p-4 rounded-lg shadow-soft">
            <span className="text-primary">Total Projects</span>
            <p className="text-2xl font-bold">{totalProjects}</p>
          </div>
          <div className="metric-card bg-glass p-4 rounded-lg shadow-soft">
            <span className="text-primary">Current Projects</span>
            <p className="text-2xl font-bold">{currentProjects}</p>
          </div>
          <div className="metric-card bg-glass p-4 rounded-lg shadow-soft">
            <span className="text-primary">Past Projects</span>
            <p className="text-2xl font-bold">{pastProjects}</p>
          </div>
          <div className="metric-card bg-glass p-4 rounded-lg shadow-soft">
            <span className="text-primary">Tasks Completed</span>
            <p className="text-2xl font-bold">{tasksCompleted}</p>
          </div>
        </div>
      </div>
      <div className="notifications-section bg-glass p-6 rounded-lg shadow-soft mb-8">
        <h2 className="text-xl font-inter text-accent-teal mb-4">Notifications</h2>
        <p className="text-gray-400">No notifications yet.</p>
      </div>
      <div className="team-activity-section bg-glass p-6 rounded-lg shadow-soft mb-8">
        <h2 className="text-xl font-inter text-accent-teal mb-4">Team Activity</h2>
        <p className="text-gray-400">No recent updates.</p>
      </div>
      <div className="projects-section">
        <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center"><Folder className="w-5 h-5 mr-2" /> All Projects</h2>
        {projects.length === 0 ? (
          <div className="no-projects-card bg-glass p-6 rounded-lg shadow-soft text-center">
            <p className="text-gray-400">No projects found. Create one to get started!</p>
            <Link to="/projects/create">
              <button className="btn-primary mt-4 flex items-center mx-auto">
                <Plus className="w-5 h-5 mr-2" /> Create Project
              </button>
            </Link>
          </div>
        ) : (
          <div className="projects-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="project-card bg-glass p-6 rounded-lg shadow-soft transition-all hover:shadow-lg">
                <Link to={`/projects/${project.id}`} className="project-card-link">
                  <h3 className="text-lg font-semibold text-primary">{project.title || 'Untitled'}</h3>
                  <p className="text-gray-400">{project.description || 'No description'}</p>
                  <p className="text-accent-teal">Category: {project.category}</p>
                  <p className="text-accent-gold">Status: {project.status}</p>
                </Link>
                <div className="project-actions mt-4 flex flex-wrap gap-2">
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
                    <button className="btn-primary flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" /> View Details
                    </button>
                  </Link>
                </div>
                <div className="announcement-section mt-4">
                  <h4 className="text-accent-teal">Announcements</h4>
                  {project.announcements && project.announcements.length > 0 ? (
                    project.announcements.map((ann, idx) => (
                      <p key={idx} className="text-gray-400">{ann.text} - {new Date(ann.date).toLocaleString()}</p>
                    ))
                  ) : (
                    <p className="text-gray-400">No announcements yet.</p>
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
                  <h4 className="text-accent-teal">Snapshots</h4>
                  {project.snapshots && project.snapshots.length > 0 ? (
                    project.snapshots.map((snap, idx) => (
                      <p key={idx} className="text-gray-400">{snap.text} - {new Date(snap.date).toLocaleString()}</p>
                    ))
                  ) : (
                    <p className="text-gray-400">No snapshots yet.</p>
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