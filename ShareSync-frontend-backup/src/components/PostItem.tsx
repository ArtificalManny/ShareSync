import { useState } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const PostContainer = styled.div`
  background: ${({ theme }: { theme: any }) => theme.cardBackground};
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  box-shadow: ${({ theme }) => theme.glow};
`;

const PostContent = styled.p`
  margin: 0 0 10px 0;
  box-shadow: ${({ theme }: { theme: any }) => theme.glow};
`;

const LikeButton = styled.button`
  background: linear-gradient(45deg, ${({ theme }: { theme: any }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  padding: 5px 10px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  margin-right: 10px;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.glow};
  }
`;

const CommentButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }: { theme: any }) => theme.accent};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.highlight};
  }
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

interface Post {
  _id: string;
  content: string;
  creator: { _id: string; firstName: string; lastName: string };
  likes: string[];
}

const PostItem = ({ post }: { post: Post }) => {
  const { currentTheme } = useTheme();
  const [likes, setLikes] = useState(post.likes.length);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    try {
      await axios.post(
        `${API_URL}/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setLikes(liked ? likes - 1 : likes + 1);
      setLiked(!liked);
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  return (
    <PostContainer theme={currentTheme}>
      <PostContent theme={currentTheme}>
        {post.creator.firstName} {post.creator.lastName}: {post.content}
      </PostContent>
      <LikeButton onClick={handleLike} theme={currentTheme}>
        {liked ? 'Unlike' : 'Like'} ({likes})
      </LikeButton>
      <CommentButton theme={currentTheme}>Comment</CommentButton>
    </PostContainer>
  );
};

export default PostItem;