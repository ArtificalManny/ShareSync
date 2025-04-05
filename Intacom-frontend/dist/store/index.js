import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import '@fortawesome/fontawesome-free/css/all.min.css';
export const store = configureStore({
    reducer: {
        auth: authReducer,
        posts: postsReducer,
    },
});
