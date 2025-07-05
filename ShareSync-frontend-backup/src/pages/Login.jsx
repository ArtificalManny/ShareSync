// src/pages/Login.jsx
import React, { useState } from 'react'
import client from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()

    // ✅ Moved inside handleSubmit
    console.log('Attempting login with', email, password)

    try {
      const { data } = await client.post('http://localhost:3000/api/auth/login', {
        email,
        password,
      })

      // ✅ Store tokens
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // ✅ Log token for Postman use
      console.log('ACCESS TOKEN:', data.access_token)

      // ✅ Navigate after success
      nav('/home')
    } catch (err) {
      console.error('Login failed:', err) // ✅ helpful debug
      alert('Login failed: ' + (err.response?.data?.message || err.message))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl mb-4">Log In</h1>
      <label className="block mb-2">
        Email
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      </label>
      <label className="block mb-4">
        Password
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      </label>
      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Log In
      </button>
    </form>
  )
}