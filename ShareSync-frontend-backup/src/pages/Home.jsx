import React, { useState, useEffect, useContext, useCallback, memo, useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Users, Award, Star, MessageCircle, Bell, Moon, Sun, Plus, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import FeedItem from '../components/FeedItem';
import { fetchLeaderboard } from '../services/project.js';
import './Home.css';

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return [...state, action.payload];
    case 'CLEAR_NOTIFICATIONS':
      return [];
    default:
      return state;
  }
};

const searchReducer = (state, action) => {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    default:
      return state;
  }
};

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
  const [notifications, dispatchNotifications] = useReducer(notificationReducer, []);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [searchState, dispatchSearch] = useReducer(searchReducer, { query: '', suggestions: [] });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [userStats, setUserStats] = useState({ activeProjects: 0, tasksCompleted: 0, achievements: [] });
  const [accentColor, setAccentColor] = useState('blue'); // Default to blue

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

    const fetchFeedItems = async () => {
      try {
        setIsLoadingFeed(true);
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

        allFeedItems.sort((a, b) => new Date(b) - new Date(a));
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
          activeProjects.forEach(project => {
            const projectTasks = project.tasks || [];
            tasksCompleted += projectTasks.filter(task => task.status === 'Completed').length;
          });
          // Mock achievements for now
          const achievements = [
            { id: 1, name: 'Task Starter', description: 'Completed 5 tasks', earned: tasksCompleted >= 5 },
            { id: 2, name: 'On-Time Pro', description: 'Delivered a project on time', earned: true },
          ];
          setUserStats({ activeProjects: activeProjects.length, tasksCompleted, achievements });

          // Show toast for new achievements
          achievements.forEach(achievement => {
            if (achievement.earned) {
              dispatchNotifications({
                type: 'ADD_NOTIFICATION',
                payload: { message: `Achievement Unlocked: ${achievement.name}!` },
              });
            }
          });
        };

        fetchUserStats();

        if (activeProjects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(activeProjects[0]._id);
        }
      } catch (err) {
        setError('Failed to load feed items: ' + (err.message || 'Please try again.'));
      } finally {
        setIsLoadingFeed(false);
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
            (a, b) => new Date(b) - new Date(a)
          );
          return updatedItems;
        });
      });

      socket.on('chat-message', (message) => {
        if (message.projectId === selectedProjectId) {
          setMessages((prev) => [...prev, message]);
        }
      });

      socket.on('notification', (notification) => {
        dispatchNotifications({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      return () => {
        socket.off('project-updated');
        socket.off('feed-update');
        socket.off('chat-message');
        socket.off('notification');
      };
    }
  }, [isAuthenticated, isLoading, navigate, user, socket, fetchUserData, selectedProjectId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Mock search suggestions based on project titles
    if (searchState.query.length > 0) {
      const suggestions = (user?.projects || [])
        .filter(project => project.title.toLowerCase().includes(searchState.query.toLowerCase()))
        .map(project => project.title)
        .slice(0, 5);
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user]);

  const handleLike = useCallback((index) => {
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
  }, [feedItems, socket, user]);

  const handleCommentSubmit = useCallback((index, e) => {
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
  }, [feedItems, newComment, socket, user]);

  const handleShare = useCallback((index) => {
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
  }, [feedItems, socket, user]);

  const toggleComments = useCallback((index) => {
    setExpandedComments(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedProjectId) return;

    const messageData = {
      projectId: selectedProjectId,
      text: newMessage,
      user: user.email,
      userId: user._id,
      username: user.username,
      profilePicture: user.profilePicture || 'https://via.placeholder.com/40',
      timestamp: new Date().toISOString(),
      online: true, // Mock online status
    };

    socket.emit('chat-message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
  }, [newMessage, selectedProjectId, socket, user]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.classList.toggle('dark');
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(prev => !prev);
    if (isNotificationDropdownOpen) setIsNotificationDropdownOpen(false);
  };

  const toggleNotificationDropdown = () => {
    setIsNotificationDropdownOpen(prev => !prev);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const toggleProjectDropdown = () => {
    setIsProjectDropdownOpen(prev => !prev);
  };

  const selectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setIsProjectDropdownOpen(false);
  };

  const handleQuickAction = (action) => {
    if (action === 'new-project') {
      alert('Create New Project! (Implement modal or navigation to project creation page.)');
    } else if (action === 'new-task') {
      alert('Create New Task! (Implement modal or navigation to task creation page.)');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      alert(`Navigate to search results for: ${searchState.query} (Implement search results page.)`);
    }
  };

  const changeAccentColor = (color) => {
    setAccentColor(color);
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-gray-600 dark:text-gray-400 text-xl font-lato ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-red-500 text-lg font-lato flex items-center gap-2">
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
    <div className={`home-container flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-light-blue text-black'} relative`}>
      {/* Animated Background Pattern */}
      <div className="animated-bg absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="dot-pattern"></div>
      </div>

      {/* Header */}
      <header className="header fixed top-0 left-0 right-0 bg-gradient-to-r from-dark-secondary to-blue-dark border-b border-gray-300 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/">
              <h1 className="text-xl font-poppins font-bold text-white">
                ShareSync
              </h1>
            </Link>
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchState.query}
                onChange={(e) => dispatchSearch({ type: 'SET_QUERY', payload: e.target.value })}
                onKeyDown={handleSearchSubmit}
                className="pl-3 pr-3 py-1 border border-gray-300 rounded-full bg-white text-gray-700 font-lato text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent w-48 sm:w-64 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                aria-label="Search projects"
              />
              {searchState.suggestions.length > 0 && (
                <div className="absolute left-0 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                  {searchState.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 text-sm font-lato text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        dispatchSearch({ type: 'SET_QUERY', payload: suggestion });
                        dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-white hover:text-blue-accent transition-transform duration-200 transform hover:scale-110">
              <LayoutDashboard className="w-5 h-5" style={{ stroke: `url(#dashboard-gradient-${accentColor})` }} aria-hidden="true" />
            </Link>
            <Link to="/projects" className="text-white hover:text-blue-accent transition-transform duration-200 transform hover:scale-110">
              <Folder className="w-5 h-5" style={{ stroke: `url(#folder-gradient-${accentColor})` }} aria-hidden="true" />
            </Link>
            <div className="relative">
              <button
                className="relative text-white hover:text-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent transition-transform duration-200 transform hover:scale-110"
                aria-label="Notifications"
                onClick={toggleNotificationDropdown}
                aria-expanded={isNotificationDropdownOpen}
              >
                <Bell className="w-5 h-5" style={{ stroke: `url(#bell-gradient-${accentColor})` }} aria-hidden="true" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-accent text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {isNotificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto" role="region" aria-live="polite">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-2 text-sm font-lato text-gray-700 dark:text-gray-300">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 text-sm font-lato text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        {notification.message}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date().toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={toggleDarkMode}
              className="text-white hover:text-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent transition-transform duration-200 transform hover:scale-110"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" style={{ stroke: `url(#sun-gradient-${accentColor})` }} aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5" style={{ stroke: `url(#moon-gradient-${accentColor})` }} aria-hidden="true" />
              )}
            </button>
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-accent transition-transform duration-200 transform hover:scale-110"
                aria-label="Profile menu"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative">
                  <img
                    src={user.profilePicture || 'https://via.placeholder.com/32'}
                    alt={`${user.firstName}'s profile`}
                    className="w-8 h-8 rounded-full"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 rounded-full ring-gradient"></div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                </div>
                <ChevronDown className="w-5 h-5 text-white" aria-hidden="true" />
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                  <Link
                    to={`/profile/${user.username}`}
                    className="block px-4 py-2 text-sm font-lato text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="px-4 py-2 text-sm font-lato text-gray-700 dark:text-gray-300">
                    Accent Color:
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => changeAccentColor('blue')}
                        className="w-6 h-6 bg-blue-accent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-accent"
                        aria-label="Select blue accent color"
                      />
                      <button
                        onClick={() => changeAccentColor('green')}
                        className="w-6 h-6 bg-green-accent rounded-full focus:outline-none focus:ring-2 focus:ring-green-accent"
                        aria-label="Select green accent color"
                      />
                      <button
                        onClick={() => changeAccentColor('purple')}
                        className="w-6 h-6 bg-purple-accent rounded-full focus:outline-none focus:ring-2 focus:ring-purple-accent"
                        aria-label="Select purple accent color"
                      />
                    </div>
                  </div>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm font-lato text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      alert('Logout functionality to be implemented.');
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <svg className="absolute w-0 h-0">
          <linearGradient id={`dashboard-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#4fd1c5', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`folder-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#4fd1c5', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bell-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#4fd1c5', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`sun-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#4fd1c5', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`moon-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#4fd1c5', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`dashboard-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`folder-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bell-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`sun-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`moon-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`dashboard-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`folder-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`bell-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`sun-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id={`moon-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
          </linearGradient>
        </svg>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 mt-12 relative z-10">
        {/* Main Content */}
        <main className="main-content flex-1 p-4 sm:p-6">
          {/* Welcome Banner */}
          <div className="welcome-banner bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6 shadow-sm micro-gradient holographic-effect">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={user.profilePicture || 'https://via.placeholder.com/40'}
                  alt={`${user.firstName}'s profile`}
                  className="w-10 h-10 rounded-full"
                  loading="lazy"
                />
                <div className="absolute inset-0 rounded-full ring-gradient"></div>
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
              </div>
              <div>
                <h2 className="text-lg font-poppins font-semibold holographic-text">
                  Welcome, {user.firstName}!
                </h2>
                <p className="text-sm font-lato text-gray-600 dark:text-gray-400">
                  You have{' '}
                  <Link to="/projects" className="text-blue-accent hover:underline">
                    {userStats.activeProjects} active projects
                  </Link>{' '}
                  and {userStats.tasksCompleted} tasks completed.
                </p>
                <div className="flex gap-2 mt-2">
                  {userStats.achievements.map(achievement => (
                    achievement.earned && (
                      <div key={achievement.id} className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                        <span className="text-xs font-lato text-gray-600 dark:text-gray-400">{achievement.name}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="home-header mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Folder className="w-5 h-5" style={{ stroke: `url(#folder-gradient-${accentColor})` }} aria-hidden="true" />
              <h1 className="text-lg sm:text-xl font-poppins font-semibold holographic-text">
                Project Activity Feed
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-lato">
              Stay updated with the latest activity in your projects.
            </p>
          </div>

          <div className="feed-container">
            {isLoadingFeed ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : feedItems.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-lato text-sm">
                <AlertCircle className="w-4 h-4 text-red-accent" aria-hidden="true" /> No recent activity in your active projects.
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
                      accentColor={accentColor}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar w-72 border-l border-gray-200 p-4 flex-shrink-0 hidden lg:block sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Project Chat */}
          <div className="chat-section mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4" style={{ stroke: `url(#message-gradient-${accentColor})` }} aria-hidden="true" />
              <h2 className="text-md font-poppins font-semibold holographic-text">Project Chat</h2>
            </div>
            <div className="relative mb-2">
              <button
                onClick={toggleProjectDropdown}
                className="w-full p-1 border border-gray-300 rounded-md font-lato text-gray-700 dark:text-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent flex items-center justify-between bg-white dark:bg-gray-800"
                aria-label="Select project for chat"
                aria-expanded={isProjectDropdownOpen}
              >
                <span>{(user.projects || []).find(p => p._id === selectedProjectId)?.title || 'Select a project'}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              </button>
              {isProjectDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                  {(user.projects || []).filter(p => p.status !== 'Completed').map(project => (
                    <button
                      key={project._id}
                      onClick={() => selectProject(project._id)}
                      className="block w-full text-left px-3 py-1 text-sm font-lato text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {project.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="messages bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3 h-48 overflow-y-auto mb-2">
              {messages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2 mb-2">
                  <div className="relative">
                    <img
                      src={msg.profilePicture}
                      alt={`${msg.user}'s profile`}
                      className="w-6 h-6 rounded-full"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 rounded-full ring-gradient"></div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${msg.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-300 font-lato font-medium text-sm">{msg.username}</p>
                    <p className="text-gray-700 dark:text-gray-400 font-lato text-sm">{msg.text}</p>
                    <p className="text-gray-500 dark:text-gray-500 font-lato text-xs">{new Date(msg.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-1 border border-gray-200 dark:border-gray-600 rounded-full font-lato text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent bg-white dark:bg-gray-800"
                placeholder="Type a message..."
                aria-label="Chat Message"
              />
              <button
                onClick={sendMessage}
                className="relative bg-red-accent text-white p-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-accent micro-gradient transition-transform duration-200 transform hover:scale-105 ripple"
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
              <h2 className="text-md font-poppins font-semibold holographic-text">Leaderboard</h2>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 font-lato flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-accent" aria-hidden="true" /> No leaderboard data available.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 rounded-md micro-gradient">
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
                        <text x="20" y="75" textAnchor="middle" className="text-gray-700 dark:text-gray-300 font-lato text-[10px]">{entry.username}</text>
                        <text x="20" y={80 - (entry.points / Math.max(...leaderboard.map(e => e.points)) * 60) - 5} textAnchor="middle" className="text-gray-700 dark:text-gray-300 font-lato text-[10px]">{entry.points}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                {leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 rounded-md flex justify-between items-center transition-transform duration-200 transform hover:scale-102 hover:bg-blue-50 dark:hover:bg-blue-900/20 micro-gradient">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={entry.profilePicture || 'https://via.placeholder.com/24'}
                          alt={`${entry.username}'s profile`}
                          className="w-6 h-6 rounded-full"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 rounded-full ring-gradient"></div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <div>
                        <span className={`text-sm font-poppins ${index === 0 ? 'text-orange-accent' : index === 1 ? 'text-blue-accent' : 'text-purple-accent'}`}>
                          #{index + 1}
                        </span>
                        <p className="text-gray-800 dark:text-gray-300 font-lato text-sm font-medium">{entry.username}</p>
                        {entry.achievements && entry.achievements.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {entry.achievements.slice(0, 3).map((achievement, idx) => (
                              <Star key={idx} className="w-3 h-3 text-yellow-500" title={achievement} aria-hidden="true" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-lato text-xs">{entry.points} points</span>
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
                <h2 className="text-md font-poppins font-semibold holographic-text">Recommended Projects</h2>
              </div>
              <div className="space-y-2">
                {recommendedProjects.map(project => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="recommendation-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-2 rounded-md block hover:border-blue-accent hover:bg-blue-50 dark:hover:bg-blue-900/20 micro-gradient transition-transform duration-200 transform hover:scale-102"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Folder className="w-4 h-4" style={{ stroke: `url(#folder-gradient-${accentColor})` }} aria-hidden="true" />
                      <h4 className="text-sm font-poppins font-medium text-blue-accent">{project.title}</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-lato">{project.reason}</p>
                    <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-green-accent rounded-full"
                        style={{ width: `${(project.activityLevel / Math.max(...recommendedProjects.map(p => p.activityLevel)) || 1) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-lato text-[10px] mt-1">Activity Level</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Floating Action Button with Tooltip */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <button
          className="relative bg-blue-accent text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-accent micro-gradient transition-transform duration-200 transform hover:scale-110 ripple"
          aria-label="Quick Actions"
          onClick={() => handleQuickAction('new-project')}
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs font-lato rounded py-1 px-2">
          Create New Project or Task
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          className="fixed bottom-20 right-6 z-40 bg-gray-600 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-transform duration-200 transform hover:scale-110"
          aria-label="Back to Top"
          onClick={scrollToTop}
        >
          <ChevronUp className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default memo(Home);