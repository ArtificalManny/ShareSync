import { useState } from 'react';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';

interface CreatePostProps {
  projectId: string;
}

const CreatePost = ({ projectId }: CreatePostProps) => {
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
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a post..."
          style={{ width: '100%', minHeight: '100px', marginBottom: '10px', padding: '5px' }}
        />
        <button type="submit" style={{ background: currentTheme.primary, color: currentTheme.buttonText, padding: '5px 10px' }}>
          Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;