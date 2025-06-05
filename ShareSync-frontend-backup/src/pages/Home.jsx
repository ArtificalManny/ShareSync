import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Users, Award, Star, MessageCircle, Search, User, BarChart2, PieChart, Briefcase } from 'lucide-react';
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
  const [userStats, setUserStats] = useState({ tasksCompleted: 0, totalTasks: 0 });

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

            const activityLevel = (project.activityLog || []).length + (project.posts || []).length + (project.tasks || []).length;

            return {
              id: project._id,
              title: project.title,
              latestActivity: latestActivity || new Date().toISOString(),
              userInteractionCount,
              hasUserInteraction: userInteractionCount > 0,
              activityLevel,
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
              activityLevel: project.activityLevel,
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

        const fetchUserStats = () => {
          let tasksCompleted = 0;
          let totalTasks = 0;
          activeProjects.forEach(project => {
            const projectTasks = project.tasks || [];
            tasksCompleted += projectTasks.filter(task => task.status === 'Completed').length;
            totalTasks += projectTasks.length;
          });
          setUserStats({ tasksCompleted, totalTasks });
        };

        fetchUserStats();

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
    <div className="home-container flex flex-col min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="header fixed top-0 left-0 right-0 bg-dark-secondary border-b border-gray-600 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-orbitron font-bold text-orange-accent">ShareSync</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-10 pr-4 py-2 border border-gray-600 rounded-full bg-dark-bg text-gray-300 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-teal-accent"
                aria-label="Search projects"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
              <img
                src={user.profilePicture || 'https://via.placeholder.com/32'}
                alt={`${user.firstName}'s profile`}
                className="w-8 h-8 rounded-full border-2 border-teal-accent"
              />
              <span className="text-gray-300 font-inter text-sm">{user.firstName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 mt-16">
        {/* Left Sidebar */}
        <aside className="left-sidebar w-64 bg-dark-secondary border-r border-gray-600 p-4 flex-shrink-0">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-teal-accent" aria-hidden="true" />
              <h2 className="text-lg font-orbitron font-semibold text-white">Your Profile</h2>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={user.profilePicture || 'https://via.placeholder.com/40'}
                alt={`${user.firstName}'s profile`}
                className="w-10 h-10 rounded-full border-2 border-teal-accent"
              />
              <div>
                <p className="text-white font-inter font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-gray-400 font-inter text-sm">{user.email}</p>
              </div>
            </div>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#2a2e39"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  strokeWidth="10"
                  strokeDasharray="283"
                  strokeDashoffset={283 * (1 - (userStats.tasksCompleted / (userStats.totalTasks || 1)))}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00c4b4', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <text x="50" y="55" textAnchor="middle" className="text-white font-orbitron text-xl font-semibold">
                  {Math.round((userStats.tasksCompleted / (userStats.totalTasks || 1)) * 100)}%
                </text>
              </svg>
              <p className="text-center text-gray-400 font-inter text-sm mt-2">Tasks Completed</p>
            </div>
          </div>
          <nav>
            <Link to="/projects" className="flex items-center gap-2 p-2 hover:bg-dark-bg rounded-md">
              <Folder className="w-5 h-5 text-teal-accent" aria-hidden="true" />
              <span className="text-gray-300 font-inter text-sm">Projects</span>
            </Link>
            <Link to={`/profile/${user.username}`} className="flex items-center gap-2 p-2 hover:bg-dark-bg rounded-md">
              <User className="w-5 h-5 text-teal-accent" aria-hidden="true" />
              <span className="text-gray-300 font-inter text-sm">Profile</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content flex-1 p-4 lg:p-6 bg-white">
          <div className="home-header mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-6 h-6 text-blue-accent" aria-hidden="true" />
              <h1 className="text-2xl font-orbitron font-semibold text-black">
                Project Activity Feed
              </h1>
            </div>
            <p className="text-gray-600 text-base font-inter">
              Stay updated with the latest activity in your projects.
            </p>
          </div>

          <div className="feed-container">
            {feedItems.length === 0 ? (
              <p className="text-gray-600 flex items-center gap-2 font-inter">
                <AlertCircle className="w-5 h-5 text-red-accent" aria-hidden="true" /> No recent activity in your active projects.
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
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar w-80 bg-light-bg border-l border-gray-200 p-4 flex-shrink-0">
          {/* Project Chat */}
          <div className="chat-section mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-blue-accent" aria-hidden="true" />
              <h2 className="text-lg font-orbitron font-semibold text-black">Project Chat</h2>
            </div>
            <div className="mb-4">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md font-inter text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-accent"
                aria-label="Select Project for Chat"
              >
                {(user.projects || []).filter(p => p.status !== 'Completed').map(project => (
                  <option key={project._id} value={project._id}>{project.title}</option>
                ))}
              </select>
            </div>
            <div className="messages bg-white border border-gray-200 rounded-md p-4 h-64 overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2 mb-2">
                  <img
                    src={msg.profilePicture}
                    alt={`${msg.user}'s profile`}
                    className="w-6 h-6 rounded-full border border-gray-300"
                  />
                  <div>
                    <p className="text-gray-800 font-inter font-medium text-sm">{msg.username}</p>
                    <p className="text-gray-700 font-inter text-sm">{msg.text}</p>
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
                className="flex-1 p-2 border border-gray-300 rounded-full font-inter text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-accent"
                placeholder="Type a message..."
                aria-label="Chat Message"
              />
              <button
                onClick={sendMessage}
                className="bg-red-accent text-white p-2 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-accent micro-gradient"
                aria-label="Send Message"
              >
                <Send className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="leaderboard-section mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-blue-accent" aria-hidden="true" />
              <h2 className="text-lg font-orbitron font-semibold text-black">Leaderboard</h2>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-gray-600 font-inter flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-accent" aria-hidden="true" /> No leaderboard data available.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 p-4 rounded-md">
                  <svg className="w-full h-40" viewBox={`0 0 ${leaderboard.length * 60} 100`}>
                    {leaderboard.map((entry, index) => (
                      <g key={index} transform={`translate(${index * 60}, 0)`}>
                        <rect
                          x="10"
                          y={100 - (entry.points / Math.max(...leaderboard.map(e => e.points)) * 80)}
                          width="40"
                          height={(entry.points / Math.max(...leaderboard.map(e => e.points)) * 80)}
                          fill={`url(#bar-gradient-${index})`}
                        />
                        <defs>
                          <linearGradient id={`bar-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: index === 0 ? '#f5a623' : index === 1 ? '#00c4b4' : '#a0aec0', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: index === 0 ? '#e69500' : index === 1 ? '#009b8b' : '#718096', stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <text x="30" y="95" textAnchor="middle" className="text-gray-700 font-inter text-xs">{entry.username}</text>
                        <text x="30" y={100 - (entry.points / Math.max(...leaderboard.map(e => e.points)) * 80) - 5} textAnchor="middle" className="text-gray-700 font-inter text-xs">{entry.points}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                {leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-item bg-white border border-gray-200 p-3 rounded-md flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img
                        src={entry.profilePicture || 'https://via.placeholder.com/32'}
                        alt={`${entry.username}'s profile`}
                        className="w-8 h-8 rounded-full border border-gray-300"
                      />
                      <div>
                        <span className={`text-lg font-orbitron ${index === 0 ? 'text-orange-accent' : index === 1 ? 'text-teal-accent' : 'text-gray-500'}`}>
                          #{index + 1}
                        </span>
                        <p className="text-gray-800 font-inter">{entry.username}</p>
                        {entry.achievements && entry.achievements.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {entry.achievements.slice(0, 3).map((achievement, idx) => (
                              <Star key={idx} className="w-4 h-4 text-yellow-500" title={achievement} aria-hidden="true" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-600 font-inter">{entry.points} points</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations Section */}
          {recommendedProjects.length > 0 && (
            <div className="recommendations-section">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-blue-accent" aria-hidden="true" />
                <h2 className="text-lg font-orbitron font-semibold text-black">Recommended Projects</h2>
              </div>
              <div className="space-y-3">
                {recommendedProjects.map(project => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="recommendation-card bg-white border border-gray-200 p-4 rounded-md block hover:border-blue-accent micro-gradient"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="w-5 h-5 text-blue-accent" aria-hidden="true" />
                      <h4 className="text-md font-orbitron font-medium text-blue-accent">{project.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm font-inter">{project.reason}</p>
                    <div className="w-full h-6 mt-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-teal-accent rounded-full"
                        style={{ width: `${(project.activityLevel / Math.max(...recommendedProjects.map(p => p.activityLevel)) || 1) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 font-inter text-xs mt-1">Activity Level</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Home;