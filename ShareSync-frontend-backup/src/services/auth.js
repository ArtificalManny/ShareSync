import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.data.access_token) {
      throw new Error('No access token received in response');
    }
    console.log('Login successful, access token:', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token || '');
    localStorage.setItem('user', JSON.stringify(response.data.user || {}));
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
};

export const register = async (firstName, lastName, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      firstName,
      lastName,
      email,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.data.access_token) {
      throw new Error('No access token received in response');
    }
    console.log('Register successful, access token:', response.data.access_token);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token || '');
    localStorage.setItem('user', JSON.stringify(response.data.user || {}));
    return response.data;
  } catch (error) {
    console.error('Register failed:', error.message);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    console.log('Attempting to refresh token with refresh_token:', refreshToken);
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.data.access_token) {
      throw new Error('No access token received in refresh response');
    }
    console.log('Token refresh successful, new access token:', response.data.access_token);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token || refreshToken);
    return response.data.access_token;
  } catch (error) {
    console.error('Token refresh failed:', error.message);
    logout();
    throw new Error('Session expired. Please log in again.');
  }
};

export const getUserData = async () => {
  try {
    let accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found');
    }
    console.log('Fetching user data with access token:', accessToken);
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data) {
        throw new Error('No user data received');
      }
      console.log('User data fetched:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        accessToken = await refreshToken();
        const response = await axios.get(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.data) {
          throw new Error('No user data received after token refresh');
        }
        console.log('User data fetched after token refresh:', response.data);
        return response.data;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in getUserData:', error.message);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    let accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found');
    }
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    console.log('Fetching project with ID:', projectId, 'using access token:', accessToken);
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data) {
        throw new Error('No project data received');
      }
      console.log('Project data fetched:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        accessToken = await refreshToken();
        const response = await axios.get(`${API_URL}/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.data) {
          throw new Error('No project data received after token refresh');
        }
        console.log('Project data fetched after token refresh:', response.data);
        return response.data;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error in getProjectById for ID ${projectId}:`, error.message);
    throw error;
  }
};

export const createProject = async (title, description, category, status) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found');
    }
    console.log('Creating project with access token:', accessToken);
    const response = await axios.post(`${API_URL}/projects`, {
      title,
      description,
      category,
      status,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Project created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create project:', error.message);
    throw new Error('Failed to create project: ' + (error.response?.data?.message || error.message));
  }
};

export const updateProjectStatus = async (projectId, status) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token found');
    }
    const response = await axios.put(`${API_URL}/projects/${projectId}/status`, { status }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};