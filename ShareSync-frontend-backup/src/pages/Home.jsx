import React, { useState, useEffect, useContext, useCallback, memo, useReducer } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, Users, Sparkles, Star, MessageCircle, ChevronUp, FileClock } from 'lucide-react';
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

const Home = ({
  searchState,
  dispatchSearch,
  isDarkMode,
  setIsDarkMode,
  accentColor,
  setAccentColor,
  notifications,
  setNotifications,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, authError, socket, fetchUserData } = useContext(AuthContext);
  const [feedItems, setFeedItems] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [recommendedProjects, setRecommendedProjects] = useState([]);
  const [projectStories, setProjectStories] = useState([]);
  const [seenStories, setSeenStories] = useState(new Set());
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [notificationsState, dispatchNotifications] = useReducer(notificationReducer, notifications);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [userStats, setUserStats] = useState({ activeProjects: 0, tasksCompleted: 0, achievements: [] });

  useEffect(() => {
    setNotifications(notificationsState);
  }, [notificationsState, setNotifications]);

  useEffect(() => {
    console.log('AuthContext State:', { isAuthenticated, user, isLoading, authError });

    if (isLoading) return;

    if (!isAuthenticated || !user) {
      console.log('Not authenticated or no user, redirecting to /login');
      navigate('/login', { replace: true });
      return;
    }

    const fetchFeedItems = async () => {
      try {
        setIsLoadingFeed(true);
        const activeProjects = (user?.projects || []).filter(project => project && project.status && project.status !== 'Completed');

        // Calculate project stories
        const stories = activeProjects.map(project => {
          const recentActivity = [
            ...(project.activityLog || []),
            ...(project.posts || []),
            ...(project.tasks || []),
            ...(project.files || []),
          ]
            .map(item => ({
              type: item.message ? 'activity' : item.content ? 'post' : item.status ? 'task' : 'file',
              message: item.message || item.content || `${item.title || 'Unnamed task'} completed` || `Shared file: ${item.name || 'Unnamed file'}`,
              timestamp: item.timestamp || item.updatedAt || item.uploadedAt || new Date().toISOString(),
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3);

          const hasRecentActivity = recentActivity.length > 0 && 
            (new Date() - new Date(recentActivity[0].timestamp)) / (1000 * 60 * 60) < 24;

          return hasRecentActivity ? {
            id: project._id,
            title: project.title,
            recentActivity,
          } : null;
        }).filter(story => story !== null);

        setProjectStories(stories);

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
            .slice(0, 2)
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

            const leaderboardArray = Object.values(aggregated).sort((a, b) => b.points - a.points).slice(0, 3);
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
          const achievements = [
            { id: 1, name: 'Task Starter', description: 'Completed 5 tasks', earned: tasksCompleted >= 5 },
            { id: 2, name: 'On-Time Pro', description: 'Delivered a project on time', earned: true },
          ];
          setUserStats({ activeProjects: activeProjects.length, tasksCompleted, achievements });

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
      socket?.on('project-updated', () => {
        fetchUserData();
      });

      socket?.on('feed-update', (data) => {
        setFeedItems((prev) => {
          const updatedItems = [...prev, data].sort(
            (a, b) => new Date(b) - new Date(a)
          );
          return updatedItems;
        });
      });

      socket?.on('chat-message', (message) => {
        if (message.projectId === selectedProjectId) {
          setMessages((prev) => [...prev, message]);
        }
      });

      socket?.on('notification', (notification) => {
        dispatchNotifications({ type: 'ADD_NOTIFICATION', payload: notification });
      });

      return () => {
        socket?.off('project-updated');
        socket?.off('feed-update');
        socket?.off('chat-message');
        socket?.off('notification');
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
    if (searchState.query.length > 0) {
      const suggestions = (user?.projects || [])
        .filter(project => project.title.toLowerCase().includes(searchState.query.toLowerCase()))
        .map(project => project.title)
        .slice(0, 5);
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user, dispatchSearch]);

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
      user: user?.email || 'Anonymous',
      userId: user?._id,
      username: user?.username,
      profilePicture: user?.profilePicture || 'https://via.placeholder.com/40',
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
      user: user?.email,
      userId: user?._id,
      username: user?.username,
      profilePicture: user?.profilePicture || 'https://via.placeholder.com/40',
      timestamp: new Date().toISOString(),
    };

    socket?.emit('chat-message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage('');
  }, [newMessage, selectedProjectId, socket, user]);

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

  const handleStoryClick = (story) => {
    setSeenStories(prev => new Set(prev).add(story.id));
    const activityMessages = story.recentActivity.map(activity => 
      `${activity.type.toUpperCase()}: ${activity.message} (${new Date(activity.timestamp).toLocaleString()})`
    ).join('\n');
    alert(`Recent Activity for "${story.title}":\n\n${activityMessages}`);
    // TODO: Replace alert with a modal showing recent activity
  };

  if (isLoading) {
    return (
      <div className="home-container">
        <div className="loading-message flex items-center justify-center min-h-screen">
          <div className="loader" aria-label="Loading home page"></div>
          <span className="text-gray-600 dark:text-gray-400 text-xl font-sans ml-4">Loading...</span>
        </div>
      </div>
    );
  }

  if (authError || error) {
    return (
      <div className="home-container">
        <div className="error-message flex items-center justify-center min-h-screen">
          <p className="text-rose-500 text-lg font-sans flex items-center gap-2">
            <AlertCircle className="w-5 h-5" aria-hidden="true" /> {authError || error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`home-container flex flex-col min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} relative`}>
      {/* Animated Background Pattern */}
      <div className="animated-bg absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="dot-pattern"></div>
      </div>

      {/* Fallback UI if not authenticated */}
      {(!isAuthenticated || !user) && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="loader mx-auto mb-4" aria-label="Redirecting to login"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg font-sans">
              Redirecting to login...
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isAuthenticated && user && (
        <div className="flex flex-1 mt-14 relative z-10">
          {/* Main Content */}
          <main className="main-content flex-1 p-4 sm:p-6">
            {/* Welcome Banner */}
            <div className="welcome-banner bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.profilePicture || 'https://via.placeholder.com/40'}
                    alt={`${user.firstName}'s profile`}
                    className="w-10 h-10 rounded-full border-2 border-purple-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 rounded-full ring-gradient"></div>
                </div>
                <div>
                  <h2 className="text-lg font-sans font-bold text-gray-900 dark:text-white">
                    Welcome, {user.firstName}!
                  </h2>
                  <p className="text-sm font-sans text-gray-600 dark:text-gray-400">
                    You have{' '}
                    <Link to="/projects" className="text-purple-500 hover:underline">
                      {userStats.activeProjects} active projects
                    </Link>{' '}
                    and {userStats.tasksCompleted} tasks completed.
                  </p>
                  <div className="flex gap-2 mt-2">
                    {userStats.achievements.map(achievement => (
                      achievement.earned && (
                        <div key={achievement.id} className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                          <span className="text-xs font-sans text-gray-600 dark:text-gray-400">{achievement.name}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Stories Section */}
            {projectStories.length > 0 && (
              <div className="project-stories mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileClock className="w-5 h-5 text-purple-500" aria-hidden="true" />
                  <h2 className="text-md font-sans font-bold text-gray-900 dark:text-white">
                    Recent Project Updates
                  </h2>
                </div>
                <div className="flex overflow-x-auto space-x-4 pb-2">
                  {projectStories.map(story => {
                    const isSeen = seenStories.has(story.id);
                    return (
                      <button
                        key={story.id}
                        onClick={() => handleStoryClick(story)}
                        className="flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full"
                        aria-label={`View recent updates for ${story.title}`}
                      >
                        <div className={`relative w-16 h-16 rounded-full ${isSeen ? 'border-2 border-gray-300' : 'p-[2px] bg-gradient-to-r from-purple-500 to-pink-500'}`}>
                          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Folder className="w-8 h-8 text-purple-500" aria-hidden="true" />
                          </div>
                        </div>
                        <span className="text-xs font-sans text-gray-700 dark:text-gray-300 truncate w-16">{story.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="home-header mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Folder className="w-5 h-5 text-purple-500" aria-hidden="true" />
                <h1 className="text-lg sm:text-xl font-sans font-bold text-gray-900 dark:text-white">
                  Project Activity Feed
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-sans">
                Stay updated with the latest activity in your projects.
              </p>
            </div>

            <div className="feed-container">
              {isLoadingFeed ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl p-4">
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
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 font-sans text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-500" aria-hidden="true" /> No recent activity in your active projects.
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
                        accentColor="purple"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="right-sidebar w-72 border-l border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto pt-4 pb-8 shadow-lg">
            {/* Project Chat */}
            <div className="chat-section mb-8">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
                <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white">Project Chat</h2>
              </div>
              <div className="relative mb-2">
                <button
                  onClick={toggleProjectDropdown}
                  className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md font-sans text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center justify-between bg-white dark:bg-gray-800 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  aria-label="Select project for chat"
                  aria-expanded={isProjectDropdownOpen}
                >
                  <span>{(user?.projects || []).find(p => p._id === selectedProjectId)?.title || 'Select a project'}</span>
                  <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                </button>
                {isProjectDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    {(user?.projects || []).filter(p => p.status !== 'Completed').map(project => (
                      <button
                        key={project._id}
                        onClick={() => selectProject(project._id)}
                        className="block w-full text-left px-3 py-1 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {project.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="messages bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3 h-32 overflow-y-auto mb-2">
                {messages.slice(-3).map((msg, index) => (
                  <div key={index} className="flex items-start gap-2 mb-2">
                    <div className="relative">
                      <img
                        src={msg.profilePicture}
                        alt={`${msg.user}'s profile`}
                        className="w-6 h-6 rounded-full"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 rounded-full ring-gradient"></div>
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-300 font-sans font-medium text-sm">{msg.username}</p>
                      <p className="text-gray-700 dark:text-gray-400 font-sans text-sm">{msg.text}</p>
                      <p className="text-gray-500 dark:text-gray-500 font-sans text-xs">{new Date(msg.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2 flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-1 border border-gray-200 dark:border-gray-600 rounded-full font-sans text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                    placeholder="Type a message..."
                    aria-label="Chat Message"
                  />
                  <button
                    onClick={sendMessage}
                    className="relative bg-pink-500 text-white p-1 rounded-full hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-transform duration-200 transform hover:scale-105"
                    aria-label="Send Message"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <Link to={`/chat/${selectedProjectId}`} className="text-purple-500 hover:underline text-xs font-sans ml-2">
                  View More
                </Link>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="leaderboard-section mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white">Leaderboard</h2>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 font-sans flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-500" aria-hidden="true" /> No leaderboard data available.
                </p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div key={index} className="leaderboard-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-2 transition-transform duration-200 transform hover:scale-102 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={entry.profilePicture || 'https://via.placeholder.com/24'}
                            alt={`${entry.username}'s profile`}
                            className="w-6 h-6 rounded-full"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 rounded-full ring-gradient"></div>
                        </div>
                        <div>
                          <span className={`text-sm font-sans ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-purple-500' : 'text-teal-400'}`}>
                            #{index + 1}
                          </span>
                          <p className="text-gray-800 dark:text-gray-300 font-sans text-sm font-medium">{entry.username}</p>
                          {entry.achievements && entry.achievements.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {entry.achievements.slice(0, 3).map((achievement, idx) => (
                                <Star key={idx} className="w-3 h-3 text-amber-500" title={achievement} aria-hidden="true" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 font-sans text-xs">{entry.points} points</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Projects Section */}
            {recommendedProjects.length > 0 && (
              <div className="recommendations-section">
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="w-4 h-4 text-purple-500" aria-hidden="true" />
                  <h2 className="text-sm font-sans font-bold text-gray-900 dark:text-white">Recommended Projects</h2>
                </div>
                <div className="space-y-2">
                  {recommendedProjects.map(project => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="recommendation-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-2 block hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-transform duration-200 transform hover:scale-102"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Folder className="w-4 h-4 text-purple-500" aria-hidden="true" />
                        <h4 className="text-sm font-sans font-medium text-purple-500">{project.title}</h4>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-sans">{project.reason}</p>
                      <div className="w-full h-4 mt-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-full bg-teal-400 rounded-full"
                          style={{ width: `${(project.activityLevel / Math.max(...recommendedProjects.map(p => p.activityLevel)) || 1) * 100}%` }}
                        ></div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Back to Top Button */}
      {isAuthenticated && user && showBackToTop && (
        <button
          className="fixed bottom-6 right-6 z-40 bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-transform duration-200 transform hover:scale-110"
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