import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Users, Award, Star, MessageCircle, Menu, X } from 'lucide-react';
import FeedItem from '../components/FeedItem';
import { fetchLeaderboard } from '../services/project.js';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, socket, fetchUserData } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!user || !user.email) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchFeedItems = () => {
      try {
        const activeProjects = (user.projects || []).filter(project => project && project.status && project.status !== 'Completed');

        const allFeedItems = activeProjects.flatMap(project => {
          const activityLogs = (project.activityLog || []).map(log => ({
            projectId: project._id,
            projectTitle: project.title,
            type: 'activity',
            message: log.message || 'Unknown activity',
            user: log.user || 'Unknown user',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: log.timestamp || new Date().toISOString(),
            userId: log.userId || null,
          }));

          const posts = (project.posts || []).map(post => ({
            projectId: project._id,
            projectTitle: project.title,
            type: post.type || 'announcement',
            content: post.content || 'No content',
            author: post.author || 'Unknown author',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: post.timestamp || new Date().toISOString(),
            votes: post.votes || [],
            options: post.options || [],
            userId: post.userId || null,
          }));

          const tasks = (project.tasks || []).filter(task => task.status === 'Completed').map(task => ({
            projectId: project._id,
            projectTitle: project.title,
            type: 'task-complete',
            message: `${task.title || 'Unnamed task'} completed`,
            user: task.assignedTo || 'Unassigned',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: task.updatedAt || new Date().toISOString(),
            userId: task.userId || null,
          }));

          const files = (project.files || []).map(file => ({
            projectId: project._id,
            projectTitle: project.title,
            type: 'file',
            message: `Shared file: ${file.name || 'Unnamed file'}`,
            user: file.uploadedBy || 'Unknown user',
            profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
            timestamp: file.uploadedAt || new Date().toISOString(),
            url: file.url || '#',
            userId: file.userId || null,
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

        const recommendProjects = () => {
          const projectsWithActivity = activeProjects.map(project => {
            const latestActivity = [
              ...(project.activityLog || []),
              ...(project.posts || []),
              ...(project.tasks || []),
              ...(project.files || []),
            ].map(item => item.timestamp || new Date().toISOString())
             .sort((a, b) => new Date(b) - new Date(a))[0];

            const userInteractionCount = (project.activityLog || []).filter(log => log.user === user.email).length;

            return {
              id: project._id,
              title: project.title,
              latestActivity: latestActivity || new Date().toISOString(),
              userInteractionCount,
              hasUserInteraction: userInteractionCount > 0,
            };
          });

          const recommendations = projectsWithActivity
            .sort((a, b) => {
              if (a.hasUserInteraction && !b.hasUserInteraction) return 1;
              if (!a.hasUserInteraction && b.hasUserInteraction) return -1;
              if (a.userInteractionCount !== b.userInteractionCount) {
                return b.userInteractionCount - a.userInteractionCount;
              }
              return new Date(b.latestActivity) - new Date(a.latestActivity);
            })
            .slice(0, 3)
            .map(project => ({
              id: project.id,
              title: project.title,
              reason: project.hasUserInteraction
                ? 'You’ve been active here recently'
                : 'Active project with recent updates',
            }));

          setRecommendedProjects(recommendations);
        };

        recommendProjects();

        const fetchLeaderboards = async () => {
          try {
            const projectLeaderboards = await Promise.all(
              activeProjects.map(async (project) => {
                const response = await fetchLeaderboard(project._id);
                return response;
              })
            );

            const aggregated = {};
            projectLeaderboards.forEach(leaderboard => {
              leaderboard.forEach(entry => {
                if (aggregated[entry.email]) {
                  aggregated[entry.email].points += entry.points;
                  aggregated[entry.email].achievements = [...new Set([...(aggregated[entry.email].achievements || []), ...(entry.achievements || [])])];
                } else {
                  aggregated[entry.email] = { ...entry };
                }
              });
            });

            const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 5);
            setLeaderboard(leaderboardArray);
          } catch (err) {
            setLeaderboard([]);
          }
        };

        fetchLeaderboards();

        if (activeProjects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(activeProjects[0]._id);
        }
      } catch (err) {
        setError('Failed to load feed items: ' + (err.message || 'Please try again.'));
        setFeedItems([]);
      }
    };

    fetchFeedItems();

    if (socket) {
      socket.on('project-updated', () => {
        fetchUserData();
      });

      socket.on('feed-update', (data) => {
        setFeedItems((prev) => {
          const updatedItems = [...prev, data].sort(
            (a, b) => new Date(b.timestamp || new Date()) - new Date(a.timestamp || new Date())
          );
          return updatedItems;
        });
      });

      socket.on('chat-message', (message) => {
        if (message.projectId === selectedProjectId) {
          setMessages((prev) => [...prev, message]);
        }
      });

      return () => {
        socket.off('project-updated');
        socket.off('feed-update');
        socket.off('chat-message');
      };
    }
  }, [isAuthenticated, isLoading, navigate, user, socket, fetchUserData, selectedProjectId]);

  const handleLike = (index) => {
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, likes: (item.likes || 0) + 1 } : item
      )
    );
    if (socket) {
      socket.emit('feed-like', { item: feedItems[index], userId: user?._id });
      if (feedItems[index].userId && feedItems[index].userId !== user._id) {
        socket.emit('notification', {
          user: feedItems[index].userId,
          message: `${user.username} liked your activity in project "${feedItems[index].projectTitle}"`,
        });
      }
    }
  };

  const handleCommentSubmit = (index, e) => {
    e.preventDefault();
    const commentText = newComment[index] || '';
    if (!commentText.trim()) return;

    const mentions = commentText.match(/@(\w+)/g)?.map(mention => mention.slice(1)) || [];

    const newCommentData = {
      text: commentText,
      user: user.email || 'Anonymous',
      userId: user._id,
      username: user.username,
      profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
      timestamp: new Date().toISOString(),
    };

    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index
          ? { ...item, comments: [...(item.comments || []), newCommentData] }
          : item
      )
    );
    setNewComment(prev => ({ ...prev, [index]: '' }));
    setExpandedComments(prev => ({ ...prev, [index]: true }));

    if (socket) {
      socket.emit('feed-comment', { item: feedItems[index], comment: newCommentData, userId: user?._id });
      if (feedItems[index].userId && feedItems[index].userId !== user._id) {
        socket.emit('notification', {
          user: feedItems[index].userId,
          message: `${user.username} commented on your activity in project "${feedItems[index].projectTitle}"`,
        });
      }
      if (mentions.length > 0) {
        mentions.forEach(mentionedUser => {
          socket.emit('notification', {
            user: mentionedUser,
            message: `${user.username} mentioned you in a comment in project "${feedItems[index].projectTitle}"`,
          });
        });
      }
    }
  };

  const handleShare = (index) => {
    setFeedItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, shares: (item.shares || 0) + 1 } : item
      )
    );
    alert('Shared! (This is a mock action—implement sharing logic as needed.)');
    if (socket) {
      socket.emit('feed-share', { item: feedItems[index], userId: user?._id });
      if (feedItems[index].userId && feedItems[index].userId !== user._id) {
        socket.emit('notification', {
          user: feedItems[index].userId,
          message: `${user.username} shared your activity in project "${feedItems[index].projectTitle}"`,
        });
      }
    }
  };

  const toggleComments = (index) => {
    setExpandedComments(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedProjectId) return;

    const messageData = {
      projectId: selectedProjectId,
      text: newMessage,
      user: user.email,
      userId: user._id,
      username: user.username,
      profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
      timestamp: new Date().toISOString(),
    };

    socket.emit('chat-message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
  };

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen(!isLeftSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-gray-300 text-xl font-inter ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-400 text-lg font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {authError || error}
          </p>
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
          <p className="text-gray-300 text-lg font-inter">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container flex min-h-screen bg-navy-dark">
      {/* Left Sidebar */}
      <div className={`left-sidebar fixed lg:static inset-y-0 left-0 z-50 lg:z-0 transform ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-gray-900 p-4 flex flex-col gap-4 lg:flex`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-orbitron font-semibold text-cyan-neon">Projects</h2>
          <button
            className="lg:hidden text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-neon"
            onClick={toggleLeftSidebar}
            aria-label={isLeftSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {(user.projects || []).filter(p => p.status !== 'Completed').map(project => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300 font-inter text-sm"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-cyan-neon" />
                  <span>{project.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-xs">{project.members?.length || 0} members</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content flex-1 p-4 lg:p-6">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <button
            className="lg:hidden text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-neon"
            onClick={toggleLeftSidebar}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="home-header mb-6 glassmorphic p-6 rounded-xl">
          <div className="flex items-center gap-3">
            <img
              src={user.profilePicture || 'https://via.placeholder.com/40'}
              alt={`${user.firstName}'s profile`}
              className="w-10 h-10 rounded-full border-2 border-cyan-neon shadow-glow"
            />
            <h1 className="text-3xl font-orbitron font-bold text-white neon-glow">
              Welcome to ShareSync, {user.firstName}!
            </h1>
          </div>
          <p className="text-gray-300 text-lg font-inter mt-2">
            Collaborate seamlessly in a futuristic workspace.
          </p>
        </div>

        {/* Feed Section */}
        <div className="feed-container">
          <h2 className="text-xl font-orbitron font-semibold text-white mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-cyan-neon" aria-hidden="true" /> Project Activity Feed
          </h2>
          {feedItems.length === 0 ? (
            <p className="text-gray-300 flex items-center gap-2 font-inter">
              <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" /> No recent activity in your active projects.
            </p>
          ) : (
            <div className="space-y-4">
              {feedItems.map((item, index) => (
                <div key={index}>
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
                    setNewComment={setNewComment}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar w-full lg:w-80 p-4 lg:p-6 glassmorphic">
        {/* Project Chat */}
        <div className="chat-section mb-6">
          <h3 className="text-lg font-orbitron font-semibold text-white mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-cyan-neon" aria-hidden="true" /> Project Chat
          </h3>
          <div className="mb-4">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 bg-gray-800 text-gray-300 rounded-md font-inter border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-neon"
              aria-label="Select Project for Chat"
            >
              {(user.projects || []).filter(p => p.status !== 'Completed').map(project => (
                <option key={project._id} value={project._id} className="bg-gray-800 text-gray-300">{project.title}</option>
              ))}
            </select>
          </div>
          <div className="messages bg-gray-800 border border-gray-700 rounded-md p-4 h-64 overflow-y-auto mb-4">
            {messages.map((msg, index) => (
              <div key={index} className="flex items-start gap-2 mb-2">
                <img
                  src={msg.profilePicture}
                  alt={`${msg.user}'s profile`}
                  className="w-6 h-6 rounded-full border border-cyan-neon shadow-glow"
                />
                <div>
                  <p className="text-white font-inter font-medium text-sm">{msg.username}</p>
                  <p className="text-gray-300 font-inter text-sm">{msg.text}</p>
                  <p className="text-gray-500 font-inter text-xs">{new Date(msg.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 bg-gray-800 text-gray-300 rounded-full font-inter border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-neon"
              placeholder="Type a message..."
              aria-label="Chat Message"
            />
            <button
              onClick={sendMessage}
              className="bg-cyan-neon text-navy-dark p-2 rounded-full hover:bg-magenta-neon focus:outline-none focus:ring-2 focus:ring-cyan-neon holographic-effect"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section mb-6">
          <h3 className="text-lg font-orbitron font-semibold text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-cyan-neon" aria-hidden="true" /> Overall Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-gray-300 font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" /> No leaderboard data available.
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={index} className="leaderboard-item bg-gray-800 border border-gray-700 p-3 rounded-md flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={entry.profilePicture || 'https://via.placeholder.com/32'}
                      alt={`${entry.username}'s profile`}
                      className="w-8 h-8 rounded-full border-2 border-cyan-neon shadow-glow"
                    />
                    <div>
                      <span className={`text-lg font-orbitron ${index === 0 ? 'text-magenta-neon' : index === 1 ? 'text-purple-soft' : 'text-cyan-neon'}`}>
                        #{index + 1}
                      </span>
                      <p className="text-white font-inter">{entry.username}</p>
                      {entry.achievements && entry.achievements.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {entry.achievements.slice(0, 3).map((achievement, idx) => (
                            <Star key={idx} className="w-4 h-4 text-yellow-400" title={achievement} aria-hidden="true" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 font-inter">{entry.points} points</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        {recommendedProjects.length > 0 && (
          <div className="recommendations-section">
            <h3 className="text-lg font-orbitron font-semibold text-white mb-4">Recommended Projects</h3>
            <div className="space-y-3">
              {recommendedProjects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="recommendation-card bg-gray-800 border border-gray-700 p-4 rounded-md block hover:border-cyan-neon holographic-effect"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h4 className="text-md font-orbitron font-medium text-cyan-neon">{project.title}</h4>
                  <p className="text-gray-300 text-sm font-inter">{project.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;