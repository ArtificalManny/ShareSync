import React from 'react';
import { ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare } from 'lucide-react';

const FeedItem = ({ item, index, newComment, expandedComments, handleLike, handleCommentSubmit, toggleComments, handleShare, user, setNewComment }) => {
  return (
    <div className="feed-item card p-4 glassmorphic">
      <div className="flex items-start gap-3">
        {item.type === 'activity' && <Folder className="w-5 h-5 text-blue-500" />}
        {item.type === 'announcement' && <MessageSquare className="w-5 h-5 text-blue-500" />}
        {item.type === 'task-complete' && <CheckSquare className="w-5 h-5 text-blue-500" />}
        {item.type === 'file' && <FileText className="w-5 h-5 text-blue-500" />}
        <div className="flex-1">
          <p className="text-gray-200 font-inter">
            <strong>{item.projectTitle}</strong> - {item.message || item.content}
          </p>
          <p className="text-teal-400 text-sm font-inter">
            {item.user || item.author} - {new Date(item.timestamp).toLocaleString()}
          </p>
          {item.type === 'announcement' && item.options && item.options.length > 0 && (
            <div className="mt-2 space-y-2">
              {item.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <button
                    className="btn-primary rounded-full px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label={`Vote for ${option}`}
                  >
                    Vote
                  </button>
                  <span className="text-gray-200 font-inter">{option}</span>
                  <span className="text-teal-400 font-inter">
                    ({item.votes?.filter((v) => v.option === option).length || 0} votes)
                  </span>
                </div>
              ))}
            </div>
          )}
          {item.type === 'file' && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              View File
            </a>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => handleLike(index)}
              className="flex items-center gap-1 text-blue-500 hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label={`Like (${item.likes || 0} likes)`}
            >
              <ThumbsUp className="w-5 h-5" aria-hidden="true" /> {item.likes || 0}
            </button>
            <button
              onClick={() => toggleComments(index)}
              className="flex items-center gap-1 text-blue-500 hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label={`Toggle comments (${item.comments?.length || 0} comments)`}
            >
              <MessageSquare className="w-5 h-5" aria-hidden="true" /> {item.comments?.length || 0}
            </button>
            <button
              onClick={() => handleShare(index)}
              className="flex items-center gap-1 text-blue-500 hover:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label={`Share (${item.shares || 0} shares)`}
            >
              <Share2 className="w-5 h-5" aria-hidden="true" /> {item.shares || 0}
            </button>
          </div>
          {expandedComments[index] && (
            <div className="comments-section mt-3 animate-slide-down">
              {item.comments?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {item.comments.map((comment, cIndex) => (
                    <div key={cIndex} className="comment p-2 bg-teal-500 bg-opacity-20 rounded">
                      <p className="text-gray-200 text-sm font-inter">
                        <strong>{comment.user}:</strong> {comment.text}
                      </p>
                      <p className="text-teal-400 text-xs font-inter">
                        {new Date(comment.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-teal-400 text-sm font-inter">No comments yet.</p>
              )}
              <form onSubmit={(e) => handleCommentSubmit(index, e)} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newComment[index] || ''}
                  onChange={(e) =>
                    setNewComment((prev) => ({ ...prev, [index]: e.target.value }))
                  }
                  className="input-field flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Add a comment..."
                  aria-label="Comment input"
                />
                <button
                  type="submit"
                  className="btn-primary rounded-full flex items-center px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label="Submit comment"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedItem;