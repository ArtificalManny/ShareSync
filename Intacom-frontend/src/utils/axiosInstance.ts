import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/auth', // Use the proxy path.
});

axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios request URL:', config.url);
    console.log('Axios full URL:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error),
);

export default axiosInstance;