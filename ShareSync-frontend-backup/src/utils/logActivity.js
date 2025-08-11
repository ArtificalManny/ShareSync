import { io as socketIO } from 'socket.io-client'

// Use your existing socket if you have a provider. This is a fallback:
const socket = socketIO('/', { autoConnect: true })

/**
 * Fire-and-forget client activity (optional).
 * Prefer server-side logging, but this helps with optimistic UI.
 */
export function logActivityClient(evt) {
  try {
    socket.emit('activity', evt)
  } catch (e) {
    console.warn('[logActivityClient] emit failed', e)
  }
}
