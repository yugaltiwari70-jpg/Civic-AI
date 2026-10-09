require('dotenv').config();
const express = require('express'), cors = require('cors'), mongoose = require('mongoose'), path = require('path'), fs = require('fs');
const { errorHandler } = require('./middleware/auth'), authRoutes = require('./routes/auth');
const app = express(), PORT = process.env.PORT || 5000;
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '1mb' }));
const up = path.join(__dirname, '../uploads'); fs.mkdirSync(up, { recursive: true });
app.use('/uploads', express.static(up));
app.get('/api/health', (q, s) => s.json({ ok: true, db: mongoose.connection.readyState === 1, aiConfigured: !!process.env.AI_API_KEY, mode: process.env.AI_API_KEY ? 'ai' : 'demo-fallback' }));
app.use('/api/auth', authRoutes);
app.use('/api', require('./routes/issues'));
app.use((q, s) => s.status(404).json({ error: 'Not found' }));
app.use(errorHandler);
mongoose.connect(process.env.MONGO_URI).then(() => authRoutes.ensureAdmin()).then(() => app.listen(PORT, () => console.log(`CivicAI API on :${PORT} (AI ${process.env.AI_API_KEY ? 'enabled' : 'DEMO FALLBACK'})`)))
  .catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
