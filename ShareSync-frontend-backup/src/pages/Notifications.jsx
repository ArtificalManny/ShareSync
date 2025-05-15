import React from 'react';

const Notifications = ({ user }) => {
  const notifications = [
    {
      id: 1,
      type: 'mention',
      message: 'Alice mentioned you in a post: "Great work on the project, @' + (user?.username || 'You') + '!"',
      timestamp: '2025-05-14T07:15:00Z',
      unread: true,
    },
    {
      id: 2,
      type: 'task',
      message: 'Your task "Design Homepage" is due tomorrow.',
      timestamp: '2025-05-14T07:00:00Z',
      unread: true,
    },
    {
      id: 3,
      type: 'share',
      message: 'Bob shared the project "Website Redesign" with you.',
      timestamp: '2025-05-14T06:45:00Z',
      unread: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-display text-vibrant-pink mb-6 animate-fade-in">Notifications</h2>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-white text-center">No notifications yet.</p>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`card glassmorphic transform hover:scale-105 transition-transform ${
                notification.unread ? 'border-2 border-vibrant-pink animate-pulse-glow' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-dark-navy flex items-center justify-center">
                  {notification.type === 'mention' && <span className="text-vibrant-pink">@</span>}
                  {notification.type === 'task' && <span className="text-vibrant-pink">📋</span>}
                  {notification.type === 'share' && <span className="text-vibrant-pink">📤</span>}
                </div>
                <div>
                  <p className="text-white">{notification.message}</p>
                  <p className="text-sm text-gray-300">{new Date(notification.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;