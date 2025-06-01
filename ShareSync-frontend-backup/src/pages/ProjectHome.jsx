import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Folder, AlertCircle, Users, Edit, Send, CheckSquare, Square, FileText, MessageSquare, Settings, X, Image, BarChart, PieChart, Clock, Lightbulb, Bell } from 'lucide-react';
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
  const [contributions, setContributions] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 1000;

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
        let projectData = user.projects.find((p) => p.id === id);
        if (!projectData) {
          console.log('ProjectHome - Project not found in user data, fetching directly');
          const response = await axios.get(`http://localhost:3000/api/projects/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          projectData = response.data;
        }

        if (!projectData) {
          throw new Error('Project not found');
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
        if (retryCount < maxRetries) {
          console.log('ProjectHome - Retrying fetch, attempt:', retryCount + 1);
          setTimeout(() => setRetryCount(retryCount + 1), retryDelay);
        } else {
          setError('Failed to load project after multiple attempts: ' + (err.message || 'An unexpected error occurred.'));
        }
      }
    };

    const fetchContributions = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/projects/${id}/contributions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setContributions(response.data);
      } catch (err) {
        console.error('ProjectHome - Failed to fetch contributions:', err.message);
        setError('Failed to load contributions: ' + (err.message || 'Please try again.'));
      }
    };

    const fetchAiSuggestions = () => {
      const mockSuggestions = project?.tasks?.map((task, index) => ({
        taskId: task.id,
        title: task.title,
        priority: index % 2 === 0 ? 'High' : 'Medium',
        reason: index % 2 === 0 ? 'Due soon' : 'High impact',
      })) || [];
      setAiSuggestions(mockSuggestions);
    };

    fetchProject();
    fetchContributions();
    fetchAiSuggestions();

    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      console.log('ProjectHome - Connected to socket.io');
      socket.emit('join_project', id);
    });

    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('notification', (notification) => {
      const priority = notification.message.includes('message') || notification.message.includes('task') ? 'high' : 'normal';
      setNotifications((prev) => [...prev, { ...notification, priority }].slice(-5));
    });

    return () => {
      socket.off('message');
      socket.off('notification');
      socket.disconnect();
    };
  }, [id, user, isAuthenticated, isLoading, navigate, project, retryCount]);

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
        <Link to="/projects" className="text-holo-blue hover:underline focus:outline-none focus:ring-2 focus:ring-holo-blue">Return to Projects</Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-home-container">
        <p className="text-red-500">Project not found.</p>
        <Link to="/projects" className="text-holo-blue hover:underline focus:outline-none focus:ring-2 focus:ring-holo-blue">Return to Projects</Link>
      </div>
    );
  }

  const isOwner = project.members.some((m) => m.email === user.email && m.role === 'Owner');
  const filteredActivityLog = activityFilter === 'All' ? project.activityLog : project.activityLog.filter(log => log.action === activityFilter.toLowerCase());
  const timelineEvents = project.activityLog.filter(log => ['create', 'task-create', 'task-update', 'post'].includes(log.action)).slice(-5);

  return (
    <div className="project-home-container">
      <div className="project-home-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full rounded-full text-center focus:outline-none focus:ring-2 focus:ring-holo-blue"
              aria-label="Edit project title"
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
              className="input-field w-full h-24 rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-blue"
              aria-label="Edit project description"
            />
          ) : (
            project.description
          )}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <div className="project-details card p-6 glassmorphic">
          <div className="notifications-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Real-Time Notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No recent notifications.
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.sort((a, b) => (b.priority === 'high' ? 1 : -1)).map((notification, index) => (
                  <div key={index} className={`p-2 rounded ${notification.priority === 'high' ? 'bg-holo-pink bg-opacity-30' : 'bg-holo-pink bg-opacity-20'}`}>
                    <p className="text-holo-gray text-sm">{notification.message}</p>
                    <p className="text-holo-gray text-xs">{new Date(notification.timestamp).toLocaleString()}</p>
                    {notification.priority === 'high' && (
                      <p className="text-holo-pink text-xs font-bold">Priority: High</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="transparency-dashboard mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Transparency Dashboard
            </h2>
            {Object.keys(contributions).length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No contributions yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(contributions).map(([email, stats]) => (
                  <div key={email} className="contribution-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{email}</p>
                    <p className="text-holo-gray text-sm">Tasks Completed: {stats.tasksCompleted} (Mock: {stats.tasksCompleted * 10}% of total)</p>
                    <p className="text-holo-gray text-sm">Posts Created: {stats.postsCreated}</p>
                    <p className="text-holo-gray text-sm">Comments Made: {stats.commentsMade}</p>
                    <p className="text-holo-gray text-sm">Files Uploaded: {stats.filesUploaded}</p>
                    <p className="text-holo-gray text-sm">Suggestions Made: {stats.suggestionsMade}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="timeline-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Project Timeline
            </h2>
            {timelineEvents.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No timeline events yet.
              </p>
            ) : (
              <div className="space-y-4">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="timeline-item card p-4 glassmorphic">
                    <p className="text-holo-gray">{event.message}</p>
                    <p className="text-holo-gray text-sm">By: {event.user}</p>
                    <p className="text-holo-gray text-sm">{new Date(event.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-holo-pink" aria-hidden="true" />
              <span className="text-holo-gray">
                Category:{' '}
                {isEditing ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Select project category"
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
                    className="input-field rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Select project status"
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
                        className="btn-primary rounded-full animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
                        aria-label="Save project changes"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn-primary rounded-full bg-holo-bg-light focus:outline-none focus:ring-2 focus:ring-holo-blue"
                        aria-label="Cancel editing"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="btn-primary rounded-full animate-glow flex items-center focus:outline-none focus:ring-2 focus:ring-holo-blue"
                      aria-label="Edit project"
                    >
                      <Edit className="w-5 h-5 mr-2" aria-hidden="true" /> Edit Project
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="btn-primary rounded-full animate-glow flex items-center focus:outline-none focus:ring-2 focus:ring-holo-blue"
                aria-label="Open project settings"
              >
                <Settings className="w-5 h-5 mr-2" aria-hidden="true" /> Settings
              </button>
            </div>
          </div>

          <div className="members-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Members
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.members.map((member, index) => (
                <div key={index} className="member-item card p-4 glassmorphic">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.profilePicture}
                      alt={`${member.email}'s profile picture`}
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
                  className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  disabled={isInviting}
                  aria-label="Email address to invite"
                />
                <button
                  type="submit"
                  disabled={isInviting}
                  className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label={isInviting ? "Sending invitation" : "Send invitation"}
                >
                  {isInviting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" aria-hidden="true" /> Invite
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="ai-suggestions-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> AI Task Prioritization
            </h2>
            {aiSuggestions.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No tasks to prioritize.
              </p>
            ) : (
              <div className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="ai-suggestion-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{suggestion.title}</p>
                    <p className="text-holo-gray text-sm">Priority: {suggestion.priority}</p>
                    <p className="text-holo-gray text-sm">Reason: {suggestion.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="posts-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Posts
            </h2>
            <form onSubmit={handleCreatePost} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={newPost.type}
                  onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                  className="input-field rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Select post type"
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
                  className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label={newPost.type === 'picture' ? 'Enter image URL' : 'Enter post content'}
                />
                <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Create post">
                  <Send className="w-5 h-5 mr-2" aria-hidden="true" /> Post
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
                      className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                      aria-label={`Poll option ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </form>
            {project.posts.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No posts yet.
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
                      <img src={post.content} alt="Post content" className="w-full h-48 object-cover rounded-lg mb-2" />
                    ) : (
                      <p className="text-holo-gray">{post.content}</p>
                    )}
                    {post.type === 'poll' && (
                      <div className="mt-2">
                        {post.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <button className="btn-primary rounded-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label={`Vote for ${option}`}>Vote</button>
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
                <CheckSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Tasks
              </h2>
              {isOwner && (
                <button
                  onClick={handleAutoAssign}
                  className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Auto-assign tasks"
                >
                  <Square className="w-5 h-5 mr-2" aria-hidden="true" /> Auto-Assign Tasks
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
                    className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Task title"
                  />
                  <input
                    type="text"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Description (optional)"
                    className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Task description"
                  />
                  <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Add task">
                    <CheckSquare className="w-5 h-5 mr-2" aria-hidden="true" /> Add Task
                  </button>
                </div>
              </form>
            )}
            {project.tasks.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No tasks yet.
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
                          className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                          aria-label={`Add subtask for ${task.title}`}
                        />
                        <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Add subtask">
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
              <FileText className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Files
            </h2>
            <form onSubmit={handleUploadFile} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFile.name}
                  onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                  placeholder="File name"
                  className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="File name"
                />
                <input
                  type="text"
                  value={newFile.url}
                  onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                  placeholder="File URL"
                  className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="File URL"
                />
                <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label={isOwner ? "Upload file" : "Request file upload"}>
                  <FileText className="w-5 h-5 mr-2" aria-hidden="true" /> {isOwner ? 'Upload' : 'Request Upload'}
                </button>
              </div>
            </form>
            {project.files.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No files yet.
              </p>
            ) : (
              <div className="space-y-4">
                {project.files.map((file, index) => (
                  <div key={index} className="file-item card p-4 glassmorphic">
                    <p className="text-holo-blue">{file.name}</p>
                    <p className="text-holo-gray text-sm">Uploaded by: {file.uploadedBy}</p>
                    <p className="text-holo-gray text-sm">Status: {file.status}</p>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-holo-blue hover:underline focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label={`View file ${file.name}`}>View File</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="teams-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Teams
            </h2>
            {isOwner && (
              <form onSubmit={handleCreateTeam} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Team name"
                    className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Team name"
                  />
                  <input
                    type="text"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Description"
                    className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                    aria-label="Team description"
                  />
                  <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Create team">
                    <Users className="w-5 h-5 mr-2" aria-hidden="true" /> Create Team
                  </button>
                </div>
                <select
                  multiple
                  value={newTeam.members}
                  onChange={(e) => setNewTeam({ ...newTeam, members: Array.from(e.target.selectedOptions, option => option.value) })}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Select team members"
                >
                  {project.members.map((member, index) => (
                    <option key={index} value={member.email}>{member.email}</option>
                  ))}
                </select>
              </form>
            )}
            {project.teams.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No teams yet.
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
              <MessageSquare className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Project Chat
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
                className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                aria-label="Type a message"
              />
              <button
                onClick={handleSendMessage}
                className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 mr-2" aria-hidden="true" /> Send
              </button>
            </div>
          </div>

          <div className="activity-log-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Activity Log
            </h2>
            <div className="flex gap-2 mb-4">
              {['All', 'Create', 'Update', 'Invite', 'Post', 'Comment', 'Task-Create', 'Task-Update'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`btn-primary rounded-full px-3 py-1 ${activityFilter === filter ? 'bg-holo-pink' : ''} focus:outline-none focus:ring-2 focus:ring-holo-blue`}
                  aria-label={`Filter activity by ${filter}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            {filteredActivityLog.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No activity yet.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredActivityLog.map((log, index) => (
                  <div key={index} className="log-item card p-4 glassmorphic">
                    <p className="text-holo-gray">{log.message}</p>
                    <p className="text-holo-gray text-sm">By: {log.user}</p>
                    <p className="text-holo-gray text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="suggestions-section mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-holo-pink animate-pulse" aria-hidden="true" /> Suggestions
            </h2>
            <form onSubmit={handleSubmitSuggestion} className="mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  placeholder="Suggest a change..."
                  className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Suggest a change"
                />
                <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Submit suggestion">
                  <Send className="w-5 h-5 mr-2" aria-hidden="true" /> Submit
                </button>
              </div>
            </form>
            {project.suggestions.length === 0 ? (
              <p className="text-holo-gray flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" aria-hidden="true" /> No suggestions yet.
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
              <button onClick={() => setShowSettings(false)} className="text-holo-gray hover:text-holo-blue z-70 focus:outline-none focus:ring-2 focus:ring-holo-blue" aria-label="Close settings">
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.checked })}
                  className="form-checkbox focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Enable email notifications"
                />
                <span className="text-holo-gray">Email Notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, sms: e.target.checked })}
                  className="form-checkbox focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Enable SMS notifications"
                />
                <span className="text-holo-gray">SMS Notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.inApp}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, inApp: e.target.checked })}
                  className="form-checkbox focus:outline-none focus:ring-2 focus:ring-holo-blue"
                  aria-label="Enable in-app notifications"
                />
                <span className="text-holo-gray">In-App Notifications</span>
              </label>
              <button
                onClick={handleUpdateNotificationSettings}
                className="btn-primary rounded-full w-full animate-glow focus:outline-none focus:ring-2 focus:ring-holo-blue"
                aria-label="Save notification settings"
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