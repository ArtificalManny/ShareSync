import { useDispatch } from 'react-redux';
import { likePost } from '../store/slices/postsSlice';
import styled from 'styled-components';

const PostItemContainer = styled.div`
  background: ${({ theme }) => theme.background === '#ffffff' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'};
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const Content = styled.p`
  margin-bottom: 10px;
  font-size: 16px;
`;

const LikeButton = styled.button`
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.buttonText};
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s ease, transform 0.1s ease;

  &:hover {
    background: ${({ theme }) => theme.secondary};
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
    <PostItemContainer theme={{ primary: '#007bff', secondary: '#6c757d', buttonText: '#ffffff' }}>
      <Content>{post.content}</Content>
      <LikeButton onClick={handleLike} theme={{ primary: '#007bff', secondary: '#6c757d', buttonText: '#ffffff' }}>
        Like ({post.likes})
      </LikeButton>
    </PostItemContainer>
  );
};

export default PostItem;