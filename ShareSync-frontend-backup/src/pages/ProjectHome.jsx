import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CheckCircle, MessageSquare, ThumbsUp, Share2, Edit2, FilePlus, Users, Bell, Filter } from 'lucide-react';
import { io } from 'socket.io-client';
import './ProjectHome.css';

const socket = io('http://localhost:3000');

const mockProject = {
  id: '1',
  title: 'Project Alpha',
  description: 'A revolutionary project to change the world.',
  category: 'Job',
  status: 'In Progress',
  admins: ['johndoe'],
  members: ['alice', 'bob'],
  comments: [{ text: 'Great progress so far!', user: 'Alice', timestamp: new Date().toISOString() }],
  teams: [
    { name: 'Design Team', description: 'Handles UI/UX design', members: ['alice'] },
    { name: 'Dev Team', description: 'Handles development', members: ['bob'] },
  ],
  tasks: [],
  files: [],
  posts: [],
  activityLog: [],
};

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, notificationPrefs, updateNotificationPrefs } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState('announcement');
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', subtasks: [] });
  const [newSubtask, setNewSubtask] = useState('');
  const [newFileRequest, setNewFileRequest] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('member');
  const [shareRequest, setShareRequest] = useState('');
  const [editSuggestion, setEditSuggestion] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) throw new Error('Project ID is missing');
        console.log('ProjectHome - Fetching project');
        setProject(mockProject);
        setComments(mockProject.comments || []);
        setMessages([]);
      } catch (err) {
        console.error('ProjectHome - Error fetching project:', err.message, err.stack);
        setError('Failed to load project: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    socket.on('message', (message) => {
      if (message.projectId === id) {
        setMessages((prev) => [...prev, message]);
        notifyUsers('New chat message', `New message in ${mockProject.title}: ${message.text}`);
      }
    });

    if (isAuthenticated) {
      fetchProject();
    } else {
      console.log('ProjectHome - Not authenticated, navigating to login');
      navigate('/login', { replace: true });
    }

    return () => socket.off('message');
  }, [id, isAuthenticated, navigate]);

  const notifyUsers = (title, message) => {
    // Mock notification logic
    console.log('Notifying users:', { title, message, prefs: notificationPrefs });
    // In a real app, send email/SMS via an API
  };

  const isAdmin = project && user && project.admins.includes(user.username);

  const sendMessage = () => {
    if (!newMessage) return;
    socket.emit('message', { projectId: id, text: newMessage, user: user?.username || 'Guest' });
    setMessages((prev) => [...prev, { projectId: id, text: newMessage, user: user?.username || 'Guest' }]);
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), { type: 'chat', user: user?.username, action: 'sent a message', timestamp: new Date().toISOString() }],
    }));
    setNewMessage('');
    notifyUsers('New Chat Message', `New message in ${project.title}: ${newMessage}`);
  };

  const addComment = () => {
    if (!newComment) return;
    const newCommentObj = {
      text: newComment,
      user: user?.username || 'Guest',
      timestamp: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newCommentObj]);
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), { type: 'comment', user: user?.username, action: 'added a comment', timestamp: new Date().toISOString() }],
    }));
    setNewComment('');
    notifyUsers('New Comment', `New comment in ${project.title}: ${newComment}`);
  };

  const addPost = () => {
    if (!newPost) return;
    const newPostObj = {
      type: postType,
      content: newPost,
      user: user?.username,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };
    setProject((prev) => ({
      ...prev,
      posts: [...(prev.posts || []), newPostObj],
      activityLog: [...(prev.activityLog || []), { type: 'post', user: user?.username, action: `posted a ${postType}`, timestamp: new Date().toISOString() }],
    }));
    setNewPost('');
    notifyUsers(`New ${postType}`, `New ${postType} in ${project.title}: ${newPost}`);
  };

  const likePost = (postIndex) => {
    setProject((prev) => {
      const updatedPosts = [...prev.posts];
      updatedPosts[postIndex].likes += 1;
      return {
        ...prev,
        posts: updatedPosts,
        activityLog: [...(prev.activityLog || []), { type: 'like', user: user?.username, action: 'liked a post', timestamp: new Date().toISOString() }],
      };
    });
    notifyUsers('Post Liked', `${user?.username} liked a post in ${project.title}`);
  };

  const addTask = () => {
    if (!newTask.title) return;
    setProject((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), { ...newTask, id: `${prev.tasks.length + 1}`, comments: [], status: 'Not Started' }],
      activityLog: [...(prev.activityLog || []), { type: 'task', user: user?.username, action: 'created a task', timestamp: new Date().toISOString() }],
    }));
    setNewTask({ title: '', description: '', assignedTo: '', subtasks: [] });
    notifyUsers('New Task', `New task created in ${project.title}: ${newTask.title}`);
  };

  const addSubtask = (taskId) => {
    if (!newSubtask) return;
    setProject((prev) => {
      const updatedTasks = prev.tasks.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...task.subtasks, { text: newSubtask, completed: false }] }
          : task
      );
      return {
        ...prev,
        tasks: updatedTasks,
        activityLog: [...(prev.activityLog || []), { type: 'subtask', user: user?.username, action: 'added a subtask', timestamp: new Date().toISOString() }],
      };
    });
    setNewSubtask('');
    notifyUsers('New Subtask', `New subtask added in ${project.title}`);
  };

  const requestFileUpload = () => {
    if (!newFileRequest) return;
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), { type: 'file_request', user: user?.username, action: `requested to upload a file: ${newFileRequest}`, timestamp: new Date().toISOString() }],
    }));
    setNewFileRequest('');
    notifyUsers('File Upload Request', `${user?.username} requested to upload a file in ${project.title}`);
  };

  const addTeam = (teamName, description) => {
    setProject((prev) => ({
      ...prev,
      teams: [...(prev.teams || []), { name: teamName, description, members: [] }],
      activityLog: [...(prev.activityLog || []), { type: 'team', user: user?.username, action: `created team: ${teamName}`, timestamp: new Date().toISOString() }],
    }));
    notifyUsers('New Team', `New team ${teamName} created in ${project.title}`);
  };

  const shareProject = () => {
    if (!shareEmail) return;
    setProject((prev) => ({
      ...prev,
      [shareRole === 'admin' ? 'admins' : 'members']: [...(shareRole === 'admin' ? prev.admins : prev.members), shareEmail],
      activityLog: [...(prev.activityLog || []), { type: 'share', user: user?.username, action: `shared project with ${shareEmail} as ${shareRole}`, timestamp: new Date().toISOString() }],
    }));
    setShareEmail('');
    setShareRole('member');
    setShowShareModal(false);
    notifyUsers('Project Shared', `${user?.username} shared ${project.title} with ${shareEmail}`);
  };

  const requestShare = () => {
    if (!shareRequest) return;
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), { type: 'share_request', user: user?.username, action: `requested to share project with ${shareRequest}`, timestamp: new Date().toISOString() }],
    }));
    setShareRequest('');
    setShowShareModal(false);
    notifyUsers('Share Request', `${user?.username} requested to share ${project.title} with ${shareRequest}`);
  };

  const submitEditSuggestion = () => {
    if (!editSuggestion) return;
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), { type: 'edit_suggestion', user: user?.username, action: `suggested edit: ${editSuggestion}`, timestamp: new Date().toISOString() }],
    }));
    setEditSuggestion('');
    notifyUsers('Edit Suggestion', `${user?.username} suggested an edit in ${project.title}: ${editSuggestion}`);
  };

  const updateProjectDetails = (updatedDetails) => {
    setProject((prev) => ({
      ...prev,
      ...updatedDetails,
      activityLog: [...(prev.activityLog || []), { type: 'edit', user: user?.username, action: 'updated project details', timestamp: new Date().toISOString() }],
    }));
    notifyUsers('Project Updated', `${user?.username} updated ${project.title}`);
  };

  if (loading) {
    return <div className="project-home-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (error) {
    return (
      <div className="project-home-container">
        <p className="text-error">{error}</p>
        {error.includes('token') && (
          <p className="text-secondary">
            Please <Link to="/login">log in</Link> to view this project.
          </p>
        )}
        <Link to="/projects">
          <button className="btn-primary">Back to Projects</button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return <div className="project-home-container"><p className="text-secondary">Project not found.</p></div>;
  }

  const statusProgress = project.status === 'Completed' ? 100 : project.status === 'In Progress' ? 50 : 0;
  const totalTasks = project.tasks ? project.tasks.length : 0;
  const completedTasks = project.tasks ? project.tasks.filter((task) => task.status === 'Completed').length : 0;

  return (
    <div className="project-home-container">
      <div className="project-home-header">
        <h1 className="text-4xl font-orbitron text-neon-white">{project.title || 'Untitled'}</h1>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button onClick={() => setShowShareModal(true)} className="btn-primary">
              <Share2 className="icon" /> Share
            </button>
          )}
          {!isAdmin && (
            <button onClick={() => setShowShareModal(true)} className="btn-primary">
              <Share2 className="icon" /> Request Share
            </button>
          )}
          <button onClick={() => setShowSettingsModal(true)} className="btn-primary">
            <Bell className="icon" /> Notification Settings
          </button>
        </div>
      </div>
      <div className="team-infographic bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Team Roles</h2>
        <div className="flex flex-wrap gap-4">
          <div className="role-card bg-gradient-to-r from-neon-cyan to-neon-magenta p-4 rounded-lg">
            <h3 className="text-neon-white font-bold">Administrators</h3>
            <ul className="text-secondary">
              {project.admins.map((admin) => (
                <li key={admin}>{admin}</li>
              ))}
            </ul>
          </div>
          <div className="role-card bg-gradient-to-r from-neon-magenta to-neon-yellow p-4 rounded-lg">
            <h3 className="text-neon-white font-bold">Members</h3>
            <ul className="text-secondary">
              {project.members.map((member) => (
                <li key={member}>{member}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="project-details">
        <p className="text-secondary mb-4">{project.description || 'No description'}</p>
        <p className="text-neon-cyan mb-4">Category: {project.category}</p>
        <div className="project-overview">
          <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Project Overview</h2>
          <div className="overview-infographic">
            <div className="stat-bar">
              <span className="text-neon-white flex items-center">
                <CheckCircle className="icon mr-2" /> Status: {project.status || 'Unknown'}
              </span>
              <div className="progress-bar">
                <div
                  className="progress-fill gradient-bg"
                  style={{ width: `${statusProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="metric-card gradient-bg mt-4">
              <span className="text-neon-white">Total Tasks</span>
              <p className="text-3xl font-bold">{totalTasks}</p>
            </div>
            <div className="metric-card gradient-bg mt-4">
              <span className="text-neon-white">Tasks Completed</span>
              <p className="text-3xl font-bold">{completedTasks}</p>
            </div>
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="edit-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
          <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Edit Project</h2>
          <input
            type="text"
            value={project.title}
            onChange={(e) => updateProjectDetails({ title: e.target.value })}
            placeholder="Project Title"
            className="input-field mb-4"
          />
          <textarea
            value={project.description}
            onChange={(e) => updateProjectDetails({ description: e.target.value })}
            placeholder="Project Description"
            className="input-field mb-4"
          />
          <select
            value={project.status}
            onChange={(e) => updateProjectDetails({ status: e.target.value })}
            className="input-field"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}
      {!isAdmin && (
        <div className="suggestion-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
          <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Suggest an Edit</h2>
          <textarea
            value={editSuggestion}
            onChange={(e) => setEditSuggestion(e.target.value)}
            placeholder="Suggest changes to this project..."
            className="input-field mb-4"
          />
          <button onClick={submitEditSuggestion} className="btn-primary">
            <Edit2 className="icon" /> Submit Suggestion
          </button>
        </div>
      )}
      <div className="social-feed bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Project Feed</h2>
        <div className="post-form mb-6">
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="input-field mb-2"
          >
            <option value="announcement">Announcement</option>
            <option value="poll">Poll</option>
            <option value="picture">Picture</option>
          </select>
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder={`Write a new ${postType}...`}
            className="input-field mb-2"
          />
          <button onClick={addPost} className="btn-primary">Post</button>
        </div>
        {project.posts && project.posts.length > 0 ? (
          project.posts.map((post, index) => (
            <div key={index} className="post-item bg-dark-glass p-4 rounded-lg mb-4 border-l-4 border-neon-magenta">
              <p className="text-neon-white capitalize">{post.type} by {post.user}</p>
              <p className="text-secondary">{new Date(post.timestamp).toLocaleString()}</p>
              <p className="text-neon-white mt-2">{post.content}</p>
              <div className="flex items-center mt-2">
                <button
                  onClick={() => likePost(index)}
                  className="flex items-center text-neon-cyan hover:text-neon-magenta transition-colors"
                >
                  <ThumbsUp className="w-5 h-5 mr-1" /> {post.likes} Likes
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-secondary">No posts yet.</p>
        )}
      </div>
      <div className="chat-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4 flex items-center"><MessageSquare className="icon mr-2" /> Project Chat</h2>
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className="message-item">
              <strong className="text-neon-white">{msg.user}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="input-field"
          />
          <button onClick={sendMessage} className="btn-primary">Send</button>
        </div>
      </div>
      <div className="comments-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Comments</h2>
        <div className="comments-list">
          {comments.map((comment, index) => (
            <div key={index} className="comment-item">
              <p className="text-neon-white">{comment.text}</p>
              <p className="text-secondary">By {comment.user} on {new Date(comment.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="comment-input">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="input-field"
          />
          <button onClick={addComment} className="btn-primary">Post</button>
        </div>
      </div>
      <div className="tasks-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Tasks</h2>
        {isAdmin && (
          <div className="task-form mb-6">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task Title"
              className="input-field mb-2"
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Task Description"
              className="input-field mb-2"
            />
            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              className="input-field mb-2"
            >
              <option value="">Assign to...</option>
              {[...project.admins, ...project.members].map((member) => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
            <button onClick={addTask} className="btn-primary">Create Task</button>
          </div>
        )}
        {project.tasks && project.tasks.length > 0 ? (
          project.tasks.map((task) => (
            <div key={task.id} className="task-item bg-dark-glass p-4 rounded-lg mb-4 border-l-4 border-neon-cyan">
              <h3 className="text-neon-white font-bold">{task.title}</h3>
              <p className="text-secondary">{task.description}</p>
              <p className="text-neon-magenta">Assigned to: {task.assignedTo || 'Unassigned'}</p>
              <p className="text-neon-cyan">Status: {task.status}</p>
              <div className="subtasks mt-4">
                <h4 className="text-neon-cyan">Subtasks</h4>
                {task.subtasks.map((subtask, idx) => (
                  <p key={idx} className="text-secondary">{subtask.text} - {subtask.completed ? 'Completed' : 'Pending'}</p>
                ))}
                {isAdmin && (
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add subtask..."
                      className="input-field flex-1 mr-2"
                    />
                    <button onClick={() => addSubtask(task.id)} className="btn-primary">Add</button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-secondary">No tasks yet.</p>
        )}
      </div>
      <div className="files-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Files</h2>
        {project.files && project.files.length > 0 ? (
          project.files.map((file, index) => (
            <p key={index} className="text-secondary">{file.name}</p>
          ))
        ) : (
          <p className="text-secondary">No files yet.</p>
        )}
        {!isAdmin && (
          <div className="file-request mt-4">
            <input
              type="text"
              value={newFileRequest}
              onChange={(e) => setNewFileRequest(e.target.value)}
              placeholder="Request to upload a file..."
              className="input-field mb-2"
            />
            <button onClick={requestFileUpload} className="btn-primary">
              <FilePlus className="icon" /> Request Upload
            </button>
          </div>
        )}
      </div>
      <div className="teams-section bg-dark-glass p-6 rounded-xl shadow-glow-cyan mb-8">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Teams</h2>
        {isAdmin && (
          <div className="team-form mb-6">
            <input
              type="text"
              placeholder="Team Name"
              className="input-field mb-2"
              id="new-team-name"
            />
            <textarea
              placeholder="Team Description"
              className="input-field mb-2"
              id="new-team-desc"
            />
            <button
              onClick={() => {
                const name = document.getElementById('new-team-name').value;
                const desc = document.getElementById('new-team-desc').value;
                if (name && desc) addTeam(name, desc);
              }}
              className="btn-primary"
            >
              <Users className="icon" /> Create Team
            </button>
          </div>
        )}
        {project.teams && project.teams.length > 0 ? (
          project.teams.map((team, index) => (
            <div key={index} className="team-item bg-dark-glass p-4 rounded-lg mb-4 border-l-4 border-neon-yellow">
              <h3 className="text-neon-white font-bold">{team.name}</h3>
              <p className="text-secondary">{team.description}</p>
              <p className="text-neon-magenta">Members: {team.members.join(', ') || 'None'}</p>
            </div>
          ))
        ) : (
          <p className="text-secondary">No teams yet.</p>
        )}
      </div>
      <div className="activity-log bg-dark-glass p-6 rounded-xl shadow-glow-cyan">
        <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Activity Log</h2>
        <div className="filter-section mb-4">
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Activities</option>
            <option value="chat">Chat Messages</option>
            <option value="comment">Comments</option>
            <option value="post">Posts</option>
            <option value="task">Tasks</option>
            <option value="file_request">File Requests</option>
            <option value="share">Shares</option>
            <option value="team">Teams</option>
          </select>
        </div>
        {project.activityLog && project.activityLog.length > 0 ? (
          project.activityLog
            .filter((log) => activityFilter === 'all' || log.type === activityFilter)
            .map((log, index) => (
              <div key={index} className="log-item bg-dark-glass p-4 rounded-lg mb-4 border-l-4 border-neon-magenta">
                <p className="text-neon-white">{log.user} {log.action}</p>
                <p className="text-secondary">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
            ))
        ) : (
          <p className="text-secondary">No activity yet.</p>
        )}
      </div>

      {showShareModal && (
        <div className="modal fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="modal-content bg-dark-glass p-8 rounded-xl shadow-glow-cyan">
            <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">
              {isAdmin ? 'Share Project' : 'Request to Share'}
            </h2>
            {isAdmin ? (
              <>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email to share with..."
                  className="input-field mb-4"
                />
                <select
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="input-field mb-4"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-4">
                  <button onClick={shareProject} className="btn-primary">Share</button>
                  <button onClick={() => setShowShareModal(false)} className="btn-secondary">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="email"
                  value={shareRequest}
                  onChange={(e) => setShareRequest(e.target.value)}
                  placeholder="Enter email to request sharing..."
                  className="input-field mb-4"
                />
                <div className="flex gap-4">
                  <button onClick={requestShare} className="btn-primary">Request</button>
                  <button onClick={() => setShowShareModal(false)} className="btn-secondary">Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="modal-content bg-dark-glass p-8 rounded-xl shadow-glow-cyan">
            <h2 className="text-2xl font-orbitron text-neon-cyan mb-4">Notification Settings</h2>
            <div className="notification-prefs">
              <h3 className="text-neon-white mb-2">Email Notifications</h3>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.email.taskCompletion}
                  onChange={(e) =>
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      email: { ...notificationPrefs.email, taskCompletion: e.target.checked },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-secondary">Task Completion</span>
              </label>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.email.newPost}
                  onChange={(e) =>
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      email: { ...notificationPrefs.email, newPost: e.target.checked },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-secondary">New Posts</span>
              </label>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.email.fileUpload}
                  onChange={(e) =>
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      email: { ...notificationPrefs.email, fileUpload: e.target.checked },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-secondary">File Uploads</span>
              </label>
              <h3 className="text-neon-white mt-4 mb-2">SMS Notifications</h3>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.sms.taskCompletion}
                  onChange={(e) =>
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      sms: { ...notificationPrefs.sms, taskCompletion: e.target.checked },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-secondary">Task Completion</span>
              </label>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.sms.newPost}
                  onChange={(e) =>
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      sms: { ...notificationPrefs.sms, newPost: e.target.checked },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-secondary">New Posts</span>
              </label>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.sms.fileUpload}
                  onChange={(e) =>
                    updateNotificationPrefs({
                      ...notificationPrefs,
                      sms: { ...notificationPrefs.sms, fileUpload: e.target.checked },
                    })
                  }
                  className="mr-2"
                />
                <span className="text-secondary">File Uploads</span>
              </label>
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="btn-secondary mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHome;