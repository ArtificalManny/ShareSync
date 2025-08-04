import React from 'react'
import { Briefcase } from 'lucide-react'

// Utility to convert to "3d ago", "2h ago"
const getRelativeTime = (dateStr) => {
  const now = new Date()
  const then = new Date(dateStr)
  const diff = Math.floor((now - then) / 1000)

  const units = [
    { label: 'd', secs: 86400 },
    { label: 'h', secs: 3600 },
    { label: 'm', secs: 60 },
  ]

  for (const unit of units) {
    const value = Math.floor(diff / unit.secs)
    if (value >= 1) return `${value}${unit.label} ago`
  }

  return 'Just now'
}

export default function YourProjectsPanel({ projects = [] }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">📁 Your Projects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 col-span-full">You haven’t joined any projects yet.</div>
        ) : (
          projects.map(project => (
            <div
              key={project._id}
              onClick={() => window.location.href = `/projects/${project._id}`}
              className="relative border-l-4 border-purple-500 bg-white/95 dark:bg-gray-800/95 hover:scale-[1.03] hover:-translate-y-1 transform transition-all duration-200 rounded-xl p-4 shadow-sm hover:shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{project.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {project.description || 'No description provided'}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                Last updated: {getRelativeTime(project.updatedAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
