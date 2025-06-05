import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, Send, FileText, CheckSquare, Paperclip } from 'lucide-react';

const FeedItem = ({ item, index, newComment, expandedComments, handleLike, handleCommentSubmit, toggleComments, handleShare, user, setNewComment }) => {
  const renderIcon = (type) => {
    switch (type) {
      case 'announcement':
      case 'update':
        return <FileText className="w-5 h-5 text-indigo-vivid" aria-hidden="true" />;
      case 'task-complete':
        return <CheckSquare className="w-5 h-5 text-emerald-green" aria-hidden="true" />;
      case 'file':
        return <Paperclip className="w-5 h-5 text-saffron-yellow" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <div className="feed-item bg-white border border-gray-200 p-4 rounded-md shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <img
            src={item.profilePicture}
            alt={`${item.user}'s profile`}
            className="w-10 h-10 rounded-full border border-gray-300"
          />
          <div>
            <Link to={`/projects/${item.projectId}`} className="text-indigo-vivid font-orbitron font-medium hover:underline">
              {item.projectTitle}
            </Link>
            <p className="text-gray-500 text-sm font-inter">Posted by {item.user || item.author} • {new Date(item.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 mb-3">
        {renderIcon(item.type)}
        {item.type === 'activity' && (
          <p className="text-gray-700 font-inter">
            {item.user} {item.message}
          </p>
        )}
        {item.type === 'announcement' && (
          <p className="text-gray-700 font-inter">
            <span className="font-medium text-indigo-vivid">Announcement:</span> {item.content.split(/(@\w+)/g).map((part, i) =>
              part.match(/@\w+/) ? (
                <span key={i} className="text-indigo-vivid font-bold hover:underline">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        )}
        {item.type === 'update' && (
          <p className="text-gray-700 font-inter">
            <span className="font-medium text-indigo-vivid">Update:</span> {item.content.split(/(@\w+)/g).map((part, i) =>
              part.match(/@\w+/) ? (
                <span key={i} className="text-indigo-vivid font-bold hover:underline">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        )}
        {item.type === 'task-complete' && (
          <p className="text-gray-700 font-inter">
            {item.user} {item.message}
          </p>
        )}
        {item.type === 'file' && (
          <p className="text-gray-700 font-inter">
            {item.user} {item.message} - <a href={item.url} className="text-indigo-vivid hover:underline">View File</a>
          </p>
        )}
      </div>
      <div className="flex gap-4 mt-2 border-t border-gray-200 pt-2">
        <button
          onClick={() => handleLike(index)}
          className="flex items-center gap-1 text-gray-600 hover:text-emerald-green focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label={`Like feed item ${index}`}
        >
          <ThumbsUp className="w-4 h-4" aria-hidden="true" /> {item.likes}
        </button>
        <button
          onClick={() => toggleComments(index)}
          className="flex items-center gap-1 text-gray-600 hover:text-indigo-vivid focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label={`Toggle comments for feed item ${index}`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" /> {item.comments.length}
        </button>
        <button
          onClick={() => handleShare(index)}
          className="flex items-center gap-1 text-gray-600 hover:text-neon-coral focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label={`Share feed item ${index}`}
        >
          <Share2 className="w-4 h-4" aria-hidden="true" /> {item.shares}
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments-section mt-4">
          {(item.comments || []).map((comment, commentIndex) => (
            <div key={commentIndex} className="comment bg-gray-100 border border-gray-200 p-2 rounded-md mb-2">
              <div className="flex items-start gap-2">
                <img
                  src={comment.profilePicture}
                  alt={`${comment.user}'s profile`}
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
                <div className="flex-1">
                  <p className="text-gray-800 font-inter font-medium text-sm">{comment.username || comment.user}</p>
                  <p className="text-gray-700 font-inter text-sm">{comment.text}</p>
                  <p className="text-gray-500 font-inter text-xs">{new Date(comment.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          <form onSubmit={(e) => handleCommentSubmit(index, e)} className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newComment[index] || ''}
                onChange={(e) => setNewComment({ ...newComment, [index]: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-full font-inter text-gray-700 pl-10"
                placeholder="Write a comment... (@username to mention)"
                aria-label="Comment"
              />
              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" aria-hidden="true" />
            </div>
            <button
              type="submit"
              className="bg-emerald-green text-white p-2 rounded-full hover:bg-neon-coral focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Submit Comment"
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