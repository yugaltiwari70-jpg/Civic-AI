const { SEVERITIES, CATEGORIES } = require('../models');
const PROMPT = `You are CivicAI, an AI assistant for analyzing civic infrastructure issues.
Analyze the provided image and optional citizen description. Identify the most likely civic issue.
Return ONLY valid JSON with keys: issueType, category, severity, suggestedDepartment, explanation, recommendedAction, confidence.
Do not invent facts that cannot reasonably be inferred. If uncertain, say so in the explanation. If no civic issue is visible, set issueType to "None".
confidence must be a number between 0 and 1 only if you can justify it, otherwise null.
category must be one of: ${CATEGORIES.join(', ')}. severity must be one of: ${SEVERITIES.join(', ')}.`;
const d = (issueType, category, severity, dept, act) => ({ issueType, category, severity, suggestedDepartment: dept, explanation: 'DEMO SCENARIO: predefined sample data, not an analysis of an image.', recommendedAction: act, confidence: null });
const DEMO = { pothole: d('Pothole', 'Road Infrastructure', 'High', 'Road Maintenance', 'Inspect and repair the affected road section.'), garbage: d('Garbage Overflow', 'Waste Management', 'Medium', 'Waste Management', 'Schedule collection and clean the area.'), streetlight: d('Broken Streetlight', 'Street Lighting', 'Medium', 'Electrical Maintenance', 'Inspect the lamp and wiring; repair or replace.'), water: d('Water Leakage', 'Water & Drainage', 'High', 'Water Services', 'Dispatch a team to locate and fix the leak.') };
const fail = (code, message) => Object.assign(new Error(message || code), { code });
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
function normalize(j) {
  const issueType = clip(j.issueType, 80);
  if (!issueType || /^none$/i.test(issueType)) throw fail('NO_ISSUE');
  const c = Number(j.confidence);
  return { issueType, category: CATEGORIES.includes(j.category) ? j.category : 'Other', severity: SEVERITIES.includes(j.severity) ? j.severity : 'Medium', suggestedDepartment: clip(j.suggestedDepartment, 80) || 'General Administration', explanation: clip(j.explanation, 600), recommendedAction: clip(j.recommendedAction, 400), confidence: j.confidence != null && c >= 0 && c <= 1 ? c : null };
}
async function analyze(buf, mime, description) {
  if (!process.env.AI_API_KEY) throw fail('NO_AI_KEY');
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.AI_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.AI_MODEL, max_tokens: 700, system: PROMPT, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mime, data: buf.toString('base64') } }, { type: 'text', text: 'Citizen description: ' + (description || 'none') }] }] }) });
  } catch { throw fail('AI_FAILED'); }
  if (res.status === 429) throw fail('RATE_LIMIT');
  if (!res.ok) throw fail('AI_FAILED');
  try {
    const data = await res.json();
    const txt = data.content.filter(b => b.type === 'text').map(b => b.text).join('').replace(/```json|```/g, '').trim();
    return normalize(JSON.parse(txt));
  } catch (e) { if (e.code) throw e; throw fail('AI_FAILED'); }
}
module.exports = { analyze, demo: k => DEMO[k] || null, DEMO_KEYS: Object.keys(DEMO) };
