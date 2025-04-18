import { useDispatch } from 'react-redux';
import { likePost } from '../store/slices/postsSlice';
import styled from 'styled-components';

const PostItemContainer = styled.div`
  background: ${({ theme }) => theme.background === '#0d1b2a' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  box-shadow: 0 0 15px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 25px ${({ theme }) => theme.glow};
  }
`;

const Content = styled.p`
  margin-bottom: 10px;
  font-size: 16px;
  text-shadow: 0 0 5px ${({ theme }) => theme.glow};
`;

const LikeButton = styled.button`
  background: linear-gradient(45deg, ${({ theme }) => theme.primary}, ${({ theme }) => theme.secondary});
  color: ${({ theme }) => theme.buttonText};
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  box-shadow: 0 0 10px ${({ theme }) => theme.glow};
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

interface Post {
  _id: string;
  content: string;
  likes: number;
}

interface PostItemProps {
  post: Post;
}

const PostItem = ({ post }: PostItemProps) => {
  const dispatch = useDispatch();

  const handleLike = () => {
    dispatch(likePost({ postId: post._id, userId: 'user_id' }));
  };

  return (
    <PostItemContainer theme={currentTheme}>
      <Content theme={currentTheme}>{post.content}</Content>
      <LikeButton onClick={handleLike} theme={currentTheme}>
        Like ({post.likes})
      </LikeButton>
    </PostItemContainer>
  );
};

export default PostItem;