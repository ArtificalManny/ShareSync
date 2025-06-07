import React, { useState, useEffect, useContext, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Folder, AlertCircle, ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare, User, MessageCircle, ChevronUp, Heart } from 'lucide-react';
import FeedItem from '../components/FeedItem';
import './Home.css';

const Home = ({
  searchState,
  dispatchSearch,
  isDarkMode,
  setIsDarkMode,
  accentColor,
  setAccentColor,
  notifications,
  setNotifications,
  feedItems,
  setFeedItems,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, authError, socket } = useContext(AuthContext);
  const [newComment, setNewComment] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [projectStories, setProjectStories] = useState([]);
  const [seenStories, setSeenStories] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(user?.projects[0]?._id || null);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [userStats, setUserStats] = useState({ activeProjects: 0, tasksCompleted: 0 });
  const [likes, setLikes] = useState({});

  useEffect(() => {
    if (!isAuthenticated || !user) { navigate('/login', { replace: true }); return; }
    const activeProjects = user.projects.filter(p => p.status !== 'Completed' && p._id);
    const stories = activeProjects.map(p => {
      const recent = [...(p.activityLog || []), ...(p.posts || []), ...(p.tasks || []), ...(p.files || [])]
        .map(i => ({ type: i.message ? 'activity' : i.content ? 'post' : i.status ? 'task' : 'file', message: i.message || i.content || `${i.title} completed` || `Shared ${i.name}`, timestamp: i.timestamp || new Date().toISOString() }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 3);
      return recent.length ? { id: p._id, title: p.title, recent } : null;
    }).filter(s => s);
    setProjectStories(stories);
    setFeedItems(prev => [...prev, ...activeProjects.flatMap(p => [
      ...(p.activityLog || []).map(l => ({ projectId: p._id, projectTitle: p.title, type: 'activity', message: l.message, user: l.user || user.email, profilePicture: user.profilePicture, timestamp: l.timestamp || new Date().toISOString(), likes: 0, comments: [], shares: 0 })),
      ...(p.posts || []).map(p => ({ projectId: p._id, projectTitle: p.title, type: 'announcement', content: p.content, author: p.author || user.email, profilePicture: user.profilePicture, timestamp: p.timestamp || new Date().toISOString(), likes: 0, comments: [], shares: 0 })),
      ...(p.tasks || []).filter(t => t.status === 'Completed').map(t => ({ projectId: p._id, projectTitle: p.title, type: 'task-complete', message: `${t.title} completed`, user: t.assignedTo || user.email, profilePicture: user.profilePicture, timestamp: t.updatedAt || new Date().toISOString(), likes: 0, comments: [], shares: 0 })),
      ...(p.files || []).map(f => ({ projectId: p._id, projectTitle: p.title, type: 'file', message: `Shared ${f.name}`, user: f.uploadedBy || user.email, profilePicture: user.profilePicture, timestamp: f.uploadedAt || new Date().toISOString(), url: f.url || '#', likes: 0, comments: [], shares: 0 })),
    ])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    setUserStats({ activeProjects: activeProjects.length, tasksCompleted: activeProjects.reduce((sum, p) => sum + (p.tasks || []).filter(t => t.status === 'Completed').length, 0) });
  }, [isAuthenticated, user, navigate, socket, setFeedItems]);

  useEffect(() => {
    window.addEventListener('scroll', () => setShowBackToTop(window.scrollY > 200));
    return () => window.removeEventListener('scroll', () => {});
  }, []);

  useEffect(() => {
    if (searchState.query) {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: (user?.projects || []).filter(p => p.title.toLowerCase().includes(searchState.query.toLowerCase())).map(p => p.title).slice(0, 5) });
    } else {
      dispatchSearch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [searchState.query, user, dispatchSearch]);

  const handleLike = useCallback((index) => {
    const itemId = `${feedItems[index]?.projectId}-${index}`;
    setLikes(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    const updated = { ...feedItems[index], likes: (feedItems[index].likes || 0) + 1 };
    setFeedItems(prev => prev.map((item, i) => i === index ? updated : item));
    if (socket) socket.emit('feed-like', { item: updated, userId: user._id });
  }, [feedItems, socket, user]);

  const handleCommentSubmit = useCallback((index, e) => {
    e.preventDefault();
    const text = newComment[index] || '';
    if (!text.trim()) return;
    const comment = { text, user: user.email, userId: user._id, username: user.username, profilePicture: user.profilePicture, timestamp: new Date().toISOString() };
    const updated = { ...feedItems[index], comments: [...(feedItems[index].comments || []), comment] };
    setFeedItems(prev => prev.map((item, i) => i === index ? updated : item));
    setNewComment(prev => ({ ...prev, [index]: '' }));
    setExpandedComments(prev => ({ ...prev, [index]: true }));
    if (socket) socket.emit('feed-comment', { item: updated, comment, userId: user._id });
  }, [feedItems, newComment, socket, user]);

  const handleShare = useCallback((index) => {
    const updated = { ...feedItems[index], shares: (feedItems[index].shares || 0) + 1 };
    setFeedItems(prev => prev.map((item, i) => i === index ? updated : item));
    if (socket) socket.emit('feed-share', { item: updated, userId: user._id });
  }, [feedItems, socket, user]);

  const toggleComments = useCallback((index) => setExpandedComments(prev => ({ ...prev, [index]: !prev[index] })), []);
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedProjectId) return;
    const message = { projectId: selectedProjectId, text: newMessage, user: user.email, userId: user._id, username: user.username, profilePicture: user.profilePicture, timestamp: new Date().toISOString() };
    socket.emit('chat-message', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  }, [newMessage, selectedProjectId, socket, user]);

  const toggleProjectDropdown = () => setIsProjectDropdownOpen(prev => !prev);
  const selectProject = (projectId) => { setSelectedProjectId(projectId); setIsProjectDropdownOpen(false); };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const handleStoryClick = (story) => { setSeenStories(prev => new Set(prev).add(story.id)); alert(`Updates for ${story.title}: ${story.recent.map(a => a.message).join('\n')}`); };
  const handleDoubleLike = useCallback((index) => {
    const itemId = `${feedItems[index]?.projectId}-${index}`;
    setLikes(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 2 }));
    const updated = { ...feedItems[index], likes: (feedItems[index].likes || 0) + 2 };
    setFeedItems(prev => prev.map((item, i) => i === index ? updated : item));
    if (socket) socket.emit('feed-like', { item: updated, userId: user._id });
  }, [feedItems, socket, user]);

  if (authError) return <div className="home-container min-h-screen flex items-center justify-center bg-white dark:bg-gray-950"><div className="error-message text-rose-500 text-lg font-sans flex items-center gap-2"><AlertCircle className="w-6 h-6" />{authError}</div></div>;

  return (
    <div className="home-container min-h-screen bg-white dark:bg-gray-950 flex flex-col ml-10 sm:ml-12 transition-all duration-200">
      {isAuthenticated && (
        <div className="flex flex-1">
          <main className="main-content w-full p-2 sm:p-3 lg:p-4">
            <div className="welcome-banner bg-white/98 dark:bg-gray-900/98 border border-gray-100 dark:border-gray-800 rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 shadow-sm hover:shadow-md hover-glow transition-all duration-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative">
                  <img src={user.profilePicture} alt={`${user.firstName}'s profile`} className="w-10 h-10 sm:w-12 h-12 rounded-full border-2 border-[color:var(--gradient-purple-teal)] object-cover" loading="lazy" />
                  <div className="absolute inset-0 rounded-full ring-2 ring-purple-500 animate-pulse-slow"></div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-sans font-bold text-gray-900 dark:text-gray-100">Welcome, {user.firstName}!</h2>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1"><Folder className="w-4 h-4 sm:w-5 h-5 text-purple-500" /><span className="text-sm sm:text-base font-sans text-gray-600 dark:text-gray-400">{userStats.activeProjects} active</span></div>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1"><CheckSquare className="w-4 h-4 sm:w-5 h-5 text-emerald-500" /><span className="text-sm sm:text-base font-sans text-gray-600 dark:text-gray-400">{userStats.tasksCompleted} completed</span></div>
                </div>
              </div>
            </div>

            {projectStories.length > 0 && (
              <div className="project-stories mb-2 sm:mb-3">
                <div className="flex overflow-x-auto space-x-2 sm:space-x-3 pb-1 sm:pb-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
                  {projectStories.map(story => {
                    const isSeen = seenStories.has(story.id);
                    return (
                      <button key={story.id} onClick={() => handleStoryClick(story)} className="flex flex-col items-center gap-1 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-full group hover-glow transition-all duration-200">
                        <div className={`relative w-12 h-12 sm:w-16 h-16 rounded-full ${isSeen ? 'border-4 border-gray-300' : 'p-1 bg-gradient-to-r from-purple-500 to-teal-400'}`}>
                          <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center"><Folder className="w-8 h-8 sm:w-10 h-10 text-purple-500" /></div>
                          {!isSeen && <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-teal-400 opacity-60 animate-pulse"></div>}
                        </div>
                        <span className="text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 truncate w-12 sm:w-16 text-center group-hover:text-purple-500">{story.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="home-header mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3"><Folder className="w-5 h-5 sm:w-6 h-6 text-purple-500 animate-pulse-slow" /><h1 className="text-xl sm:text-2xl font-sans font-bold text-gray-900 dark:text-gray-100">Feed</h1></div>
            </div>

            <div className="feed-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {feedItems.length === 0 ? (
                <p className="col-span-full text-gray-600 dark:text-gray-400 flex items-center gap-2"><AlertCircle className="w-5 h-5 sm:w-6 h-6 text-rose-500" />No activity</p>
              ) : (
                feedItems.map((item, index) => (
                  <FeedItem key={index} item={item} index={index} newComment={newComment} expandedComments={expandedComments} handleLike={handleLike} handleCommentSubmit={handleCommentSubmit} toggleComments={toggleComments} handleShare={handleShare} user={user} setNewComment={setNewComment} accentColor={accentColor} handleDoubleLike={handleDoubleLike} />
                ))
              )}
            </div>
          </main>

          <aside className="right-sidebar w-56 sm:w-64 border-l border-gray-100 dark:border-gray-800 p-2 sm:p-3 flex-shrink-0 hidden lg:block sticky top-0 h-screen overflow-y-auto shadow-sm backdrop-blur-md">
            <div className="sidebar-toggle flex justify-end mb-1 sm:mb-2"><button onClick={() => {}} className="text-purple-500 hover:text-purple-600 hover-glow transition-all duration-200"><ChevronUp className="w-4 h-4 sm:w-5 h-5" /></button></div>
            <div className="chat-section mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1"><MessageCircle className="w-4 h-4 sm:w-5 h-5 text-teal-400 animate-pulse-slow" /><span className="text-lg font-sans font-bold text-gray-900 dark:text-gray-100">Chat</span></div>
              <div className="relative mb-0.5 sm:mb-1">
                <button onClick={toggleProjectDropdown} className="w-full p-1 sm:p-2 border border-gray-200 dark:border-gray-800 rounded-full text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center">
                  {(user.projects.find(p => p._id === selectedProjectId)?.title) || 'Select'} <ChevronUp className="w-3 h-3 sm:w-4 h-4 ml-0.5 sm:ml-1" />
                </button>
                {isProjectDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-full max-h-24 sm:max-h-28 overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                    {user.projects.filter(p => p.status !== 'Completed' && p._id).map(p => (
                      <button key={p._id} onClick={() => selectProject(p._id)} className="block w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="messages bg-white/98 dark:bg-gray-900/98 border border-gray-100 dark:border-gray-800 rounded-xl p-1 sm:p-2 h-14 sm:h-16 overflow-y-auto mb-0.5 sm:mb-1">
                {messages.slice(-2).map((msg, i) => (
                  <div key={i} className="flex items-start gap-1 sm:gap-2 mb-0.5 sm:mb-1 animate-fade-in">
                    <img src={msg.profilePicture} alt={`${msg.user}'s profile`} className="w-5 h-5 sm:w-6 h-6 rounded-full border-2 border-[color:var(--gradient-teal-rose)] object-cover" />
                    <div><p className="text-gray-900 dark:text-gray-100 font-sans text-xs sm:text-sm">{msg.username}</p><p className="text-gray-600 dark:text-gray-400 text-xs">{msg.text}</p></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1 sm:gap-2"><input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 p-1 sm:p-2 border border-gray-200 dark:border-gray-800 rounded-full text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-900 transition-all duration-200" placeholder="Type a message..." /><button onClick={sendMessage} className="bg-teal-500 text-white p-1 sm:p-2 rounded-full hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200"><Send className="w-3 h-3 sm:w-4 h-4" /></button></div>
            </div>
          </aside>
        </div>
      )}
      {showBackToTop && <button className="fixed bottom-2 sm:bottom-3 right-2 sm:right-3 bg-purple-500 text-white p-1 sm:p-2 rounded-full shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 hover-glow" onClick={scrollToTop}><ChevronUp className="w-3 h-3 sm:w-4 h-4" /></button>}
    </div>
  );
};

export default memo(Home);