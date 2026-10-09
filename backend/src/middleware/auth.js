const jwt = require('jsonwebtoken');
const { DEMO_KEYS } = require('../services/aiService');
function auth(q, s, n) { const h = q.headers.authorization || ''; if (h.startsWith('Bearer ')) { try { q.user = jwt.verify(h.slice(7), process.env.JWT_SECRET); } catch { /* invalid token = anonymous */ } } n(); }
function adminOnly(q, s, n) { if (!q.user || q.user.role !== 'admin') return s.status(401).json({ error: 'Admin authentication required' }); n(); }
function errorHandler(e, q, s, n) {
  const map = { LIMIT_FILE_SIZE: [413, 'Image too large (max 5 MB)'], NO_AI_KEY: [503, 'AI is not configured. Use Demo Analysis Mode.'], RATE_LIMIT: [429, 'AI rate limit reached. Please retry shortly.'], NO_ISSUE: [422, 'No clear civic issue could be identified. Upload a clearer image or add a description.'], AI_FAILED: [502, 'AI analysis failed. Please retry or use Demo Analysis Mode.'] };
  const [code, msg] = map[e.code] || [e.status || (e.name === 'CastError' || e.name === 'ValidationError' ? 400 : 500), null];
  if (code === 500) console.error(e);
  const body = { error: msg || (code === 500 ? 'Internal server error' : e.message) };
  if (e.code === 'NO_AI_KEY' || e.code === 'AI_FAILED') body.demoScenarios = DEMO_KEYS;
  s.status(code).json(body);
}
module.exports = { auth, adminOnly, errorHandler };
