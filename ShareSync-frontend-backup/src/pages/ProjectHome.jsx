import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, Users, Edit, Send, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';
import './ProjectHome.css';

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, updateProject, inviteToProject, autoAssignTasks } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (isLoading) {
        console.log('ProjectHome - Waiting for AuthContext to finish loading');
        return;
      }

      if (!isAuthenticated) {
        console.log('ProjectHome - User not authenticated, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }

      if (!user || !user.email) {
        console.log('ProjectHome - User data not available');
        setError('User data not available. Please log in again.');
        navigate('/login', { replace: true });
        return;
      }

      try {
        console.log('ProjectHome - Fetching project with ID:', id);
        const projectData = user.projects.find((p) => p.id === id);
        if (!projectData) {
          console.log('ProjectHome - Project not found for ID:', id);
          setError('Project not found or you do not have access to this project.');
          return;
        }

        console.log('ProjectHome - Project fetched:', projectData);
        setProject(projectData);
        setTitle(projectData.title);
        setDescription(projectData.description);
        setStatus(projectData.status);
      } catch (err) {
        console.error('ProjectHome - Failed to fetch project:', err.message);
        setError('Failed to load project: ' + (err.message || 'An unexpected error occurred.'));
      }
    };

    fetchProject();
  }, [id, user, isAuthenticated, isLoading, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updates = {
        title,
        description,
        status,
      };
      console.log('ProjectHome - Saving project updates:', updates);
      const updatedProject = await updateProject(id, updates);
      setProject(updatedProject);
      setIsEditing(false);
      alert('Project updated successfully!');
    } catch (err) {
      console.error('ProjectHome - Failed to update project:', err.message);
      setError('Failed to update project: ' + (err.message || 'Please try again.'));
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError('Invite email is required.');
      return;
    }

    setIsInviting(true);
    setError('');

    try {
      console.log('ProjectHome - Sending invite to:', inviteEmail);
      await inviteToProject(id, inviteEmail);
      alert('Invite sent successfully!');
      setInviteEmail('');
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
    } catch (err) {
      console.error('ProjectHome - Failed to send invite:', err.message);
      setError('Failed to send invite: ' + (err.message || 'Please try again.'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      console.log('ProjectHome - Auto-assigning tasks for project:', id);
      await autoAssignTasks(id);
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      alert('Tasks auto-assigned successfully!');
    } catch (err) {
      console.error('ProjectHome - Failed to auto-assign tasks:', err.message);
      setError('Failed to auto-assign tasks: ' + (err.message || 'Please try again.'));
    }
  };

  if (isLoading) {
    console.log('ProjectHome - Rendering loading state');
    return <div className="project-home-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  if (authError || error) {
    console.log('ProjectHome - Rendering error state:', authError || error);
    return (
      <div className="project-home-container">
        <p className="text-red-500">{authError || error}</p>
        <Link to="/projects" className="text-holo-blue hover:underline">Return to Projects</Link>
      </div>
    );
  }

  if (!project) {
    console.log('ProjectHome - No project data available');
    return (
      <div className="project-home-container">
        <p className="text-red-500">Project not found.</p>
        <Link to="/projects" className="text-holo-blue hover:underline">Return to Projects</Link>
      </div>
    );
  }

  const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');

  return (
    <div className="project-home-container">
      <div className="project-home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full rounded-full text-center"
            />
          ) : (
            project.title
          )}
        </h1>
        <p className="text-holo-gray mb-4">
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full h-24 rounded-lg"
            />
          ) : (
            project.description
          )}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <div className="project-details card p-6 glassmorphic">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-holo-pink" />
              <span className="text-holo-gray">
                Status:{' '}
                {isEditing ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field rounded-full"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : (
                  project.status
                )}
              </span>
            </div>
            {isOwner && (
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn-primary rounded-full animate-glow"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-primary rounded-full bg-holo-bg-light"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="btn-primary rounded-full animate-glow flex items-center"
                  >
                    <Edit className="w-5 h-5 mr-2" /> Edit Project
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="members-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Members
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.members.map((member, index) => (
                <div key={index} className="member-item card p-4 glassmorphic">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.profilePicture}
                      alt={member.email}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-holo-blue">{member.email}</p>
                      <p className="text-holo-gray text-sm">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isOwner && (
              <form onSubmit={handleInvite} className="mt-4 flex items-center gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email to invite"
                  className="input-field w-full rounded-full"
                />
                <button
                  type="submit"
                  disabled={isInviting}
                  className="btn-primary rounded-full flex items-center animate-glow"
                >
                  {isInviting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" /> Invite
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="tasks-section">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-inter text-holo-blue flex items-center">
                <CheckSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Tasks
              </h2>
              {isOwner && (
                <button
                  onClick={handleAutoAssign}
                  className="btn-primary rounded-full flex items-center animate-glow"
                >
                  <Square className="w-5 h-5 mr-2" /> Auto-Assign Tasks
                </button>
              )}
            </div>
            {project.tasks.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No tasks yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.tasks.map((task, index) => (
                  <div key={index} className="task-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{task.title}</p>
                    <p className="text-holo-gray text-sm">Assigned to: {task.assignedTo}</p>
                    <p className="text-holo-gray text-sm">Status: {task.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;