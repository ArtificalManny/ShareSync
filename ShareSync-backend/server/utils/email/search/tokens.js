// server/utils/email/services/search/tokens.js
const TYPE_RE = /\btype:(user|project|post|file|task)\b/gi;
const USER_RE = /@([A-Za-z0-9_.]{2,32})/g;
const PROJECT_RE = /#([A-Za-z0-9_.\-]{2,64})/g;

function parseTokens(qRaw = '') {
  const q = String(qRaw || '').trim();
  const typeTokens = [];
  let m;
  while ((m = TYPE_RE.exec(q)) !== null) typeTokens.push(m[1].toLowerCase());

  const userHandles = [];
  while ((m = USER_RE.exec(q)) !== null) userHandles.push(m[1]);

  const projectHandles = [];
  while ((m = PROJECT_RE.exec(q)) !== null) projectHandles.push(m[1]);

  // strip tokens to produce plain text query
  const qPlain = q
    .replace(TYPE_RE, '')
    .replace(USER_RE, '')
    .replace(PROJECT_RE, '')
    .trim();

  return { qPlain, userHandles, projectHandles, typeTokens };
}

module.exports = { parseTokens };
