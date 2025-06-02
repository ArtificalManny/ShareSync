import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Folder, BarChart2, Users, FileText, Plus, Edit, Send, ThumbsUp, Share2, Filter, Settings, X, ChevronDown, ChevronUp, AlertCircle, Award } from 'lucide-react';
import './ProjectHome.css';

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', status: '' });
  const [newPost, setNewPost] = useState({ type: 'announcement', content: '', options: [] });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });
  const [newSubtask, setNewSubtask] = useState({ taskId: '', title: '' });
  const [newFile, setNewFile] = useState({ name: '', url: '' });
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: [] });
  const [newSuggestion, setNewSuggestion] = useState('');
  const [taskComment, setTaskComment] = useState({ taskId: '', text: '' });
  const [activityFilter, setActivityFilter] = useState('All');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({ email: true, sms: true, inApp: true, taskUpdates: true, fileUpdates: true, teamUpdates: true });
  const [metrics, setMetrics] = useState({ totalTasks: 0, completedTasks: 0, activeMembers: 0, pendingFiles: 0 });
  const [expandedTasks, setExpandedTasks] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/api/projects/${id}`, { timeout: 15000 });
        setProject(response.data);
        setEditForm({
          title: response.data.title,
          description: response.data.description,
          category: response.data.category,
          status: response.data.status,
        });
        setNotificationSettings(response.data.settings.notifications || { email: true, sms: true, inApp: true, taskUpdates: true, fileUpdates: true, teamUpdates: true });

        // Calculate metrics
        const totalTasks = response.data.tasks?.length || 0;
        const completedTasks = response.data.tasks?.filter(t => t.status === 'Completed').length || 0;
        const activeMembers = response.data.members?.length || 0;
        const pendingFiles = response.data.files?.filter(f => f.status === 'Pending Approval').length || 0;

        setMetrics({ totalTasks, completedTasks, activeMembers, pendingFiles });

        // Fetch leaderboard
        const leaderboardResponse = await axios.get(`http://localhost:3000/api/projects/${id}/leaderboard`);
        setLeaderboard(leaderboardResponse.data);
      } catch (err) {
        setError('Failed to load project: ' + (err.response?.data?.message || err.message));
      }
    };

    fetchProject();
  }, [id, isLoading, isAuthenticated, navigate]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/projects/${id}`, { timeout: 15000 });
      setProject(response.data);
      setEditForm({
        title: response.data.title,
        description: response.data.description,
        category: response.data.category,
        status: response.data.status,
      });

      const totalTasks = response.data.tasks?.length || 0;
      const completedTasks = response.data.tasks?.filter(t => t.status === 'Completed').length || 0;
      const activeMembers = response.data.members?.length || 0;
      const pendingFiles = response.data.files?.filter(f => f.status === 'Pending Approval').length || 0;

      setMetrics({ totalTasks, completedTasks, activeMembers, pendingFiles });

      // Fetch leaderboard
      const leaderboardResponse = await axios.get(`http://localhost:3000/api/projects/${id}/leaderboard`);
      setLeaderboard(leaderboardResponse.data);
    } catch (err) {
      setError('Failed to load project: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${id}`, editForm);
      setProject(response.data);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update project: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const postData = { ...newPost };
      if (newPost.type === 'poll' && newPost.options.length === 0) {
        postData.options = ['Option 1', 'Option 2'];
      }
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/posts`, postData);
      setProject(prev => ({
        ...prev,
        posts: [...prev.posts, response.data],
      }));
      setNewPost({ type: 'announcement', content: '', options: [] });
    } catch (err) {
      setError('Failed to create post: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks`, newTask);
      setProject(prev => ({
        ...prev,
        tasks: [...prev.tasks, response.data],
      }));
      setNewTask({ title: '', description: '', assignedTo: '' });
    } catch (err) {
      setError('Failed to create task: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubtaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks/${newSubtask.taskId}/subtasks`, { title: newSubtask.title });
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === newSubtask.taskId ? { ...task, subtasks: [...task.subtasks, response.data] } : task
        ),
      }));
      setNewSubtask({ taskId: '', title: '' });
    } catch (err) {
      setError('Failed to create subtask: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${id}/tasks/${taskId}`, { status });
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === taskId ? response.data : task),
      }));
    } catch (err) {
      setError('Failed to update task status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTaskCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks/${taskComment.taskId}/comments`, { text: taskComment.text });
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskComment.taskId ? { ...task, comments: [...task.comments, response.data] } : task
        ),
      }));
      setTaskComment({ taskId: '', text: '' });
    } catch (err) {
      setError('Failed to add comment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTaskLike = async (taskId) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks/${taskId}/like`);
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === taskId ? response.data : task),
      }));
    } catch (err) {
      setError('Failed to like task: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTaskShare = async (taskId) => {
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/tasks/${taskId}/share`);
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => task.id === taskId ? response.data : task),
      }));
    } catch (err) {
      setError('Failed to share task: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/files`, newFile);
      setProject(prev => ({
        ...prev,
        files: [...prev.files, response.data],
      }));
      setNewFile({ name: '', url: '' });
    } catch (err) {
      setError('Failed to upload file: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFileApproval = async (fileId, status) => {
    try {
      const response = await axios.put(`http://localhost:3000/api/projects/${id}/files/${fileId}/approve`, { status });
      setProject(prev => ({
        ...prev,
        files: prev.files.map(file => file._id === fileId ? response.data : file),
      }));
    } catch (err) {
      setError('Failed to update file status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/teams`, newTeam);
      setProject(prev => ({
        ...prev,
        teams: [...prev.teams, response.data],
      }));
      setNewTeam({ name: '', description: '', members: [] });
    } catch (err) {
      setError('Failed to create team: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3000/api/projects/${id}/suggestions`, { content: newSuggestion });
      setProject(prev => ({
        ...prev,
        suggestions: [...prev.suggestions, response.data],
      }));
      setNewSuggestion('');
    } catch (err) {
      setError('Failed to add suggestion: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3000/api/projects/${id}/invite`, { email: inviteEmail });
      setInviteEmail('');
      setShowInviteModal(false);
      alert('User invited successfully!');
    } catch (err) {
      setError('Failed to invite user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3000/api/projects/${id}/settings/notifications`, notificationSettings);
      setProject(prev => ({
        ...prev,
        settings: { ...prev.settings, notifications: notificationSettings },
      }));
      setShowSettingsModal(false);
      alert('Notification settings updated!');
    } catch (err) {
      setError('Failed to update settings: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  if (isLoading) {
    return (
      <div className="project-home-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading project"></div>
        <span className="text-neon-magenta text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="project-home-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg font-orbitron mb-4">{authError || error}</p>
          <Link to="/projects" className="text-neon-magenta hover:underline text-base font-orbitron focus:outline-none focus:ring-2 focus:ring-holo-silver">Return to Projects</Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-home-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading project"></div>
        <span className="text-cyber-teal text-xl font-orbitron ml-4">Loading project...</span>
      </div>
    );
  }

  const isOwner = project.members.some(m => m.email === user.email && m.role === 'Owner');
  const filteredActivityLog = activityFilter === 'All' ? project.activityLog : project.activityLog.filter(log => log.action === activityFilter.toLowerCase());

  return (
    <div className="project-home-container">
      <div className="project-header py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-orbitron font-bold text-neon-magenta mb-4 animate-text-glow">{project.title}</h1>
        <p className="text-cyber-teal text-lg font-inter mb-4">{project.description}</p>
        <p className="text-light-text font-inter">Category: {project.category} | Status: {project.status}</p>
        <div className="flex justify-center gap-4 mt-4">
          {isOwner && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
              aria-label="Edit project"
            >
              <Edit className="w-5 h-5 mr-2" aria-hidden="true" /> Edit Project
            </button>
          )}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
            aria-label="Notification settings"
          >
            <Settings className="w-5 h-5 mr-2" aria-hidden="true" /> Notification Settings
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 mb-4 text-center font-orbitron">{error}</p>}

        {/* Edit Project Modal */}
        {isEditing && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content card p-6 glassmorphic w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta">Edit Project</h2>
                <button onClick={() => setIsEditing(false)} className="text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleEditProject}>
                <div className="mb-4">
                  <label htmlFor="editTitle" className="block text-cyber-teal mb-2 font-inter">Title</label>
                  <input
                    type="text"
                    id="editTitle"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    aria-label="Project Title"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="editDescription" className="block text-cyber-teal mb-2 font-inter">Description</label>
                  <textarea
                    id="editDescription"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    rows="3"
                    aria-label="Project Description"
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label htmlFor="editCategory" className="block text-cyber-teal mb-2 font-inter">Category</label>
                  <select
                    id="editCategory"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    aria-label="Project Category"
                  >
                    <option value="Personal">Personal</option>
                    <option value="School">School</option>
                    <option value="Job">Job</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="editStatus" className="block text-cyber-teal mb-2 font-inter">Status</label>
                  <select
                    id="editStatus"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    aria-label="Project Status"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full rounded-full flex items-center justify-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                  aria-label="Save changes"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notification Settings Modal */}
        {showSettingsModal && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content card p-6 glassmorphic w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta">Notification Settings</h2>
                <button onClick={() => setShowSettingsModal(false)} className="text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSettingsSubmit}>
                <div className="mb-4">
                  <label className="flex items-center text-cyber-teal font-inter">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.checked })}
                      className="mr-2"
                    />
                    Email Notifications
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center text-cyber-teal font-inter">
                    <input
                      type="checkbox"
                      checked={notificationSettings.sms}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, sms: e.target.checked })}
                      className="mr-2"
                    />
                    SMS Notifications
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center text-cyber-teal font-inter">
                    <input
                      type="checkbox"
                      checked={notificationSettings.inApp}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, inApp: e.target.checked })}
                      className="mr-2"
                    />
                    In-App Notifications
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center text-cyber-teal font-inter">
                    <input
                      type="checkbox"
                      checked={notificationSettings.taskUpdates}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, taskUpdates: e.target.checked })}
                      className="mr-2"
                    />
                    Task Updates
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center text-cyber-teal font-inter">
                    <input
                      type="checkbox"
                      checked={notificationSettings.fileUpdates}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, fileUpdates: e.target.checked })}
                      className="mr-2"
                    />
                    File Updates
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center text-cyber-teal font-inter">
                    <input
                      type="checkbox"
                      checked={notificationSettings.teamUpdates}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, teamUpdates: e.target.checked })}
                      className="mr-2"
                    />
                    Team Updates
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full rounded-full flex items-center justify-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                  aria-label="Save settings"
                >
                  Save Settings
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Metrics Dashboard */}
        <div className="metrics-dashboard mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-holo-silver" aria-hidden="true" /> Project Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Total Tasks</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.totalTasks}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Completed Tasks</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.completedTasks}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Active Members</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.activeMembers}</p>
            </div>
            <div className="metric-card p-4 bg-cyber-teal bg-opacity-20 rounded-lg">
              <p className="text-light-text font-inter">Pending Files</p>
              <p className="text-2xl font-orbitron text-neon-magenta">{metrics.pendingFiles}</p>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Project Leaderboard
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

        {/* Team Activity */}
        <div className="team-activity-section mb-8 card p-6 glassmorphic">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta">Team Activity</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-holo-silver" />
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="input-field rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Filter activity"
              >
                <option value="All">All</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Invite">Invite</option>
                <option value="Task-Create">Task Create</option>
                <option value="Task-Status-Update">Task Status Update</option>
                <option value="Task-Comment">Task Comment</option>
                <option value="File-Upload">File Upload</option>
                <option value="File-Approval">File Approval</option>
                <option value="Team-Create">Team Create</option>
                <option value="Suggestion">Suggestion</option>
              </select>
            </div>
          </div>
          {filteredActivityLog.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No recent activity.
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {filteredActivityLog.map((log, index) => (
                <li key={index} className="text-light-text font-inter">
                  {log.message} - {new Date(log.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Announcements */}
        <div className="announcements-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4">Announcements</h2>
          <form onSubmit={handlePostSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="postType" className="block text-cyber-teal mb-2 font-inter">Post Type</label>
              <select
                id="postType"
                value={newPost.type}
                onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Post Type"
              >
                <option value="announcement">Announcement</option>
                <option value="poll">Poll</option>
                <option value="picture">Picture</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="postContent" className="block text-cyber-teal mb-2 font-inter">Content</label>
              <textarea
                id="postContent"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                placeholder={newPost.type === 'picture' ? 'Enter image URL' : 'Enter your post content'}
                rows="3"
                aria-label="Post Content"
              ></textarea>
            </div>
            {newPost.type === 'poll' && (
              <div className="mb-4">
                <label className="block text-cyber-teal mb-2 font-inter">Poll Options (comma-separated)</label>
                <input
                  type="text"
                  value={newPost.options.join(', ')}
                  onChange={(e) => setNewPost({ ...newPost, options: e.target.value.split(',').map(opt => opt.trim()) })}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                  placeholder="Option 1, Option 2, ..."
                  aria-label="Poll Options"
                />
              </div>
            )}
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
              aria-label="Create Post"
            >
              <Send className="w-5 h-5 mr-2" aria-hidden="true" /> Create Post
            </button>
          </form>
          {project.posts.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No posts yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.posts.map((post, index) => (
                <div key={index} className="post card p-4 glassmorphic">
                  <p className="text-light-text font-inter">{post.content}</p>
                  {post.type === 'picture' && (
                    <img src={post.content} alt="Post content" className="w-full h-48 object-cover rounded-lg mt-2" onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
                  )}
                  {post.type === 'poll' && (
                    <div className="mt-2 space-y-2">
                      {post.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <button className="btn-primary rounded-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-holo-silver" aria-label={`Vote for ${option}`}>Vote</button>
                          <span className="text-light-text font-inter">{option}</span>
                          <span className="text-cyber-teal font-inter">({post.votes?.filter(v => v.option === option).length || 0} votes)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-cyber-teal text-sm mt-1 font-inter">Posted by {post.author} - {new Date(post.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="tasks-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4">Tasks</h2>
          {isOwner && (
            <form onSubmit={handleTaskSubmit} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="taskTitle" className="block text-cyber-teal mb-2 font-inter">Task Title</label>
                  <input
                    type="text"
                    id="taskTitle"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Enter task title"
                    aria-label="Task Title"
                  />
                </div>
                <div>
                  <label htmlFor="taskDescription" className="block text-cyber-teal mb-2 font-inter">Description</label>
                  <textarea
                    id="taskDescription"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Enter task description"
                    rows="2"
                    aria-label="Task Description"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="taskAssignedTo" className="block text-cyber-teal mb-2 font-inter">Assign To</label>
                  <select
                    id="taskAssignedTo"
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    aria-label="Assign To"
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((member, index) => (
                      <option key={index} value={member.email}>{member.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary mt-4 rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Create Task"
              >
                <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Create Task
              </button>
            </form>
          )}
          {project.tasks.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No tasks yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.tasks.map(task => (
                <div key={task.id} className="task card p-4 glassmorphic">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-orbitron font-semibold text-neon-magenta">{task.title}</h3>
                    <button
                      onClick={() => toggleTaskExpansion(task.id)}
                      className="text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver"
                      aria-label={expandedTasks[task.id] ? "Collapse task details" : "Expand task details"}
                    >
                      {expandedTasks[task.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-light-text font-inter mb-1">{task.description || 'No description'}</p>
                  <p className="text-cyber-teal text-sm font-inter mb-1">Assigned To: {task.assignedTo || 'Unassigned'}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                      className="input-field rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                      aria-label="Task Status"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleTaskLike(task.id)}
                      className="flex items-center gap-1 text-neon-magenta hover:text-holo-silver transition-colors focus:outline-none focus:ring-2 focus:ring-holo-silver"
                      aria-label={`Like task (${task.likes?.length || 0} likes)`}
                    >
                      <ThumbsUp className="w-5 h-5" aria-hidden="true" /> {task.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => handleTaskShare(task.id)}
                      className="flex items-center gap-1 text-neon-magenta hover:text-holo-silver transition-colors focus:outline-none focus:ring-2 focus:ring-holo-silver"
                      aria-label={`Share task (${task.shares?.length || 0} shares)`}
                    >
                      <Share2 className="w-5 h-5" aria-hidden="true" /> {task.shares?.length || 0}
                    </button>
                  </div>
                  {expandedTasks[task.id] && (
                    <div className="mt-4 animate-slide-down">
                      {/* Subtasks */}
                      <div className="subtasks mb-4">
                        <h4 className="text-base font-orbitron text-neon-magenta mb-2">Subtasks</h4>
                        {isOwner && (
                          <form onSubmit={handleSubtaskSubmit} className="mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newSubtask.title}
                                onChange={(e) => setNewSubtask({ taskId: task.id, title: e.target.value })}
                                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                                placeholder="Enter subtask title"
                                aria-label="Subtask Title"
                              />
                              <button
                                type="submit"
                                className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                                aria-label="Add Subtask"
                              >
                                <Plus className="w-5 h-5" aria-hidden="true" />
                              </button>
                            </div>
                          </form>
                        )}
                        {task.subtasks.length === 0 ? (
                          <p className="text-cyber-teal font-inter">No subtasks.</p>
                        ) : (
                          <ul className="space-y-2">
                            {task.subtasks.map((subtask, subIndex) => (
                              <li key={subIndex} className="flex items-center gap-2">
                                <span className="text-light-text font-inter">{subtask.title}</span>
                                <span className="text-cyber-teal text-sm font-inter">({subtask.status})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Task Comments */}
                      <div className="task-comments">
                        <h4 className="text-base font-orbitron text-neon-magenta mb-2">Comments</h4>
                        <form onSubmit={handleTaskCommentSubmit} className="mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={taskComment.text}
                              onChange={(e) => setTaskComment({ taskId: task.id, text: e.target.value })}
                              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                              placeholder="Add a comment..."
                              aria-label="Task Comment"
                            />
                            <button
                              type="submit"
                              className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                              aria-label="Submit Comment"
                            >
                              <Send className="w-5 h-5" aria-hidden="true" />
                            </button>
                          </div>
                        </form>
                        {task.comments.length === 0 ? (
                          <p className="text-cyber-teal font-inter">No comments yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {task.comments.map((comment, cIndex) => (
                              <div key={cIndex} className="comment p-2 bg-cyber-teal bg-opacity-20 rounded">
                                <p className="text-light-text text-sm font-inter">
                                  <strong>{comment.user}:</strong> {comment.text}
                                </p>
                                <p className="text-cyber-teal text-xs font-inter">{new Date(comment.timestamp).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className="files-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-holo-silver" aria-hidden="true" /> Files
          </h2>
          <form onSubmit={handleFileUpload} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fileName" className="block text-cyber-teal mb-2 font-inter">File Name</label>
                <input
                  type="text"
                  id="fileName"
                  value={newFile.name}
                  onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                  placeholder="Enter file name"
                  aria-label="File Name"
                />
              </div>
              <div>
                <label htmlFor="fileUrl" className="block text-cyber-teal mb-2 font-inter">File URL</label>
                <input
                  type="text"
                  id="fileUrl"
                  value={newFile.url}
                  onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                  className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                  placeholder="Enter file URL"
                  aria-label="File URL"
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn-primary mt-4 rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
              aria-label={isOwner ? "Upload File" : "Request File Upload"}
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> {isOwner ? 'Upload File' : 'Request File Upload'}
            </button>
          </form>
          {project.files.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No files yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.files.map((file, index) => (
                <div key={index} className="file card p-4 glassmorphic flex justify-between items-center">
                  <div>
                    <p className="text-light-text font-inter">{file.name}</p>
                    <p className="text-cyber-teal text-sm font-inter">Uploaded by {file.uploadedBy} - {new Date(file.uploadedAt).toLocaleString()}</p>
                    <p className="text-cyber-teal text-sm font-inter">Status: {file.status}</p>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-neon-magenta hover:underline">View File</a>
                  </div>
                  {isOwner && file.status === 'Pending Approval' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFileApproval(file._id, 'Uploaded')}
                        className="btn-primary rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-holo-silver"
                        aria-label="Approve file"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleFileApproval(file._id, 'Rejected')}
                        className="btn-primary rounded-full bg-red-500 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-holo-silver"
                        aria-label="Reject file"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teams Section */}
        <div className="teams-section mb-8 card p-6 glassmorphic">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta flex items-center">
              <Users className="w-5 h-5 mr-2 text-holo-silver" aria-hidden="true" /> Teams
            </h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
              aria-label="Invite Member"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Invite Member
            </button>
          </div>
          {isOwner && (
            <form onSubmit={handleTeamSubmit} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="teamName" className="block text-cyber-teal mb-2 font-inter">Team Name</label>
                  <input
                    type="text"
                    id="teamName"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Enter team name"
                    aria-label="Team Name"
                  />
                </div>
                <div>
                  <label htmlFor="teamDescription" className="block text-cyber-teal mb-2 font-inter">Description</label>
                  <textarea
                    id="teamDescription"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Enter team description"
                    rows="2"
                    aria-label="Team Description"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="teamMembers" className="block text-cyber-teal mb-2 font-inter">Members (comma-separated emails)</label>
                  <input
                    type="text"
                    id="teamMembers"
                    value={newTeam.members.join(', ')}
                    onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value.split(',').map(email => email.trim()) })}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Enter member emails"
                    aria-label="Team Members"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary mt-4 rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Create Team"
              >
                <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Create Team
              </button>
            </form>
          )}
          {project.teams.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No teams yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.teams.map((team, index) => (
                <div key={index} className="team card p-4 glassmorphic">
                  <h3 className="text-lg font-orbitron font-semibold text-neon-magenta">{team.name}</h3>
                  <p className="text-light-text font-inter mb-2">{team.description}</p>
                  <p className="text-cyber-teal text-sm font-inter">Members: {team.members.map(m => m.email).join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions Section */}
        <div className="suggestions-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4">Suggestions</h2>
          <form onSubmit={handleSuggestionSubmit} className="mb-6">
            <div className="flex items-center gap-2">
              <textarea
                value={newSuggestion}
                onChange={(e) => setNewSuggestion(e.target.value)}
                className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                placeholder="Enter your suggestion..."
                rows="3"
                aria-label="Suggestion"
              ></textarea>
              <button
                type="submit"
                className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                aria-label="Submit Suggestion"
              >
                <Send className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </form>
          {project.suggestions.length === 0 ? (
            <p className="text-cyber-teal font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No suggestions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion card p-4 glassmorphic">
                  <p className="text-light-text font-inter">{suggestion.content}</p>
                  <p className="text-cyber-teal text-sm font-inter">Suggested by {suggestion.author} - {new Date(suggestion.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content card p-6 glassmorphic w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta">{isOwner ? 'Invite Member' : 'Request to Add Member'}</h2>
                <button onClick={() => setShowInviteModal(false)} className="text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleInviteSubmit}>
                <div className="mb-4">
                  <label htmlFor="inviteEmail" className="block text-cyber-teal mb-2 font-inter">Email</label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-holo-silver"
                    placeholder="Enter email to invite"
                    aria-label="Invite Email"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full rounded-full flex items-center justify-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver"
                  aria-label={isOwner ? "Invite Member" : "Request to Add Member"}
                >
                  {isOwner ? 'Invite Member' : 'Request to Add Member'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHome;