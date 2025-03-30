import React from 'react';
import TransparencyDashboard from '../components/TransparencyDashboard';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
  status?: 'current' | 'past';
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
  const [sharedUserEmail, setSharedUserEmail] = React.useState('');
  const [sharedUserRole, setSharedUserRole] = React.useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');

  return (
    <div className="home-container">
      <h2>Dashboard</h2>
      <TransparencyDashboard projects={projects} />
      <div className="dashboarda">
        <div className="dashboard-card glassmorphic">
          <h4>Total Projects</h4>
          <p>{projects.length}</p>
        </div>
        <div className="dashboard-card glassmorphic">
          <h4>Current Projects</h4>
          <p>{projects.filter((p) => p.status === 'current').length}</p>
        </div>
        <div className="dashboard-card glassmorphic">
          <h4>Past Projects</h4>
          <p>{projects.filter((p) => p.status === 'past').length}</p>
        </div>
      </div>
      <div className="quick-actions">
        <button className="neumorphic" onClick={() => setShowCreateProject(true)}>
          Create Project
        </button>
      </div>
      {showCreateProject && (
        <div className="modal glassmorphic">
          <h3>Create a New Project</h3>
          <form onSubmit={handleCreateProject}>
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
                rows={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectColor">Project Color</label>
              <input
                id="projectColor"
                type="color"
                value={projectColor || '#3a3a50'}
                onChange={(e) => setProjectColor(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Share With</label>
              <div className="share-input">
                <input
                  type="email"
                  value={sharedUserEmail}
                  onChange={(e) => setSharedUserEmail(e.target.value)}
                  placeholder="Enter email"
                />
                <select
                  value={sharedUserRole}
                  onChange={(e) => setSharedUserRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                >
                  <option value="Admin">Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  type="button"
                  className="neumorphic"
                  onClick={() => {
                    if (sharedUserEmail) {
                      handleAddSharedUser(sharedUserEmail, sharedUserRole);
                      setSharedUserEmail('');
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
                      <button
                        type="button"
                        className="neumorphic remove-shared-user"
                        onClick={() => handleRemoveSharedUser(user.email)}
                      >
                        Remove
                      </button>
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
    </div>
  );
};

export default Home;