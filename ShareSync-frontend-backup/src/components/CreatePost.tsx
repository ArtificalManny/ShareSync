import { useState } from 'react';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';

const CreatePost = ({ projectId }: { projectId: string }) => {
  const [content, setContent] = useState('');
  const { currentTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/posts', { projectId, content });
      setContent('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text }}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a post..."
          style={{ width: '100%', minHeight: '100px' }}
        />
        <button type="submit">Post</button>
      </form>
    </div>
  );
};

export default CreatePost;