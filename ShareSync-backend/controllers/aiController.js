const aiRecommendationService = require('../services/aiRecommendationService');

/**
 * Get personalized daily plan
 * GET /api/ai/daily-plan
 */
exports.getDailyPlan = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const plan = await aiRecommendationService.generateDailyPlan(userId);
    
    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error getting daily plan:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate daily plan' 
    });
  }
};

module.exports = exports;
