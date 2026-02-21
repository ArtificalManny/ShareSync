cat > docs/NOTIFICATIONS_API.md << 'EOF'
# Notifications API Documentation

## Overview

ShareSync notifications system provides in-app and real-time notifications for user events.

---

## Notification Types

- `task_assigned` - User assigned to a task
- `task_completed` - Task marked as complete
- `task_comment` - New comment on task
- `task_due_soon` - Task due date approaching
- `project_invite` - Invited to join project
- `member_joined` - New member joined project
- `member_left` - Member left project
- `ship_created` - New ship posted
- `mention` - User mentioned in content
- `badge_earned` - New badge awarded
- `level_up` - User leveled up
- `streak_milestone` - Streak milestone reached
- `achievement_complete` - Achievement completed
- `system_update` - System announcement
- `welcome` - Welcome message

---

## API Endpoints

### Get Notifications

**GET** `/api/notifications`

Get user's notifications with pagination.

**Query Parameters:**
- `limit` (optional) - Number of notifications (default: 50, max: 100)
- `skip` (optional) - Number to skip for pagination (default: 0)
- `unreadOnly` (optional) - Only unread notifications (default: false)

**Response:**
```json
{
  "notifications": [
    {
      "_id": "...",
      "message": "John assigned you a task: \"Fix bug\"",
      "type": "task_assigned",
      "data": {
        "taskId": "...",
        "taskTitle": "Fix bug",
        "assignedBy": "John"
      },
      "metadata": {},
      "timestamp": "2025-12-20T...",
      "read": false
    }
  ],
  "total": 25,
  "unread": 5
}
```

---

### Get Unread Count

**GET** `/api/notifications/unread`

Get count of unread notifications.

**Response:**
```json
{
  "unread": 5
}
```

---

### Mark as Read

**PUT** `/api/notifications/:notificationId/read`

Mark a single notification as read.

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": { ... }
}
```

---

### Mark All as Read

**PUT** `/api/notifications/read-all`

Mark all notifications as read.

**Response:**
```json
{
  "message": "All notifications marked as read",
  "total": 25
}
```

---

### Delete Notification

**DELETE** `/api/notifications/:notificationId`

Delete a single notification.

**Response:**
```json
{
  "message": "Notification deleted"
}
```

---

### Clear All Notifications

**DELETE** `/api/notifications/clear`

Clear all notifications for user.

**Response:**
```json
{
  "message": "All notifications cleared",
  "deleted": 25
}
```

---

### Create Notification (System/Admin)

**POST** `/api/notifications`

Create a notification (for system use).

**Body:**
```json
{
  "userId": "user123",
  "type": "system_update",
  "data": {
    "message": "System maintenance scheduled"
  },
  "metadata": {
    "link": "/announcements"
  }
}
```

**Response:**
```json
{
  "message": "Notification created",
  "notification": { ... }
}
```

---

## WebSocket Events

### Connect to Notifications
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join user's notification room
socket.emit('join', userId);

// Listen for new notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Update UI, show toast, etc.
});

// Mark as read (broadcast to other devices)
socket.emit('notification:read', {
  userId,
  notificationId
});

socket.on('notification:marked-read', ({ notificationId }) => {
  // Update UI on other devices
});
```

---

## Notification Preferences

### Get Preferences

**GET** `/api/notifications/preferences/settings`

Get notification preferences.

**Response:**
```json
{
  "preferences": {
    "notifyOnLevelUp": true,
    "notifyOnBadge": true,
    "notifyOnTaskAssigned": true,
    "notifyOnMention": true,
    "emailNotifications": false
  }
}
```

---

### Update Preferences

**PUT** `/api/notifications/preferences/settings`

Update notification preferences.

**Body:**
```json
{
  "notifyOnLevelUp": true,
  "notifyOnBadge": true,
  "notifyOnTaskAssigned": false,
  "emailNotifications": true
}
```

**Response:**
```json
{
  "message": "Preferences updated",
  "preferences": { ... }
}
```

---

## Integration Examples

### Task Assignment
```javascript
const { onTaskAssigned } = require('../utils/notificationTriggers');

// When assigning a task
await onTaskAssigned(io, {
  taskId: task._id,
  assigneeId: assignee._id,
  assignedBy: currentUser.username,
  taskTitle: task.title,
  projectTitle: project.title
});
```

### Badge Earned
```javascript
const { onBadgeEarned } = require('../utils/notificationTriggers');

// When user earns a badge
await onBadgeEarned(io, {
  userId: user._id,
  badgeName: 'Week Warrior',
  badgeIcon: '🔥'
});
```

### Level Up
```javascript
const { onLevelUp } = require('../utils/notificationTriggers');

// When user levels up
await onLevelUp(io, {
  userId: user._id,
  level: 5
});
```

---

## Email Notifications (Optional)

To enable email notifications:

1. Install nodemailer:
```bash
npm install nodemailer
```

2. Add to `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

3. Uncomment code in `utils/emailNotifications.js`

4. Gmail App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Create password for "Mail"
   - Use that password in EMAIL_PASS

---

## Best Practices

1. **Rate Limiting**: Don't spam users with notifications
2. **Batching**: Group similar notifications
3. **Preferences**: Respect user notification settings
4. **Real-time**: Use WebSocket for instant updates
5. **Cleanup**: Auto-delete old notifications (keep last 100)

---

## Frontend Implementation
```jsx
// Example React component
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Fetch initial count
    fetch('/api/notifications/unread')
      .then(res => res.json())
      .then(data => setUnread(data.unread));
    
    // Connect to WebSocket
    const socket = io();
    socket.emit('join', userId);
    
    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnread(prev => prev + 1);
      // Show toast notification
    });
    
    return () => socket.disconnect();
  }, []);
  
  return (
    <button>
      🔔 {unread > 0 && <span>{unread}</span>}
    </button>
  );
}
```

EOF

echo "✅ Notification API documentation created!"