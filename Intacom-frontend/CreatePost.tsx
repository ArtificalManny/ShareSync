// src/components/CreatePost.tsx
import React, { useState } from 'react';
import { useAppDispatch } from '../hooks';
import { createPost } from '../store/slices/postsSlice';
import { TextField, Button, Box } from '@mui/material';

interface CreatePostProps {
  projectId: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('content', content);
    if (files) {
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
    }
    dispatch(createPost({ projectId, formData }));
    setContent('');
    setFiles(null);
  };

  return (
    <Box mb={2}>
      <TextField
        label="What's on your mind?"
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Box mt={1} display="flex" alignItems="center" gap={2}>
        <Button variant="contained" component="label">
          Upload Files
          <input type="file" hidden multiple onChange={(e) => setFiles(e.target.files)} />
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Post
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePost;
