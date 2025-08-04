import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import { io } from 'socket.io-client'

export default function ProjectUnifiedFeed() {
  const [activity, setActivity] = useState([])

  useEffect(() => {
    // Initial fetch
    client.get('/projects/activity-summary')
      .then(res => setActivity(res.data))
      .catch(err => console.error('[UnifiedFeed] Error loading activity:', err))

    // Live updates via Socket.io
    const socket = io()
    socket.on('project:update', (newItem) => {
      setActivity(prev => [newItem, ...prev.slice(0, 9)])
    })

    return () => socket.disconnect()
  }, [])

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">🧩 Project Activity</h2>
      <ul className="space-y-2">
        {activity.length === 0 && <li className="text-gray-500 dark:text-gray-400">No recent activity.</li>}
        {activity.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
            {item.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
