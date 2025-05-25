import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CheckCircle, MessageSquare, ThumbsUp, Share2, Award, ChevronDown, PlusCircle, FileText, Settings, Users, Filter, Image as ImageIcon, Vote, Edit, Mail, Smartphone, UserPlus } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './ProjectHome.css';

const mockProject = {
  id: '1',
  title: 'Project Alpha',
  description: 'A revolutionary project to change the world.',
  category: 'Job',
  status: 'In Progress',
  tasksCompleted: 5,
  totalTasks: 10,
  comments: [],
  posts: [],
  achievements: [
    { id: 'a1', name: 'Task Master', description: 'Completed 5 tasks', earned: true },
    { id: 'a2', name: 'On-Time Hero', description: 'Completed a task on time', earned: false },
  ],
  teams: [
    { id: 't1', name: 'Design Team', description: 'Working on UI/UX', members: ['Alice', 'Bob'] },
    { id: 't2', name: 'Dev Team', description: 'Backend development', members: ['Charlie', 'Dave'] },
  ],
  files: [],
  tasks: [],
  activityLog: [],
  admin: 'user@example.com',
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#F5F6FA',
        font: {
          family: 'Inter, sans-serif',
          size: 14,
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#F5F6FA' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
    },
    x: {
      ticks: { color: '#F5F6FA' },
      grid: { color: 'rgba(255, 255, 255, 0.1)' },
    },
  },
};

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, socket } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [postType, setPostType] = useState('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [postImage, setPostImage] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: [], subtasks: [] });
  const [newFile, setNewFile] = useState(null);
  const [fileRequest, setFileRequest] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    posts: true,
    tasks: true,
    files: true,
  });
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: [] });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSuggestions, setEditSuggestions] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [suggestedDeadline, setSuggestedDeadline] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) throw new Error('Project ID is missing');
        console.log('ProjectHome - Fetching project');
        const updatedProject = {
          ...mockProject,
          posts: [],
          comments: [],
          activityLog: [],
          files: [],
          tasks: [],
        };
        setProject(updatedProject);
        setComments(updatedProject.comments || []);
        setIsAdmin(user?.email === updatedProject.admin);
      } catch (err) {
        console.error('ProjectHome - Error fetching project:', err.message, err.stack);
        setError('Failed to load project: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const predictDeadline = async () => {
      // Mock AI deadline prediction
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      setSuggestedDeadline(deadline.toISOString().split('T')[0]);
    };

    if (socket) {
      socket.on('message', (message) => {
        if (message.projectId === id) {
          setMessages((prev) => [...prev, message]);
          setProject((prev) => ({
            ...prev,
            activityLog: [...(prev.activityLog || []), {
              id: `act-${Date.now()}`,
              user: message.user,
              action: 'Sent a message in chat',
              timestamp: new Date().toISOString(),
            }],
          }));
          notifyUsers(`${message.user} sent a message in chat`);
        }
      });

      socket.on('comment', (comment) => {
        if (comment.projectId === id) {
          setComments((prev) => [...prev, comment]);
          setProject((prev) => ({
            ...prev,
            activityLog: [...(prev.activityLog || []), {
              id: `act-${Date.now()}`,
              user: comment.user,
              action: 'Posted a comment',
              timestamp: new Date().toISOString(),
            }],
          }));
          notifyUsers(`${comment.user} posted a comment`);
        }
      });

      socket.on('post', (post) => {
        if (post.projectId === id) {
          setProject((prev) => ({
            ...prev,
            posts: [...(prev.posts || []), post],
            activityLog: [...(prev.activityLog || []), {
              id: `act-${Date.now()}`,
              user: post.user,
              action: `Posted a ${post.type}`,
              timestamp: new Date().toISOString(),
            }],
          }));
          notifyUsers(`${post.user} posted a ${post.type}`);
        }
      });

      socket.on('metric-update', (update) => {
        setProject((prev) => ({
          ...prev,
          tasksCompleted: update.tasksCompleted || prev.tasksCompleted,
          totalTasks: update.totalTasks || prev.totalTasks,
          activityLog: [...(prev.activityLog || []), {
            id: `act-${Date.now()}`,
            user: update.user || 'System',
            action: 'Updated project metrics',
            timestamp: new Date().toISOString(),
          }],
        }));
        notifyUsers(`${update.user || 'System'} updated project metrics`);
      });

      socket.on('task-update', (task) => {
        setProject((prev) => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === task.id ? task : t),
          activityLog: [...(prev.activityLog || []), {
            id: `act-${Date.now()}`,
            user: task.updatedBy,
            action: `Updated task: ${task.title}`,
            timestamp: new Date().toISOString(),
          }],
        }));
        notifyUsers(`${task.updatedBy} updated task: ${task.title}`);
      });

      socket.on('file-update', (file) => {
        setProject((prev) => ({
          ...prev,
          files: [...(prev.files || []), file],
          activityLog: [...(prev.activityLog || []), {
            id: `act-${Date.now()}`,
            user: file.uploadedBy,
            action: `Uploaded file: ${file.name}`,
            timestamp: new Date().toISOString(),
          }],
        }));
        notifyUsers(`${file.uploadedBy} uploaded file: ${file.name}`);
      });
    }

    if (isAuthenticated) {
      fetchProject();
      predictDeadline();
    } else {
      navigate('/login', { replace: true });
    }

    return () => {
      if (socket) {
        socket.off('message');
        socket.off('comment');
        socket.off('post');
        socket.off('metric-update');
        socket.off('task-update');
        socket.off('file-update');
      }
    };
  }, [id, isAuthenticated, navigate, socket, user]);

  const sendMessage = () => {
    if (!newMessage || !socket) return;
    const message = { projectId: id, text: newMessage, user: user?.email || 'Guest', timestamp: new Date().toISOString() };
    socket.emit('message', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const addComment = () => {
    if (!newComment || !socket) return;
    const comment = {
      id: `c${comments.length + 1}`,
      projectId: id,
      text: newComment,
      user: user?.email || 'Guest',
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    socket.emit('comment', comment);
    setComments((prev) => [...prev, comment]);
    setNewComment('');
  };

  const addPost = () => {
    if (!newPost && !postImage && postType !== 'poll') return;
    let post = {
      id: `p${project.posts?.length + 1 || 1}`,
      projectId: id,
      type: postType,
      user: user?.email || 'Guest',
      profilePicture: user?.profilePicture,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    if (postType === 'text') {
      post.content = newPost;
    } else if (postType === 'image') {
      post.image = postImage;
      post.content = newPost;
    } else if (postType === 'poll') {
      post.question = newPost;
      post.options = pollOptions.map((opt, idx) => ({ id: `opt-${idx}`, text: opt, votes: 0 }));
    }

    socket.emit('post', post);
    setProject((prev) => ({
      ...prev,
      posts: [...(prev.posts || []), post],
    }));
    setNewPost('');
    setPostImage(null);
    setPollOptions(['', '']);
    setPostType('text');
  };

  const handleLike = (itemId, type) => {
    if (!socket) return;
    if (type === 'comment') {
      setComments((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
        )
      );
      socket.emit('comment', {
        ...comments.find((c) => c.id === itemId),
        likes: (comments.find((c) => c.id === itemId).likes || 0) + 1,
      });
    } else if (type === 'post') {
      setProject((prev) => ({
        ...prev,
        posts: prev.posts.map((item) =>
          item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
        ),
      }));
      socket.emit('post', {
        ...project.posts.find((p) => p.id === itemId),
        likes: (project.posts.find((p) => p.id === itemId).likes || 0) + 1,
      });
    }
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: `Liked a ${type}`,
        timestamp: new Date().toISOString(),
      }],
    }));
    notifyUsers(`${user.email} liked a ${type}`);
  };

  const handleVote = (postId, optionId) => {
    setProject((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              options: post.options.map((opt) =>
                opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
              ),
            }
          : post
      ),
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: 'Voted in a poll',
        timestamp: new Date().toISOString(),
      }],
    }));
    socket.emit('post', project.posts.find((p) => p.id === postId));
    notifyUsers(`${user.email} voted in a poll`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTask = () => {
    if (!isAdmin) return;
    if (!newTask.title) return;
    const task = {
      id: `task-${project.tasks?.length + 1 || 1}`,
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      subtasks: newTask.subtasks.map((sub, idx) => ({
        id: `sub-${idx}`,
        title: sub,
        completed: false,
      })),
      comments: [],
      status: 'Not Started',
      dueDate: suggestedDeadline,
    };
    setProject((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), task],
      totalTasks: prev.totalTasks + 1,
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: `Created task: ${task.title}`,
        timestamp: new Date().toISOString(),
      }],
    }));
    socket.emit('task-update', { ...task, updatedBy: user.email });
    setNewTask({ title: '', description: '', assignedTo: [], subtasks: [] });
  };

  const completeTask = (taskId) => {
    setProject((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, status: 'Completed' } : task
      ),
      tasksCompleted: prev.tasksCompleted + 1,
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: `Completed task: ${prev.tasks.find(t => t.id === taskId).title}`,
        timestamp: new Date().toISOString(),
      }],
      achievements: prev.achievements.map((ach) =>
        ach.id === 'a2' && !ach.earned ? { ...ach, earned: true } : ach
      ),
    }));
    socket.emit('metric-update', { projectId: id, tasksCompleted: project.tasksCompleted + 1, user: user.email });
  };

  const uploadFile = () => {
    if (!newFile) return;
    const file = {
      id: `file-${project.files?.length + 1 || 1}`,
      name: newFile.name,
      url: URL.createObjectURL(newFile),
      uploadedBy: user.email,
      timestamp: new Date().toISOString(),
    };
    socket.emit('file-update', file);
    setNewFile(null);
  };

  const requestFile = () => {
    if (!fileRequest) return;
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: `Requested to add file: ${fileRequest}`,
        timestamp: new Date().toISOString(),
      }],
    }));
    notifyUsers(`${user.email} requested to add file: ${fileRequest}`);
    setFileRequest('');
  };

  const notifyUsers = (message) => {
    if (notificationSettings.email && notificationSettings[message.includes('post') ? 'posts' : message.includes('task') ? 'tasks' : 'files']) {
      console.log(`Sending email notification: ${message}`);
    }
    if (notificationSettings.sms && notificationSettings[message.includes('post') ? 'posts' : message.includes('task') ? 'tasks' : 'files']) {
      console.log(`Sending SMS notification: ${message}`);
    }
    socket.emit('notification', { message, userId: user?.username });
  };

  const addTeam = () => {
    if (!isAdmin) return;
    const team = {
      id: `team-${project.teams?.length + 1 || 1}`,
      name: newTeam.name,
      description: newTeam.description,
      members: newTeam.members,
    };
    setProject((prev) => ({
      ...prev,
      teams: [...(prev.teams || []), team],
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: `Created team: ${team.name}`,
        timestamp: new Date().toISOString(),
      }],
    }));
    notifyUsers(`${user.email} created team: ${team.name}`);
    setShowTeamModal(false);
    setNewTeam({ name: '', description: '', members: [] });
  };

  const inviteUser = () => {
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: `Invited ${inviteEmail} to the project`,
        timestamp: new Date().toISOString(),
      }],
    }));
    notifyUsers(`${user.email} invited ${inviteEmail} to the project`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const submitEditSuggestion = () => {
    setProject((prev) => ({
      ...prev,
      activityLog: [...(prev.activityLog || []), {
        id: `act-${Date.now()}`,
        user: user.email,
        action: isAdmin ? 'Edited project details' : 'Submitted an edit suggestion',
        timestamp: new Date().toISOString(),
      }],
    }));
    if (isAdmin) {
      setProject((prev) => ({
        ...prev,
        title: editSuggestions.includes('Title:') ? editSuggestions.split('Title:')[1].split('\n')[0].trim() : prev.title,
        description: editSuggestions.includes('Description:') ? editSuggestions.split('Description:')[1].trim() : prev.description,
      }));
    }
    notifyUsers(`${user.email} ${isAdmin ? 'edited project details' : 'submitted an edit suggestion'}`);
    setEditSuggestions('');
    setShowEditModal(false);
  };

  if (loading) return <div className="project-home-container"><p className="text-gray-400">Loading...</p></div>;

  if (error) {
    return (
      <div className="project-home-container">
        <p className="text-red-500">{error}</p>
        {error.includes('token') && (
          <p className="text-gray-400">
            Please <Link to="/login" className="text-accent-teal hover:underline">log in</Link> to view this project.
          </p>
        )}
        <Link to="/projects"><button className="btn-primary">Back to Projects</button></Link>
      </div>
    );
  }

  if (!project) return <div className="project-home-container"><p className="text-gray-400">Project not found.</p></div>;

  const statusProgress = project.status === 'Completed' ? 100 : project.status === 'In Progress' ? 50 : 0;

  const taskProgressData = {
    labels: ['Tasks Completed', 'Tasks Remaining'],
    datasets: [
      {
        label: 'Tasks',
        data: [project.tasksCompleted, project.totalTasks - project.tasksCompleted],
        backgroundColor: ['#26C6DA', '#8A9A5B'],
        borderColor: ['#0A1A2F', '#0A1A2F'],
        borderWidth: 1,
      },
    ],
  };

  const filteredActivityLog = project.activityLog?.filter((log) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'posts') return log.action.includes('Posted');
    if (activityFilter === 'tasks') return log.action.includes('task');
    if (activityFilter === 'files') return log.action.includes('file');
    return true;
  }) || [];

  return (
    <div className="project-home-container">
      {/* Header Section */}
      <div className="project-header bg-glass py-8 px-6 rounded-b-3xl text-center">
        <h1 className="text-4xl font-playfair text-accent-gold mb-2">{project.title || 'Untitled'}</h1>
        <p className="text-gray-400">{project.description || 'No description'}</p>
        <div className="flex justify-center gap-4 mt-4">
          <Link to="/projects" className="text-accent-teal hover:text-accent-coral transition-all">
            ← Back to Projects
          </Link>
          <button
            onClick={() => setShowSettings(true)}
            className="text-accent-teal hover:text-accent-coral transition-all flex items-center"
          >
            <Settings className="w-5 h-5 mr-2" /> Settings
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="text-accent-teal hover:text-accent-coral transition-all flex items-center"
          >
            <Edit className="w-5 h-5 mr-2" /> {isAdmin ? 'Edit Project' : 'Suggest Edits'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            {/* Project Overview */}
            <div className="project-overview card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-playfair text-accent-teal">Project Overview</h2>
                <button onClick={() => setShowDetails(!showDetails)} className="text-accent-teal hover:text-accent-coral">
                  <ChevronDown className={`w-6 h-6 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="chart-container">
                    <Bar data={taskProgressData} options={chartOptions} />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-primary flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-accent-teal" /> Status: {project.status || 'Unknown'}
                      </span>
                      <div className="progress-bar mt-2">
                        <div className="progress-fill" style={{ width: `${statusProgress}%` }}></div>
                      </div>
                    </div>
                    <p className="text-primary">Category: <span className="text-accent-gold">{project.category}</span></p>
                    <p className="text-primary">
                      Progress: <span className="text-accent-gold">{project.tasksCompleted}/{project.totalTasks} tasks</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Feed */}
            <div className="social-feed card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Project Feed</h2>
              <div className="post-input card p-4 mb-4">
                <div className="flex items-center mb-2">
                  <img
                    src={user?.profilePicture}
                    alt="User"
                    className="w-8 h-8 rounded-full mr-2 object-cover"
                  />
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="input-field mr-2"
                  >
                    <option value="text">Text Post</option>
                    <option value="image">Image Post</option>
                    <option value="poll">Poll</option>
                  </select>
                </div>
                {postType === 'poll' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Poll question..."
                      className="input-field w-full"
                    />
                    {pollOptions.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[idx] = e.target.value;
                          setPollOptions(newOptions);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="input-field w-full"
                      />
                    ))}
                    <button
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-accent-teal hover:text-accent-coral transition-all"
                    >
                      + Add Option
                    </button>
                  </div>
                ) : (
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share an update..."
                    className="input-field w-full mb-2 h-24"
                  />
                )}
                {postType === 'image' && (
                  <div className="mb-2">
                    <label className="flex items-center text-accent-teal hover:text-accent-coral cursor-pointer">
                      <ImageIcon className="w-5 h-5 mr-2" /> Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {postImage && (
                      <img src={postImage} alt="Preview" className="mt-2 max-w-full h-40 object-cover rounded-lg" />
                    )}
                  </div>
                )}
                <button onClick={addPost} className="btn-primary rounded-full">Post</button>
              </div>
              {project.posts?.length === 0 ? (
                <p className="text-gray-400 text-center">No posts yet. Be the first to share an update!</p>
              ) : (
                project.posts.map((post) => (
                  <div key={post.id} className="post-item card p-4 mb-4 holographic-effect">
                    <div className="flex items-center mb-2">
                      <img
                        src={post.profilePicture}
                        alt="User"
                        className="w-8 h-8 rounded-full mr-2 object-cover"
                      />
                      <div>
                        <span className="text-primary font-semibold">{post.user}</span>
                        <span className="text-gray-400 text-sm ml-2">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {post.type === 'text' && <p className="text-primary">{post.content}</p>}
                    {post.type === 'image' && (
                      <div>
                        {post.content && <p className="text-primary mb-2">{post.content}</p>}
                        <img src={post.image} alt="Post" className="max-w-full h-40 object-cover rounded-lg" />
                      </div>
                    )}
                    {post.type === 'poll' && (
                      <div>
                        <p className="text-primary font-semibold mb-2">{post.question}</p>
                        {post.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleVote(post.id, opt.id)}
                            className="block w-full text-left p-2 mb-1 bg-accent-sage rounded-lg text-primary hover:bg-teal-900 transition-all"
                          >
                            {opt.text} ({opt.votes || 0} votes)
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center mt-2 gap-4">
                      <button
                        onClick={() => handleLike(post.id, 'post')}
                        className="flex items-center text-accent-teal hover:text-accent-coral transition-all"
                      >
                        <ThumbsUp className="w-5 h-5 mr-1" /> {post.likes || 0}
                      </button>
                      <button className="flex items-center text-accent-teal hover:text-accent-coral transition-all">
                        <MessageSquare className="w-5 h-5 mr-1" /> {post.comments?.length || 0}
                      </button>
                      <button className="flex items-center text-accent-teal hover:text-accent-coral transition-all">
                        <Share2 className="w-5 h-5 mr-1" /> Share
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comments Section */}
            <div className="comments-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Comments</h2>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment-item card p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <img
                          src={user?.profilePicture || 'https://via.placeholder.com/150'}
                          alt="User"
                          className="w-8 h-8 rounded-full mr-2 object-cover"
                        />
                        <div>
                          <span className="text-primary font-semibold">{comment.user}</span>
                          <span className="text-gray-400 text-sm ml-2">{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-primary">{comment.text}</p>
                      <div className="flex items-center mt-2 gap-4">
                        <button
                          onClick={() => handleLike(comment.id, 'comment')}
                          className="flex items-center text-accent-teal hover:text-accent-coral transition-all"
                        >
                          <ThumbsUp className="w-5 h-5 mr-1" /> {comment.likes || 0}
                        </button>
                        <button className="flex items-center text-accent-teal hover:text-accent-coral transition-all">
                          <MessageSquare className="w-5 h-5 mr-1" /> Reply
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="comment-input flex gap-4 mt-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input-field flex-1 rounded-full"
                />
                <button onClick={addComment} className="btn-primary rounded-full">Post</button>
              </div>
            </div>

            {/* Activity Log */}
            <div className="activity-log card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" /> Activity Log
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-accent-teal" />
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Activity</option>
                  <option value="posts">Posts</option>
                  <option value="tasks">Tasks</option>
                  <option value="files">Files</option>
                </select>
              </div>
              {filteredActivityLog.length === 0 ? (
                <p className="text-gray-400 text-center">No activity yet.</p>
              ) : (
                filteredActivityLog.map((log) => (
                  <div key={log.id} className="activity-item card p-2 mb-2">
                    <p className="text-primary">{log.user} {log.action}</p>
                    <p className="text-gray-400 text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>

            {/* Tasks Section */}
            <div className="tasks-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Tasks</h2>
              {isAdmin && (
                <div className="task-input card p-4 mb-4">
                  <h3 className="text-lg font-playfair text-primary mb-2">Create Task</h3>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title..."
                    className="input-field w-full mb-2"
                  />
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description..."
                    className="input-field w-full mb-2 h-16"
                  />
                  <input
                    type="text"
                    value={newTask.assignedTo.join(', ')}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="Assigned to (comma-separated)..."
                    className="input-field w-full mb-2"
                  />
                  {suggestedDeadline && (
                    <p className="text-gray-400 mb-2">AI Suggested Deadline: {suggestedDeadline}</p>
                  )}
                  {newTask.subtasks.map((sub, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={sub}
                      onChange={(e) => {
                        const newSubtasks = [...newTask.subtasks];
                        newSubtasks[idx] = e.target.value;
                        setNewTask({ ...newTask, subtasks: newSubtasks });
                      }}
                      placeholder={`Subtask ${idx + 1}`}
                      className="input-field w-full mb-2"
                    />
                  ))}
                  <button
                    onClick={() => setNewTask({ ...newTask, subtasks: [...newTask.subtasks, ''] })}
                    className="text-accent-teal hover:text-accent-coral transition-all mb-2"
                  >
                    + Add Subtask
                  </button>
                  <button onClick={addTask} className="btn-primary rounded-full">Create Task</button>
                </div>
              )}
              {project.tasks?.length === 0 ? (
                <p className="text-gray-400 text-center">No tasks yet.</p>
              ) : (
                project.tasks.map((task) => (
                  <div key={task.id} className="task-item card p-4 mb-4">
                    <h3 className="text-lg font-playfair text-accent-gold">{task.title}</h3>
                    <p className="text-gray-400">{task.description}</p>
                    <p className="text-gray-400">Assigned to: {task.assignedTo.join(', ')}</p>
                    <p className="text-gray-400">Due Date: {task.dueDate}</p>
                    <p className="text-accent-teal">Status: {task.status}</p>
                    {task.subtasks?.length > 0 && (
                      <div className="subtasks mt-2">
                        <h4 className="text-primary">Subtasks:</h4>
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => {
                                setProject((prev) => ({
                                  ...prev,
                                  tasks: prev.tasks.map((t) =>
                                    t.id === task.id
                                      ? {
                                          ...t,
                                          subtasks: t.subtasks.map((s) =>
                                            s.id === sub.id ? { ...s, completed: !s.completed } : s
                                          ),
                                        }
                                      : t
                                  ),
                                }));
                              }}
                            />
                            <p className={`text-primary ${sub.completed ? 'line-through' : ''}`}>{sub.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => completeTask(task.id)}
                      className="btn-primary rounded-full mt-2"
                      disabled={task.status === 'Completed'}
                    >
                      Mark as Completed
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Files Section */}
            <div className="files-section card p-6">
              <h2 className="text-2xl font-playfair text-accent-teal mb-4">Files</h2>
              {isAdmin ? (
                <div className="file-input card p-4 mb-4">
                  <label className="flex items-center text-accent-teal hover:text-accent-coral cursor-pointer mb-2">
                    <FileText className="w-5 h-5 mr-2" /> Upload File
                    <input
                      type="file"
                      onChange={(e) => setNewFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {newFile && (
                    <p className="text-gray-400 mb-2">Selected: {newFile.name}</p>
                  )}
                  <button onClick={uploadFile} className="btn-primary rounded-full">Upload</button>
                </div>
              ) : (
                <div className="file-request card p-4 mb-4">
                  <input
                    type="text"
                    value={fileRequest}
                    onChange={(e) => setFileRequest(e.target.value)}
                    placeholder="Request a file to add..."
                    className="input-field w-full mb-2"
                  />
                  <button onClick={requestFile} className="btn-primary rounded-full">Request</button>
                </div>
              )}
              {project.files?.length === 0 ? (
                <p className="text-gray-400 text-center">No files yet.</p>
              ) : (
                project.files.map((file) => (
                  <div key={file.id} className="file-item card p-2 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent-teal" />
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {file.name}
                    </a>
                    <p className="text-gray-400 text-sm">Uploaded by {file.uploadedBy} on {new Date(file.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 space-y-6">
            {/* Project Chat */}
            <div className="chat-section card p-6">
              <h2 className="text-xl font-playfair text-accent-teal mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" /> Project Chat
              </h2>
              <div className="messages bg-accent-sage p-4 rounded-lg h-64 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-center">No messages yet. Say hello!</p>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="message-item mb-2">
                      <strong className="text-primary">{msg.user}:</strong> {msg.text}
                      <span className="text-gray-400 text-sm ml-2">{new Date(msg.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="chat-input flex gap-4 mt-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1 rounded-full"
                />
                <button onClick={sendMessage} className="btn-primary rounded-full">Send</button>
              </div>
            </div>

            {/* Achievements */}
            <div className="achievements-section card p-6">
              <h2 className="text-xl font-playfair text-accent-teal mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" /> Achievements
              </h2>
              {project.achievements.length === 0 ? (
                <p className="text-gray-400">No achievements yet. Keep working to earn some!</p>
              ) : (
                project.achievements.map((achievement) => (
                  <div key={achievement.id} className={`achievement-item card p-4 mb-4 ${achievement.earned ? 'bg-teal-900' : 'bg-gray-700'} bg-opacity-20`}>
                    <div className="flex items-center gap-3">
                      <Award className={`w-6 h-6 ${achievement.earned ? 'text-accent-gold' : 'text-gray-400'}`} />
                      <div>
                        <p className="text-primary font-semibold">{achievement.name}</p>
                        <p className="text-gray-400 text-sm">{achievement.description}</p>
                        <p className={`text-sm ${achievement.earned ? 'text-accent-teal' : 'text-gray-500'}`}>
                          {achievement.earned ? 'Earned' : 'Not Earned'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Teams */}
            <div className="teams-section card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-playfair text-accent-teal flex items-center">
                  <Users className="w-5 h-5 mr-2" /> Teams
                </h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-accent-teal hover:text-accent-coral transition-all flex items-center"
                >
                  <UserPlus className="w-5 h-5 mr-2" /> Invite
                </button>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="btn-primary rounded-full mb-4 flex items-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" /> Create Team
                </button>
              )}
              {project.teams?.length === 0 ? (
                <p className="text-gray-400">No teams yet.</p>
              ) : (
                project.teams.map((team) => (
                  <div key={team.id} className="team-item card p-4 mb-4 flex items-center gap-4">
                    <Users className="w-6 h-6 text-accent-teal" />
                    <div>
                      <p className="text-primary font-semibold">{team.name}</p>
                      <p className="text-gray-400 text-sm">{team.description}</p>
                      <p className="text-gray-400 text-sm">Members: {team.members.join(', ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-playfair text-accent-teal mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.checked })}
                />
                <Mail className="w-5 h-5 text-accent-teal" /> Email Notifications
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, sms: e.target.checked })}
                />
                <Smartphone className="w-5 h-5 text-accent-teal" /> SMS Notifications
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.posts}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, posts: e.target.checked })}
                />
                Notify for Posts
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.tasks}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, tasks: e.target.checked })}
                />
                Notify for Tasks
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationSettings.files}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, files: e.target.checked })}
                />
                Notify for Files
              </label>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="btn-primary rounded-full mt-4 w-full"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Team Creation Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-playfair text-accent-teal mb-4">Create Team</h2>
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              placeholder="Team name..."
              className="input-field w-full mb-2"
            />
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              placeholder="Team description..."
              className="input-field w-full mb-2 h-16"
            />
            <input
              type="text"
              value={newTeam.members.join(', ')}
              onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="Members (comma-separated)..."
              className="input-field w-full mb-2"
            />
            <div className="flex gap-4">
              <button onClick={addTeam} className="btn-primary rounded-full flex-1">Create</button>
              <button
                onClick={() => setShowTeamModal(false)}
                className="btn-primary bg-gray-700 rounded-full flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-playfair text-accent-teal mb-4">Invite to Project</h2>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email to invite..."
              className="input-field w-full mb-4"
            />
            <div className="flex gap-4">
              <button onClick={inviteUser} className="btn-primary rounded-full flex-1">Invite</button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn-primary bg-gray-700 rounded-full flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Suggest Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-playfair text-accent-teal mb-4">{isAdmin ? 'Edit Project' : 'Suggest Edits'}</h2>
            <textarea
              value={editSuggestions}
              onChange={(e) => setEditSuggestions(e.target.value)}
              placeholder={isAdmin ? 'Edit project details...\nTitle: New Title\nDescription: New Description' : 'Suggest changes...'}
              className="input-field w-full h-24 mb-4"
            />
            <div className="flex gap-4">
              <button onClick={submitEditSuggestion} className="btn-primary rounded-full flex-1">
                {isAdmin ? 'Save' : 'Submit'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn-primary bg-gray-700 rounded-full flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHome;