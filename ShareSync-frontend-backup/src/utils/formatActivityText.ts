import { timeAgo } from './timeAgo';

export const formatActivityItems = (activities = []) => {
  return activities.map((item: any) => {
    // 1. Let variable reward slots / interstitials pass through untouched
    if (item.type === 'interstitial') {
      return item;
    }

    // 2. Extract populated User details
    const user = item.userId?.displayName || item.actorId?.displayName || 'A team member';
    
    // 3. Extract Metadata
    const taskTitle = item.metadata?.taskTitle || item.details?.taskTitle || 'a task';
    const projectName = item.metadata?.projectName || 'a project';
    const timestamp = item.createdAt ? timeAgo(item.createdAt) : 'just now';

    // 4. Defaults
    let icon = 'Sparkles';
    let color = 'purple';
    let action = 'interacted with';
    let content = taskTitle;
    let project = projectName;

    // 5. Map internal events to UI strings (Supporting both canonical and legacy types)
    const eventType = item.type || item.action;

    switch (eventType) {
      case 'task_completed':
      case 'TASK_COMPLETED':
        icon = 'CheckCircle';
        color = 'emerald';
        action = 'shipped';
        break;
      case 'task_created':
      case 'TASK_CREATED':
        icon = 'Rocket';
        color = 'blue';
        action = 'created';
        break;
      case 'comment_added':
      case 'COMMENT_ADDED':
        icon = 'MessageCircle';
        color = 'fuchsia';
        action = 'commented on';
        break;
      case 'project_shipped':
        icon = 'TrendingUp';
        color = 'orange';
        action = 'launched';
        content = projectName;
        project = null; // Hide the pill if the project IS the content
        break;
      case 'task_moved':
      case 'TASK_MOVED':
      case 'task_updated':
      case 'TASK_UPDATED':
        icon = 'FileText';
        color = 'purple';
        action = 'updated';
        break;
      default:
        icon = 'Sparkles';
        color = 'purple';
        action = 'updated';
        break;
    }

    return {
      id: item._id || item.id || Math.random().toString(),
      type: 'activity',
      icon,
      color,
      user,
      action,
      content,
      project,
      timestamp,
      rawItem: item // Keep reference just in case
    };
  });
};
