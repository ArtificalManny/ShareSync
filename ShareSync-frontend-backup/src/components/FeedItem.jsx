import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Send, Share2, FileText, CheckSquare } from 'lucide-react';

const FeedItem = ({ item, index, newComment, expandedComments, handleLike, handleCommentSubmit, toggleComments, handleShare, user }) => {
  return (
    <div className="feed-item card p-6 glassmorphic animate-fade-in" style={{ transformStyle: 'preserve-3d' }}>
      <div className="flex justify-between items-center mb-3">
        <Link to={`/projects/${item.projectId}`} className="text-neon-magenta font-orbitron font-bold text-lg hover:underline">
          {item.projectTitle}
        </Link>
        <p className="text-cyber-teal text-sm font-inter">{new Date(item.timestamp).toLocaleString()}</p>
      </div>
      {item.type === 'activity' ? (
        <p className="text-light-text font-inter">{item.message} by {item.user}</p>
      ) : item.type === 'task-complete' ? (
        <p className="text-light-text font-inter flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-holo-silver" aria-hidden="true" /> {item.message} by {item.user}
        </p>
      ) : item.type === 'file' ? (
        <p className="text-light-text font-inter flex items-center gap-2">
          <FileText className="w-5 h-5 text-holo-silver" aria-hidden="true" /> {item.message} by {item.user}
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-neon-magenta hover:underline ml-2">View File</a>
        </p>
      ) : (
        <>
          <p className="text-light-text font-inter">{item.content}</p>
          {item.type === 'picture' && (
            <img src={item.content} alt="Post content" className="w-full h-48 object-cover rounded-lg mt-3" />
          )}
          {item.type === 'poll' && (
            <div className="mt-3 space-y-2">
              {item.options.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <button className="btn-primary rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-holo-silver" aria-label={`Vote for ${option}`}>Vote</button>
                  <span className="text-light-text font-inter">{option}</span>
                  <span className="text-cyber-teal font-inter">({item.votes.filter(v => v.option === option).length} votes)</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-cyber-teal text-sm mt-2 font-inter">Posted by {item.author}</p>
        </>
      )}
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => handleLike(index)}
          className="flex items-center gap-1 text-neon-magenta hover:text-holo-silver transition-colors focus:outline-none focus:ring-2 focus:ring-holo-silver animate-pulse-on-hover"
          aria-label={`Like this update (${item.likes} likes)`}
        >
          <ThumbsUp className="w-5 h-5" aria-hidden="true" /> {item.likes} Likes
        </button>
        <button
          onClick={() => toggleComments(index)}
          className="flex items-center gap-1 text-neon-magenta hover:text-holo-silver transition-colors focus:outline-none focus:ring-2 focus:ring-holo-silver"
          aria-label="Toggle comments"
        >
          <MessageSquare className="w-5 h-5" aria-hidden="true" /> {item.comments.length} Comments
        </button>
        <button
          onClick={() => handleShare(index)}
          className="flex items-center gap-1 text-neon-magenta hover:text-holo-silver transition-colors focus:outline-none focus:ring-2 focus:ring-holo-silver"
          aria-label={`Share this update (${item.shares} shares)`}
        >
          <Share2 className="w-5 h-5" aria-hidden="true" /> {item.shares} Shares
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments-section mt-4 animate-slide-down">
          {item.comments.length > 0 ? (
            <div className="space-y-2">
              {item.comments.map((comment, cIndex) => (
                <div key={cIndex} className="comment p-3 bg-cyber-teal bg-opacity-20 rounded-lg">
                  <p className="text-light-text text-sm font-inter">
                    <strong>{comment.user}:</strong> {comment.text}
                  </p>
                  <p className="text-cyber-teal text-xs font-inter">{new Date(comment.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cyber-teal text-sm font-inter">No comments yet.</p>
          )}
          <form onSubmit={(e) => handleCommentSubmit(index, e)} className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={newComment[index] || ''}
              onChange={(e) => setNewComment(prev => ({ ...prev, [index]: e.target.value }))}
              placeholder="Add a comment..."
              className="input-field w-full rounded-full focus:outline-none focus:ring-2 focus:ring-holo-silver"
              aria-label="Add a comment"
            />
            <button type="submit" className="btn-primary rounded-full flex items-center animate-glow focus:outline-none focus:ring-2 focus:ring-holo-silver" aria-label="Submit comment">
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedItem;