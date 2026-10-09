const r = require('express').Router(), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { User } = require('../models');
r.post('/login', async (q, s, n) => { try {
  const { email, password } = q.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return s.status(400).json({ error: 'Email and password are required' });
  const u = await User.findOne({ email: email.toLowerCase().trim() });
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return s.status(401).json({ error: 'Invalid credentials' });
  s.json({ token: jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), user: { name: u.name, email: u.email, role: u.role } });
} catch (e) { n(e); } });
r.ensureAdmin = async () => {
  const { ADMIN_EMAIL: e, ADMIN_PASSWORD: p } = process.env;
  if (!e || !p || !process.env.JWT_SECRET) throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET must be set in .env');
  const passwordHash = await bcrypt.hash(p, 10);
  await User.findOneAndUpdate({ email: e.toLowerCase() }, { name: 'CivicAI Admin', passwordHash, role: 'admin' }, { upsert: true });
};
module.exports = r;
