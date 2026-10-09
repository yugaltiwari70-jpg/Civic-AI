import { useState } from 'react'; import { Link } from 'react-router-dom'; import { motion } from 'framer-motion';
import { api, toast } from '../api'; import { CATEGORIES, SEVERITIES, DEMOS, SC } from '../constants'; import { MapView, Sev } from '../components';
const STEPS = ['Scanning image', 'Identifying issue', 'Estimating severity', 'Routing department', 'Checking duplicates'];
function compress(f, max = 1280) {
  return new Promise((res, rej) => {
    const im = new Image(), u = URL.createObjectURL(f);
    im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(b => (b ? res(new File([b], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })) : rej()), 'image/jpeg', .82); };
    im.onerror = rej; im.src = u;
  });
}
export default function Report() {
  const [file, setFile] = useState(null), [prev, setPrev] = useState(''), [lat, setLat] = useState(''), [lng, setLng] = useState(''), [loc, setLoc] = useState(''), [desc, setDesc] = useState('');
  const [stage, setStage] = useState('form'), [step, setStep] = useState(0), [res, setRes] = useState(null), [mode, setMode] = useState(null), [err, setErr] = useState(''), [rel, setRel] = useState([]), [done, setDone] = useState(null), [busy, setBusy] = useState(false), [over, setOver] = useState(false);
  const pin = lat !== '' && lng !== '' && !isNaN(+lat) && !isNaN(+lng) && Math.abs(+lat) <= 90 && Math.abs(+lng) <= 180 ? { lat: +lat, lng: +lng } : null;
  const pick = async f => { if (!f) return; if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setErr('Unsupported file. Use JPG, PNG or WEBP.'); if (f.size > 20 * 1024 * 1024) return setErr('Image too large (max 20 MB).'); setErr(''); try { const c = await compress(f); setFile(c); setPrev(URL.createObjectURL(c)); } catch { setErr('Could not read this image.'); } };
  const detect = () => { if (!navigator.geolocation) return setErr('Geolocation unavailable - enter coordinates manually.'); navigator.geolocation.getCurrentPosition(p => { setLat(p.coords.latitude.toFixed(5)); setLng(p.coords.longitude.toFixed(5)); toast('Location detected'); }, () => setErr('Could not detect location - enter it manually.'), { timeout: 8000 }); };
  async function analyze(demo) {
    if (!pin) return setErr('Please add a valid location.');
    if (!file && !demo) return setErr('Upload an image or choose a demo scenario.');
    setErr(''); setStage('run'); setStep(0); const t = setInterval(() => setStep(s => Math.min(s + 1, 4)), 900);
    try {
      const fd = new FormData(); fd.append('description', desc); demo ? fd.append('demoScenario', demo) : fd.append('image', file);
      const d = await api('/issues/analyze', { method: 'POST', form: fd }), r = d.result;
      const n = await api(`/issues/nearby?lat=${pin.lat}&lng=${pin.lng}&category=${encodeURIComponent(r.category)}&issueType=${encodeURIComponent(r.issueType)}`);
      setStep(5); setMode(d.mode); setRel(n.related);
      setRes({ ...r, title: `${r.issueType} reported`, description: `${r.issueType} reported at the given location. ${desc ? 'Citizen note: ' + desc + '. ' : ''}${r.explanation} Recommended action: ${r.recommendedAction}` });
      await new Promise(x => setTimeout(x, 500)); setStage('result');
    } catch (e) { setErr(e.message + (e.data && e.data.demoScenarios ? ' You can use a Demo Scenario below.' : '')); setStage('form'); } finally { clearInterval(t); }
  }
  async function submit() {
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries({ latitude: pin.lat, longitude: pin.lng, locationText: loc, citizenDescription: res.description, issueType: res.issueType, category: res.category, severity: res.severity, suggestedDepartment: res.suggestedDepartment, explanation: res.explanation, recommendedAction: res.recommendedAction, analysisMode: mode }).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (file && mode === 'ai') fd.append('image', file);
      const d = await api('/issues', { method: 'POST', form: fd }); setDone(d); setStage('done');
    } catch (e) { setErr(e.message); toast(e.message); } finally { setBusy(false); }
  }
  async function support(id) { try { await api(`/issues/${id}/support`, { method: 'POST' }); toast('Support added to ' + id); setStage('form'); setRes(null); } catch (e) { toast(e.message); } }
  const up = (k, v) => setRes(r => ({ ...r, [k]: v }));
  if (stage === 'run') return <div className="card narrow"><h2>CivicAI is analyzing…</h2><div className="drop" style={{ minHeight: 180 }}>{prev ? <img src={prev} alt="" /> : <div style={{ fontSize: 48 }}>🔍</div>}<div className="scan" /></div>
    {STEPS.map((s, i) => <div key={s} className={'step ' + (i < step ? 'done' : i === step ? 'on' : '')}><span className="dot">{i < step ? '✓' : ''}</span>{s}</div>)}</div>;
  if (stage === 'done') { const i = done.issue; return <motion.div className="card narrow" style={{ textAlign: 'center' }} initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
    <svg width="90" height="90" viewBox="0 0 90 90"><circle cx="45" cy="45" r="40" fill="none" stroke="#34d399" strokeWidth="4" /><motion.path d="M26 47l13 13 25-27" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .2, duration: .6 }} /></svg>
    <h2>✓ Civic Issue Reported</h2><p className="g big">{i.issueId}</p><p className="sm mu">Status: {i.status} · {i.category} · {i.severity} · {new Date(i.createdAt).toLocaleString()}</p>
    {done.related.length > 0 && <p className="sm">{done.related.length} possible related report(s) flagged for admin review.</p>}
    <Link className="btn" to={`/issue/${i.issueId}`}>Track My Report</Link> <Link className="btn s" to="/map">View Civic Map</Link> <button className="btn s" onClick={() => { setStage('form'); setRes(null); setFile(null); setPrev(''); setDesc(''); }}>Report Another Issue</button></motion.div>; }
  if (stage === 'result') return <><h2>AI Analysis <span className="g">Complete</span></h2>
    {mode === 'demo' ? <div className="warn">Demo Analysis Mode: predefined scenario, not a live AI result.</div> : <div className="warn">AI-generated assessment. Please review before submission.</div>}
    <div className="grid c2"><div className="card"><div className="sm mu">AI SUGGESTED</div>{prev && <img src={prev} alt="" style={{ width: '100%', borderRadius: 12 }} />}<div className="big">{res.issueType}</div><Sev v={res.severity} />
      <div className="bar"><i style={{ '--w': (SEVERITIES.indexOf(res.severity) + 1) * 25 + '%', background: SC[res.severity] }} /></div>
      <p className="sm"><b>Department:</b> {res.suggestedDepartment}<br /><b>Explanation:</b> {res.explanation}<br /><b>Recommended action:</b> {res.recommendedAction}{res.confidence != null && <><br /><b>Confidence:</b> {Math.round(res.confidence * 100)}%</>}</p>
      <div className="card" style={{ borderColor: rel.length ? 'var(--am)' : undefined }}><b>CivicAI Duplicate Intelligence</b>
        {rel.length ? <><div className="sm mu">Possible related reports found - likely related, not confirmed.</div>{rel.map(x => <div key={x.issue.issueId} className="sm" style={{ marginTop: 8 }}>{x.issue.issueId} · {x.issue.issueType} · {x.distance} m · {x.issue.status} · {x.issue.supportCount} report(s) <button className="btn s" onClick={() => support(x.issue.issueId)}>Support Existing Issue</button></div>)}</> : <div className="sm mu">No possible duplicate found.</div>}</div></div>
      <div className="card"><b>AI Generated Complaint (editable)</b>
        <label>Issue type</label><input value={res.issueType} onChange={e => up('issueType', e.target.value)} />
        <label>Category</label><select value={res.category} onChange={e => up('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
        <label>Severity</label><select value={res.severity} onChange={e => up('severity', e.target.value)}>{SEVERITIES.map(c => <option key={c}>{c}</option>)}</select>
        <label>Department</label><input value={res.suggestedDepartment} onChange={e => up('suggestedDepartment', e.target.value)} />
        <label>Title</label><input value={res.title} onChange={e => up('title', e.target.value)} />
        <label>Description</label><textarea rows="5" value={res.description} onChange={e => up('description', e.target.value)} />
        {err && <div className="sm" style={{ color: 'var(--rd)' }}>{err}</div>}
        <button className="btn" style={{ width: '100%' }} disabled={busy} onClick={submit}>{busy ? 'Submitting…' : rel.length ? 'Continue as New Report' : 'Submit Civic Report'}</button></div></div></>;
  return <><h2>Report a <span className="g">Civic Issue</span></h2><div className="grid c2"><div><div className="card"><b>Upload Evidence</b>
    <div className={'drop' + (over ? ' ov' : '')} onClick={() => document.getElementById('f').click()} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }} tabIndex={0} onKeyDown={e => e.key === 'Enter' && document.getElementById('f').click()}>
      {prev ? <img src={prev} alt="preview" /> : <><div style={{ fontSize: 40 }}>📷</div><div>Drag & drop or click to browse</div><div className="sm mu">JPG, PNG, WEBP · auto-compressed before upload</div></>}</div>
    <input id="f" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => pick(e.target.files[0])} />{prev && <button className="btn s" style={{ marginTop: 10 }} onClick={() => { setFile(null); setPrev(''); }}>Remove image</button>}</div>
    <div className="card" style={{ marginTop: 14 }}><b>Demo Scenario</b><div className="sm mu">No AI call; predefined sample result (clearly labeled).</div><div className="chips" style={{ marginTop: 8 }}>{DEMOS.map(([k, t]) => <button key={k} className="chip" onClick={() => analyze(k)}>{t}</button>)}</div></div></div>
    <div className="card"><b>Issue Details</b><div style={{ margin: '8px 0' }}><button className="btn s" onClick={detect}>📍 Detect my location</button></div>
      <div className="grid c2"><div><label>Latitude</label><input value={lat} onChange={e => setLat(e.target.value)} placeholder="28.6100" /></div><div><label>Longitude</label><input value={lng} onChange={e => setLng(e.target.value)} placeholder="77.2100" /></div></div>
      <label>Location / landmark</label><input value={loc} onChange={e => setLoc(e.target.value)} />{pin && <MapView points={[]} pin={pin} height={180} />}
      <label>What did you notice? (optional)</label><textarea rows="3" value={desc} onChange={e => setDesc(e.target.value)} />
      {err && <div className="sm" style={{ color: 'var(--rd)', marginBottom: 8 }}>{err}</div>}
      <button className="btn" style={{ width: '100%' }} onClick={() => analyze(null)}>✨ Analyze with CivicAI</button></div></div></>;
}
