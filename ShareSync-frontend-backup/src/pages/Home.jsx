import React from 'react';
import StoryCarousel from '../components/StoryCarousel';
import {
  Folder,
  CheckCircle,
  ThumbsUp,
  MessageCircle,
  Share2,
} from 'lucide-react';

export default function Home() {
  // Dummy data to verify layout; replace with real API data later
  const user = {
    name: 'Manny',
    avatarUrl: '/path/to/avatar.jpg',
  };
  const projects = [
    { id: 1, name: 'Project Alpha', avatarUrl: '/avatars/alpha.png', hasRecentUpdate: true },
    { id: 2, name: 'Project Beta', avatarUrl: '/avatars/beta.png', hasRecentUpdate: false },
  ];
  const feedItems = [
    {
      id: 1,
      user: { name: 'Alice', avatarUrl: '/avatars/alice.png' },
      projectName: 'Project Alpha',
      type: 'update',
      title: 'Updated project plan',
      timestamp: '11:27 AM',
      likes: 0,
      comments: 0,
      shares: 0,
    },
    {
      id: 2,
      user: { name: 'Bob', avatarUrl: '/avatars/bob.png' },
      projectName: 'Project Alpha',
      type: 'announcement',
      title: 'New announcement posted',
      timestamp: '11:29 AM',
      likes: 2,
      comments: 1,
      shares: 1,
    },
  ];

  return (
    <div className="ml-16 md:ml-24 p-6 bg-gray-100 dark:bg-gray-800 min-h-screen space-y-6">
      {/* Welcome Banner */}
      <section
        className="rounded-lg shadow-lg p-6 flex items-center space-x-4"
        style={{ background: 'linear-gradient(135deg, #D8B4FE, #FDE68A)' }}
      >
        <img
          src={user.avatarUrl}
          alt={`${user.name}'s profile`}
          className="w-20 h-20 rounded-full ring-4 ring-indigo-500"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome, {user.name}!
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mt-1 flex space-x-6">
            <span className="inline-flex items-center">
              <Folder className="w-5 h-5 mr-1 text-indigo-500" />
              {projects.length} active
            </span>
            <span className="inline-flex items-center">
              <CheckCircle className="w-5 h-5 mr-1 text-green-500" />
              {feedItems.filter((f) => f.type === 'completed').length} completed
            </span>
          </p>
        </div>
      </section>

      {/* Recent Updates Carousel */}
      <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Recent Updates
        </h2>
        <StoryCarousel projects={projects} />
      </section>

      {/* Activity Feed */}
      <section className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Project Activity Feed
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src={item.user.avatarUrl}
                  alt={item.user.name}
                  className="w-8 h-8 rounded-full ring-2 ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.user.name}{' '}
                    <span className="text-indigo-500">
                      {item.type === 'update'
                        ? `Updated ${item.projectName}`
                        : item.title}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">{item.timestamp}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between text-gray-600 dark:text-gray-400 text-sm">
                <button className="flex items-center space-x-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{item.likes}</span>
                </button>
                <button className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{item.comments}</span>
                </button>
                <button className="flex items-center space-x-1">
                  <Share2 className="w-4 h-4" />
                  <span>{item.shares}</span>
                </button>
              </div>
            </div>
          ))}
          {feedItems.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No recent activity.</p>
          )}
        </div>
      </section>
    </div>
  );
}
