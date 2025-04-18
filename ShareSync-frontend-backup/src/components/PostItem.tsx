import { useDispatch } from 'react-redux';
import { likePost } from '../store/slices/postsSlice';

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
    <div>
      <p>{post.content}</p>
      <button onClick={handleLike}>Like ({post.likes})</button>
    </div>
  );
};

export default PostItem;