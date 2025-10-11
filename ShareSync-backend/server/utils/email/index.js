// server/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');

// 1) import the router aggregator (already attempts to include discovery route)
const apiRoutes = require('./utils/email/routes');

const app = express();

// --- middleware (put your auth/session above the routes if you have them) ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// (optional) if you use the native Mongo driver and want the native path in discovery:
// const { MongoClient } = require('mongodb');
// (async () => {
//   const client = new MongoClient(process.env.MONGO_URL);
//   await client.connect();
//   app.locals.db = client.db(process.env.MONGO_DB_NAME);
// })().catch(err => { console.error('[mongo] failed to connect', err); });

// --- HTTP server + Socket.IO (so we can emit live discovery bumps) ---
const httpServer = http.createServer(app);

let initSocketIOServer;
try {
  // Preferred: compiled JS at server/utils/email/sockets/index.js
  ({ initSocketIOServer } = require('./utils/email/sockets'));
} catch {
  try {
    // Fallback if you run with ts-node
    ({ initSocketIOServer } = require('./utils/email/sockets/index.ts'));
  } catch (e) {
    console.warn('[sockets] not initialized:', e && e.message);
  }
}

let io = null;
if (typeof initSocketIOServer === 'function') {
  io = initSocketIOServer(httpServer);
  app.locals.io = io; // make io available to routes/services if needed
}

// --- API mounts (includes /discovery via the aggregator router) ---
app.use('/api', apiRoutes);

// health root (optional)
app.get('/', (_req, res) => res.json({ ok: true, service: 'ShareSync API' }));

// error handler (keep last)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: String(err?.message || err) });
});

// start server (use httpServer so Socket.IO works)
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});