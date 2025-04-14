import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface Post {
  _id: string;
  content: string;
  likes: number;
  projectId: string;
  userId: string;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
};

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/project/${projectId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ content, projectId, userId }: { content: string; projectId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, { content, projectId, userId });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error creating post');
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async ({ postId, userId }: { postId: string; userId: string }, { rejectWithValue }) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/posts/like/${postId}`, { userId });
      return { postId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error liking post');
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<Post[]>) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<Post>) => {
        state.loading = false;
        state.posts = [action.payload, ...state.posts];
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(likePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(likePost.fulfilled, (state, action: PayloadAction<{ postId: string }>) => {
        state.loading = false;
        state.posts = state.posts.map((post) =>
          post._id === action.payload.postId ? { ...post, likes: post.likes + 1 } : post
        );
      })
      .addCase(likePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default postsSlice.reducer;