import { useEffect, useState, useCallback } from 'react'; import { Link } from 'react-router-dom'; import { motion } from 'framer-motion';
import { api, img } from '../api'; import { Counter, Loading, Err, Sev, Stat } from '../components';
export default function MyReports() {
  const [d, setD] = useState(null), [e, setE] = useState('');
  const load = useCallback(() => { setE(''); setD(null); api('/issues?limit=50', { anon: true }).then(setD).catch(x => setE(x.message)); }, []); useEffect(load, [load]);
  if (e) return <Err msg={e} retry={load} />; if (!d) return <Loading />;
  const c = s => d.items.filter(i => s.includes(i.status)).length;
  return <><h2>My Reports</h2><div className="grid c3">{[['Submitted', c(['Submitted'])], ['In Progress', c(['Under Review', 'In Progress'])], ['Resolved', c(['Resolved'])]].map(([t, n]) => <div className="card" key={t}>{t}<div className="big"><Counter to={n} /></div></div>)}</div>
    <div className="grid" style={{ marginTop: 16 }}>{d.items.length ? d.items.map((i, k) => <Link key={i._id} to={`/issue/${i.issueId}`} style={{ color: 'inherit', textDecoration: 'none' }}><motion.div className="card row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * .05 }}>
      {i.imageUrl ? <img src={img(i.imageUrl)} width="64" height="64" style={{ objectFit: 'cover', borderRadius: 10 }} alt="" /> : <span style={{ fontSize: 36 }}>📄</span>}<div style={{ flex: 1 }}><b>{i.issueId} · {i.issueType}</b><div className="sm mu">{i.category} · {i.locationText || `${i.latitude}, ${i.longitude}`} · {new Date(i.createdAt).toLocaleDateString()}</div></div><Sev v={i.severity} /><Stat v={i.status} /></motion.div></Link>) : <div className="card empty">No reports yet. <Link to="/report" style={{ color: 'var(--cy)' }}>Report an issue</Link></div>}</div></>;
}
