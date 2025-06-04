import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { fetchProjectById, updateProject, createPost, createTask, createSubtask, updateTaskStatus, likeTask, shareTask, addTaskComment, uploadFile, approveFile, createTeam, inviteUser, addSuggestion, updateNotificationSettings } from '../services/project.js';
import { Folder, AlertCircle, Plus, Edit, Trash, CheckSquare, FileText, Share2, ThumbsUp, MessageSquare, Users, Settings } from 'lucide-react';
import './ProjectHome.css';

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, socket } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', category: '', status: '' });
  const [newPost, setNewPost] = useState({ type: 'announcement', content: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', dueDate: '' });
  const [newSubtask, setNewSubtask] = useState({ title: '', taskId: '' });
  const [newFile, setNewFile] = useState(null);
  const [newTeam, setNewTeam] = useState({ name: '', members: [] });
  const [inviteEmail, setInviteEmail] = useState('');
  const [newSuggestion, setNewSuggestion] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({ emailNotifications: true, inAppNotifications: true });

  useEffect(() => {
    const loadProject = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const projectData = await fetchProjectById(id);
        setProject(projectData);
        setProjectForm({
          title: projectData.title || '',
          description: projectData.description || '',
          category: projectData.category || '',
          status: projectData.status || '',
        });
      } catch (err) {
        setError('Failed to load project: ' + (err.message || 'Please try again.'));
      }
    };

    loadProject();

    if (socket) {
      socket.on('project-updated', (data) => {
        if (data.project._id === id) {
          setProject(data.project);
        }
      });

      return () => {
        socket.off('project-updated');
      };
    }
  }, [id, isAuthenticated, isLoading, navigate, socket]);

  const handleProjectUpdate = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await updateProject(id, projectForm);
      setProject(updatedProject);
      setIsEditingProject(false);
      if (socket) {
        socket.emit('project-updated', { project: updatedProject, userId: user?._id });
      }
    } catch (err) {
      setError('Failed to update project: ' + err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const post = await createPost(id, newPost);
      setProject((prev) => ({
        ...prev,
        posts: [...(prev.posts || []), post],
      }));
      setNewPost({ type: 'announcement', content: '' });
      if (socket) {
        socket.emit('feed-update', { ...post, projectId: id, projectTitle: project.title });
      }
    } catch (err) {
      setError('Failed to create post: ' + err.message);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const task = await createTask(id, newTask);
      setProject((prev) => ({
        ...prev,
        tasks: [...(prev.tasks || []), task],
      }));
      setNewTask({ title: '', description: '', assignedTo: '', dueDate: '' });
    } catch (err) {
      setError('Failed to create task: ' + err.message);
    }
  };

  const handleCreateSubtask = async (taskId) => {
    try {
      const subtask = await createSubtask(id, taskId, { title: newSubtask.title });
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t._id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
        ),
      }));
      setNewSubtask({ title: '', taskId: '' });
    } catch (err) {
      setError('Failed to create subtask: ' + err.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const updatedTask = await updateTaskStatus(id, taskId, status);
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map(t => (t._id === taskId ? updatedTask : t)),
      }));
    } catch (err) {
      setError('Failed to update task status: ' + err.message);
    }
  };

  const handleLikeTask = async (taskId) => {
    try {
      const updatedTask = await likeTask(id, taskId);
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map(t => (t._id === taskId ? updatedTask : t)),
      }));
    } catch (err) {
      setError('Failed to like task: ' + err.message);
    }
  };

  const handleShareTask = async (taskId) => {
    try {
      const updatedTask = await shareTask(id, taskId);
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map(t => (t._id === taskId ? updatedTask : t)),
      }));
      alert('Task shared! (Mock action—implement sharing logic as needed.)');
    } catch (err) {
      setError('Failed to share task: ' + err.message);
    }
  };

  const handleAddTaskComment = async (taskId, commentText) => {
    try {
      const updatedTask = await addTaskComment(id, taskId, { text: commentText, user: user.email });
      setProject((prev) => ({
        ...prev,
        tasks: prev.tasks.map(t => (t._id === taskId ? updatedTask : t)),
      }));
    } catch (err) {
      setError('Failed to add comment: ' + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!newFile) return;

    try {
      const fileData = new FormData();
      fileData.append('file', newFile);
      const uploadedFile = await uploadFile(id, fileData);
      setProject((prev) => ({
        ...prev,
        files: [...(prev.files || []), uploadedFile],
      }));
      setNewFile(null);
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
    }
  };

  const handleApproveFile = async (fileId, status) => {
    try {
      const updatedFile = await approveFile(id, fileId, status);
      setProject((prev) => ({
        ...prev,
        files: prev.files.map(f => (f._id === fileId ? updatedFile : f)),
      }));
    } catch (err) {
      setError('Failed to update file status: ' + err.message);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const team = await createTeam(id, newTeam);
      setProject((prev) => ({
        ...prev,
        teams: [...(prev.teams || []), team],
      }));
      setNewTeam({ name: '', members: [] });
    } catch (err) {
      setError('Failed to create team: ' + err.message);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    try {
      await inviteUser(id, inviteEmail);
      setInviteEmail('');
      alert('Invitation sent! (Mock action—implement email logic as needed.)');
    } catch (err) {
      setError('Failed to invite user: ' + err.message);
    }
  };

  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    try {
      const suggestion = await addSuggestion(id, { content: newSuggestion, user: user.email });
      setProject((prev) => ({
        ...prev,
        suggestions: [...(prev.suggestions || []), suggestion],
      }));
      setNewSuggestion('');
    } catch (err) {
      setError('Failed to add suggestion: ' + err.message);
    }
  };

  const handleUpdateNotificationSettings = async (e) => {
    e.preventDefault();
    try {
      const updatedSettings = await updateNotificationSettings(id, notificationSettings);
      setProject((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...updatedSettings },
      }));
    } catch (err) {
      setError('Failed to update notification settings: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="project-home-container flex items-center justify-center min-h-screen">
        <div className="loader" aria-label="Loading project"></div>
        <span className="text-saffron-yellow text-xl font-orbitron ml-4">Loading...</span>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="project-home-container flex items-center justify-center min-h-screen">
        <p className="text-crimson-red text-lg font-orbitron">{authError || error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-home-container flex items-center justify-center min-h-screen">
        <p className="text-saffron-yellow text-lg font-orbitron">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="project-home-container">
      <div className="project-header py-8 px-6 rounded-b-3xl text-center glassmorphic">
        {isEditingProject ? (
          <form onSubmit={handleProjectUpdate} className="max-w-2xl mx-auto">
            <input
              type="text"
              value={projectForm.title}
              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              className="input-field text-4xl font-orbitron font-bold text-emerald-green mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
              placeholder="Project Title"
              aria-label="Project Title"
            />
            <textarea
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
              placeholder="Project Description"
              rows="3"
              aria-label="Project Description"
            ></textarea>
            <div className="flex gap-4 mt-4">
              <select
                value={projectForm.category}
                onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                className="input-field rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                aria-label="Project Category"
              >
                <option value="Personal">Personal</option>
                <option value="School">School</option>
                <option value="Job">Job</option>
              </select>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                className="input-field rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                aria-label="Project Status"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                aria-label="Save project changes"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingProject(false)}
                className="btn-primary rounded-full flex items-center bg-crimson-red focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                aria-label="Cancel editing"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-orbitron font-bold text-emerald-green mb-4">{project.title}</h1>
              <button
                onClick={() => setIsEditingProject(true)}
                className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                aria-label="Edit project"
              >
                <Edit className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-saffron-yellow text-lg font-inter mb-4">{project.description}</p>
            <p className="text-lavender-gray font-inter">Category: {project.category}</p>
            <p className="text-lavender-gray font-inter">Status: {project.status}</p>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {error && <p className="text-crimson-red mb-4 text-center font-orbitron">{error}</p>}

        {/* Posts Section */}
        <div className="posts-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Posts
          </h2>
          <form onSubmit={handleCreatePost} className="mb-4">
            <select
              value={newPost.type}
              onChange={(e) => setNewPost({ ...newPost, type: e.target.value })}
              className="input-field rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              aria-label="Post Type"
            >
              <option value="announcement">Announcement</option>
              <option value="update">Update</option>
            </select>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Write a post..."
              rows="3"
              aria-label="Post Content"
            ></textarea>
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Create Post"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Post
            </button>
          </form>
          {(project.posts || []).length === 0 ? (
            <p className="text-saffron-yellow font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No posts yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.posts.map((post, index) => (
                <div key={index} className="post-item p-4 bg-saffron-yellow bg-opacity-20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/32'}
                      alt={`${post.author}'s profile`}
                      className="w-8 h-8 rounded-full profile-pic"
                    />
                    <div>
                      <p className="text-indigo-vivid font-orbitron font-medium">{post.type.toUpperCase()}</p>
                      <p className="text-lavender-gray font-inter">{post.content}</p>
                      <p className="text-lavender-gray text-sm font-inter">
                        By {post.author} at {new Date(post.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="tasks-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Tasks
          </h2>
          <form onSubmit={handleCreateTask} className="mb-4">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Task Title"
              aria-label="Task Title"
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Task Description"
              rows="2"
              aria-label="Task Description"
            ></textarea>
            <input
              type="text"
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Assigned To (email)"
              aria-label="Assigned To"
            />
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              aria-label="Due Date"
            />
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Create Task"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Add Task
            </button>
          </form>
          {(project.tasks || []).length === 0 ? (
            <p className="text-saffron-yellow font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No tasks yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.tasks.map((task) => (
                <div key={task._id} className="task-item p-4 bg-saffron-yellow bg-opacity-20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img
                        src={user.profilePicture || 'https://via.placeholder.com/32'}
                        alt={`${task.assignedTo}'s profile`}
                        className="w-8 h-8 rounded-full profile-pic"
                      />
                      <h3 className="text-lg font-orbitron font-bold text-indigo-vivid">{task.title}</h3>
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
                      className="input-field rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                      aria-label={`Status for task ${task.title}`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <p className="text-lavender-gray font-inter">{task.description}</p>
                  <p className="text-lavender-gray text-sm font-inter">Assigned To: {task.assignedTo}</p>
                  <p className="text-lavender-gray text-sm font-inter">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleLikeTask(task._id)}
                      className="flex items-center gap-1 text-charcoal-gray hover:text-indigo-vivid focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                      aria-label={`Like task ${task.title}`}
                    >
                      <ThumbsUp className="w-4 h-4" aria-hidden="true" /> {task.likes || 0}
                    </button>
                    <button
                      onClick={() => handleShareTask(task._id)}
                      className="flex items-center gap-1 text-charcoal-gray hover:text-indigo-vivid focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                      aria-label={`Share task ${task.title}`}
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" /> {task.shares || 0}
                    </button>
                  </div>
                  {/* Subtasks */}
                  <div className="subtasks mt-4">
                    <h4 className="text-md font-orbitron font-semibold text-emerald-green mb-2">Subtasks</h4>
                    {(task.subtasks || []).map((subtask) => (
                      <div key={subtask._id} className="subtask-item p-2 bg-charcoal-gray bg-opacity-20 rounded-lg mb-2">
                        <p className="text-lavender-gray font-inter">{subtask.title}</p>
                      </div>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateSubtask(task._id);
                      }}
                      className="flex gap-2 mt-2"
                    >
                      <input
                        type="text"
                        value={newSubtask.title}
                        onChange={(e) => setNewSubtask({ title: e.target.value, taskId: task._id })}
                        className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                        placeholder="Subtask Title"
                        aria-label="Subtask Title"
                      />
                      <button
                        type="submit"
                        className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                        aria-label="Add Subtask"
                      >
                        <Plus className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                  {/* Comments */}
                  <div className="comments mt-4">
                    <h4 className="text-md font-orbitron font-semibold text-emerald-green mb-2">Comments</h4>
                    {(task.comments || []).map((comment, index) => (
                      <div key={index} className="comment-item p-2 bg-charcoal-gray bg-opacity-20 rounded-lg mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.profilePicture || 'https://via.placeholder.com/32'}
                            alt={`${comment.user}'s profile`}
                            className="w-6 h-6 rounded-full profile-pic"
                          />
                          <div>
                            <p className="text-lavender-gray font-inter">{comment.text}</p>
                            <p className="text-lavender-gray text-sm font-inter">By {comment.user} at {new Date(comment.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const commentText = e.target.comment.value;
                        if (commentText.trim()) {
                          handleAddTaskComment(task._id, commentText);
                          e.target.comment.value = '';
                        }
                      }}
                      className="flex gap-2 mt-2"
                    >
                      <input
                        type="text"
                        name="comment"
                        className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
                        placeholder="Add a comment..."
                        aria-label="Comment"
                      />
                      <button
                        type="submit"
                        className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                        aria-label="Add Comment"
                      >
                        <MessageSquare className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className="files-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Files
          </h2>
          <form onSubmit={handleFileUpload} className="mb-4">
            <input
              type="file"
              onChange={(e) => setNewFile(e.target.files[0])}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              aria-label="Upload File"
            />
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Upload File"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Upload File
            </button>
          </form>
          {(project.files || []).length === 0 ? (
            <p className="text-saffron-yellow font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No files yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.files.map((file) => (
                <div key={file._id} className="file-item p-4 bg-saffron-yellow bg-opacity-20 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/32'}
                      alt={`${file.uploadedBy}'s profile`}
                      className="w-8 h-8 rounded-full profile-pic"
                    />
                    <div>
                      <p className="text-lavender-gray font-inter">{file.name}</p>
                      <p className="text-lavender-gray text-sm font-inter">Uploaded by {file.uploadedBy} at {new Date(file.uploadedAt).toLocaleString()}</p>
                      <p className="text-lavender-gray text-sm font-inter">Status: {file.status || 'Pending'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveFile(file._id, 'Approved')}
                      className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                      aria-label={`Approve file ${file.name}`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveFile(file._id, 'Rejected')}
                      className="btn-primary rounded-full flex items-center bg-crimson-red focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
                      aria-label={`Reject file ${file.name}`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teams Section */}
        <div className="teams-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Teams
          </h2>
          <form onSubmit={handleCreateTeam} className="mb-4">
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Team Name"
              aria-label="Team Name"
            />
            <input
              type="text"
              value={newTeam.members.join(', ')}
              onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value.split(',').map(m => m.trim()) })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Members (comma-separated emails)"
              aria-label="Team Members"
            />
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Create Team"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Create Team
            </button>
          </form>
          {(project.teams || []).length === 0 ? (
            <p className="text-saffron-yellow font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No teams yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.teams.map((team) => (
                <div key={team._id} className="team-item p-4 bg-saffron-yellow bg-opacity-20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/32'}
                      alt="Team creator's profile"
                      className="w-8 h-8 rounded-full profile-pic"
                    />
                    <div>
                      <p className="text-indigo-vivid font-orbitron font-medium">{team.name}</p>
                      <p className="text-lavender-gray font-inter">Members: {team.members.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite Users */}
        <div className="invite-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Invite Users
          </h2>
          <form onSubmit={handleInviteUser}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Enter email to invite"
              aria-label="Invite Email"
            />
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Invite User"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Invite
            </button>
          </form>
        </div>

        {/* Suggestions Section */}
        <div className="suggestions-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Suggestions
          </h2>
          <form onSubmit={handleAddSuggestion} className="mb-4">
            <textarea
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray mb-2"
              placeholder="Add a suggestion..."
              rows="3"
              aria-label="Suggestion"
            ></textarea>
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Add Suggestion"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" /> Add Suggestion
            </button>
          </form>
          {(project.suggestions || []).length === 0 ? (
            <p className="text-saffron-yellow font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-charcoal-gray animate-pulse" aria-hidden="true" /> No suggestions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {project.suggestions.map((suggestion, index) => (
                <div key={index} className="suggestion-item p-4 bg-saffron-yellow bg-opacity-20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/32'}
                      alt={`${suggestion.user}'s profile`}
                      className="w-8 h-8 rounded-full profile-pic"
                    />
                    <div>
                      <p className="text-lavender-gray font-inter">{suggestion.content}</p>
                      <p className="text-lavender-gray text-sm font-inter">By {suggestion.user}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification Settings */}
        <div className="notification-settings-section mb-8 card p-6 glassmorphic holographic-effect card-3d">
          <h2 className="text-2xl font-orbitron font-semibold text-emerald-green mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-charcoal-gray" aria-hidden="true" /> Notification Settings
          </h2>
          <form onSubmit={handleUpdateNotificationSettings}>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                className="focus:ring-indigo-vivid"
                aria-label="Email Notifications"
              />
              <label htmlFor="emailNotifications" className="text-lavender-gray font-inter">Email Notifications</label>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="inAppNotifications"
                checked={notificationSettings.inAppNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, inAppNotifications: e.target.checked })}
                className="focus:ring-indigo-vivid"
                aria-label="In-App Notifications"
              />
              <label htmlFor="inAppNotifications" className="text-lavender-gray font-inter">In-App Notifications</label>
            </div>
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect"
              aria-label="Save Notification Settings"
            >
              Save Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;