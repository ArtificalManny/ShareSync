import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/auth', // Same-origin path.
});

axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios: Making request to:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Axios: Request error:', error);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios: Response error:', error.message);
    return Promise.reject(error);
  },
);

export default axiosInstance;