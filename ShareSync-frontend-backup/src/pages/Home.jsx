import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Users, Award, Star, MessageCircle } from 'lucide-react';
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

        // Select the first project for chat by default
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
          <p className="text-crimson-red text-lg font-inter flex items-center gap-2">
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
          <p className="text-gray-600 text-lg font-inter">Unable to load user data. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Main Content */}
      <div className="main-content flex-1 p-4 lg:p-8">
        <div className="home-header mb-8 p-6">
          <div className="flex items-center gap-3">
            <img
              src={user.profilePicture || 'https://via.placeholder.com/40'}
              alt={`${user.firstName}'s profile`}
              className="w-10 h-10 rounded-full border border-gray-300"
            />
            <h1 className="text-3xl font-orbitron font-bold text-gray-800">
              Welcome to ShareSync, {user.firstName}!
            </h1>
          </div>
          <p className="text-gray-600 text-lg font-inter mt-2">
            Stay connected with all your active projects in a modern workspace.
          </p>
        </div>

        {/* Feed Section */}
        <div className="feed-container">
          <h2 className="text-2xl font-orbitron font-semibold text-gray-800 mb-6 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-gray-600" aria-hidden="true" /> Project Activity Feed
          </h2>
          {feedItems.length === 0 ? (
            <p className="text-gray-600 flex items-center gap-2 font-inter">
              <AlertCircle className="w-5 h-5 text-gray-600" aria-hidden="true" /> No recent activity in your active projects.
            </p>
          ) : (
            <div className="space-y-6">
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
      <div className="sidebar w-full lg:w-80 p-4 lg:p-6 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50">
        {/* Project Chat */}
        <div className="chat-section mb-6">
          <h3 className="text-lg font-orbitron font-semibold text-gray-800 mb-4 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-gray-600" aria-hidden="true" /> Project Chat
          </h3>
          <div className="mb-4">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md font-inter text-gray-700"
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
              className="flex-1 p-2 border border-gray-300 rounded-full font-inter text-gray-700"
              placeholder="Type a message..."
              aria-label="Chat Message"
            />
            <button
              onClick={sendMessage}
              className="bg-emerald-green text-white p-2 rounded-full hover:bg-neon-coral focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Send Message"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="leaderboard-section mb-6">
          <h3 className="text-lg font-orbitron font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-gray-600" aria-hidden="true" /> Overall Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-gray-600 font-inter flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600" aria-hidden="true" /> No leaderboard data available.
            </p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={index} className="leaderboard-item bg-white border border-gray-200 p-3 rounded-md flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <img
                      src={entry.profilePicture || 'https://via.placeholder.com/32'}
                      alt={`${entry.username}'s profile`}
                      className="w-8 h-8 rounded-full border border-gray-300"
                    />
                    <div>
                      <span className={`text-lg font-orbitron ${index === 0 ? 'text-crimson-red' : index === 1 ? 'text-saffron-yellow' : 'text-indigo-vivid'}`}>
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
            <h3 className="text-lg font-orbitron font-semibold text-gray-800 mb-4">Recommended Projects</h3>
            <div className="space-y-3">
              {recommendedProjects.map(project => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="recommendation-card bg-white border border-gray-200 p-4 rounded-md block"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <h4 className="text-md font-orbitron font-medium text-indigo-vivid">{project.title}</h4>
                  <p className="text-gray-600 text-sm font-inter">{project.reason}</p>
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