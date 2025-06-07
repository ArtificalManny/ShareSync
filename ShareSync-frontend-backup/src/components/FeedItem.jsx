import React from 'react';
import { ThumbsUp, MessageSquare, Share2, FileText, CheckSquare, User } from 'lucide-react';

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
}) => {
  const renderContent = () => {
    switch (item.type) {
      case 'activity':
        return <div className="flex items-center gap-2"><User className="w-5 h-5 text-gray-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-base">{item.message} <span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span></div>;
      case 'announcement':
      case 'poll':
        return <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-gray-500" /><div><span className="text-gray-700 dark:text-gray-300 font-sans text-base"><span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span><p className="text-gray-600 dark:text-gray-400 text-sm">{item.content}</p></div></div>;
      case 'task-complete':
        return <div className="flex items-center gap-2"><CheckSquare className="w-5 h-5 text-emerald-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-base">{item.message} <span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span></div>;
      case 'file':
        return <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-gray-500" /><span className="text-gray-700 dark:text-gray-300 font-sans text-base">Shared <a href={item.url} className="text-purple-500 hover:text-purple-600">{item.message}</a> <span className="text-purple-500 hover:text-purple-600 cursor-pointer">{item.projectTitle}</span></span></div>;
      default: return null;
    }
  };

  return (
    <div className="feed-item bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={() => console.log(`View ${item.type} details for ${item.projectTitle}`)}>
      <div className="flex items-start gap-3 mb-2">
        <div className="relative">
          <img src={item.profilePicture} alt={`${item.user}'s profile`} className="w-10 h-10 rounded-full border-2 border-gradient-purple-teal object-cover" loading="lazy" />
          <div className="absolute inset-0 rounded-full ring-2 ring-purple-500 animate-pulse-slow"></div>
        </div>
        <div className="flex-1">{renderContent()}</div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <button onClick={(e) => { e.stopPropagation(); handleLike(index); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 transition-colors duration-200">
          <ThumbsUp className="w-5 h-5" /><span className="text-sm font-sans">{item.likes || 0}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleComments(index); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-400 transition-colors duration-200">
          <MessageSquare className="w-5 h-5" /><span className="text-sm font-sans">{(item.comments || []).length}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleShare(index); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors duration-200">
          <Share2 className="w-5 h-5" /><span className="text-sm font-sans">{item.shares || 0}</span>
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments mt-3 space-y-2">
          {(item.comments || []).map((comment, i) => (
            <div key={i} className="flex items-start gap-2 animate-fade-in">
              <img src={comment.profilePicture} alt={`${comment.user}'s profile`} className="w-8 h-8 rounded-full border-2 border-gradient-teal-rose object-cover" />
              <div><p className="text-gray-800 dark:text-gray-300 font-sans text-sm">{comment.username}</p><p className="text-gray-700 dark:text-gray-400 text-xs">{comment.text}</p></div>
            </div>
          ))}
          <form onSubmit={(e) => { e.stopPropagation(); handleCommentSubmit(index, e); }} className="mt-2 flex gap-2">
            <input type="text" value={newComment[index] || ''} onChange={e => setNewComment(prev => ({ ...prev, [index]: e.target.value }))} className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-sans text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800" placeholder="Comment..." />
            <button type="submit" className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"><Send className="w-5 h-5" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedItem;