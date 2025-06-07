import React from 'react';
import { ThumbsUp, MessageSquare, Share2, FileText, CheckSquare } from 'lucide-react';

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
        return (
          <p className="text-gray-700 dark:text-gray-300 font-sans text-base">
            <span className="font-medium">{item.user}</span> {item.message} in{' '}
            <span className="text-purple-500 hover:text-purple-600">{item.projectTitle}</span>
          </p>
        );
      case 'announcement':
      case 'poll':
        return (
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-sans text-base">
              <span className="font-medium">{item.author}</span> posted an {item.type} in{' '}
              <span className="text-purple-500 hover:text-purple-600">{item.projectTitle}</span>
            </p>
            <p className="mt-1 text-gray-600 dark:text-gray-400 font-sans text-sm">{item.content}</p>
            {item.options && item.options.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.options.map((option, idx) => (
                  <div key={idx} className="text-gray-600 dark:text-gray-400 font-sans text-sm">
                    - {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'task-complete':
        return (
          <p className="text-gray-700 dark:text-gray-300 font-sans text-base">
            <span className="font-medium">{item.user}</span> completed a task: {item.message} in{' '}
            <span className="text-purple-500 hover:text-purple-600">{item.projectTitle}</span>
          </p>
        );
      case 'file':
        return (
          <p className="text-gray-700 dark:text-gray-300 font-sans text-base">
            <span className="font-medium">{item.user}</span> shared a file: <a href={item.url} className="text-purple-500 hover:text-purple-600">{item.message}</a> in{' '}
            <span className="text-purple-500 hover:text-purple-600">{item.projectTitle}</span>
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="feed-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
      <div className="flex items-start gap-3 mb-2">
        <div className="relative">
          <img
            src={item.profilePicture}
            alt={`${item.user}'s profile`}
            className="w-10 h-10 rounded-full border-2 border-gradient-purple-pink object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-purple-500 animate-pulse-slow"></div>
        </div>
        <div className="flex-1">
          {renderContent()}
          <div className="text-gray-500 dark:text-gray-500 font-sans text-xs mt-1">
            {new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={() => handleLike(index)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 transition-colors duration-200"
          aria-label="Like this post"
        >
          <ThumbsUp className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-sans">{item.likes || 0}</span>
        </button>
        <button
          onClick={() => toggleComments(index)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-400 transition-colors duration-200"
          aria-label="View comments"
        >
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-sans">{(item.comments || []).length}</span>
        </button>
        <button
          onClick={() => handleShare(index)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-500 transition-colors duration-200"
          aria-label="Share this post"
        >
          <Share2 className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm font-sans">{item.shares || 0}</span>
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments mt-3 space-y-2">
          {(item.comments || []).map((comment, commentIndex) => (
            <div key={commentIndex} className="flex items-start gap-2 animate-fade-in">
              <img
                src={comment.profilePicture}
                alt={`${comment.user}'s profile`}
                className="w-8 h-8 rounded-full border-2 border-gradient-teal-pink object-cover"
                loading="lazy"
              />
              <div>
                <p className="text-gray-800 dark:text-gray-300 font-sans font-medium text-base">{comment.username}</p>
                <p className="text-gray-700 dark:text-gray-400 font-sans text-sm">{comment.text}</p>
                <p className="text-gray-500 dark:text-gray-500 font-sans text-xs">{new Date(comment.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
          <form onSubmit={(e) => handleCommentSubmit(index, e)} className="mt-2 flex gap-2">
            <input
              type="text"
              value={newComment[index] || ''}
              onChange={(e) => setNewComment(prev => ({ ...prev, [index]: e.target.value }))}
              className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-full font-sans text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
              placeholder="Add a comment..."
              aria-label="Add a comment"
            />
            <button
              type="submit"
              className="bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-transform duration-200 transform hover:scale-105"
              aria-label="Submit comment"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedItem;