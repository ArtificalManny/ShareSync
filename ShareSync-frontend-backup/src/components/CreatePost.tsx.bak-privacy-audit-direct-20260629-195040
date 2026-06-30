import { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const PostFormContainer = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.glow};
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.border};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid ${({ theme }: { theme: any }) => theme.border};
  border-radius: 5px;
  background: ${({ theme }) => theme.cardBackground};
  color: ${({ theme }) => theme.text};
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  margin: 10px 0;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.glow};
  }
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const CreatePost = ({ projectId }: { projectId: string }) => {
  const { currentTheme } = useTheme();
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/posts`,
        { content, projectId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setContent('');
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  return (
    <PostFormContainer theme={currentTheme}>
      <form onSubmit={handleSubmit}>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          theme={currentTheme}
        />
        <Button type="submit" theme={currentTheme}>Post</Button>
      </form>
    </PostFormContainer>
  );
};

export default CreatePost;