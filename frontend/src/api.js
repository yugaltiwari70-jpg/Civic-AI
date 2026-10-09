const BASE = import.meta.env.VITE_API_URL || '';
export const img = u => (u ? BASE + u : '');
export const toast = m => window.dispatchEvent(new CustomEvent('toast', { detail: m }));
export const reporterId = () => { let v = localStorage.getItem('civicai_rid'); if (!v) { v = crypto.randomUUID ? crypto.randomUUID() : 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem('civicai_rid', v); } return v; };
export const token = () => localStorage.getItem('civicai_token');
export const setToken = t => (t ? localStorage.setItem('civicai_token', t) : localStorage.removeItem('civicai_token'));
export async function api(path, { method = 'GET', body, form, anon } = {}) {
  const headers = { 'x-reporter-id': reporterId() };
  if (token() && !anon) headers.Authorization = 'Bearer ' + token();
  if (body) headers['content-type'] = 'application/json';
  let res;
  try { res = await fetch(BASE + '/api' + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) }); }
  catch { throw new Error('Network error - is the backend running?'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (res.status === 401 && token()) setToken(null); throw Object.assign(new Error(data.error || 'Request failed'), { data, status: res.status }); }
  return data;
}
