// /Users/artificalmanny/Portfolio/ShareSync/ShareSync-backend/src/index.ts
import mongoose from 'mongoose'
import http from 'http'
import { Server } from 'socket.io'
import app from './app'

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sharesync'

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// Make Socket.IO available to routes via req.app.get('io')
app.set('io', io)

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] connected')
    server.listen(PORT, () => console.log(`[Server] listening on :${PORT}`))
  })
  .catch((err) => {
    console.error('[MongoDB] connection error:', err)
    process.exit(1)
  })
