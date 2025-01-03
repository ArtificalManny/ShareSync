import axios from 'axios';
import { store } from '../store';
import { logout,setCredentials } from '../Features/Authentication/authSlice';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    , //Update with your backend URL
});

//Request interceptor to add auth token
api.interceptor.request.use(
    (config) => {
        const state = store.getState();
        if (state.auth.token) {
            config.headers.Authorization = `Bearer ${state.auth.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

//Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response.status === 401) {
            store.dispatch(logout());
        }
        return Promise.reject(error);
    }
);

export default api;