import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { registerUser } from '../store/slices/authSlice';
import { TextField, Button, Typography, Container, Box } from '@mui/material';

const Register: React.FC = () => {
    const dispatch = useAppDispatch();
    const authState = useAppSelector(state => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = () => {
        dispatch(registerUser({ email, password, name }));
    };

    return (
        <Container maxWidth="sm">
            <Box mt={5}>
                <Typography variant="h4" gutterBottom>Register</Typography>
                {authState.error && <Typography color="error">{authState.error}</Typography>}
                <TextField
                    label="Name"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    />
                <TextField
                    label="Email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                <TextField
                    label="Password"
                    variant="outlined"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={authState.loading}
                >
                    {authState.loading ? 'Registering...' : 'Register'}
                </Button>
            </Box>
        </Container>
    );
};

export default Register;