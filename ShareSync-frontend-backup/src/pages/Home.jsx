import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ThumbsUp, MessageSquare, Share2, Bell, Folder } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './Home.css';

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
};

const Home = () => {
  const { user, isAuthenticated, globalMetrics, socket } = useContext(AuthContext);
  const [projectFeed, setProjectFeed] = useState([
    { id: '1', project: 'Project Alpha', type: 'post', user: 'Alice', content: 'Just posted an update on our UI design!', timestamp: '2 hours ago', likes: 5, projectId: '1' },
    { id: '2', project: 'Project Beta', type: 'task', user: 'Bob', content: 'Completed task: Backend API Integration', timestamp: '5 hours ago', projectId: '2' },
    { id: '3', project: 'Project Gamma', type: 'announcement', user: 'Charlie', content: 'Team meeting scheduled for tomorrow at 10 AM', timestamp: '1 day ago', projectId: '3' },
  ]);
  const [newPost, setNewPost] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        if (notification.userId !== user?.username) {
          setNotifications((prev) => [notification, ...prev].slice(0, 10)); // Keep only the latest 10 notifications
          // Simulate Facebook-like notification sound (optional)
          const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
          audio.play().catch((err) => console.warn('Audio playback failed:', err));
        }
      });

      socket.on('post', (post) => {
        setProjectFeed((prev) => [
          { id: `post-${prev.length + 1}`, project: 'Unknown', type: 'post', ...post },
          ...prev,
        ]);
      });
    } else {
      console.warn('Socket is not initialized');
    }

    return () => {
      if (socket) {
        socket.off('notification');
        socket.off('post');
      }
    };
  }, [socket, user]);

  const handlePost = () => {
    if (!newPost || !socket) return;
    const post = {
      id: `post-${projectFeed.length + 1}`,
      project: 'General',
      type: 'post',
      user: user?.email || 'Guest',
      content: newPost,
      timestamp: new Date().toISOString(),
      likes: 0,
      projectId: '0',
    };
    socket.emit('post', post);
    setProjectFeed((prev) => [post, ...prev]);
    setNewPost('');
    socket.emit('notification', { message: `New post by ${user?.email || 'Guest'}`, userId: user?.username });
  };

  const handleLike = (itemId) => {
    if (!socket) return;
    setProjectFeed((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, likes: (item.likes || 0) + 1 } : item
      )
    );
    socket.emit('notification', { message: `${user?.email || 'Guest'} liked a post`, userId: user?.username });
  };

  const totalProjects = globalMetrics?.totalProjects ?? 0;
  const tasksCompleted = globalMetrics?.tasksCompleted ?? 0;
  const notificationsCount = globalMetrics?.notifications ?? 0;

  const metricsData = {
    labels: ['Total Projects', 'Tasks Completed'],
    datasets: [
      {
        label: 'Metrics',
        data: [totalProjects, tasksCompleted],
        backgroundColor: ['#26C6DA', '#FFD700'],
        borderColor: ['#0A1A2F', '#0A1A2F'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="home-container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto p-6">
        {/* Left Sidebar */}
        <div className="col-span-1 hidden md:block">
          <div className="sidebar bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center relative">
              <Bell className="w-5 h-5 mr-2 cursor-pointer" onClick={() => setShowNotifications(!showNotifications)} />
              Notifications ({notificationsCount})
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </h2>
            {showNotifications && (
              <div className="notifications-dropdown bg-glass p-4 rounded-lg shadow-soft max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <div key={index} className="notification-item p-2 border-b border-gray-700 last:border-b-0">
                      <p className="text-gray-400 text-sm">{notif.message}</p>
                      <p className="text-gray-500 text-xs">{new Date().toLocaleTimeString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No notifications yet.</p>
                )}
              </div>
            )}
            <h2 className="text-xl font-inter text-accent-teal mt-6 mb-4">Quick Links</h2>
            <ul>
              <li><Link to="/projects" className="text-accent-teal hover:underline">Projects</Link></li>
              <li><Link to={`/profile/${user?.username || 'johndoe'}`} className="text-accent-teal hover:underline">Profile</Link></li>
              <li><Link to="/projects/create" className="text-accent-teal hover:underline">Create Project</Link></li>
            </ul>
          </div>
        </div>
        {/* Main Feed */}
        <div className="col-span-1 md:col-span-2">
          <div className="feed bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4">Project Feed</h2>
            <div className="post-input bg-glass p-4 rounded-lg shadow-soft mb-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share an update..."
                className="input-field w-full mb-2"
              />
              <button onClick={handlePost} className="btn-primary">Post</button>
            </div>
            {projectFeed.length === 0 ? (
              <p className="text-gray-400">No updates yet. Join a project to see what’s happening!</p>
            ) : (
              <div className="space-y-4">
                {projectFeed.map((item) => (
                  <div
                    key={item.id}
                    className="feed-item bg-glass p-4 rounded-lg shadow-soft transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-primary font-semibold">{item.user}</span>
                      <span className="text-gray-400 mx-2">in</span>
                      <Link to={`/projects/${item.projectId}`} className="text-accent-teal hover:underline">
                        {item.project}
                      </Link>
                    </div>
                    <p className="text-primary">{item.content}</p>
                    <p className="text-gray-400 text-sm mt-1">{item.timestamp}</p>
                    <div className="flex items-center mt-3 gap-4">
                      <button
                        onClick={() => handleLike(item.id)}
                        className="flex items-center text-accent-teal hover:text-accent-gold transition-all"
                      >
                        <ThumbsUp className="w-5 h-5 mr-1" /> {item.likes || 0} Likes
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
            )}
          </div>
        </div>
        {/* Right Sidebar */}
        <div className="col-span-1 hidden md:block">
          <div className="trending bg-glass p-6 rounded-lg shadow-soft">
            <h2 className="text-xl font-inter text-accent-teal mb-4 flex items-center">
              <Folder className="w-5 h-5 mr-2" /> Trending Projects
            </h2>
            <div className="space-y-4">
              <div>
                <Link to="/projects/1" className="text-primary font-semibold hover:underline">Project Alpha</Link>
                <p className="text-gray-400 text-sm">5 new posts this week</p>
              </div>
              <div>
                <Link to="/projects/2" className="text-primary font-semibold hover:underline">Project Beta</Link>
                <p className="text-gray-400 text-sm">3 tasks completed</p>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="text-xl font-inter text-accent-teal mb-4">Metrics Overview</h2>
              {totalProjects > 0 || tasksCompleted > 0 ? (
                <div className="chart-container">
                  <Doughnut data={metricsData} options={chartOptions} />
                </div>
              ) : (
                <p className="text-gray-400">No metrics available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;