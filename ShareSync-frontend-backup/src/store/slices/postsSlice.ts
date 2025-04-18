import { createSlice } from '@reduxjs/toolkit';

const postsSlice = createSlice({
  name: 'posts',
  initialState: { posts: [] },
  reducers: {
    likePost(state, action) {
      // Placeholder
    },
    addComment(state, action) {
      // Placeholder
    },
  },
});

export const { likePost, addComment } = postsSlice.actions;
export default postsSlice.reducer;