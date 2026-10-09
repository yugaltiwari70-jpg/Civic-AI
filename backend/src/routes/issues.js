const r = require('express').Router(), multer = require('multer'), path = require('path'), crypto = require('crypto'), mongoose = require('mongoose');
const { Issue, StatusHistory, DuplicateRecord, Counter, STATUSES, SEVERITIES, CATEGORIES } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const ai = require('../services/aiService'), { findRelated } = require('../services/duplicates');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const fileFilter = (q, f, cb) => EXT[f.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only JPG, PNG or WEBP images are allowed'), { status: 400 }));
const limits = { fileSize: 5 * 1024 * 1024 };
const mem = multer({ storage: multer.memoryStorage(), limits, fileFilter });
const disk = multer({ storage: multer.diskStorage({ destination: path.join(__dirname, '../../uploads'), filename: (q, f, cb) => cb(null, crypto.randomUUID() + EXT[f.mimetype]) }), limits, fileFilter });
const w = f => (q, s, n) => Promise.resolve(f(q, s, n)).catch(n);
const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const rid = q => { const v = q.headers['x-reporter-id']; return typeof v === 'string' && v.length <= 64 ? v : null; };
const find = async id => (await Issue.findOne({ issueId: String(id).toUpperCase() })) || (mongoose.isValidObjectId(id) ? Issue.findById(id) : null);
const isAdmin = q => q.user && q.user.role === 'admin';
const canSee = (q, i) => isAdmin(q) || (rid(q) && i.reporterId === rid(q));

r.post('/issues/analyze', mem.single('image'), w(async (q, s) => {
  const desc = String(q.body.description || '').slice(0, 1000);
  if (q.body.demoScenario) { const d = ai.demo(q.body.demoScenario); if (!d) throw bad('Unknown demo scenario'); return s.json({ mode: 'demo', label: 'Demo Analysis Mode - not a live AI result', result: d }); }
  if (!q.file) throw bad('Image is required');
  s.json({ mode: 'ai', result: await ai.analyze(q.file.buffer, q.file.mimetype, desc) });
}));

r.get('/issues/nearby', w(async (q, s) => {
  const latitude = +q.query.lat, longitude = +q.query.lng;
  if (q.query.lat === '' || q.query.lng === '' || !(Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) || !CATEGORIES.includes(q.query.category)) throw bad('lat, lng and a valid category are required');
  s.json({ related: await findRelated({ latitude, longitude, category: q.query.category, issueType: q.query.issueType }) });
}));

r.post('/issues', auth, disk.single('image'), w(async (q, s) => {
  const b = q.body, latitude = Number(b.latitude), longitude = Number(b.longitude);
  if (!b.latitude || !b.longitude || !(Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180)) throw bad('A valid location is required');
  if (!CATEGORIES.includes(b.category) || !SEVERITIES.includes(b.severity)) throw bad('Invalid category or severity');
  if (!b.issueType || String(b.issueType).length > 80) throw bad('issueType is required (max 80 chars)');
  const reporterId = rid(q) || 'anonymous';
  const c = await Counter.findOneAndUpdate({ _id: 'issue' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  const issue = await Issue.create({ issueId: 'CIV-' + (1000 + c.seq), reporterId, imageUrl: q.file ? '/uploads/' + q.file.filename : null, latitude, longitude, locationText: String(b.locationText || '').slice(0, 200), citizenDescription: String(b.citizenDescription || '').slice(0, 2000),
    issueType: String(b.issueType).trim(), category: b.category, severity: b.severity, suggestedDepartment: String(b.suggestedDepartment || '').slice(0, 80), explanation: String(b.explanation || '').slice(0, 600), recommendedAction: String(b.recommendedAction || '').slice(0, 400), analysisMode: b.analysisMode === 'ai' ? 'ai' : 'demo' });
  await StatusHistory.create({ issue: issue._id, previousStatus: null, newStatus: 'Submitted', changedBy: reporterId, note: 'Report submitted' });
  const related = await findRelated({ latitude, longitude, category: issue.category, issueType: issue.issueType, excludeId: issue._id });
  await DuplicateRecord.insertMany(related.map(x => ({ issue: issue._id, related: x.issue._id, distance: x.distance, similarityReason: x.reason })));
  s.status(201).json({ issue, related });
}));

r.get('/issues', auth, w(async (q, s) => {
  const f = {}, Q = q.query;
  if (!isAdmin(q)) { if (!rid(q)) throw bad('x-reporter-id header required'); f.reporterId = rid(q); }
  if (SEVERITIES.includes(Q.severity)) f.severity = Q.severity;
  if (STATUSES.includes(Q.status)) f.status = Q.status;
  if (CATEGORIES.includes(Q.category)) f.category = Q.category;
  if (Q.search) { const x = new RegExp(String(Q.search).slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); f.$or = [{ issueId: x }, { issueType: x }, { locationText: x }]; }
  const sort = ['createdAt', '-createdAt', '-supportCount'].includes(Q.sort) ? Q.sort : '-createdAt';
  const page = Math.max(1, +Q.page || 1), limit = Math.min(50, Math.max(1, +Q.limit || 10));
  const [items, total] = await Promise.all([Issue.find(f).select('-supporters').sort(sort).skip((page - 1) * limit).limit(limit), Issue.countDocuments(f)]);
  s.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

r.get('/map/issues', w(async (q, s) => s.json(await Issue.find().select('issueId issueType category severity status latitude longitude supportCount masterIssueId createdAt isDemoData'))));

r.get('/analytics', auth, adminOnly, w(async (q, s) => {
  const g = f => Issue.aggregate([{ $group: { _id: '$' + f, n: { $sum: 1 } } }]);
  const since = new Date(Date.now() - 30 * 864e5);
  const [cat, sev, st, trend, total, hot] = await Promise.all([g('category'), g('severity'), g('status'), Issue.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]), Issue.countDocuments(), Issue.countDocuments({ severity: { $in: ['High', 'Critical'] }, status: { $ne: 'Resolved' } })]);
  const m = a => Object.fromEntries(a.map(x => [x._id, x.n])), S = m(st);
  s.json({ total, resolved: S.Resolved || 0, open: total - (S.Resolved || 0), highOrCriticalOpen: hot, byCategory: m(cat), bySeverity: m(sev), byStatus: S, trend: trend.map(x => ({ date: x._id, count: x.n })) });
}));

r.get('/issues/:id', auth, w(async (q, s) => {
  const i = await find(q.params.id); if (!i) throw bad('Issue not found', 404);
  if (!canSee(q, i)) throw bad('You do not have access to this issue', 403);
  s.json({ issue: i, history: await StatusHistory.find({ issue: i._id }).sort('timestamp') });
}));

r.patch('/issues/:id', auth, adminOnly, w(async (q, s) => {
  const i = await find(q.params.id); if (!i) throw bad('Issue not found', 404);
  const { category, severity, suggestedDepartment } = q.body || {};
  if (category !== undefined) { if (!CATEGORIES.includes(category)) throw bad('Invalid category'); i.category = category; }
  if (severity !== undefined) { if (!SEVERITIES.includes(severity)) throw bad('Invalid severity'); i.severity = severity; }
  if (suggestedDepartment !== undefined) i.suggestedDepartment = String(suggestedDepartment).slice(0, 80);
  await i.save(); s.json({ issue: i });
}));

r.patch('/issues/:id/status', auth, adminOnly, w(async (q, s) => {
  const i = await find(q.params.id); if (!i) throw bad('Issue not found', 404);
  const next = q.body && q.body.status;
  if (!STATUSES.includes(next)) throw bad('Invalid status');
  if (STATUSES.indexOf(next) !== STATUSES.indexOf(i.status) + 1) throw bad(`Cannot move from "${i.status}" to "${next}"`, 409);
  const prev = i.status; i.status = next; await i.save();
  await StatusHistory.create({ issue: i._id, previousStatus: prev, newStatus: next, changedBy: 'admin', note: String(q.body.note || '').slice(0, 300) });
  s.json({ issue: i, history: await StatusHistory.find({ issue: i._id }).sort('timestamp') });
}));

r.get('/issues/:id/duplicates', auth, adminOnly, w(async (q, s) => {
  const i = await find(q.params.id); if (!i) throw bad('Issue not found', 404);
  s.json({ records: await DuplicateRecord.find({ $or: [{ issue: i._id }, { related: i._id }] }).populate('issue related', 'issueId issueType status createdAt masterIssueId') });
}));

// Grouping into a master issue only happens after admin confirmation.
r.patch('/duplicates/:id', auth, adminOnly, w(async (q, s) => {
  const rec = await DuplicateRecord.findById(q.params.id).populate('issue related'); if (!rec) throw bad('Record not found', 404);
  const confirmed = q.body && q.body.confirmed; if (typeof confirmed !== 'boolean') throw bad('confirmed (boolean) required');
  rec.reviewed = true; rec.confirmed = confirmed; await rec.save();
  if (confirmed) { const [a, b] = [rec.issue, rec.related].sort((x, y) => x.createdAt - y.createdAt); const master = a.masterIssueId || a.issueId; a.masterIssueId = master; b.masterIssueId = master; await Promise.all([a.save(), b.save()]); }
  s.json({ record: rec });
}));

r.post('/issues/:id/support', auth, w(async (q, s) => {
  const id = rid(q); if (!id) throw bad('x-reporter-id header required');
  const i = await find(q.params.id); if (!i) throw bad('Issue not found', 404);
  if (i.reporterId === id || i.supporters.includes(id)) throw bad('You have already reported or supported this issue', 409);
  i.supporters.push(id); i.supportCount += 1; await i.save(); s.json({ supportCount: i.supportCount });
}));
module.exports = r;
