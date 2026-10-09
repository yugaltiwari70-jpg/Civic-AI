import { useEffect, useRef, useState } from 'react'; import L from 'leaflet'; import { SC, STATUSES } from './constants';
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fmt = t => (t ? new Date(t).toLocaleString() : '');
export const Sev = ({ v }) => <span className={'pill ' + v}>{v}</span>;
export const Stat = ({ v }) => <span className="pill st">{v}</span>;
export function Counter({ to }) { const [n, setN] = useState(0); useEffect(() => { let s, id; const f = t => { s = s || t; const p = Math.min((t - s) / 900, 1); setN(Math.round(to * p)); if (p < 1) id = requestAnimationFrame(f); }; id = requestAnimationFrame(f); return () => cancelAnimationFrame(id); }, [to]); return <>{n}</>; }
export const Loading = () => <div className="card empty">Loading…</div>;
export const Err = ({ msg, retry }) => <div className="card empty"><p>⚠️ {msg}</p>{retry && <button className="btn" onClick={retry}>Retry</button>}</div>;
export function MapView({ points = [], pin, height = 340 }) {
  const el = useRef(), map = useRef(), layer = useRef();
  const pkey = points.map(p => p.issueId + p.status + p.severity + p.latitude + p.longitude).join('|');
  useEffect(() => {
    map.current = L.map(el.current).setView([20.6, 78.9], 4);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    const t = setTimeout(() => map.current && map.current.invalidateSize(), 300);
    return () => { clearTimeout(t); map.current.remove(); };
  }, []);
  useEffect(() => {
    layer.current.clearLayers(); const b = [];
    points.forEach(p => { L.circleMarker([p.latitude, p.longitude], { radius: 9, color: '#fff', weight: 1.5, fillColor: p.status === 'Resolved' ? '#34d399' : SC[p.severity], fillOpacity: .9 }).bindPopup(`<b>${esc(p.issueId)}</b><br>${esc(p.issueType)}<br>${esc(p.category)}<br>${p.severity} · ${p.status}<br>${p.supportCount} report(s)`).addTo(layer.current); b.push([p.latitude, p.longitude]); });
    if (pin) { L.circleMarker([pin.lat, pin.lng], { radius: 11, color: '#22d3ee', weight: 3, fillColor: '#22d3ee', fillOpacity: .4 }).bindPopup('Selected location').addTo(layer.current); b.push([pin.lat, pin.lng]); }
    if (b.length) map.current.fitBounds(b, { maxZoom: 16, padding: [30, 30] });
  }, [pkey, pin && pin.lat, pin && pin.lng]);
  return <div ref={el} style={{ height, borderRadius: 14, border: '1px solid var(--bd)' }} />;
}
export function Timeline({ issue, history }) {
  const at = s => history.find(h => h.newStatus === s);
  const rows = [['Report Submitted', issue.createdAt, true], ['AI Analysis Completed' + (issue.analysisMode === 'demo' ? ' (demo scenario)' : ''), issue.createdAt, true], ...STATUSES.slice(1).map(s => [s, at(s) && at(s).timestamp, !!at(s)])];
  const cur = rows.findIndex(r => !r[2]);
  return <div className="tl">{rows.map((r, i) => <div key={i} className={r[2] ? 'ok' : i === cur ? 'cur' : ''}>{r[0]} {r[1] && <span className="sm mu">{fmt(r[1])}</span>}</div>)}</div>;
}
