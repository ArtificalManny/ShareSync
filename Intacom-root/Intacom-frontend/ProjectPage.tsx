// src/components/ProjectPage.tsx
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import { Container, Typography, Box } from '@mui/material';
import CreatePost from './CreatePost';
import PostsList from './PostsList';

const ProjectPage: React.FC = () => {
  const { id } = useParams();
  const auth = useAppSelector(state => state.auth);

  if (!auth.token) {
    return <Navigate to="/login" />;
  }

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Typography variant="h4" gutterBottom>Project {id}</Typography>
        <CreatePost projectId={id || ''} />
        <PostsList type="project" projectId={id || ''} />
      </Box>
    </Container>
  );
};

export default ProjectPage;
