// src/api/activity.js
import client from './client';

export const fetchActivities = async (type, userId, projectId, page = 1, limit = 10) => {
  let url = '/activities'; // Note: NOT prefixed with /api because client.js already includes it

  if (type === 'user') url += `/user/${userId}`;
  else if (type === 'project') url += `/project/${projectId}`;

  try {
    const response = await client.get(`${url}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

export const logActivity = (activityData) => {
  return client.post('/activities', activityData);
};
