import { useEffect, useState } from 'react';
import axios from '../axios';
import PostItem from './PostItem';
import { useTheme } from '../contexts/ThemeContext';

interface Post {
  _id: string;
  content: string;
  projectId: string;
  likes: number;
}

interface PostsListProps {
  projectId: string;
}

const PostsList = ({ projectId }: PostsListProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`/posts/project/${projectId}`);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    fetchPosts();
  }, [projectId]);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text, padding: '20px' }}>
      {posts.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostsList;