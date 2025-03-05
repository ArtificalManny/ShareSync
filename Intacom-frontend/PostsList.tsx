// src/components/PostsList.tsx
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchPosts, addPost, addGlobalPost, addCommentToPost, likePostInState } from '../store/slices/postsSlice';
import PostItem from './PostItem';
import { Box } from '@mui/material';
import io from 'socket.io-client';

interface PostsListProps {
  projectId?: string;
  type: 'project' | 'global';
}

const socket = io('http://localhost:3000'); // Update based on backend URL

const PostsList: React.FC<PostsListProps> = ({ projectId, type }) => {
  const dispatch = useAppDispatch();
  const postsState = useAppSelector(state => state.posts);

  useEffect(() => {
    if (type === 'project' && projectId) {
      dispatch(fetchPosts(projectId));
      socket.emit('joinProject', projectId);
    } else if (type === 'global') {
      // Fetch global posts if applicable
    }

    socket.on('newProjectPost', (post: any) => {
      if (type === 'project' && post.project.id === projectId) {
        dispatch(addPost(post));
      }
    });

    socket.on('newGlobalPost', (post: any) => {
      if (type === 'global') {
        dispatch(addGlobalPost(post));
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('newProjectPost');
      socket.off('newGlobalPost');
    };
  }, [dispatch, projectId, type]);

  return (
    <Box>
      {postsState.posts.map(post => (
        <PostItem key={post.id} post={post} type={type} projectId={projectId} />
      ))}
    </Box>
  );
};

export default PostsList;
