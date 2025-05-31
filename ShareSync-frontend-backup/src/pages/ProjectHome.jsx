import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Folder, AlertCircle, Users, Edit, Send, CheckSquare, Square, FileText, MessageSquare, Settings, X, Image, BarChart } from 'lucide-react';
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
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [newPost, setNewPost] = useState({ type: 'announcement', content: '', options: ['', ''] });
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [newSubtask, setNewSubtask] = useState({ taskId: '', title: '' });
  const [newFile, setNewFile] = useState({ name: '', url: '' });
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: [] });
  const [newSuggestion, setNewSuggestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activityFilter, setActivityFilter] = useState('All');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({ email: true, sms: true, inApp: true });

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
        setCategory(projectData.category);
        setStatus(projectData.status);
        setNotificationSettings(projectData.settings?.notifications || { email: true, sms: true, inApp: true });
      } catch (err) {
        console.error('ProjectHome - Failed to fetch project:', err.message);
        setError('Failed to load project: ' + (err.message || 'An unexpected error occurred.'));
      }
    };

    fetchProject();

    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      console.log('ProjectHome - Connected to socket.io');
      socket.emit('join_project', id);
    });

    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('message');
      socket.disconnect();
    };
  }, [id, user, isAuthenticated, isLoading, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updates = { title, description, category, status };
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/posts`, newPost, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setNewPost({ type: 'announcement', content: '', options: ['', ''] });
    } catch (err) {
      setError('Failed to create post: ' + (err.message || 'Please try again.'));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setNewTask({ title: '', description: '' });
    } catch (err) {
      setError('Failed to create task: ' + (err.message || 'Please try again.'));
    }
  };

  const handleCreateSubtask = async (e, taskId) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks/${taskId}/subtasks`, { title: newSubtask.title }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setNewSubtask({ taskId: '', title: '' });
    } catch (err) {
      setError('Failed to create subtask: ' + (err.message || 'Please try again.'));
    }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/files`, newFile, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setNewFile({ name: '', url: '' });
    } catch (err) {
      setError('Failed to upload file: ' + (err.message || 'Please try again.'));
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/teams`, newTeam, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setNewTeam({ name: '', description: '', members: [] });
    } catch (err) {
      setError('Failed to create team: ' + (err.message || 'Please try again.'));
    }
  };

  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/suggestions`, { content: newSuggestion }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setNewSuggestion('');
    } catch (err) {
      setError('Failed to submit suggestion: ' + (err.message || 'Please try again.'));
    }
  };

  const handleSendMessage = () => {
    const socket = io('http://localhost:3000');
    socket.emit('message', { projectId: id, text: newMessage, user: user.email });
    setNewMessage('');
  };

  const handleUpdateNotificationSettings = async () => {
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${id}/settings/notifications`, notificationSettings, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedUser = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const updatedProject = updatedUser.data.projects.find((p) => p.id === id);
      setProject(updatedProject);
      setShowSettings(false);
    } catch (err) {
      setError('Failed to update notification settings: ' + (err.message || 'Please try again.'));
    }
  };

  if (isLoading) {
    return <div className="project-home-container"><p className="text-holo-gray">Loading...</p></div>;
  }

  if (authError || error) {
    return (
      <div className="project-home-container">
        <p className="text-red-500">{authError || error}</p>
        <Link to="/projects" className="text-holo-blue hover:underline">Return to Projects</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-home-container">
        <p className="text-red-500">Project not found.</p>
        <Link to="/projects" className="text-holo-blue hover:underline">Return to Projects</Link>
      </div>
    );
  }

  const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
  const filteredActivityLog = activityFilter === 'All' ? project.activityLog : project.activityLog.filter(log => log.action === activityFilter.toLowerCase());

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
                Category:{' '}
                {isEditing ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field rounded-full"
                  >
                    <option value="School">School</option>
                    <option value="Job">Job</option>
                    <option value="Personal">Personal</option>
                  </select>
                ) : (
                  project.category
                )}
              </span>
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
            <div className="flex gap-4">
              {isOwner && (
                <>
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
                </>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="btn-primary rounded-full animate-glow flex items-center"
              >
                <Settings className="w-5 h-5 mr-2" /> Settings
              </button>
            </div>
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

          <div className="posts-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Posts
            </h2>
            <form onSubmit={handleCreatePost} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                  className="input-field rounded-full"
                >
                  <option value="announcement">Announcement</option>
                  <option value="poll">Poll</option>
                  <option value="picture">Picture</option>
                </select>
                <input
                  type="text"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder={newPost.type === 'picture' ? 'Image URL' : 'Post content'}
                  className="input-field w-full rounded-full"
                />
                <button type="submit" className="btn-primary rounded-full flex items-center animate-glow">
                  <Send className="w-5 h-5 mr-2" /> Post
                </button>
              </div>
              {newPost.type === 'poll' && (
                <div className="flex gap-2">
                  {newPost.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newPost.options];
                        newOptions[index] = e.target.value;
                        setNewPost({ ...newPost, options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                      className="input-field w-full rounded-full"
                    />
                  ))}
                </div>
              )}
            </form>
            {project.posts.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No posts yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.posts.map((post, index) => (
                  <div key={index} className="post-item card p-4 glassmorphic">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-holo-blue">{post.author}</p>
                      <p className="text-holo-gray text-sm">{new Date(post.timestamp).toLocaleString()}</p>
                    </div>
                    {post.type === 'picture' ? (
                      <img src={post.content} alt="Post" className="w-full h-48 object-cover rounded-lg mb-2" />
                    ) : (
                      <p className="text-holo-gray">{post.content}</p>
                    )}
                    {post.type === 'poll' && (
                      <div className="mt-2">
                        {post.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <button className="btn-primary rounded-full px-2 py-1 text-sm">Vote</button>
                            <span>{option}</span>
                            <span>({post.votes.filter(v => v.option === option).length} votes)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tasks-section mb-6">
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
            {isOwner && (
              <form onSubmit={handleCreateTask} className="mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                    className="input-field w-full rounded-full"
                  />
                  <input
                    type="text"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="input-field w-full rounded-full"
                  />
                  <button type="submit" className="btn-primary rounded-full flex items-center animate-glow">
                    <CheckSquare className="w-5 h-5 mr-2" /> Add Task
                  </button>
                </div>
              </form>
            )}
            {project.tasks.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No tasks yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.tasks.map((task, index) => (
                  <div key={index} className="task-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{task.title}</p>
                    <p className="text-holo-gray text-sm">Description: {task.description || 'None'}</p>
                    <p className="text-holo-gray text-sm">Assigned to: {task.assignedTo}</p>
                    <p className="text-holo-gray text-sm">Status: {task.status}</p>
                    {isOwner && (
                      <form
                        onSubmit={(e) => handleCreateSubtask(e, task.id)}
                        className="mt-2 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={newSubtask.taskId === task.id ? newSubtask.title : ''}
                          onChange={(e) => setNewSubtask({ taskId: task.id, title: e.target.value })}
                          placeholder="Subtask title"
                          className="input-field w-full rounded-full"
                        />
                        <button type="submit" className="btn-primary rounded-full flex items-center animate-glow">
                          Add Subtask
                        </button>
                      </form>
                    )}
                    {task.subtasks.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {task.subtasks.map((subtask, subIndex) => (
                          <div key={subIndex} className="subtask-item p-2 bg-holo-bg-light rounded">
                            <p className="text-holo-gray text-sm">{subtask.title}</p>
                            <p className="text-holo-gray text-sm">Status: {subtask.status}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="files-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Files
            </h2>
            <form onSubmit={handleUploadFile} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFile.name}
                  onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                  placeholder="File name"
                  className="input-field w-full rounded-full"
                />
                <input
                  type="text"
                  value={newFile.url}
                  onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                  placeholder="File URL"
                  className="input-field w-full rounded-full"
                />
                <button type="submit" className="btn-primary rounded-full flex items-center animate-glow">
                  <FileText className="w-5 h-5 mr-2" /> {isOwner ? 'Upload' : 'Request Upload'}
                </button>
              </div>
            </form>
            {project.files.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No files yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.files.map((file, index) => (
                  <div key={index} className="file-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{file.name}</p>
                    <p className="text-holo-gray text-sm">Uploaded by: {file.uploadedBy}</p>
                    <p className="text-holo-gray text-sm">Status: {file.status}</p>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-holo-blue hover:underline">View File</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="teams-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Teams
            </h2>
            {isOwner && (
              <form onSubmit={handleCreateTeam} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Team name"
                    className="input-field w-full rounded-full"
                  />
                  <input
                    type="text"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Description"
                    className="input-field w-full rounded-full"
                  />
                  <button type="submit" className="btn-primary rounded-full flex items-center animate-glow">
                    <Users className="w-5 h-5 mr-2" /> Create Team
                  </button>
                </div>
                <select
                  multiple
                  value={newTeam.members}
                  onChange={(e) => setNewTeam({ ...newTeam, members: Array.from(e.target.selectedOptions, option => option.value) })}
                  className="input-field w-full rounded-lg"
                >
                  {project.members.map((member, index) => (
                    <option key={index} value={member.email}>{member.email}</option>
                  ))}
                </select>
              </form>
            )}
            {project.teams.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No teams yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.teams.map((team, index) => (
                  <div key={index} className="team-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{team.name}</p>
                    <p className="text-holo-gray text-sm">Description: {team.description}</p>
                    <p className="text-holo-gray text-sm">Members: {team.members.map(m => m.email).join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Project Chat
            </h2>
            <div className="messages card p-4 glassmorphic max-h-60 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <strong className="text-holo-blue">{msg.user}:</strong> {msg.text}
                  <span className="text-holo-gray text-xs ml-2">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="input-field w-full rounded-full"
              />
              <button
                onClick={handleSendMessage}
                className="btn-primary rounded-full flex items-center animate-glow"
              >
                <Send className="w-5 h-5 mr-2" /> Send
              </button>
            </div>
          </div>

          <div className="activity-log-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Activity Log
            </h2>
            <div className="flex gap-2 mb-4">
              {['All', 'Create', 'Update', 'Invite', 'Post', 'Comment', 'Task-Create', 'Task-Update'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`btn-primary rounded-full px-3 py-1 ${activityFilter === filter ? 'bg-holo-pink' : ''}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            {filteredActivityLog.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No activity yet.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredActivityLog.map((log, index) => (
                  <div key={index} className="log-item card p-4 glassmorphic">
                    <p className="text-holo-gray">{log.message}</p>
                    <p className="text-holo-gray text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="suggestions-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Suggestions
            </h2>
            <form onSubmit={handleSubmitSuggestion} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  placeholder="Suggest a change..."
                  className="input-field w-full rounded-full"
                />
                <button type="submit" className="btn-primary rounded-full flex items-center animate-glow">
                  <Send className="w-5 h-5 mr-2" /> Submit
                </button>
              </div>
            </form>
            {project.suggestions.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No suggestions yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item card p-4 glassmorphic">
                    <p className="text-holo-gray">{suggestion.content}</p>
                    <p className="text-holo-gray text-sm">By: {suggestion.author}</p>
                    <p className="text-holo-gray text-sm">{new Date(suggestion.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-holo-bg-light p-6 rounded-lg max-w-md w-full glassmorphic relative z-[60]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-inter text-holo-blue">Notification Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-holo-gray hover:text-holo-blue z-70">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.checked })}
                  className="form-checkbox"
                />
                <span className="text-holo-gray">Email Notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, sms: e.target.checked })}
                  className="form-checkbox"
                />
                <span className="text-holo-gray">SMS Notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.inApp}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, inApp: e.target.checked })}
                  className="form-checkbox"
                />
                <span className="text-holo-gray">In-App Notifications</span>
              </label>
              <button
                onClick={handleUpdateNotificationSettings}
                className="btn-primary rounded-full w-full animate-glow"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHome;