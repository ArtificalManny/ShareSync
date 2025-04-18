import { useState } from 'react';
import axios from '../axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const CreatePostContainer = styled.div`
  background: ${({ theme }) => theme.background === '#0d1b2a' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 0 15px ${({ theme }) => theme.glow};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Textarea = styled.textarea`
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 5px;
  font-size: 14px;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  outline: none;
  resize: none;
  height: 100px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  }
`;

const Button = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SuccessMessage = styled.p`
  color: #55ff55;
  text-align: center;
  margin-top: 10px;
  text-shadow: 0 0 5px rgba(85, 255, 85, 0.5);
  animation: fadeIn 0.5s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

interface CreatePostProps {
  projectId: string;
}

const CreatePost = ({ projectId }: CreatePostProps) => {
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const { currentTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/posts', { projectId, content }, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setContent('');
      setSuccess('Post created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <CreatePostContainer theme={currentTheme}>
      <Form onSubmit={handleSubmit}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a post..."
          theme={currentTheme}
          required
        />
        <Button type="submit" theme={currentTheme}>Post</Button>
      </Form>
      {success && <SuccessMessage>{success}</SuccessMessage>}
    </CreatePostContainer>
  );
};

export default CreatePost;