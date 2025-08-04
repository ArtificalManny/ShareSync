// src/components/social/SocialPanel.jsx

import React from 'react'
import { UsersRound, FolderKanban } from 'lucide-react'

const mockProjects = [
  { id: 1, name: 'Quantum Dashboard', description: 'AI-powered finance tracker' },
  { id: 2, name: 'Atlas Health', description: 'Wellness app with smart routines' },
  { id: 3, name: 'CodeMate', description: 'Live coding collab with AI assists' }
]

const mockUsers = [
  { id: 1, name: 'Sophie Zhang', streak: 7, tier: 'Gold', avatar: '/avatars/sophie.png' },
  { id: 2, name: 'Liam Chen', streak: 3, tier: 'Silver', avatar: '/avatars/liam.png' },
  { id: 3, name: 'Zara Patel', streak: 12, tier: 'Platinum', avatar: '/avatars/zara.png' }
]

export default function SocialPanel() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg px-5 py-4 transition-all duration-300 space-y-6">
      <h3 className="text-md font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
        <UsersRound className="w-4 h-4" />
        People You May Know
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockUsers.map(user => (
          <div
            key={user.id}
            className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl hover:shadow-md transition"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                🔥 {user.streak}-day streak • 🏅 {user.tier} Tier
              </p>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-md font-semibold text-green-600 dark:text-green-400 flex items-center gap-2 mt-6">
        <FolderKanban className="w-4 h-4" />
        Recommended Projects
      </h3>
      <div className="space-y-3">
        {mockProjects.map(project => (
          <div
            key={project.id}
            className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl hover:shadow-md transition"
          >
            <p className="font-medium text-sm">{project.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{project.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
