import React from 'react'
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react'
import { formatRelativeTime } from '../utils/formatters'

export default function LiveActivityFeed({ feedItems = [] }) {
  if (!feedItems.length) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No activity yet. Start by creating a project or posting an update!
      </div>
    )
  }

  const tagColors = {
    task: 'bg-yellow-400 text-yellow-900',
    comment: 'bg-blue-500 text-white',
    completed: 'bg-green-500 text-white',
    overdue: 'bg-red-500 text-white',
    update: 'bg-indigo-500 text-white'
  }

  return (
    <section className="w-full">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
        🔴 Live Activity Feed
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedItems.map(item => (
          <div
            key={item.id}
            className="flex flex-col p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow hover:shadow-md transition-all"
          >
            {/* Header: Avatar + User Info */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={item.user.avatarUrl}
                alt={item.user.name}
                className="w-10 h-10 rounded-full ring-2 ring-indigo-500 object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.user.name}{' '}
                  <span className="text-indigo-500 font-normal">
                    {item.type === 'update'
                      ? `updated ${item.projectName}`
                      : item.title}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(item.timestamp)}
                </p>
              </div>
            </div>

            {/* Activity Type Tag */}
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  tagColors[item.type] || 'bg-gray-200 text-gray-700'
                }`}
              >
                {item.type}
              </span>
            </div>

            {/* Footer: Interactions */}
            <div className="mt-auto flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <button className="flex items-center gap-1 hover:text-indigo-500">
                <ThumbsUp className="w-4 h-4" />
                <span>{item.likes}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-indigo-500">
                <MessageCircle className="w-4 h-4" />
                <span>{item.comments}</span>
              </button>
              <button className="flex items-center gap-1 hover:text-indigo-500">
                <Share2 className="w-4 h-4" />
                <span>{item.shares}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
