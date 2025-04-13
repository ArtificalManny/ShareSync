// src/store/slices/postsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const initialState = {
    posts: [],
    loading: false,
    error: null,
};
// Async Thunks
export const fetchPosts = createAsyncThunk('posts/fetchPosts', async (projectId, thunkAPI) => {
    try {
        const response = await axios.get(`/projects/${projectId}/posts`);
        return response.data;
    }
    catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.error);
    }
});
export const createPost = createAsyncThunk('posts/createPost', async ({ projectId, formData }, thunkAPI) => {
    try {
        const state = thunkAPI.getState();
        const response = await axios.post(`/projects/${projectId}/posts`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${state.auth.token}`,
            },
        });
        return response.data;
    }
    catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.error);
    }
});
export const likePost = createAsyncThunk('posts/likePost', async ({ type, postId, projectId }, thunkAPI) => {
    try {
        let url = '';
        if (type === 'project' && projectId) {
            url = `/projects/${projectId}/posts/${postId}/like`;
        }
        else if (type === 'global') {
            url = `/posts/global/${postId}/like`;
        }
        const state = thunkAPI.getState();
        const response = await axios.post(url, {}, {
            headers: {
                Authorization: `Bearer ${state.auth.token}`,
            },
        });
        return { type, postId };
    }
    catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.error);
    }
});
export const addComment = createAsyncThunk('posts/addComment', async ({ type, postId, content, projectId }, thunkAPI) => {
    try {
        let url = '';
        if (type === 'project' && projectId) {
            url = `/projects/${projectId}/posts/${postId}/comment`;
        }
        else if (type === 'global') {
            url = `/posts/global/${postId}/comment`;
        }
        const state = thunkAPI.getState();
        const response = await axios.post(url, { content }, {
            headers: {
                Authorization: `Bearer ${state.auth.token}`,
            },
        });
        return { type, postId, comment: response.data };
    }
    catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.error);
    }
});
// Slice
const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        addPost(state, action) {
            state.posts.unshift(action.payload);
        },
        addGlobalPost(state, action) {
            state.posts.unshift(action.payload);
        },
        addCommentToPost(state, action) {
            const { postId, comment } = action.payload;
            const post = state.posts.find(p => p.id === postId);
            if (post) {
                post.comments.push(comment);
            }
        },
        likePostInState(state, action) {
            const { postId } = action.payload;
            const post = state.posts.find(p => p.id === postId);
            if (post) {
                post.likes.push({
                    id: 'new_like_id', // Replace with actual ID
                    user: {
                        id: 'current_user_id', // Replace with actual user ID
                        name: 'Current User',
                        profilePicture: 'path_to_profile_pic',
                    },
                    createdAt: new Date().toISOString(),
                });
            }
        },
    },
    extraReducers: (builder) => {
        // Fetch Posts
        builder.addCase(fetchPosts.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPosts.fulfilled, (state, action) => {
            state.loading = false;
            state.posts = action.payload;
        });
        builder.addCase(fetchPosts.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        // Create Post
        builder.addCase(createPost.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createPost.fulfilled, (state, action) => {
            state.loading = false;
            state.posts.unshift(action.payload);
        });
        builder.addCase(createPost.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
        // Like Post
        builder.addCase(likePost.fulfilled, (state, action) => {
            // Optionally update state
        });
        builder.addCase(likePost.rejected, (state, action) => {
            state.error = action.payload;
        });
        // Add Comment
        builder.addCase(addComment.fulfilled, (state, action) => {
            const { postId, comment } = action.payload;
            const post = state.posts.find(p => p.id === postId);
            if (post) {
                post.comments.push(comment);
            }
        });
        builder.addCase(addComment.rejected, (state, action) => {
            state.error = action.payload;
        });
    },
});
export const { addPost, addGlobalPost, addCommentToPost, likePostInState } = postsSlice.actions;
export default postsSlice.reducer;
