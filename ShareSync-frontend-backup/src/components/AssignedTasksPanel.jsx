// src/components/AssignedTasksPanel.jsx
import React from 'react'
import { CalendarDays, Clock } from 'lucide-react'

export default function AssignedTasksPanel({ tasks = [] }) {
  if (!tasks.length) return null

  return (
    <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6 transition">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        📋 Assigned Tasks
      </h2>

      <ul className="space-y-4">
        {tasks.slice(0, 5).map(task => (
          <li
            key={task.id}
            className="border-l-4 border-indigo-500 pl-4 py-3 px-3 bg-gray-50 dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Task Details */}
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {task.title}
              </p>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                <span className="flex items-center">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Due: {task.dueDateFormatted}
                </span>
                {task.priority && (
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Priority: {task.priority}
                  </span>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div className="flex -space-x-2 mt-3 sm:mt-0">
              {task.assignees.map(user => (
                <img
                  key={user.id}
                  src={user.avatarUrl}
                  alt={user.name}
                  title={user.name}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 object-cover transition-transform hover:scale-105"
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
