import React from 'react';

interface AnnouncementProps {
  announcement: {
    id: number;
    content: string;
    media: string;
    likes: number;
    comments: { user: string; text: string }[];
    user: string;
  };
  onLike?: () => void;
  onComment?: (text: string) => void;
}

const Announcement: React.FC<AnnouncementProps> = ({ announcement, onLike, onComment }) => {
  const [comment, setComment] = React.useState('');

  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <p className="text-gray-800">{announcement.content}</p>
      {announcement.media && <img src={announcement.media} alt="Announcement media" className="mt-2 max-w-full rounded" />}
      <p className="text-gray-600">By: {announcement.user}</p>
      <p className="text-gray-600">Likes: {announcement.likes}</p>
      <button onClick={onLike} className="mt-2 py-1 px-3 bg-blue-500 text-white rounded hover:bg-blue-600">Like</button>
      <div className="mt-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded"
        />
        <button onClick={() => onComment && onComment(comment)} className="mt-2 py-1 px-3 bg-green-500 text-white rounded hover:bg-green-600">Comment</button>
      </div>
      <div className="mt-2">
        {announcement.comments.map((c, index) => (
          <p key={index} className="text-gray-700">-{c.user}: {c.text}</p>
        ))}
      </div>
    </div>
  );
};

export default Announcement;