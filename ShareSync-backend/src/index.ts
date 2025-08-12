// /Users/artificalmanny/Portfolio/ShareSync/ShareSync-backend/src/index.ts
import http from 'http';
import app from './app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
