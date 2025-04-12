import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/auth', // Use the proxy path.
});

export default axiosInstance;