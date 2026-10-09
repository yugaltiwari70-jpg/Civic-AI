import { useEffect, useState, useCallback, useMemo } from 'react'; import { api } from '../api'; import { MapView, Loading, Err } from '../components'; import { SC } from '../constants';
const F = { All: () => true, 'High Severity': i => ['High', 'Critical'].includes(i.severity), Road: i => i.category === 'Road Infrastructure', Waste: i => i.category === 'Waste Management', Water: i => i.category === 'Water & Drainage', Lighting: i => i.category === 'Street Lighting', Open: i => i.status !== 'Resolved', Resolved: i => i.status === 'Resolved' };
export default function MapPage() {
  const [d, setD] = useState(null), [e, setE] = useState(''), [f, setF] = useState('All'), [q, setQ] = useState('');
  const load = useCallback(() => { setE(''); api('/map/issues').then(setD).catch(x => setE(x.message)); }, []); useEffect(load, [load]);
  const pts = useMemo(() => (d || []).filter(F[f]).filter(i => !q || (i.issueId + i.issueType).toLowerCase().includes(q.toLowerCase())), [d, f, q]);
  if (e) return <Err msg={e} retry={load} />; if (!d) return <Loading />;
  return <><h2>Civic Map</h2><div className="chips">{Object.keys(F).map(k => <button key={k} className={'chip' + (k === f ? ' on' : '')} onClick={() => setF(k)}>{k}</button>)}</div>
    <input placeholder="Search issue ID or type…" value={q} onChange={e => setQ(e.target.value)} />
    {pts.length ? <MapView points={pts} height={480} /> : <div className="card empty">No issues match.</div>}
    <p className="sm mu">Legend: {Object.entries(SC).map(([k, c]) => <span key={k}><span style={{ color: c }}>●</span> {k} </span>)}<span style={{ color: '#34d399' }}>●</span> Resolved · {pts.length} shown</p></>;
}
