import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import axios from 'axios';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Menu, X, Mic, Users, Award, Bell } from 'lucide-react';
import LazyLoad from 'react-lazy-load';
import FeedItem from '../components/FeedItem';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, notifications } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Initialize Web Speech API for voice navigation
    let recognition;
    if ('webkitSpeechRecognition' in window) {
      recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase().trim();
        console.log('Home - Voice command received:', command);
        if (command.includes('go to projects')) {
          navigate('/projects');
        } else if (command.includes('go to profile')) {
          navigate(`/profile/${user?.username}`);
        } else if (command.includes('go to home')) {
          navigate('/');
        }
      };

      recognition.onerror = (event) => {
        console.error('Home - Voice recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    // Fetch feed items and leaderboard
    if (isLoading) {
      console.log('Home - Waiting for AuthContext to finish loading');
      return;
    }

    if (!isAuthenticated) {
      console.log('Home - User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.email) {
      console.log('Home - User data not available, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const activeProjects = (user.projects || []).filter(project => project && project.status && project.status !== 'Completed');
      console.log('Home - Active projects:', activeProjects);

      const allFeedItems = activeProjects.flatMap(project => {
        const activityLogs = (project.activityLog || []).map(log => ({
          projectId: project._id,
          projectTitle: project.title,
          type: 'activity',
          message: log.message || 'Unknown activity',
          user: log.user || 'Unknown user',
          timestamp: log.timestamp || new Date().toISOString(),
        }));

        const posts = (project.posts || []).map(post => ({
          projectId: project._id,
          projectTitle: project.title,
          type: post.type || 'announcement',
          content: post.content || 'No content',
          author: post.author || 'Unknown author',
          timestamp: post.timestamp || new Date().toISOString(),
          votes: post.votes || [],
          options: post.options || [],
        }));

        const tasks = (project.tasks || []).filter(task => task.status === 'Completed').map(task => ({
          projectId: project._id,
          projectTitle: project.title,
          type: 'task-complete',
          message: `${task.title || 'Unnamed task'} completed`,
          user: task.assignedTo || 'Unassigned',
          timestamp: task.updatedAt || new Date().toISOString(),
        }));

        const files = (project.files || []).map(file => ({
          projectId: project._id,
          projectTitle: project.title,
          type: 'file',
          message: `Shared file: ${file.name || 'Unnamed file'}`,
          user: file.uploadedBy || 'Unknown user',
          timestamp: file.uploadedAt || new Date().toISOString(),
          url: file.url || '#',
        }));

        return [...activityLogs, ...posts, ...tasks, ...files].map(item => ({
          ...item,
          likes: item.likes || 0,
          comments: item.comments || [],
          shares: item.shares || 0,
        }));
      });

      allFeedItems.sort((a, b) => new Date(b.timestamp || new Date()) - new Date(a.timestamp || new Date()));
      setFeedItems(allFeedItems);

      // AI-driven project recommendations (mock implementation)
      const recommendations = activeProjects
        .sort((a, b) => (b.activityLog?.length || 0) - (a.activityLog?.length || 0))
        .slice(0, 3)
        .map(project => ({
          id: project._id,
          title: project.title,
          reason: 'Based on recent activity',
        }));
      setRecommendedProjects(recommendations);

      // Fetch leaderboard data
      const fetchLeaderboards = async () => {
        try {
          const projectLeaderboards = await Promise.all(
            activeProjects.map(async (project) => {
              const response = await axios.get(`http://localhost:3000/api/projects/${project._id}/leaderboard`);
              return response.data;
            })
          );

          const aggregated = {};
          projectLeaderboards.forEach(leaderboard => {
            leaderboard.forEach(entry => {
              if (aggregated[entry.email]) {
                aggregated[entry.email].points += entry.points;
              } else {
                aggregated[entry.email] = { ...entry };
              }
            });
          });

          const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 5);
          setLeaderboard(leaderboardArray);
        } catch (err) {
          console.error('Failed to fetch leaderboard:', err);
          setLeaderboard([]);
        }
      };

      fetchLeaderboards();
    } catch (err) {
      setError('Failed to load feed items: ' + (err.message || 'Please try again.'));
      setFeedItems([]);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isAuthenticated, isLoading, navigate, user]);

  const handleLike = (index) => {
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, likes: (item.likes || 0) + 1 } : item
      )
    );
  };

  const handleCommentSubmit = (index, e) => {
    e.preventDefault();
    const commentText = newComment[index] || '';
    if (!commentText.trim()) return;

    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index
          ? { ...item, comments: [...(item.comments || []), { text: commentText, user: user.email || 'Anonymous', timestamp: new Date().toISOString() }] }
          : item
      )
    );
    setNewComment(prev => ({ ...prev, [index]: '' }));
    setExpandedComments(prev => ({ ...prev, [index]: true }));
  };

  const handleShare = (index) => {
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, shares: (item.shares || 0) + 1 } : item
      )
    );
    alert('Shared! (This is a mock action—implement sharing logic as needed.)');
  };

  const toggleComments = (index) => {
    setExpandedComments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleVoiceNavigation = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
    }
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-neon-magenta text-xl font-orbitron ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-lg font-orbitron">{authError || error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-cyber-teal text-lg font-orbitron">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <div className={`sidebar fixed lg:static inset-y-0 left-0 z-50 lg:z-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-cyber-teal p-4 flex flex-col gap-4 lg:flex`}>
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h2 className="text-xl font-orbitron font-semibold text-neon-magenta">Activity Summary</h2>
          <button
            className="lg:hidden text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            {(user.projects || []).filter(p => p.status !== 'Completed').slice(0, 5).map(project => (
              <div key={project._id} className="sidebar-item p-3 bg-neon-magenta bg-opacity-20 rounded-lg">
                <Link to={`/projects/${project._id}`} className="text-holo-silver font-inter font-medium hover:underline">{project.title}</Link>
                <p className="text-light-text text-sm font-inter">Status: {project.status}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-holo-silver" />
                  <span className="text-light-text text-xs font-inter">{project.members?.length || 0} active users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-4 lg:p-8">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <button
            className="lg:hidden text-holo-silver focus:outline-none focus:ring-2 focus:ring-holo-silver"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-1 rounded-full ${isListening ? 'bg-neon-magenta' : 'bg-cyber-teal'} text-light-text focus:outline-none focus:ring-2 focus:ring-holo-silver`}
            onClick={toggleVoiceNavigation}
            aria-label={isListening ? "Stop voice navigation" : "Start voice navigation"}
          >
            <Mic className="w-5 h-5" />
            {isListening ? 'Listening...' : 'Voice Navigation'}
          </button>
        </div>

        <div className="home-header mb-8">
          <h1 className="text-4xl font-orbitron font-bold text-neon-magenta mb-2 animate-text-glow">
            Welcome to ShareSync, {user.firstName}!
          </h1>
          <p className="text-cyber-teal text-lg font-inter">
            Stay connected with all your active projects in a futuristic workspace.
          </p>
        </div>

        {/* Notifications */}
        <div className="notifications-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Notifications
          </h2>
          {notifications.length === 0 ? (
            <p className="text-cyber-teal font-inter">No notifications yet.</p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notif, index) => (
                <li key={index} className="text-light-text font-inter p-2 bg-cyber-teal bg-opacity-20 rounded">
                  {notif.message} - {new Date(notif.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section mb-8 card p-6 glassmorphic">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Overall Leaderboard
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

        {/* AI-Driven Project Recommendations */}
        {recommendedProjects.length > 0 && (
          <div className="recommendations-section mb-8">
            <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-4">Recommended Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedProjects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="recommendation-card card p-4 glassmorphic animate-fade-in"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h3 className="text-lg font-orbitron font-medium text-neon-magenta">{project.title}</h3>
                  <p className="text-cyber-teal text-sm font-inter">{project.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feed Section */}
        <div className="feed-container">
          <h2 className="text-2xl font-orbitron font-semibold text-neon-magenta mb-6 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-holo-silver animate-pulse" aria-hidden="true" /> Project Activity Feed
          </h2>
          {feedItems.length === 0 ? (
            <p className="text-cyber-teal flex items-center gap-2 font-inter">
              <AlertCircle className="w-5 h-5 text-holo-silver animate-pulse" aria-hidden="true" /> No recent activity in your active projects.
            </p>
          ) : (
            <div className="space-y-6">
              {feedItems.map((item, index) => (
                <LazyLoad key={index} height={200} offset={100}>
                  <FeedItem
                    item={item}
                    index={index}
                    newComment={newComment}
                    expandedComments={expandedComments}
                    handleLike={handleLike}
                    handleCommentSubmit={handleCommentSubmit}
                    toggleComments={toggleComments}
                    handleShare={handleShare}
                    user={user}
                  />
                </LazyLoad>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;