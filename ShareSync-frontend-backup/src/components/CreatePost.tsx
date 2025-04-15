import React, { useState, FormEvent } from 'react';
import axios from 'axios';

interface CreatePostProps {
  projectId: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ projectId }) => {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        content,
        projectId,
      });
      setContent('');
    } catch (err) {
      console.error('CreatePost.tsx: Error creating post:', err);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={styles.textarea}
          required
        />
        <button type="submit" style={styles.submitButton}>Post</button>
      </form>
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    background: 'rgba(162, 228, 255, 0.1)',
    borderRadius: '15px',
    boxShadow: '0 0 20px rgba(162, 228, 255, 0.3)',
    border: '1px solid #A2E4FF',
    animation: 'fadeIn 1s ease-in-out',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    fontSize: '16px',
    backgroundColor: '#1E1E2F',
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
    resize: 'vertical',
    minHeight: '100px',
    transition: 'box-shadow 0.3s ease',
  },
  submitButton: {
    background: 'linear-gradient(90deg, #A2E4FF, #FF6F91)',
    color: '#1E1E2F',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 15px rgba(162, 228, 255, 0.5)',
    transition: 'transform 0.1s ease, box-shadow 0.3s ease',
  },
};

// Add keyframes for animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  button:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(162, 228, 255, 0.7);
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  textarea:focus {
    box-shadow: 0 0 10px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default CreatePost;