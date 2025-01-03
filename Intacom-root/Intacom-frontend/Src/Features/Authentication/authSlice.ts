import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setCredentials } from '../../store/slices/authSlice';
import api from '../../api/api'; 

interface User {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null,
};

//Async Thunks
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials: { email: string; password: string }, thunkAPI) => {
        try {
            const response = await api.post('/auth/login', credentials);
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data.error);
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData: { email: string; password: string; name: string }, thunkAPI) => {
        try {
            const response = await axios.post('/users/register', userData);
            return response.data;
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data.error);
        }
    }
);

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
        setCredentials(state, action) {
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
                state.token = action.payload_token;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
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
                state.error = action.payload as string;
            });
    },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;