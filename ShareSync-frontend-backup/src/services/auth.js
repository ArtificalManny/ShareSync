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
    console.log('Login refresh token:', response.data.refresh_token);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
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
  console.log('Logging out, clearing tokens');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    console.log('refreshToken - Retrieved refresh token:', refreshToken);
    if (!refreshToken) {
      console.error('refreshToken - No refresh token found in localStorage');
      throw new Error('No refresh token found');
    }
    console.log('refreshToken - Attempting to refresh token with refresh_token:', refreshToken);
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('refreshToken - Refresh response:', response.data);
    if (!response.data.access_token) {
      console.error('refreshToken - No access token received in refresh response');
      throw new Error('No access token received in refresh response');
    }
    console.log('refreshToken - Token refresh successful, new access token:', response.data.access_token);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token || refreshToken);
    console.log('refreshToken - Updated localStorage - Access token:', localStorage.getItem('access_token'));
    console.log('refreshToken - Updated localStorage - Refresh token:', localStorage.getItem('refresh_token'));
    return response.data.access_token;
  } catch (error) {
    console.error('refreshToken - Token refresh failed:', error.response?.data?.message || error.message);
    logout();
    throw new Error('Session expired. Please log in again.');
  }
};

export const getUserData = async () => {
  try {
    let accessToken = localStorage.getItem('access_token');
    console.log('getUserData - Retrieved access token:', accessToken);
    if (!accessToken) {
      console.error('getUserData - No access token found in localStorage');
      throw new Error('No access token found');
    }
    console.log('getUserData - Fetching user data with access token:', accessToken);
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data) {
        console.error('getUserData - No user data received');
        throw new Error('No user data received');
      }
      console.log('getUserData - User data fetched:', response.data);
      return response.data;
    } catch (error) {
      console.log('getUserData - Initial request failed:', error.response?.status, error.response?.data?.message);
      if (error.response?.status === 401) {
        console.log('getUserData - Access token expired, attempting to refresh token');
        accessToken = await refreshToken();
        console.log('getUserData - Retrying with new access token:', accessToken);
        const response = await axios.get(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.data) {
          console.error('getUserData - No user data received after token refresh');
          throw new Error('No user data received after token refresh');
        }
        console.log('getUserData - User data fetched after token refresh:', response.data);
        return response.data;
      }
      console.error('getUserData - Error after retry:', error.response?.data?.message || error.message);
      throw error;
    }
  } catch (error) {
    console.error('getUserData - Final error:', error.message);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    let accessToken = localStorage.getItem('access_token');
    console.log('getProjectById - Retrieved access token:', accessToken);
    if (!accessToken) {
      console.error('getProjectById - No access token found in localStorage');
      throw new Error('No access token found');
    }
    if (!projectId) {
      console.error('getProjectById - Project ID is required');
      throw new Error('Project ID is required');
    }
    console.log('getProjectById - Fetching project with ID:', projectId, 'using access token:', accessToken);
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data) {
        console.error('getProjectById - No project data received');
        throw new Error('No project data received');
      }
      console.log('getProjectById - Project data fetched:', response.data);
      return response.data;
    } catch (error) {
      console.log('getProjectById - Initial request failed:', error.response?.status, error.response?.data?.message);
      if (error.response?.status === 401) {
        console.log('getProjectById - Access token expired, attempting to refresh token');
        accessToken = await refreshToken();
        console.log('getProjectById - Retrying with new access token:', accessToken);
        const response = await axios.get(`${API_URL}/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.data) {
          console.error('getProjectById - No project data received after token refresh');
          throw new Error('No project data received after token refresh');
        }
        console.log('getProjectById - Project data fetched after token refresh:', response.data);
        return response.data;
      }
      console.error('getProjectById - Error after retry:', error.response?.data?.message || error.message);
      throw error;
    }
  } catch (error) {
    console.error(`getProjectById - Final error for ID ${projectId}:`, error.message);
    throw error;
  }
};

export const createProject = async (title, description, category, status) => {
  try {
    const accessToken = localStorage.getItem('access_token');
    console.log('createProject - Retrieved access token:', accessToken);
    if (!accessToken) {
      console.error('createProject - No access token found in localStorage');
      throw new Error('No access token found');
    }
    console.log('createProject - Creating project with access token:', accessToken);
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
    console.log('createProject - Project created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('createProject - Failed to create project:', error.response?.data?.message || error.message);
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