import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../services/api';
const initialState = {
    user: null,
    token: null,
    loading: false,
    error: null,
};
//Async Thunks
export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, thunkAPI) => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    }
    catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.error || 'Login failed');
    }
});
export const registerUser = createAsyncThunk('auth/registerUser', async (userData, thunkAPI) => {
    try {
        const response = await axios.post('/users/register', userData);
        return response.data;
    }
    catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.error || 'Registration Failed');
    }
});
//Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.error = null;
        },
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.access_token;
        },
    },
    extraReducers: (builder) => {
        //Handle async thunks
        builder
            .addCase(loginUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.access_token;
        })
            .addCase(loginUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? 'Login request was rejected';
        })
            .addCase(registerUser.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(registerUser.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
            .addCase(registerUser.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? 'Registration request was rejected';
        });
    },
});
export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
