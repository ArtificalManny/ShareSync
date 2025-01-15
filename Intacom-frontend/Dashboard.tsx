import React, { useEffect } from 'react';
import { useAppSelector } from '../hooks';
import { Navigate } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import CreatePost from './CreatePost';
import PostsList from './PostsList';

const Dashboard: React.FC = () => {
    const auth = useAppSelector(state => state.auth);

    if (!auth.token) {
        return <Navigate to="/login" />;
    }

    return (
        <Container maxWidth="md">
            <Box mt={4}>
                <Typography variant="h4" gutterBottom>Welcome, {auth.user?.name}!</Typography>
                <CreatePost projectId="global" /> {/* Assuming 'global' project ID */}
                <PostsList type="global" />
            </Box>
        </Container>
    );
};

export default Dashboard;