import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, FileText, CheckSquare, User, Heart } from 'lucide-react';

const FeedItem = ({
  item,
  index,
  newComment,
  expandedComments,
  handleLike,
  handleCommentSubmit,
  toggleComments,
  handleShare,
  user,
  setNewComment,
  accentColor,
  handleDoubleLike,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [shareAnimation, setShareAnimation] = useState(false);

  useEffect(() => {
    if (likeAnimation) {
      const timer = setTimeout(() => setLikeAnimation(false), 400);
      return () => clearTimeout(timer);
    }
  }, [likeAnimation]);

  useEffect(() => {
    if (shareAnimation) {
      const timer = setTimeout(() => setShareAnimation(false), 400);
      return () => clearTimeout(timer);
    }
  }, [shareAnimation]);

  const renderContent = () => {
    switch (item.type) {
      case 'activity':
        return <div className="flex items-center gap-0.5 sm:gap-1"><User className="w-3 sm:w-4 h-3 sm:h-4 text-gray-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base">{item.message} <span className="text-purple-600 hover:text-purple-700 cursor-pointer">{item.projectTitle}</span></span></div>;
      case 'announcement':
      case 'poll':
        return <div className="flex items-center gap-0.5 sm:gap-1"><MessageSquare className="w-3 sm:w-4 h-3 sm:h-4 text-gray-500" /><div><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base"><span className="text-purple-600 hover:text-purple-700 cursor-pointer">{item.projectTitle}</span></span><p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{item.content}</p></div></div>;
      case 'task-complete':
        return <div className="flex items-center gap-0.5 sm:gap-1"><CheckSquare className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base">{item.message} <span className="text-purple-600 hover:text-purple-700 cursor-pointer">{item.projectTitle}</span></span></div>;
      case 'file':
        return <div className="flex items-center gap-0.5 sm:gap-1"><FileText className="w-3 sm:w-4 h-3 sm:h-4 text-gray-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base">Shared <a href={item.url} className="text-purple-600 hover:text-purple-700">{item.message}</a> <span className="text-purple-600 hover:text-purple-700 cursor-pointer">{item.projectTitle}</span></span></div>;
      default: return null;
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      handleDoubleLike(index);
      setLikeAnimation(true);
      setIsLiked(true);
      setTimeout(() => setIsLiked(false), 800);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    handleShare(index);
    setShareAnimation(true);
  };

  return (
    <div className="feed-item bg-white/98 dark:bg-gray-900/98 border border-gray-50 dark:border-gray-800 rounded-lg p-1 sm:p-2 shadow-sm hover:shadow-md hover-glow transition-all duration-150 cursor-pointer" onClick={() => console.log(`View ${item.type} in ${item.projectTitle}`)} onDoubleClick={handleDoubleClick}>
      <div className="flex items-start gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
        <div className="relative">
          <img src={item.profilePicture} alt={`${item.user}'s profile`} className="w-6 sm:w-7 h-6 sm:h-7 rounded-full border-2 border-gradient-purple-teal object-cover" onError={(e) => { e.target.src = '/default-avatar.png'; }} loading="lazy" />
          <div className="absolute inset-0 rounded-full ring-2 ring-purple-500 animate-pulse-slow"></div>
        </div>
        <div className="flex-1">{renderContent()}</div>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
        <button onClick={(e) => { e.stopPropagation(); handleLike(index); }} className="flex items-center gap-0.5 sm:gap-1 text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors duration-150">
          <ThumbsUp className="w-3 sm:w-3.5 h-3 sm:h-3.5" /><span className="text-xs sm:text-sm font-sans">{item.likes || 0}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleComments(index); }} className="flex items-center gap-0.5 sm:gap-1 text-gray-700 dark:text-gray-300 hover:text-teal-500 transition-colors duration-150">
          <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5" /><span className="text-xs sm:text-sm font-sans">{(item.comments || []).length}</span>
        </button>
        <button onClick={handleShareClick} className="flex items-center gap-0.5 sm:gap-1 text-gray-700 dark:text-gray-300 hover:text-rose-500 transition-colors duration-150">
          <Share2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /><span className="text-xs sm:text-sm font-sans">{item.shares || 0}</span>
        </button>
        {likeAnimation && <Heart className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-500 animate-pulse-fast" />}
        {shareAnimation && <Share2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-500 animate-pulse-fast" />}
      </div>
      {expandedComments[index] && (
        <div className="comments mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
          {(item.comments || []).map((comment, i) => (
            <div key={i} className="flex items-start gap-0.5 sm:gap-1 animate-fade-in">
              <img src={comment.profilePicture} alt={`${comment.user}'s profile`} className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-2 border-gradient-teal-rose object-cover" onError={(e) => { e.target.src = '/default-avatar.png'; }} />
              <div><p className="text-gray-800 dark:text-gray-300 font-sans text-xs sm:text-sm">{comment.username}</p><p className="text-gray-700 dark:text-gray-400 text-xs sm:text-sm comment-input">{comment.text}</p></div>
            </div>
          ))}
          <form onSubmit={(e) => { e.stopPropagation(); handleCommentSubmit(index, e); }} className="mt-0.5 sm:mt-1 flex gap-0.5 sm:gap-1">
            <input type="text" value={newComment[index] || ''} onChange={e => setNewComment(prev => ({ ...prev, [index]: e.target.value }))} className="flex-1 p-1 sm:p-2 border border-gray-200 dark:border-gray-600 rounded-full text-xs sm:text-sm font-sans text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500" placeholder="Add a comment..." />
            <button type="submit" className="bg-purple-600 text-white p-1 sm:p-2 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all duration-150"><Send className="w-2 sm:w-3 h-2 sm:h-3" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedItem;