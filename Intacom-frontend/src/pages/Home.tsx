import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface HomeProps {
  projects: Project[] | undefined;
  showCreateProject: boolean;
  setShowCreateProject: (value: boolean) => void;
  projectName: string;
  setProjectName: (value: string) => void;
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  projectColor: string;
  setProjectColor: (value: string) => void;
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
  const [shareEmail, setShareEmail] = React.useState('');
  const [shareRole, setShareRole] = React.useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');

  console.log('Rendering Home with projects:', projects);
  const safeProjects = Array.isArray(projects) ? projects : [];

  const handleAddShare = () => {
    if (shareEmail) {
      handleAddSharedUser(shareEmail, shareRole);
      setShareEmail('');
      setShareRole('Viewer');
    }
  };

  return (
    <div className="intacom-home">
      <h2>Home</h2>
      <p>Manage your projects and tasks here.</p>
      <button onClick={() => setShowCreateProject(true)} className="intacom-button">Create New Project</button>
      {showCreateProject && (
        <div className="intacom-modal">
          <div className="intacom-card">
            <h3>Create Project</h3>
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
                  required
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectColor">Color</label>
                <input
                  id="projectColor"
                  type="color"
                  value={projectColor}
                  onChange={(e) => setProjectColor(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Share With</label>
                <div className="share-section">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Enter email to share"
                  />
                  <select value={shareRole} onChange={(e) => setShareRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}>
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button type="button" className="intacom-button secondary" onClick={handleAddShare}>Add</button>
                </div>
                {sharedUsers.length > 0 && (
                  <div className="shared-users">
                    <h4>Shared With:</h4>
                    <ul>
                      {sharedUsers.map((sharedUser) => (
                        <li key={sharedUser.email}>
                          {sharedUser.email} ({sharedUser.role})
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="remove-user-icon"
                            onClick={() => handleRemoveSharedUser(sharedUser.email)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="submit" className="intacom-button">Create Project</button>
                <button type="button" className="intacom-button secondary" onClick={() => setShowCreateProject(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {safeProjects.length === 0 && !showCreateProject ? (
        <p>No projects yet. Create a project to get started!</p>
      ) : (
        !showCreateProject && (
          <div>
            <h3>Your Projects</h3>
            <div className="project-grid">
              {safeProjects.map((project) => (
                <div
                  key={project._id}
                  className="project-card"
                  style={{ background: project.color || '#3a3a50' }}
                >
                  <Link to={`/project/${project._id}`}>
                    <h4>{project.name}</h4>
                  </Link>
                  <p>{project.description || 'No description'}</p>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default Home;