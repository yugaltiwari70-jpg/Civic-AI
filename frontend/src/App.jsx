import { useEffect, useState } from 'react'; import { Routes, Route, NavLink, useLocation } from 'react-router-dom'; import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home'; import Report from './pages/Report'; import MyReports from './pages/MyReports'; import MapPage from './pages/MapPage'; import Admin from './pages/Admin'; import IssueDetail from './pages/IssueDetail';
export default function App() {
  const loc = useLocation(), [toasts, setToasts] = useState([]), [open, setOpen] = useState(false);
  useEffect(() => { const h = e => { const id = Math.random(); setToasts(t => [...t, { id, m: e.detail }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200); }; window.addEventListener('toast', h); return () => window.removeEventListener('toast', h); }, []);
  const L = [['/', 'Home'], ['/report', 'Report Issue'], ['/my-reports', 'My Reports'], ['/map', 'Civic Map'], ['/admin', 'Admin']];
  return <>
    <div className="orb o1" /><div className="orb o2" />
    <nav className={open ? 'open' : ''}><b>◉ CivicAI</b><button className="burger" aria-label="Menu" onClick={() => setOpen(o => !o)}>☰</button><div className="links" onClick={() => setOpen(false)}>{L.map(([p, t]) => <NavLink key={p} to={p} end={p === '/'}>{t}</NavLink>)}</div></nav>
    <AnimatePresence mode="wait"><motion.main key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
      <Routes location={loc}><Route path="/" element={<Home />} /><Route path="/report" element={<Report />} /><Route path="/my-reports" element={<MyReports />} /><Route path="/map" element={<MapPage />} /><Route path="/admin/*" element={<Admin />} /><Route path="/issue/:id" element={<IssueDetail />} /><Route path="*" element={<Home />} /></Routes>
    </motion.main></AnimatePresence>
    <div id="toasts">{toasts.map(t => <motion.div key={t.id} className="toast" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>{t.m}</motion.div>)}</div>
  </>;
}
