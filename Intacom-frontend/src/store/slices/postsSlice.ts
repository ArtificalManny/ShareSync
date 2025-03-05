// src/store/slices/postsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../index';

interface Media {
  image?: string;
  video?: string;
  audio?: string;
}

interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  createdAt: string;
}

interface Like {
  id: string;
  user: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
}

interface Post {
  id: string;
  project: string;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  mediaImage?: string;
  mediaVideo?: string;
  mediaAudio?: string;
  comments: Comment[];
  likes: Like[];
  createdAt: string;
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

// Async Thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (projectId: string, thunkAPI) => {
    try {
      const response = await axios.get(`/projects/${projectId}/posts`);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data.error);
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ projectId, formData }: { projectId: string; formData: FormData }, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as RootState;
      const response = await axios.post(`/projects/${projectId}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data.error);
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async ({ type, postId, projectId }: { type: string; postId: string; projectId?: string }, thunkAPI) => {
    try {
      let url = '';
      if (type === 'project' && projectId) {
        url = `/projects/${projectId}/posts/${postId}/like`;
      } else if (type === 'global') {
        url = `/posts/global/${postId}/like`;
      }
      const state = thunkAPI.getState() as RootState;
      const response = await axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return { type, postId };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data.error);
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ type, postId, content, projectId }: { type: string; postId: string; content: string; projectId?: string }, thunkAPI) => {
    try {
      let url = '';
      if (type === 'project' && projectId) {
        url = `/projects/${projectId}/posts/${postId}/comment`;
      } else if (type === 'global') {
        url = `/posts/global/${postId}/comment`;
      }
      const state = thunkAPI.getState() as RootState;
      const response = await axios.post(url, { content }, {
        headers: {
          Authorization: `Bearer ${state.auth.token}`,
        },
      });
      return { type, postId, comment: response.data };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response.data.error);
    }
  }
);

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
      state.error = action.payload as string;
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
      state.error = action.payload as string;
    });
    // Like Post
    builder.addCase(likePost.fulfilled, (state, action) => {
      // Optionally update state
    });
    builder.addCase(likePost.rejected, (state, action) => {
      state.error = action.payload as string;
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
      state.error = action.payload as string;
    });
  },
});

export const { addPost, addGlobalPost, addCommentToPost, likePostInState } = postsSlice.actions;
export default postsSlice.reducer;
