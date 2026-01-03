const analyticsService = require('./analyticsService');
const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

class AIRecommendationService {
  
  /**
   * Generate personalized daily plan for user
   */
  async generateDailyPlan(userId) {
    try {
      // Get user patterns
      const patterns = await analyticsService.getUserPatterns(userId);
      
      // Get current context
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay();
      
      // Generate plan components
      const greeting = this.generateGreeting(currentHour);
      const timeOfDay = this.getTimeOfDay(currentHour);
      const focusWindow = this.determineFocusWindow(patterns, currentHour);
      const currentEnergy = this.estimateCurrentEnergy(patterns, currentHour);
      
      // Get recommendations
      const [highEnergyTasks, coworkOpportunities, riskAlerts] = await Promise.all([
        this.getHighEnergyTasks(userId, currentEnergy, patterns),
        this.getCoworkOpportunities(userId),
        this.getRiskAlerts(userId)
      ]);
      
      return {
        greeting,
        timeOfDay,
        focusWindow,
        currentEnergy,
        highEnergyTasks,
        coworkOpportunities,
        riskAlerts,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating daily plan:', error);
      throw error;
    }
  }
  
  /**
   * Generate time-appropriate greeting
   */
  generateGreeting(hour) {
    const user = 'there'; // Will be replaced with actual user name
    
    if (hour < 5) return `Burning the midnight oil, ${user}? 🌙`;
    if (hour < 12) return `Good morning, ${user}! 🌅`;
    if (hour < 17) return `Good afternoon, ${user}! ☀️`;
    if (hour < 21) return `Good evening, ${user}! 🌆`;
    return `Good evening, ${user}! 🌙`;
  }
  
  /**
   * Get time of day category
   */
  getTimeOfDay(hour) {
    if (hour < 5) return 'late-night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }
  
  /**
   * Determine current or next focus window
   */
  determineFocusWindow(patterns, currentHour) {
    if (!patterns.focusWindows || patterns.focusWindows.length === 0) {
      // Default focus window if no data
      return {
        start: '9:00 AM',
        end: '11:00 AM',
        productivity: '2x',
        reason: 'Based on typical productivity patterns',
        isCurrent: false
      };
    }
    
    // Check if currently in a focus window
    const currentWindow = patterns.focusWindows.find(w => {
      return currentHour >= w.start && currentHour < w.end;
    });
    
    if (currentWindow) {
      return {
        start: this.formatHour(currentWindow.start),
        end: this.formatHour(currentWindow.end),
        productivity: `${Math.round(currentWindow.productivity * 10) / 10}x`,
        reason: `You're ${Math.round((currentWindow.productivity - 1) * 100)}% more productive during this time`,
        isCurrent: true
      };
    }
    
    // Find next focus window
    const nextWindow = patterns.focusWindows
      .filter(w => w.start > currentHour)
      .sort((a, b) => a.start - b.start)[0] || patterns.focusWindows[0];
    
    return {
      start: this.formatHour(nextWindow.start),
      end: this.formatHour(nextWindow.end),
      productivity: `${Math.round(nextWindow.productivity * 10) / 10}x`,
      reason: `You ship ${Math.round((nextWindow.productivity - 1) * 100)}% more during this time`,
      isCurrent: false
    };
  }
  
  /**
   * Estimate current energy level based on patterns
   */
  estimateCurrentEnergy(patterns, currentHour) {
    // Check if we have energy data for this hour
    const hourEnergy = patterns.energyByHour?.find(e => e.hour === currentHour);
    
    if (hourEnergy) {
      return {
        level: Math.round(hourEnergy.avgEnergy),
        label: this.getEnergyLabel(hourEnergy.avgEnergy),
        confidence: 'high'
      };
    }
    
    // Check if in peak hours
    if (patterns.peakHours?.includes(currentHour)) {
      return {
        level: 4,
        label: 'high',
        confidence: 'medium'
      };
    }
    
    // Default moderate energy
    return {
      level: 3,
      label: 'moderate',
      confidence: 'low'
    };
  }
  
  /**
   * Get energy label from numeric level
   */
  getEnergyLabel(level) {
    if (level >= 4.5) return 'peak';
    if (level >= 3.5) return 'high';
    if (level >= 2.5) return 'moderate';
    if (level >= 1.5) return 'low';
    return 'very-low';
  }
  
  /**
   * Get high energy task recommendations
   */
  async getHighEnergyTasks(userId, currentEnergy, patterns) {
    try {
      // Get user's active projects
      const projects = await Project.find({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ],
        status: { $ne: 'completed' }
      }).limit(5);
      
      if (!projects.length) return [];
      
      // Get incomplete tasks from these projects
      const projectIds = projects.map(p => p._id);
      const tasks = await Task.find({
        project: { $in: projectIds },
        status: { $ne: 'completed' }
      })
      .populate('project', 'title')
      .sort({ priority: -1, dueDate: 1 })
      .limit(20);
      
      // Filter tasks based on energy level
      const energyLevel = currentEnergy.level;
      const preferredComplexity = patterns.preferredTaskComplexity || 'medium';
      
      let recommendations = tasks.filter(task => {
        // High energy -> suggest complex tasks
        if (energyLevel >= 4) {
          return !task.complexity || task.complexity === 'high' || task.complexity === 'medium';
        }
        // Moderate energy -> suggest medium tasks
        if (energyLevel >= 3) {
          return !task.complexity || task.complexity === 'medium';
        }
        // Low energy -> suggest easy tasks
        return !task.complexity || task.complexity === 'low';
      });
      
      // Take top 3
      recommendations = recommendations.slice(0, 3);
      
      return recommendations.map(task => ({
        taskId: task._id,
        title: task.title,
        project: task.project?.title || 'Unknown Project',
        projectId: task.project?._id,
        estimatedTime: this.estimateTaskTime(task),
        complexity: task.complexity || 'medium',
        priority: task.priority || 'medium',
        reason: this.getTaskRecommendationReason(task, currentEnergy, preferredComplexity),
        dueDate: task.dueDate
      }));
    } catch (error) {
      console.error('Error getting high energy tasks:', error);
      return [];
    }
  }
  
  /**
   * Estimate task completion time
   */
  estimateTaskTime(task) {
    // If task has estimated time, use it
    if (task.estimatedTime) {
      return `${task.estimatedTime}h`;
    }
    
    // Estimate based on complexity
    const complexity = task.complexity || 'medium';
    const estimates = {
      low: '30min',
      medium: '1h',
      high: '2h'
    };
    
    return estimates[complexity];
  }
  
  /**
   * Get reason for recommending this task
   */
  getTaskRecommendationReason(task, currentEnergy, preferredComplexity) {
    const reasons = [];
    
    if (task.complexity === currentEnergy.label) {
      reasons.push('Matches your current energy level');
    }
    
    if (task.complexity === preferredComplexity) {
      reasons.push('Your preferred complexity');
    }
    
    if (task.priority === 'high') {
      reasons.push('High priority');
    }
    
    if (task.dueDate) {
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3) {
        reasons.push(`Due in ${daysUntilDue} days`);
      }
    }
    
    return reasons.length > 0 ? reasons[0] : 'Recommended for you';
  }
  
  /**
   * Get co-work opportunities
   */
  async getCoworkOpportunities(userId) {
    try {
      // Get projects where user is a member
      const projects = await Project.find({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ],
        status: { $ne: 'completed' }
      }).populate('members.user', 'name email');
      
      const opportunities = [];
      
      for (const project of projects) {
        // Find online teammates (this would be enhanced with Socket.IO presence)
        const teammates = project.members
          .filter(m => m.user && m.user._id.toString() !== userId.toString())
          .slice(0, 2); // Limit to 2 per project
        
        for (const teammate of teammates) {
          opportunities.push({
            userId: teammate.user._id,
            userName: teammate.user.name,
            project: project.title,
            projectId: project._id,
            online: false, // Will be updated with Socket.IO
            activity: 'Working on project',
            role: teammate.role || 'member'
          });
        }
      }
      
      return opportunities.slice(0, 3); // Return top 3 opportunities
    } catch (error) {
      console.error('Error getting cowork opportunities:', error);
      return [];
    }
  }
  
  /**
   * Get risk alerts for projects
   */
  async getRiskAlerts(userId) {
    try {
      const projects = await Project.find({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ],
        status: { $ne: 'completed' }
      });
      
      const alerts = [];
      const now = new Date();
      
      for (const project of projects) {
        // Check if project has deadline
        if (!project.deadline) continue;
        
        const daysUntilDeadline = Math.ceil((new Date(project.deadline) - now) / (1000 * 60 * 60 * 24));
        
        // Calculate completion percentage
        const totalTasks = project.tasks?.length || 0;
        const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Risk detection logic
        let severity = null;
        
        // High risk: deadline in 3 days or less, less than 50% complete
        if (daysUntilDeadline <= 3 && progress < 50) {
          severity = 'high';
        }
        // Medium risk: deadline in 7 days or less, less than 70% complete
        else if (daysUntilDeadline <= 7 && progress < 70) {
          severity = 'medium';
        }
        // Low risk: deadline in 14 days or less, less than 80% complete
        else if (daysUntilDeadline <= 14 && progress < 80) {
          severity = 'low';
        }
        
        if (severity) {
          alerts.push({
            projectId: project._id,
            projectName: project.title,
            deadline: daysUntilDeadline === 1 ? '1 day' : `${daysUntilDeadline} days`,
            deadlineDate: project.deadline,
            progress,
            severity,
            message: this.getRiskMessage(daysUntilDeadline, progress)
          });
        }
      }
      
      // Sort by severity (high -> medium -> low)
      const severityOrder = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
      
      return alerts.slice(0, 3); // Return top 3 alerts
    } catch (error) {
      console.error('Error getting risk alerts:', error);
      return [];
    }
  }
  
  /**
   * Get risk message
   */
  getRiskMessage(daysUntilDeadline, progress) {
    if (daysUntilDeadline <= 1) {
      return 'Deadline is tomorrow - prioritize this project';
    }
    if (daysUntilDeadline <= 3) {
      return `Only ${daysUntilDeadline} days left and ${100 - progress}% remaining`;
    }
    if (progress < 30) {
      return 'Project is behind schedule';
    }
    return 'Needs attention to stay on track';
  }
  
  /**
   * Format hour as 12-hour time
   */
  formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:00 ${period}`;
  }
}

module.exports = new AIRecommendationService();
