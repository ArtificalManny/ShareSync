import { useEffect, useState } from 'react';
import axios from '../axios';
import PostItem from './PostItem';
import { useTheme } from '../contexts/ThemeContext';

const PostsList = ({ projectId }: { projectId: string }) => {
  const [posts, setPosts] = useState([]);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const fetchPosts = async () => {
      const response = await axios.get(`/posts/project/${projectId}`);
      setPosts(response.data);
    };
    fetchPosts();
  }, [projectId]);

  return (
    <div style={{ background: currentTheme.background, color: currentTheme.text }}>
      {posts.map((post) => (
        <PostItem key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostsList;