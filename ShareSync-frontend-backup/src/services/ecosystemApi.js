import client from '../api/client';

/**
 * Ecosystem API Service
 * Handles all ecosystem-related API calls
 */

export const ecosystemApi = {
  /**
   * Get ecosystem status (for status bar)
   */
  async getStatus() {
    try {
      const response = await client.get('/api/ecosystem/status');
      return response.data.status;
    } catch (error) {
      console.error('Error fetching ecosystem status:', error);
      return null;
    }
  },
  
  /**
   * Get AI daily plan
   */
  async getDailyPlan() {
    try {
      const response = await client.get('/api/ai/daily-plan');
      return response.data.plan;
    } catch (error) {
      console.error('Error fetching daily plan:', error);
      return null;
    }
  },
  
  /**
   * Get burnout status
   */
  async getBurnoutStatus() {
    try {
      const response = await client.get('/api/ecosystem/burnout-status');
      return response.data.burnout;
    } catch (error) {
      console.error('Error fetching burnout status:', error);
      return null;
    }
  },
  
  /**
   * Track activity
   */
  async trackActivity(action, projectId = null, metadata = {}) {
    try {
      const response = await client.post('/api/analytics/track-activity', {
        action,
        projectId,
        metadata
      });
      return response.data.activity;
    } catch (error) {
      console.error('Error tracking activity:', error);
      return null;
    }
  }
};

export default ecosystemApi;
