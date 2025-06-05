import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Users, Award, Star, MessageCircle, Search, User, Briefcase, Home as HomeIcon } from 'lucide-react';
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
          <span className="text-gray-600 text-xl font-inter ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-lg font-inter flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {authError || error}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="home-container flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="header fixed top-0 left-0 right-0 bg-gradient-to-r from-dark-bg to-black border-b border-gray-300 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/">
              <h1 className="text-xl font-orbitron font-bold text-white flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-blue-accent" aria-hidden="true" /> ShareSync
              </h1>
            </Link>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-8 pr-3 py-1 border border-gray-300 rounded-full bg-white text-gray-700 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent w-48 sm:w-64"
                aria-label="Search projects"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/projects" className="text-white hover:text-blue-accent flex items-center gap-1">
              <Folder className="w-4 h-4" aria-hidden="true" />
              <span className="font-inter text-sm hidden sm:inline">Projects</span>
            </Link>
            <Link to={`/profile/${user.username}`} className="flex items-center gap-1">
              <img
                src={user.profilePicture || 'https://via.placeholder.com/32'}
                alt={`${user.firstName}'s profile`}
                className="w-6 h-6 rounded-full border-2 border-blue-accent"
              />
              <span className="text-white font-inter text-sm hidden sm:inline">{user.firstName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 mt-12">
        {/* Main Content */}
        <main className="main-content flex-1 p-4 sm:p-6 bg-white">
          <div className="home-header mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Folder className="w-5 h-5 text-blue-accent" aria-hidden="true" />
              <h1 className="text-lg sm:text-xl font-orbitron font-semibold text-black">
                Project Activity Feed
              </h1>
            </div>
            <p className="text-gray-600 text-sm font-inter">
              Stay updated with the latest activity in your projects.
            </p>
          </div>

          <div className="feed-container">
            {feedItems.length === 0 ? (
              <p className="text-gray-600 flex items-center gap-2 font-inter text-sm">
                <AlertCircle className="w-4 h-4 text-red-accent" aria-hidden="true" /> No recent activity in your active projects.
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
        <aside className="right-sidebar w-72 bg-light-bg border-l border-gray-200 p-4 flex-shrink-0 hidden lg:block">
          {/* Project Chat */}
          <div className="chat-section mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-accent" aria-hidden="true" />
              <h2 className="text-md font-orbitron font-semibold text-black">Project Chat</h2>
            </div>
            <div className="mb-2">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-md font-inter text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent"
                aria-label="Select Project for Chat"
              >
                {(user.projects || []).filter(p => p.status !== 'Completed').map(project => (
                  <option key={project._id} value={project._id}>{project.title}</option>
                ))}
              </select>
            </div>
            <div className="messages bg-white border border-gray-200 rounded-md p-3 h-48 overflow-y-auto mb-2">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2 mb-2">
                  <img
                    src={msg.profilePicture}
                    alt={`${msg.user}'s profile`}
                    className="w-5 h-5 rounded-full border border-gray-300"
                  />
                  <div>
                    <p className="text-gray-800 font-inter font-medium text-xs">{msg.username}</p>
                    <p className="text-gray-700 font-inter text-xs">{msg.text}</p>
                    <p className="text-gray-500 font-inter text-[10px]">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-1 border border-gray-300 rounded-full font-inter text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent"
                placeholder="Type a message..."
                aria-label="Chat Message"
              />
              <button
                onClick={sendMessage}
                className="bg-red-accent text-white p-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-accent micro-gradient"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="leaderboard-section mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-blue-accent" aria-hidden="true" />
              <h2 className="text-md font-orbitron font-semibold text-black">Leaderboard</h2>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-gray-600 font-inter flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-accent" aria-hidden="true" /> No leaderboard data available.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="bg-white border border-gray-200 p-3 rounded-md">
                  <svg className="w-full h-24" viewBox={`0 0 ${leaderboard.length * 40} 80`}>
                    {leaderboard.map((entry, index) => (
                      <g key={index} transform={`translate(${index * 40}, 0)`}>
                        <rect
                          x="5"
                          y={80 - (entry.points / Math.max(...leaderboard.map(e => e.points)) * 60)}
                          width="30"
                          height={(entry.points / Math.max(...leaderboard.map(e => e.points)) * 60)}
                          fill={`url(#bar-gradient-${index})`}
                        />
                        <defs>
                          <linearGradient id={`bar-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: index === 0 ? '#f6ad55' : index === 1 ? '#1877f2' : '#a78bfa', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: index === 0 ? '#e69500' : index === 1 ? '#0c5ab5' : '#805ad5', stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <text x="20" y="75" textAnchor="middle" className="text-gray-700 font-inter text-[10px]">{entry.username}</text>
                        <text x="20" y={80 - (entry.points / Math.max(...leaderboard.map(e => e.points)) * 60) - 5} textAnchor="middle" className="text-gray-700 font-inter text-[10px]">{entry.points}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                {leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-item bg-white border border-gray-200 p-2 rounded-md flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <img
                        src={entry.profilePicture || 'https://via.placeholder.com/24'}
                        alt={`${entry.username}'s profile`}
                        className="w-6 h-6 rounded-full border border-gray-300"
                      />
                      <div>
                        <span className={`text-sm font-orbitron ${index === 0 ? 'text-orange-accent' : index === 1 ? 'text-blue-accent' : 'text-purple-accent'}`}>
                          #{index + 1}
                        </span>
                        <p className="text-gray-800 font-inter text-xs">{entry.username}</p>
                        {entry.achievements && entry.achievements.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {entry.achievements.slice(0, 3).map((achievement, idx) => (
                              <Star key={idx} className="w-3 h-3 text-yellow-500" title={achievement} aria-hidden="true" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-600 font-inter text-xs">{entry.points} points</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Projects Section */}
          {recommendedProjects.length > 0 && (
            <div className="recommendations-section">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-blue-accent" aria-hidden="true" />
                <h2 className="text-md font-orbitron font-semibold text-black">Recommended Projects</h2>
              </div>
              <div className="space-y-2">
                {recommendedProjects.map(project => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="recommendation-card bg-white border border-gray-200 p-2 rounded-md block hover:border-blue-accent micro-gradient"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Folder className="w-4 h-4 text-blue-accent" aria-hidden="true" />
                      <h4 className="text-sm font-orbitron font-medium text-blue-accent">{project.title}</h4>
                    </div>
                    <p className="text-gray-600 text-xs font-inter">{project.reason}</p>
                    <div className="w-full h-4 mt-1 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-green-accent rounded-full"
                        style={{ width: `${(project.activityLevel / Math.max(...recommendedProjects.map(p => p.activityLevel)) || 1) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 font-inter text-[10px] mt-1">Activity Level</p>
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