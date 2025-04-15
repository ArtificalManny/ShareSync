import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlices';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000', //Update based on backend URL
});

//Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const state = store.getState();
        if (state.auth.token) {
            config.headers.Authorization = `Bearer ${state.auth.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

//Response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response.status === 401) {
            store.dispatch(logout());
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;