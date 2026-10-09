import { Link } from 'react-router-dom'; import { motion } from 'framer-motion';
const FLOW = ['Citizen Report', 'AI Vision', 'Classification', 'Severity', 'Department Routing', 'Duplicate Intelligence', 'Action'];
const DIFF = [['👁️', 'AI Vision', 'Understand civic problems from images.'], ['📊', 'Severity Intelligence', 'Help prioritize issues.'], ['🧭', 'Intelligent Routing', 'Suggest the relevant department.'], ['🧬', 'Duplicate Intelligence', 'Flag likely related reports; admins confirm.'], ['📝', 'Actionable Reports', 'Structured, editable complaints.'], ['🔎', 'Resolution Tracking', 'Submitted to resolved, with a timeline.']];
const FUTURE = ['Municipal API integration', 'Multilingual reporting', 'Voice-based reporting', 'WhatsApp/SMS reporting', 'Predictive civic hotspots', 'Advanced geospatial clustering', 'Notification system', 'Public transparency dashboard'];
export default function Home() {
  return <>
    <div className="hero"><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <span className="pill st">AI + Civic + Data + Map + Action</span>
      <h1>See an Issue.<br /><span className="g">AI Understands It.</span><br />Action Starts.</h1>
      <p className="mu big2">Transform everyday civic problems into structured, prioritized and trackable civic intelligence using AI.</p>
      <Link className="btn" to="/report">Report an Issue</Link> <Link className="btn s" to="/map">Explore Civic Map</Link> <Link className="btn s" to="/admin">Admin Dashboard</Link>
    </motion.div>
    <div className="flow">{FLOW.map((f, i) => <motion.div key={f} className="card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .15 * i }}><b className="g">{i + 1}</b> {f}</motion.div>)}</div></div>
    <h2>We don't just report civic problems. We make them actionable.</h2>
    <div className="grid c3">{DIFF.map(([i, t, d], k) => <motion.div key={t} className="card" whileHover={{ y: -4 }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * .06 }}><div style={{ fontSize: 26 }}>{i}</div><b>{t}</b><div className="mu sm">{d}</div></motion.div>)}</div>
    <h2 style={{ marginTop: 40 }}>Multiple reports → one real-world problem</h2>
    <div className="card">Multiple Citizen Reports → CivicAI Intelligence → Possible Related Reports → Master Civic Issue (admin-confirmed) → Prioritized Action. <span className="mu sm">Heuristic grouping; not a guaranteed duplicate detector.</span></div>
    <h2 style={{ marginTop: 40 }}>Future Scope <span className="pill st">NOT IMPLEMENTED</span></h2>
    <div className="chips">{FUTURE.map(f => <span key={f} className="chip">{f}</span>)}</div>
    <p className="sm mu">Hackathon prototype. No government integration; not affiliated with or endorsed by any government body or Microsoft.</p>
  </>;
}
