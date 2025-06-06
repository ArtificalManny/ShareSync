import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, Send, FileText, CheckSquare, Paperclip, AlertCircle } from 'lucide-react';

const FeedItem = ({ item, index, newComment, expandedComments, handleLike, handleCommentSubmit, toggleComments, handleShare, user, setNewComment, accentColor }) => {
  const renderIcon = (type) => {
    switch (type) {
      case 'announcement':
      case 'update':
        return <FileText className="w-4 h-4 text-blue-accent" aria-hidden="true" />;
      case 'task-complete':
        return <CheckSquare className="w-4 h-4 text-green-accent" aria-hidden="true" />;
      case 'file':
        return <Paperclip className="w-4 h-4 text-purple-accent" aria-hidden="true" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-accent" aria-hidden="true" />;
    }
  };

  return (
    <div className="feed-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 rounded-lg shadow-sm transition-shadow hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/20 micro-gradient holographic-effect">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={item.profilePicture}
              alt={`${item.user}'s profile`}
              className="w-6 h-6 rounded-full"
              loading="lazy"
            />
            <div className="absolute inset-0 rounded-full ring-gradient"></div>
          </div>
          <div>
            <Link to={`/projects/${item.projectId}`} className="text-blue-accent font-poppins font-medium hover:underline text-sm">
              {item.projectTitle}
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-lato tracking-wide font-light">
              Posted by {item.user || item.author} • {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 mb-3">
        {renderIcon(item.type)}
        {item.type === 'activity' && (
          <p className="text-gray-700 dark:text-gray-300 font-lato text-sm tracking-wide">
            {item.user} {item.message}
          </p>
        )}
        {item.type === 'announcement' && (
          <p className="text-gray-700 dark:text-gray-300 font-lato text-sm tracking-wide">
            <span className="font-medium text-blue-accent">Announcement:</span>{' '}
            {item.content.split(/(@\w+)/g).map((part, i) =>
              part.match(/@\w+/) ? (
                <span key={i} className="text-blue-accent font-bold hover:underline bg-gray-100 dark:bg-gray-600/20 px-1 rounded">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        )}
        {item.type === 'update' && (
          <p className="text-gray-700 dark:text-gray-300 font-lato text-sm tracking-wide">
            <span className="font-medium text-blue-accent">Update:</span>{' '}
            {item.content.split(/(@\w+)/g).map((part, i) =>
              part.match(/@\w+/) ? (
                <span key={i} className="text-blue-accent font-bold hover:underline bg-gray-100 dark:bg-gray-600/20 px-1 rounded">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        )}
        {item.type === 'task-complete' && (
          <p className="text-gray-700 dark:text-gray-300 font-lato text-sm tracking-wide">
            {item.user} {item.message}
          </p>
        )}
        {item.type === 'file' && (
          <p className="text-gray-700 dark:text-gray-300 font-lato text-sm tracking-wide">
            {item.user} {item.message} - <a href={item.url} className="text-blue-accent hover:underline">View File</a>
          </p>
        )}
      </div>
      <div className="flex gap-4 mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
        <button
          onClick={() => handleLike(index)}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-accent focus:outline-none focus:ring-2 focus:ring-blue-accent micro-gradient transition-transform duration-200 transform hover:scale-105"
          aria-label={`Like feed item ${index}`}
        >
          <ThumbsUp className="w-4 h-4" style={{ stroke: `url(#thumbsup-gradient-${accentColor})` }} aria-hidden="true" />
          {item.likes}
        </button>
        <button
          onClick={() => toggleComments(index)}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-purple-accent focus:outline-none focus:ring-2 focus:ring-blue-accent micro-gradient transition-transform duration-200 transform hover:scale-105"
          aria-label={`Toggle comments for feed item ${index}`}
        >
          <MessageSquare className="w-4 h-4" style={{ stroke: `url(#message-gradient-${accentColor})` }} aria-hidden="true" />
          {item.comments.length}
        </button>
        <button
          onClick={() => handleShare(index)}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent micro-gradient transition-transform duration-200 transform hover:scale-105"
          aria-label={`Share feed item ${index}`}
        >
          <Share2 className="w-4 h-4" style={{ stroke: `url(#share-gradient-${accentColor})` }} aria-hidden="true" />
          {item.shares}
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments-section mt-4">
          {(item.comments || []).map((comment, commentIndex) => (
            <div key={commentIndex} className="comment bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-2 rounded-md mb-2">
              <div className="flex items-start gap-2">
                <div className="relative">
                  <img
                    src={comment.profilePicture}
                    alt={`${comment.user}'s profile`}
                    className="w-6 h-6 rounded-full"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 rounded-full ring-gradient"></div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-300 font-lato font-medium text-sm">{comment.username || comment.user}</p>
                  <p className="text-gray-700 dark:text-gray-400 font-lato text-sm tracking-wide">
                    {comment.text.split(/(@\w+)/g).map((part, i) =>
                      part.match(/@\w+/) ? (
                        <span key={i} className="text-blue-accent font-bold hover:underline bg-gray-100 dark:bg-gray-600/20 px-1 rounded">
                          {part}
                        </span>
                      ) : (
                        part
                      )
                    )}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 font-lato text-xs tracking-wide font-light">{new Date(comment.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newComment[index] || ''}
                onChange={(e) => setNewComment({ ...newComment, [index]: e.target.value })}
                className="w-full p-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full font-lato border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-accent pl-8 text-sm"
                placeholder="Write a comment... (@username to mention)"
                aria-label="Comment"
              />
              <MessageSquare className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400" style={{ stroke: `url(#message-gradient-${accentColor})` }} aria-hidden="true" />
            </div>
            <button
              onClick={(e) => handleCommentSubmit(index, { preventDefault: () => {}, target: e.target })}
              className="relative bg-red-accent text-white p-1 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-accent micro-gradient transition-transform duration-200 transform hover:scale-105 ripple"
              aria-label="Submit Comment"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <svg className="absolute w-0 h-0">
        <linearGradient id={`thumbsup-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#e63946', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#f6ad55', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`message-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`share-gradient-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1877f2', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#4fd1c5', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`thumbsup-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#e63946', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`message-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`share-gradient-green`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#48bb78', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`thumbsup-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#e63946', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`message-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id={`share-gradient-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
        </linearGradient>
      </svg>
    </div>
  );
};

export default FeedItem;