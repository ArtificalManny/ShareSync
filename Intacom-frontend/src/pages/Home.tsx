import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface Activity {
  _id: string;
  message: string;
  createdAt: string;
}

interface HomeProps {
  projects: Project[];
  showCreateProject: boolean;
  setShowCreateProject: (show: boolean) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  projectDescription: string;
  setProjectDescription: (description: string) => void;
  projectColor: string;
  setProjectColor: (color: string) => void;
  sharedUsers: { email: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  handleAddSharedUser: (email: string, role: 'Admin' | 'Editor' | 'Viewer') => void;
  handleRemoveSharedUser: (email: string) => void;
  handleCreateProject: (e: React.FormEvent) => void;
}

const Home: React.FC<HomeProps> = ({
  projects,
  showCreateProject,
  setShowCreateProject,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  projectColor,
  setProjectColor,
  sharedUsers,
  handleAddSharedUser,
  handleRemoveSharedUser,
  handleCreateProject,
}) => {
  const [sharedEmail, setSharedEmail] = useState('');
  const [sharedRole, setSharedRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const navigate = useNavigate();

  // Mocked metrics for dashboard; in a real app, fetch from backend
  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => project.admin === 'ArtificalManny').length; // Example filter
  // Mocked social proof data (Social Proof - Influence)
  const totalUsers = 1500; // Mocked number of users
  const totalPlatformProjects = 3200; // Mocked number of projects

  // Fetch recent activities (mocked for now; in a real app, fetch from backend)
  useEffect(() => {
    const mockActivities: Activity[] = [
      { _id: '1', message: 'User John created Project Alpha', createdAt: new Date().toISOString() },
      { _id: '2', message: 'User Sarah completed Task Design UI', createdAt: new Date().toISOString() },
      { _id: '3', message: 'User Mike shared Project Beta', createdAt: new Date().toISOString() },
    ];
    setRecentActivities(mockActivities);
  }, []);

  // Mock function to invite a team member (in a real app, this would open a form or send an email)
  const handleInviteTeamMember = () => {
    alert('Invite Team Member functionality coming soon!');
  };

  console.log('Rendering Home page');
  return (
    <div className="home-container">
      <h2>Home</h2>
      <p>Manage your projects and tasks here.</p>
      {/* Dashboard Section */}
      <div className="section glassmorphic dashboard">
        <h3>Dashboard</h3>
        <div className="metrics">
          <div className="metric">
            <h4>Total Projects</h4>
            <p>{totalProjects}</p>
          </div>
          <div className="metric">
            <h4>Active Projects</h4>
            <p>{activeProjects}</p>
          </div>
          <div className="metric">
            <h4>Join the Community</h4>
            <p>{totalUsers} users managing {totalPlatformProjects} projects</p>
          </div>
        </div>
      </div>
      {/* Recent Activity Feed */}
      <div className="section glassmorphic">
        <h3>Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p>No recent activity to display.</p>
        ) : (
          <ul className="activity-list">
            {recentActivities.map((activity) => (
              <li key={activity._id}>
                {activity.message} - {new Date(activity.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Quick Actions Section */}
      <div className="section glassmorphic quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="neumorphic" onClick={() => alert('Create Task functionality coming soon!')}>
            Create Task
          </button>
          <button className="neumorphic" onClick={() => navigate('/projects')}>
            View Tasks
          </button>
          <button className="neumorphic" onClick={handleInviteTeamMember}>
            Invite Team Member
          </button>
        </div>
      </div>
      {!showCreateProject && (
        <button className="neumorphic create-project-btn" onClick={() => setShowCreateProject(true)}>
          Create New Project!
        </button>
      )}
      {showCreateProject && (
        <div className="section glassmorphic">
          <h3>Create Project</h3>
          <form onSubmit={handleCreateProject} className="create-project-form">
            <div className="form-group">
              <label htmlFor="projectName">Project Name</label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectDescription">Description</label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectColor">Color</label>
              <input
                id="projectColor"
                type="color"
                value={projectColor}
                onChange={(e) => setProjectColor(e.target.value)}
              />
            </div>
            <div className="shared-users">
              <h4>Share With</h4>
              <div className="share-section">
                <input
                  type="email"
                  value={sharedEmail}
                  onChange={(e) => setSharedEmail(e.target.value)}
                  placeholder="Enter email"
                />
                <select
                  value={sharedRole}
                  onChange={(e) => setSharedRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  type="button"
                  className="neumorphic"
                  onClick={() => {
                    if (sharedEmail) {
                      handleAddSharedUser(sharedEmail, sharedRole);
                      setSharedEmail('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
              {sharedUsers.length > 0 && (
                <ul className="shared-users-list">
                  {sharedUsers.map((user) => (
                    <li key={user.email}>
                      {user.email} - {user.role}
                      <span
                        className="remove-user-icon"
                        onClick={() => handleRemoveSharedUser(user.email)}
                      >
                        ✕
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="neumorphic">Create</button>
              <button type="button" className="neumorphic" onClick={() => setShowCreateProject(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {!showCreateProject && (
        <>
          <h3>Your Projects</h3>
          {projects.length === 0 ? (
            <p>No projects found. Create a project to get started!</p>
          ) : (
            <div className="project-grid">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="project-card glassmorphic"
                  style={{
                    borderLeft: `4px solid ${project.color || '#3a3a50'}`,
                  }}
                >
                  <Link to={`/project/${project._id}`}>
                    <h4>{project.name}</h4>
                  </Link>
                  <p>{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;