import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, Send } from 'lucide-react';

const FeedItem = ({ item, index, newComment, expandedComments, handleLike, handleCommentSubmit, toggleComments, handleShare, user, setNewComment }) => {
  return (
    <div className="feed-item card p-4 glassmorphic holographic-effect shadow-md">
      <div className="flex justify-between items-center mb-2">
        <Link to={`/projects/${item.projectId}`} className="text-primary-blue font-orbitron font-medium hover:underline">
          {item.projectTitle}
        </Link>
        <span className="text-secondary-gray text-sm font-inter">{new Date(item.timestamp).toLocaleString()}</span>
      </div>
      {item.type === 'activity' && (
        <p className="text-secondary-gray font-inter">
          {item.user} {item.message}
        </p>
      )}
      {item.type === 'announcement' && (
        <p className="text-secondary-gray font-inter">
          <strong>Announcement:</strong> {item.content} by {item.author}
        </p>
      )}
      {item.type === 'task-complete' && (
        <p className="text-secondary-gray font-inter">
          {item.user} {item.message}
        </p>
      )}
      {item.type === 'file' && (
        <p className="text-secondary-gray font-inter">
          {item.user} {item.message} - <a href={item.url} className="text-primary-blue hover:underline">View File</a>
        </p>
      )}
      <div className="flex gap-4 mt-2">
        <button
          onClick={() => handleLike(index)}
          className="flex items-center gap-1 text-neutral-gray hover:text-primary-blue focus:outline-none focus:ring-2 focus:ring-neutral-gray"
          aria-label={`Like feed item ${index}`}
        >
          <ThumbsUp className="w-4 h-4" aria-hidden="true" /> {item.likes}
        </button>
        <button
          onClick={() => toggleComments(index)}
          className="flex items-center gap-1 text-neutral-gray hover:text-primary-blue focus:outline-none focus:ring-2 focus:ring-neutral-gray"
          aria-label={`Toggle comments for feed item ${index}`}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" /> {item.comments.length}
        </button>
        <button
          onClick={() => handleShare(index)}
          className="flex items-center gap-1 text-neutral-gray hover:text-primary-blue focus:outline-none focus:ring-2 focus:ring-neutral-gray"
          aria-label={`Share feed item ${index}`}
        >
          <Share2 className="w-4 h-4" aria-hidden="true" /> {item.shares}
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments-section mt-4">
          {(item.comments || []).map((comment, commentIndex) => (
            <div key={commentIndex} className="comment p-2 bg-neutral-gray bg-opacity-20 rounded-lg mb-2">
              <p className="text-secondary-gray font-inter">{comment.text}</p>
              <p className="text-secondary-gray text-sm font-inter">
                By {comment.user} at {new Date(comment.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          <form onSubmit={(e) => handleCommentSubmit(index, e)} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newComment[index] || ''}
              onChange={(e) => setNewComment({ ...newComment, [index]: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-gray"
              placeholder="Add a comment..."
              aria-label="Comment"
            />
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-neutral-gray holographic-effect"
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