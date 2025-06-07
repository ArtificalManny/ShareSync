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

  useEffect(() => {
    if (likeAnimation) {
      const timer = setTimeout(() => setLikeAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [likeAnimation]);

  const renderContent = () => {
    switch (item.type) {
      case 'activity':
        return <div className="flex items-center gap-1 sm:gap-2"><User className="w-4 h-4 sm:w-5 h-5 text-gray-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base">{item.message} <span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span></div>;
      case 'announcement':
      case 'poll':
        return <div className="flex items-center gap-1 sm:gap-2"><MessageSquare className="w-4 h-4 sm:w-5 h-5 text-gray-500" /><div><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base"><span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span><p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{item.content}</p></div></div>;
      case 'task-complete':
        return <div className="flex items-center gap-1 sm:gap-2"><CheckSquare className="w-4 h-4 sm:w-5 h-5 text-emerald-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base">{item.message} <span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span></div>;
      case 'file':
        return <div className="flex items-center gap-1 sm:gap-2"><FileText className="w-4 h-4 sm:w-5 h-5 text-gray-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-sm sm:text-base">Shared <a href={item.url} className="text-purple-500 hover:text-purple-600">{item.message}</a> <span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span></div>;
      default: return null;
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!isLiked) {
      handleDoubleLike(index);
      setLikeAnimation(true);
      setIsLiked(true);
      setTimeout(() => setIsLiked(false), 1000);
    }
  };

  return (
    <div className="feed-item bg-white/98 dark:bg-gray-800/98 border border-gray-50 dark:border-gray-700 rounded-xl p-2 sm:p-3 shadow-sm hover:shadow-md hover-glow transition-all duration-200 cursor-pointer" onClick={() => console.log(`View ${item.type} in ${item.projectTitle}`)} onDoubleClick={handleDoubleClick}>
      <div className="flex items-start gap-1 sm:gap-2 mb-1 sm:mb-1">
        <div className="relative">
          <img src={item.profilePicture} alt={`${item.user}'s profile`} className="w-7 h-7 sm:w-8 h-8 rounded-full border-2 border-gradient-purple-teal object-cover" loading="lazy" />
          <div className="absolute inset-0 rounded-full ring-2 ring-purple-500 animate-pulse-slow"></div>
        </div>
        <div className="flex-1">{renderContent()}</div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1">
        <button onClick={(e) => { e.stopPropagation(); handleLike(index); }} className="flex items-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 hover:text-purple-500 transition-colors duration-200">
          <ThumbsUp className="w-3 h-3 sm:w-4 h-4" /><span className="text-xs sm:text-sm font-sans">{item.likes || 0}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleComments(index); }} className="flex items-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 hover:text-teal-400 transition-colors duration-200">
          <MessageSquare className="w-3 h-3 sm:w-4 h-4" /><span className="text-xs sm:text-sm font-sans">{(item.comments || []).length}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleShare(index); }} className="flex items-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors duration-200">
          <Share2 className="w-3 h-3 sm:w-4 h-4" /><span className="text-xs sm:text-sm font-sans">{item.shares || 0}</span>
        </button>
        {likeAnimation && <Heart className="w-3 h-3 sm:w-4 h-4 text-rose-500 animate-pulse-fast" />}
      </div>
      {expandedComments[index] && (
        <div className="comments mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
          {(item.comments || []).map((comment, i) => (
            <div key={i} className="flex items-start gap-0.5 sm:gap-1 animate-fade-in">
              <img src={comment.profilePicture} alt={`${comment.user}'s profile`} className="w-5 h-5 sm:w-6 h-6 rounded-full border-2 border-gradient-teal-rose object-cover" />
              <div><p className="text-gray-800 dark:text-gray-300 font-sans text-xs sm:text-sm">{comment.username}</p><p className="text-gray-700 dark:text-gray-400 text-xs">{comment.text}</p></div>
            </div>
          ))}
          <form onSubmit={(e) => { e.stopPropagation(); handleCommentSubmit(index, e); }} className="mt-0.5 sm:mt-1 flex gap-0.5 sm:gap-1">
            <input type="text" value={newComment[index] || ''} onChange={e => setNewComment(prev => ({ ...prev, [index]: e.target.value }))} className="flex-1 p-1 sm:p-2 border border-gray-200 dark:border-gray-600 rounded-full text-xs sm:text-sm font-sans text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800" placeholder="Comment..." />
            <button type="submit" className="bg-purple-500 text-white p-1 sm:p-2 rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"><Send className="w-3 h-3 sm:w-4 h-4" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedItem;