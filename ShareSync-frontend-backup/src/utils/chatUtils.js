// src/utils/chatUtils.js - Chat utility functions

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} Formatted time string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Just now (< 1 min)
  if (diffMins < 1) return 'Just now';
  
  // Minutes ago (< 1 hour)
  if (diffMins < 60) return `${diffMins}m ago`;
  
  // Hours ago (< 24 hours)
  if (diffHours < 24) return `${diffHours}h ago`;
  
  // Yesterday
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  // Older dates
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Group messages by date
 * @param {Array} messages - Array of message objects
 * @returns {Object} Messages grouped by date labels
 */
export function groupMessagesByDate(messages) {
  const groups = {};
  const now = new Date();
  
  messages.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const diffDays = Math.floor((now - messageDate) / 86400000);
    
    let label;
    if (diffDays === 0) {
      label = 'Today';
    } else if (diffDays === 1) {
      label = 'Yesterday';
    } else if (diffDays < 7) {
      label = messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      label = messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(message);
  });
  
  return groups;
}

/**
 * Get badge configuration for message type
 * @param {string} type - Message type (update, question, decision, idea, kudos)
 * @returns {Object} Badge config with icon, label, colors
 */
export function getTypeBadgeConfig(type) {
  const configs = {
    update: {
      icon: '📢',
      label: 'Update',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    question: {
      icon: '❓',
      label: 'Question',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    decision: {
      icon: '✅',
      label: 'Decision',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    idea: {
      icon: '💡',
      label: 'Idea',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    kudos: {
      icon: '🎉',
      label: 'Kudos',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/30'
    }
  };
  
  return configs[type] || configs.update;
}

/**
 * Get placeholder text for composer based on message type
 * @param {string} type - Message type
 * @returns {string} Placeholder text
 */
export function getComposerPlaceholder(type) {
  const placeholders = {
    update: 'Share an update or progress...',
    question: 'Ask a question...',
    decision: 'Document a decision made...',
    idea: 'Share an idea...',
    kudos: 'Give kudos to a teammate...'
  };
  
  return placeholders[type] || placeholders.update;
}
