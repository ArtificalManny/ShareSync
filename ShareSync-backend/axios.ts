import axios from 'axios';

console.log('axios.ts: Initializing axios instance with baseURL: http://localhost:3001');

const instance = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('axios.ts: Request failed:', error.message);
    if (error.code === 'ECONNABORTED' && error.config) {
      console.log('axios.ts: Retrying request due to timeout...');
      return new Promise((resolve) => {
        setTimeout(() => resolve(instance(error.config)), 2000);
      });
    }
    return Promise.reject(error);
  },
);

export default instance;