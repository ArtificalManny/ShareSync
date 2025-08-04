import React, { useEffect, useState } from 'react'
import client from '../../api/client'
import { ShieldCheck, Flame, Zap } from 'lucide-react'

export default function ProjectMembersPanel({ projectId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    client.get(`/projects/${projectId}/members`)
      .then(res => {
        setMembers(res.data || [])
      })
      .catch(err => {
        console.error('Error fetching project members:', err)
      })
      .finally(() => setLoading(false))
  }, [projectId])

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze': return 'text-yellow-600'
      case 'Silver': return 'text-gray-400'
      case 'Gold': return 'text-yellow-400'
      case 'Platinum': return 'text-blue-400'
      case 'Diamond': return 'text-purple-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-md p-4 space-y-4 transition-colors duration-300">
      <h3 className="text-md font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center">
        <ShieldCheck className="h-4 w-4 mr-2" />
        Project Members
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading members...</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.id} className="flex items-center space-x-3">
              <img
                src={member.avatarUrl || '/default-profile.png'}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col text-sm">
                <span className="font-medium text-gray-800 dark:text-gray-200">{member.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{member.role || 'Collaborator'}</span>
              </div>
              <div className="ml-auto flex items-center space-x-2">
                {member.streakDays >= 3 && (
                  <Flame className="w-4 h-4 text-red-500" title={`${member.streakDays}-day streak`} />
                )}
                {member.tier && (
                  <span className={`text-xs font-semibold ${getTierColor(member.tier)}`}>
                    {member.tier}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
