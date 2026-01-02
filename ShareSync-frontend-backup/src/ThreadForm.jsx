import { toast } from "./components/ui/Toast";
// src/components/forum/ThreadForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logUserActivity } from '../../utils/activityLogger';

// Placeholder createThread function (replace with real API logic)
const createThread = async ({ title, content, projectId }) => {
  // Simulate thread creation response
  return {
    _id: Math.random().toString(36).substring(2),
    title,
    content,
    projectId,
  };
};

const ThreadForm = ({ projectId }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    setSubmitting(true);
    try {
      const thread = await createThread({ title, content, projectId });

      await logUserActivity(user._id, 'forum', 'created thread', projectId, {
        threadId: thread._id,
        title: thread.title,
      });

      setTitle('');
      setContent('');
      toast.success('Thread created!', { description: 'Activity has been logged', duration: 3000 });
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread', { description: 'Please try again', duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCreateThread} className="thread-form">
      <h3>Create New Thread</h3>
      <input
        type="text"
        placeholder="Thread Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Thread Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating...' : 'Post Thread'}
      </button>
    </form>
  );
};

export default ThreadForm;
