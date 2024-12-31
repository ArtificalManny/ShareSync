// src/components/PostItem.tsx
import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Button, TextField } from '@mui/material';
import { ThumbUp, Comment, Share } from '@mui/icons-material';
import { useAppDispatch } from '../hooks';
import { likePost, addComment } from '../store/slices/postsSlice';

interface PostItemProps {
  post: any;
  type: 'project' | 'global';
  projectId?: string;
}

const PostItem: React.FC<PostItemProps> = ({ post, type, projectId }) => {
  const dispatch = useAppDispatch();
  
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  const handleLike = () => {
    if (type === 'project' && projectId) {
      dispatch(likePost({ type, postId: post.id, projectId }));
    } else {
      dispatch(likePost({ type, postId: post.id }));
    }
  };

  const handleComment = () => {
    if (commentContent.trim()) {
      if (type === 'project' && projectId) {
        dispatch(addComment({ type, postId: post.id, content: commentContent, projectId }));
      } else {
        dispatch(addComment({ type, postId: post.id, content: commentContent }));
      }
      setCommentContent('');
    }
  };

  return (
    <Box mb={2} p={2} bgcolor="#f5f5f5" borderRadius={2}>
      <Box display="flex" alignItems="center" mb={1}>
        <Avatar src={post.user.profilePicture} alt={post.user.name} />
        <Typography variant="h6" ml={2}>{post.user.name}</Typography>
      </Box>
      <Typography variant="body1">{post.content}</Typography>
      {post.mediaImage && <img src={post.mediaImage} alt="Post Media" style={{ width: '100%', marginTop: '10px' }} />}
      {post.mediaVideo && <video controls src={post.mediaVideo} style={{ width: '100%', marginTop: '10px' }} />}
      {post.mediaAudio && <audio controls src={post.mediaAudio} style={{ width: '100%', marginTop: '10px' }} />}
      <Box display="flex" alignItems="center" mt={1}>
        <IconButton onClick={handleLike}>
          <ThumbUp />
        </IconButton>
        <Typography variant="body2">{post.likes.length}</Typography>
        <IconButton onClick={() => setShowComments(!showComments)}>
          <Comment />
        </IconButton>
        <Typography variant="body2">{post.comments.length}</Typography>
        <IconButton>
          <Share />
        </IconButton>
      </Box>
      {showComments && (
        <Box mt={2}>
          {post.comments.map((comment: any) => (
            <Box key={comment.id} display="flex" alignItems="center" mb={1}>
              <Avatar src={comment.user.profilePicture} alt={comment.user.name} />
              <Box ml={2}>
                <Typography variant="subtitle2">{comment.user.name}</Typography>
                <Typography variant="body2">{comment.content}</Typography>
              </Box>
            </Box>
          ))}
          <Box display="flex" alignItems="center" mt={1}>
            <TextField
              label="Add a comment"
              variant="outlined"
              size="small"
              fullWidth
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <Button variant="contained" color="primary" onClick={handleComment} style={{ marginLeft: '10px' }}>
              Post
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PostItem;
