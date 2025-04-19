import { createSlice } from '@reduxjs/toolkit';

interface PostState {
  posts: any[];
  loading: boolean;
  error: string | null;
}

const initialState: PostState = {
  posts: [],
  loading: false,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    fetchPostsStart() {
      return { ...initialState, loading: true };
    },
    fetchPostsSuccess(state, action) {
      state.posts = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchPostsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchPostsStart, fetchPostsSuccess, fetchPostsFailure } = postsSlice.actions;
export default postsSlice.reducer;