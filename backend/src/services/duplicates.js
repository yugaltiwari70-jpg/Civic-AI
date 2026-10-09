const { Issue } = require('../models');
const rad = x => x * Math.PI / 180;
const dist = (a, b, c, e) => { const h = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(e - b) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(h)); };
const RADIUS_M = 150;
// Prototype heuristic: open issues of the same category within RADIUS_M. Image similarity is NOT computed.
async function findRelated({ latitude, longitude, category, issueType, excludeId }) {
  const dLat = RADIUS_M / 111000, dLng = RADIUS_M / (111000 * Math.max(Math.cos(rad(latitude)), .01));
  const q = { category, status: { $ne: 'Resolved' }, latitude: { $gte: latitude - dLat, $lte: latitude + dLat }, longitude: { $gte: longitude - dLng, $lte: longitude + dLng } };
  if (excludeId) q._id = { $ne: excludeId };
  const c = await Issue.find(q).select('issueId issueType category status supportCount masterIssueId latitude longitude createdAt');
  return c.map(i => ({ issue: i, distance: Math.round(dist(latitude, longitude, i.latitude, i.longitude)), reason: `Same category${i.issueType === issueType ? ' and issue type' : ''}, within ${RADIUS_M} m (likely related)` })).filter(x => x.distance <= RADIUS_M).sort((a, b) => a.distance - b.distance);
}
module.exports = { findRelated };
