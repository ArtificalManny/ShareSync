// src/components/PinnedForumPanel.jsx
import React, { useState } from 'react'

export default function PinnedForumPanel({ posts = [], onPostSubmit }) {
  const [tab, setTab] = useState('public') // 'public' or 'private'
  const [newPost, setNewPost] = useState('')

  const handleSubmit = () => {
    if (!newPost.trim()) return
    onPostSubmit({
      type: tab,
      message: newPost.trim(),
      timestamp: new Date().toISOString()
    })
    setNewPost('')
  }

  const filteredPosts = posts.filter(post => post.type === tab)

  return (
    <section className="rounded-3xl shadow-xl bg-white dark:bg-gray-900 p-6 space-y-6 transition">
      {/* Header with tabs */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          📌 Pinned Project Forum
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('public')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              tab === 'public'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setTab('private')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              tab === 'private'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Private
          </button>
        </div>
      </div>

      {/* Forum Posts Display */}
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {filteredPosts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No {tab} posts yet. Start the conversation!
          </p>
        ) : (
          filteredPosts.map((post, idx) => (
            <div
              key={idx}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 transition"
            >
              <p className="text-sm text-gray-900 dark:text-gray-100">{post.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(post.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input + Submit */}
      <div className="flex gap-2">
        <input
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          placeholder={`Write a ${tab} message...`}
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSubmit}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition"
        >
          Post
        </button>
      </div>
    </section>
  )
}
