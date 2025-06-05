import React from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, Send } from 'lucide-react';

const FeedItem = ({ item, index, newComment, expandedComments, handleLike, handleCommentSubmit, toggleComments, handleShare, user, setNewComment }) => {
  return (
    <div className="feed-item card p-4 glassmorphic holographic-effect shadow-md card-3d animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={item.profilePicture}
              alt={`${item.user}'s profile`}
              className="w-8 h-8 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
          </div>
          <Link to={`/projects/${item.projectId}`} className="text-indigo-vivid font-orbitron font-medium hover:underline">
            {item.projectTitle}
          </Link>
        </div>
        <span className="text-lavender-gray text-sm font-inter">{new Date(item.timestamp).toLocaleString()}</span>
      </div>
      {item.type === 'activity' && (
        <p className="text-lavender-gray font-inter">
          {item.user} {item.message}
        </p>
      )}
      {item.type === 'announcement' && (
        <p className="text-lavender-gray font-inter">
          <strong>Announcement:</strong> {item.content.split(/(@\w+)/g).map((part, i) =>
            part.match(/@\w+/) ? (
              <span key={i} className="text-indigo-vivid font-bold hover:underline">
                {part}
              </span>
            ) : (
              part
            )
          )} by {item.author}
        </p>
      )}
      {item.type === 'task-complete' && (
        <p className="text-lavender-gray font-inter">
          {item.user} {item.message}
        </p>
      )}
      {item.type === 'file' && (
        <p className="text-lavender-gray font-inter">
          {item.user} {item.message} - <a href={item.url} className="text-indigo-vivid hover:underline">View File</a>
        </p>
      )}
      <div className="flex gap-4 mt-2">
        <button
          onClick={() => handleLike(index)}
          className="flex items-center gap-1 text-charcoal-gray hover:text-neon-coral focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
          aria-label={`Like feed item ${index}`}
        >
          <ThumbsUp className="w-4 h-4 animate-pulse" aria-hidden="true" /> {item.likes}
        </button>
        <button
          onClick={() => toggleComments(index)}
          className="flex items-center gap-1 text-charcoal-gray hover:text-neon-coral focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
          aria-label={`Toggle comments for feed item ${index}`}
        >
          <MessageSquare className="w-4 h-4 animate-orbit" aria-hidden="true" /> {item.comments.length}
        </button>
        <button
          onClick={() => handleShare(index)}
          className="flex items-center gap-1 text-charcoal-gray hover:text-neon-coral focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
          aria-label={`Share feed item ${index}`}
        >
          <Share2 className="w-4 h-4 animate-orbit" aria-hidden="true" /> {item.shares}
        </button>
      </div>
      {expandedComments[index] && (
        <div className="comments-section mt-4">
          {(item.comments || []).map((comment, commentIndex) => (
            <div key={commentIndex} className="comment p-2 bg-charcoal-gray bg-opacity-20 rounded-lg mb-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={comment.profilePicture}
                    alt={`${comment.user}'s profile`}
                    className="w-6 h-6 rounded-full profile-pic border-2 border-indigo-vivid shadow-lg"
                  />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-green rounded-full border-2 border-charcoal-gray animate-pulse"></div>
                </div>
                <div>
                  <p className="text-lavender-gray font-inter">{comment.text}</p>
                  <p className="text-lavender-gray text-sm font-inter">
                    By {comment.user} at {new Date(comment.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <form onSubmit={(e) => handleCommentSubmit(index, e)} className="flex gap-2 mt-2">
            <input
              type="text"
              value={newComment[index] || ''}
              onChange={(e) => setNewComment({ ...newComment, [index]: e.target.value })}
              className="input-field w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-charcoal-gray"
              placeholder="Add a comment..."
              aria-label="Comment"
            />
            <button
              type="submit"
              className="btn-primary rounded-full flex items-center focus:outline-none focus:ring-2 focus:ring-charcoal-gray holographic-effect animate-bounce"
              aria-label="Submit Comment"
            >
              <Send className="w-5 h-5 animate-orbit" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FeedItem;