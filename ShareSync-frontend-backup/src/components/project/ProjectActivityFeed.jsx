import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import { io } from 'socket.io-client'

export default function ProjectActivityFeed({ projectId }) {
  const [activityFeed, setActivityFeed] = useState([])

  useEffect(() => {
    if (!projectId) return

    // Initial fetch
    client.get(`/projects/${projectId}/activity-feed`)
      .then(res => setActivityFeed(res.data))
      .catch(err => console.error('[ActivityFeed] Error fetching:', err))

    // Live updates via Socket.io
    const socket = io()

    socket.emit('joinProjectRoom', projectId)

    socket.on('projectActivity', newActivity => {
      setActivityFeed(prev => [newActivity, ...prev])
    })

    return () => {
      socket.emit('leaveProjectRoom', projectId)
      socket.disconnect()
    }
  }, [projectId])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md mt-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">📡 Project Activity Feed</h3>
      {activityFeed.length === 0 ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        activityFeed.map((item, index) => (
          <div key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
            <p>{item.message}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  )
}
