require('dotenv').config();
const mongoose = require('mongoose'); const { Issue, StatusHistory, DuplicateRecord, Counter } = require('./models');
const H = 36e5, now = Date.now();
// DEMO DATA ONLY. Coordinates are generic sample values; edit as needed.
const rows = [['Pothole', 'Road Infrastructure', 'High', 'Road Maintenance', 'Main Road (demo)', 28.6120, 77.2090, 'In Progress', 120],
  ['Pothole', 'Road Infrastructure', 'High', 'Road Maintenance', 'Main Road (demo)', 28.6122, 77.2092, 'Submitted', 30],
  ['Garbage Overflow', 'Waste Management', 'Medium', 'Waste Management', 'Market Street (demo)', 28.6060, 77.2150, 'Under Review', 72],
  ['Broken Streetlight', 'Street Lighting', 'Medium', 'Electrical Maintenance', 'Park Avenue (demo)', 28.6170, 77.2020, 'Submitted', 20],
  ['Water Leakage', 'Water & Drainage', 'Critical', 'Water Services', 'Lake Road (demo)', 28.6090, 77.2220, 'Submitted', 8],
  ['Pothole', 'Road Infrastructure', 'Low', 'Road Maintenance', 'Station Road (demo)', 28.6030, 77.2050, 'Resolved', 200]];
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const ids = (await Issue.find({ isDemoData: true }).select('_id')).map(i => i._id);
  await Promise.all([StatusHistory.deleteMany({ issue: { $in: ids } }), DuplicateRecord.deleteMany({ $or: [{ issue: { $in: ids } }, { related: { $in: ids } }] }), Issue.deleteMany({ isDemoData: true })]);
  const made = [], flow = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
  for (const [t, c, sv, d, loc, la, ln, st, ago] of rows) {
    const k = await Counter.findOneAndUpdate({ _id: 'issue' }, { $inc: { seq: 1 } }, { upsert: true, new: true });
    const at = new Date(now - ago * H);
    const i = await Issue.create({ issueId: 'CIV-' + (1000 + k.seq), reporterId: 'demo-seed', latitude: la, longitude: ln, locationText: loc, citizenDescription: 'Demo data', issueType: t, category: c, severity: sv, suggestedDepartment: d, explanation: 'Demo data - not a live AI result.', recommendedAction: 'Inspect and resolve.', analysisMode: 'demo', status: st, isDemoData: true, createdAt: at, updatedAt: at });
    for (let n = 0; n <= flow.indexOf(st); n++) await StatusHistory.create({ issue: i._id, previousStatus: n ? flow[n - 1] : null, newStatus: flow[n], changedBy: 'demo-seed', note: 'Demo data', timestamp: new Date(at.getTime() + n * 3 * H) });
    made.push(i);
  }
  const [a, b] = made; a.masterIssueId = a.issueId; b.masterIssueId = a.issueId; a.supportCount = 2; await Promise.all([a.save(), b.save()]);
  await DuplicateRecord.create({ issue: b._id, related: a._id, distance: 30, similarityReason: 'Same category and issue type, within 150 m (demo)', reviewed: true, confirmed: true });
  console.log('Seeded', made.length, 'demo issues'); await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
