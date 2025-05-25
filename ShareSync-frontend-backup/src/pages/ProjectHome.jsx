import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { CheckCircle, MessageSquare, ThumbsUp, Share2, Award } from 'lucide-react';
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
  comments: [
    { id: 'c1', text: 'Great progress so far!', user: 'Alice', timestamp: new Date().toISOString(), likes: 3 },
  ],
  posts: [
    { id: 'p1', text: 'Just finished the UI design!', user: 'Bob', timestamp: new Date().toISOString(), likes: 5 },
  ],
  achievements: [
    { id: 'a1', name: 'Task Master', description: 'Completed 5 tasks', earned: true },
    { id: 'a2', name: 'On-Time Hero', description: 'Completed a task on time', earned: false },
  ],
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

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id) throw new Error('Project ID is missing');
        console.log('ProjectHome - Fetching project');
        setProject(mockProject);
        setComments(mockProject.comments || []);
      } catch (err) {
        console.error('ProjectHome - Error fetching project:', err.message, err.stack);
        setError('Failed to load project: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (socket) {
      socket.on('message', (message) => {
        if (message.projectId === id) {
          setMessages((prev) => [...prev, message]);
        }
      });

      socket.on('comment', (comment) => {
        if (comment.projectId === id) {
          setComments((prev) => [...prev, comment]);
        }
      });

      socket.on('post', (post) => {
        if (post.projectId === id) {
          setProject((prev) => ({
            ...prev,
            posts: [...(prev.posts || []), post],
          }));
        }
      });

      socket.on('metric-update', (update) => {
        setProject((prev) => ({
          ...prev,
          tasksCompleted: update.tasksCompleted || prev.tasksCompleted,
          totalTasks: update.totalTasks || prev.totalTasks,
        }));
      });
    } else {
      console.warn('Socket is not initialized');
    }

    if (isAuthenticated) {
      fetchProject();
    } else {
      console.log('ProjectHome - Not authenticated, navigating to login');
      navigate('/login', { replace: true });
    }

    return () => {
      if (socket) {
        socket.off('message');
        socket.off('comment');
        socket.off('post');
        socket.off('metric-update');
      }
    };
  }, [id, isAuthenticated, navigate, socket]);

  const sendMessage = () => {
    if (!newMessage || !socket) return;
    const message = { projectId: id, text: newMessage, user: user?.email || 'Guest', timestamp: new Date().toISOString() };
    socket.emit('message', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
    socket.emit('notification', { message: `New message in Project ${id} by ${user?.email || 'Guest'}`, userId: user?.username });
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
    socket.emit('notification', { message: `New comment in Project ${id} by ${user?.email || 'Guest'}`, userId: user?.username });
  };

  const addPost = () => {
    if (!newPost || !socket) return;
    const post = {
      id: `p${project.posts?.length + 1 || 1}`,
      projectId: id,
      text: newPost,
      user: user?.email || 'Guest',
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    socket.emit('post', post);
    setProject((prev) => ({
      ...prev,
      posts: [...(prev.posts || []), post],
    }));
    setNewPost('');
    socket.emit('notification', { message: `New post in Project ${id} by ${user?.email || 'Guest'}`, userId: user?.username });
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
      socket.emit('notification', { message: `${user?.email || 'Guest'} liked a comment in Project ${id}`, userId: user?.username });
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
      socket.emit('notification', { message: `${user?.email || 'Guest'} liked a post in Project ${id}`, userId: user?.username });
    }
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
        backgroundColor: ['#26C6DA', '#A0A0A0'],
        borderColor: ['#0A1A2F', '#0A1A2F'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="project-home-container">
      <div className="project-home-header">
        <h1 className="text-3xl font-inter text-primary">{project.title || 'Untitled'}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Project Details */}
          <div className="project-details bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4">Project Details</h2>
            <p className="text-gray-400 mb-4">{project.description || 'No description'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-primary flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Status: {project.status || 'Unknown'}
                </span>
                <div className="progress-bar mt-2">
                  <div className="progress-fill" style={{ width: `${statusProgress}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-primary">Category: <span className="text-accent-gold">{project.category}</span></p>
                <p className="text-primary mt-2">
                  Progress: <span className="text-accent-gold">{project.tasksCompleted}/{project.totalTasks} tasks completed</span>
                </p>
              </div>
            </div>
          </div>

          {/* Project Overview with Chart */}
          <div className="project-overview bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4">Project Overview</h2>
            <div className="chart-container">
              <Bar data={taskProgressData} options={chartOptions} />
            </div>
          </div>

          {/* Social Feed */}
          <div className="social-feed">
            <h2 className="text-xl font-inter text-accent-teal mb-4">Project Feed</h2>
            <div className="post-input bg-glass p-4 rounded-lg shadow-soft mb-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share an update..."
                className="input-field w-full mb-2"
              />
              <button onClick={addPost} className="btn-primary">Post Update</button>
            </div>
            {project.posts?.map((post) => (
              <div key={post.id} className="post-item bg-glass p-4 rounded-lg shadow-soft mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-primary font-semibold">{post.user}</span>
                  <span className="text-gray-400 text-sm ml-2">{new Date(post.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-primary">{post.text}</p>
                <div className="flex items-center mt-2 gap-4">
                  <button
                    onClick={() => handleLike(post.id, 'post')}
                    className="flex items-center text-accent-teal hover:text-accent-gold transition-all"
                  >
                    <ThumbsUp className="w-5 h-5 mr-1" /> {post.likes || 0} Likes
                  </button>
                  <button className="flex items-center text-accent-teal hover:text-accent-gold transition-all">
                    <MessageSquare className="w-5 h-5 mr-1" /> Comment
                  </button>
                  <button className="flex items-center text-accent-teal hover:text-accent-gold transition-all">
                    <Share2 className="w-5 h-5 mr-1" /> Share
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <h2 className="text-xl font-inter text-accent-teal mb-4">Comments</h2>
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item bg-glass p-4 rounded-lg mb-4 shadow-soft">
                  <div className="flex items-center mb-2">
                    <span className="text-primary font-semibold">{comment.user}</span>
                    <span className="text-gray-400 text-sm ml-2">{new Date(comment.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-primary">{comment.text}</p>
                  <div className="flex items-center mt-2 gap-4">
                    <button
                      onClick={() => handleLike(comment.id, 'comment')}
                      className="flex items-center text-accent-teal hover:text-accent-gold transition-all"
                    >
                      <ThumbsUp className="w-5 h-5 mr-1" /> {post.likes || 0} Likes
                    </button>
                    <button className="flex items-center text-accent-teal hover:text-accent-gold transition-all">
                      <MessageSquare className="w-5 h-5 mr-1" /> Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="comment-input flex gap-4 mt-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input-field flex-1"
              />
              <button onClick={addComment} className="btn-primary">Post</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          {/* Project Chat */}
          <div className="chat-section bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" /> Project Chat
            </h2>
            <div className="messages bg-glass p-4 rounded-lg shadow-soft h-64 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="message-item mb-2">
                  <strong className="text-primary">{msg.user}:</strong> {msg.text}
                  <span className="text-gray-400 text-sm ml-2">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="chat-input flex gap-4 mt-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="input-field flex-1"
              />
              <button onClick={sendMessage} className="btn-primary">Send</button>
            </div>
          </div>

          {/* Achievements (Gamification) */}
          <div className="achievements-section bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" /> Achievements
            </h2>
            {project.achievements.map((achievement) => (
              <div key={achievement.id} className={`achievement-item p-4 rounded-lg mb-4 ${achievement.earned ? 'bg-teal-900' : 'bg-gray-700'} bg-opacity-20`}>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHome;