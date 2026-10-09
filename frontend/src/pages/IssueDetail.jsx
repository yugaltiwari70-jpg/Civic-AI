import { useEffect, useState, useCallback } from 'react'; import { useParams, Link } from 'react-router-dom';
import { api, img, token, toast } from '../api'; import { MapView, Timeline, Loading, Err, Sev, Stat } from '../components'; import { STATUSES, SEVERITIES, CATEGORIES } from '../constants';
export default function IssueDetail() {
  const { id } = useParams(), [d, setD] = useState(null), [dups, setDups] = useState([]), [e, setE] = useState(''), admin = !!token();
  const load = useCallback(async () => { setE(''); try { const r = await api('/issues/' + id); setD(r); if (admin) { try { setDups((await api(`/issues/${id}/duplicates`)).records); } catch { /* not admin */ } } } catch (x) { setE(x.message); } }, [id, admin]); useEffect(() => { load(); }, [load]);
  if (e) return <Err msg={e} retry={load} />; if (!d) return <Loading />;
  const i = d.issue, next = STATUSES[STATUSES.indexOf(i.status) + 1];
  const run = async (f, ok) => { try { await f(); toast(ok); load(); } catch (x) { toast(x.message); } };
  const patch = b => run(() => api('/issues/' + i.issueId, { method: 'PATCH', body: b }), 'Updated');
  const review = (rid, confirmed) => run(() => api('/duplicates/' + rid, { method: 'PATCH', body: { confirmed } }), confirmed ? 'Grouped under master issue' : 'Marked not related');
  return <><Link to={admin ? '/admin' : '/my-reports'} className="mu sm">← Back</Link>
    <h2>{i.issueId} · {i.issueType} {i.isDemoData && <span className="pill st">Demo Data</span>}</h2>
    {i.masterIssueId && <div className="card" style={{ marginBottom: 14 }}><b>MASTER ISSUE #{i.masterIssueId}</b> <span className="sm mu">- admin-confirmed group · {i.supportCount} citizen(s) reported this</span></div>}
    <div className="grid c2"><div className="card">{i.imageUrl && <img src={img(i.imageUrl)} alt="" style={{ width: '100%', borderRadius: 12 }} />}<p><Sev v={i.severity} /> <Stat v={i.status} /></p>
      <p className="sm"><b>Citizen description:</b> {i.citizenDescription || '—'}<br />{i.locationText} ({i.latitude}, {i.longitude})</p><MapView points={[i]} height={220} /></div>
      <div><div className="card"><b>AI Analysis</b> <span className="sm mu">(AI Suggested)</span>{i.analysisMode === 'demo' && <div className="warn">Demo scenario - not a live AI result.</div>}
        <p className="sm">Category: {i.category}<br />Department: {i.suggestedDepartment}<br />{i.explanation}<br />Action: {i.recommendedAction}{i.confidence != null && <><br />Confidence: {Math.round(i.confidence * 100)}%</>}</p></div>
        <div className="card" style={{ marginTop: 14 }}><b>Timeline</b><div style={{ marginTop: 8 }}><Timeline issue={i} history={d.history} /></div></div>
        {admin && <div className="card" style={{ marginTop: 14 }}><b>Admin Actions</b>
          <label>Category (override AI)</label><select value={i.category} onChange={e => patch({ category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          <label>Severity</label><select value={i.severity} onChange={e => patch({ severity: e.target.value })}>{SEVERITIES.map(c => <option key={c}>{c}</option>)}</select>
          {next ? <button className="btn" onClick={() => window.confirm(`Change status to "${next}"?`) && run(() => api(`/issues/${i.issueId}/status`, { method: 'PATCH', body: { status: next } }), 'Status → ' + next)}>Mark {next}</button> : <div className="pill Low">Resolved</div>}</div>}
        {admin && dups.length > 0 && <div className="card" style={{ marginTop: 14 }}><b>Possible related reports</b>{dups.map(r => <div key={r._id} className="sm" style={{ marginTop: 8 }}>{r.issue.issueId} ↔ {r.related.issueId} · {r.distance} m<br /><span className="mu">{r.similarityReason}</span><br />{r.reviewed ? <span className={'pill ' + (r.confirmed ? 'Low' : 'Medium')}>{r.confirmed ? 'Confirmed' : 'Not related'}</span> : <><button className="btn s" onClick={() => review(r._id, true)}>Confirm grouping</button> <button className="btn s" onClick={() => review(r._id, false)}>Not related</button></>}</div>)}</div>}</div></div></>;
}
