import axios from 'axios';

const authService = {
  login: async (email, password) => {
    console.log('authService - Logging in with email:', email);
    const response = await axios.post('http://localhost:3000/api/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return { user };
  },

  logout: () => {
    console.log('authService - Logging out');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  },

  getCurrentUser: async () => {
    console.log('authService - Fetching current user');
    const response = await axios.get('http://localhost:3000/api/auth/me');
    return response.data;
  },

  updateUserProfile: async (updates) => {
    console.log('authService - Updating user profile');
    const response = await axios.put('http://localhost:3000/api/auth/me', updates);
    return response.data;
  },
};

export default authService;