// Activity Utils: shared helpers for Activity Entry Consoles
// Static client-only app using RESTful Table API and localStorage session
// Provides: resilient API helpers (normalizePath + cb + warm-up + retries),
// activities CRUD with local fallback, cross-tab sync, and admin impersonation helpers

// ===== Session helpers =====
export function getSession() {
  try { return JSON.parse(localStorage.getItem('ascm_session')||'null'); } catch { return null; }
}

export function requireAuthOrRedirect() {
  const s = getSession();
  if (!s) { window.location.replace('index.html'); }
  return s;
}

// ===== Week helpers =====
// ISO week id as YYYY-Www (e.g., 2025-W38)
export function weekIdFromDate(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  const yyyy = date.getUTCFullYear();
  const ww = String(weekNo).padStart(2,'0');
  return `${yyyy}-W${ww}`;
}

export function currentWeekId(){ return weekIdFromDate(new Date()); }

export function recentWeeks(count=12) {
  const weeks = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (i*7));
    weeks.push(weekIdFromDate(d));
  }
  return Array.from(new Set(weeks));
}

// Convert ISO week id (YYYY-Www) to UTC Monday start and Sunday end dates
export function weekRangeFromId(weekId){
  const [yStr, wStr] = String(weekId).split('-W');
  const year = parseInt(yStr, 10); const week = parseInt(wStr, 10);
  if (!year || !week) return null;
  // Get Monday of the requested ISO week
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  let dow = simple.getUTCDay(); if (dow === 0) dow = 7; // Sunday => 7
  const monday = new Date(simple);
  if (dow <= 4) monday.setUTCDate(simple.getUTCDate() - (dow - 1));
  else monday.setUTCDate(simple.getUTCDate() + (8 - dow));
  const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday, end: sunday };
}

export function weekLabel(weekId){
  const r = weekRangeFromId(weekId); if (!r) return weekId;
  const fmt = (d)=> d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  const yr = r.end.getUTCFullYear();
  return `${fmt(r.start)} – ${fmt(r.end)}, ${yr} (${weekId})`;
}

export function weeksWithLabels(count=16){
  return recentWeeks(count).map(id => ({ id, label: weekLabel(id) }));
}

// ===== Cross-tab sync =====
function broadcastSync(eventKey){
  try { localStorage.setItem(eventKey, String(Date.now())); } catch {}
}
try {
  if (!window._ascmChan) window._ascmChan = new BroadcastChannel('ascm_sync');
} catch{}

// ===== Local activity cache (fallback for blocked POST) =====
function loadLocalActivities(){ try { return JSON.parse(localStorage.getItem('activities_local')||'[]'); } catch { return []; } }
function saveLocalActivities(list){ try { localStorage.setItem('activities_local', JSON.stringify(list||[])); } catch {} }
function addLocalActivity(rec){ const list = loadLocalActivities(); list.push(rec); saveLocalActivities(list); }
function removeLocalActivity(id){ const list = loadLocalActivities().filter(x => String(x.id) !== String(id)); saveLocalActivities(list); }

// ===== Global toast helpers (uses .ascm-toast from theme.css) =====
function ensureToastRoot(){
  if (document.getElementById('ascm_toast')) return;
  const t = document.createElement('div');
  t.id = 'ascm_toast';
  t.className = 'ascm-toast info';
  t.setAttribute('role','status');
  document.body.appendChild(t);
}
function showToast(msg, type='info'){
  try {
    ensureToastRoot();
    const t = document.getElementById('ascm_toast');
    t.classList.remove('success','error','info');
    t.classList.add(type||'info');
    t.textContent = String(msg||'');
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(()=>{ try{t.classList.remove('show');}catch{} }, 1800);
  } catch { try { console.log('[toast]', msg); } catch{} }
}
export function toast(message, type='info'){ showToast(String(message||''), type); }

// Inline badges for quick save indicators
export function showInlineBadgeAtId(containerId='entries', recordId, label='Saved', color='emerald'){
  try {
    if (!recordId) return;
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;
    const row = container.querySelector(`[data-id="${recordId}"]`);
    if (!row) return;
    const badge = document.createElement('span');
    const colorMap = {
      emerald: { bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-200' },
      blue:    { bg:'bg-blue-100',    text:'text-blue-700',    border:'border-blue-200' },
      red:     { bg:'bg-red-100',     text:'text-red-700',     border:'border-red-200' },
      amber:   { bg:'bg-amber-100',   text:'text-amber-700',   border:'border-amber-200' }
    };
    const c = colorMap[color] || colorMap.emerald;
    badge.className = `ml-2 text-xs px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border} ascm-badge-fx`;
    badge.textContent = label || 'Saved';
    row.appendChild(badge);
    setTimeout(()=>{ try { badge.remove(); } catch{} }, 1650);
  } catch(e){ try { console.warn('inline badge by id failed', e); } catch{} }
}
export function showInlineBadgeAtTop(containerId='entries', label='Saved', color='emerald'){
  try {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;
    const row = container.querySelector('.card');
    if (!row) return;
    const badge = document.createElement('span');
    const colorMap = {
      emerald: { bg:'bg-emerald-100', text:'text-emerald-700', border:'border-emerald-200' },
      blue:    { bg:'bg-blue-100',    text:'text-blue-700',    border:'border-blue-200' },
      red:     { bg:'bg-red-100',     text:'text-red-700',     border:'border-red-200' },
      amber:   { bg:'bg-amber-100',   text:'text-amber-700',   border:'border-amber-200' }
    };
    const c = colorMap[color] || colorMap.emerald;
    badge.className = `ml-2 text-xs px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border} ascm-badge-fx`;
    badge.textContent = label || 'Saved';
    row.appendChild(badge);
    setTimeout(()=>{ try { badge.remove(); } catch{} }, 1650);
  } catch(e){ try { console.warn('inline badge top failed', e); } catch{} }
}

// ===== Resilient API helpers (normalize + warm-up + cb) =====
function looksLikeHtml(res){ const ct = (res.headers?.get?.('content-type')||'').toLowerCase(); return ct.includes('text/html'); }
const sleep = (ms)=> new Promise(r => setTimeout(r, ms));
let API_BASE = 'tables/';
const API_BASE_CANDIDATES = ['tables/','/tables/'];
export async function resolveApiBase(){
  for (const base of API_BASE_CANDIDATES){
    try {
      const r = await fetch(`${base}activities?limit=1&cb=${Date.now()}`, { cache:'no-store', credentials:'same-origin' });
      const ct=(r.headers?.get('content-type')||'').toLowerCase();
      if (r.ok && ct.includes('application/json')) { API_BASE = base; break; }
    } catch {}
  }
}
function normalizePath(p){
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('tables/')) return API_BASE + p.slice('tables/'.length);
  if (p.startsWith('/tables/')) return API_BASE + p.slice('/tables/'.length);
  return p;
}
async function apiRequest(method, path, body, tries=7){
  let lastText=''; let notified=false;
  for (let i=0;i<tries;i++){
    let url = normalizePath(path);
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}cb=${Date.now()}_${i}`;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type':'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      credentials: 'same-origin'
    });
    if (res.status === 401 || res.status === 403 || looksLikeHtml(res)){
      try { lastText = await res.text(); } catch {}
      if (!notified) { showToast('Warming up connection…'); notified = true; }
      try {
        let wu = normalizePath('tables/activities?limit=1');
        const wsep = wu.includes('?') ? '&' : '?';
        await fetch(`${wu}${wsep}cb=${Date.now()}`, { cache:'no-store', credentials:'same-origin' });
      } catch {}
      const backoff = Math.min(15000, 600 * (i+1));
      await sleep(backoff);
      continue;
    }
    return res;
  }
  throw new Error(`API request failed after retries: ${lastText.slice(0,160)}`);
}
async function apiJson(method, path, body, tries=7){
  const res = await apiRequest(method, path, body, tries);
  if (!res.ok){ let t=''; try { t = await res.text(); } catch{}; throw new Error(`${method} ${normalizePath(path)} -> ${res.status} ${res.statusText} ${t.slice(0,160)}`); }
  if (res.status === 204) return {};
  try { return await res.json(); } catch { return {}; }
}

// Proactive warmup on module load (best-effort)
(async function warmup(){ try { await resolveApiBase(); await fetch(normalizePath('tables/activities?limit=1'), { cache:'no-store', credentials:'same-origin' }); } catch {} })();

// ===== Admin impersonation helpers =====
const IMPERSONATE_KEY = 'ascm_impersonate';
function isAdmin(){ try { return (getSession()?.role||'').toLowerCase()==='admin'; } catch { return false; } }
export function getImpersonation(){ try { return JSON.parse(localStorage.getItem(IMPERSONATE_KEY)||'null'); } catch { return null; } }
export async function startImpersonation(user){
  const sess = getSession();
  if (!sess || (sess.role||'').toLowerCase()!=='admin') throw new Error('Only Administrators can impersonate users');
  if (!user || !user.id) throw new Error('Invalid user for impersonation');
  const ctx = { id:user.id, name: user.name||user.email||'User', email: user.email||'', role: (user.role||'ae').toLowerCase(), startedAt: Date.now(), startedBy: sess.email||sess.id };
  try { localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(ctx)); } catch {}
  await audit('impersonation_start', { target_id: ctx.id, target_role: ctx.role, target_email: ctx.email });
  try { if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_start', at: Date.now(), target: ctx }); } catch{}
  return ctx;
}
export async function stopImpersonation(){
  const ctx = getImpersonation();
  try { localStorage.removeItem(IMPERSONATE_KEY); } catch {}
  await audit('impersonation_stop', { target_id: ctx?.id||'', target_role: ctx?.role||'' });
  try { if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_stop', at: Date.now() }); } catch{}
}
// Legacy compatibility (tests): setupActAsUser + confirmActAsUser
export async function setupActAsUser(user){
  // Prepares impersonation context but does not broadcast activate yet
  const sess = getSession();
  if (!sess || (sess.role||'').toLowerCase()!=='admin') throw new Error('Only Administrators can impersonate users');
  if (!user || !user.id) throw new Error('Invalid user for impersonation');
  const ctx = { id:user.id, name: user.name||user.email||'User', email: user.email||'', role: (user.role||'ae').toLowerCase(), startedAt: Date.now(), startedBy: sess.email||sess.id, pending:true };
  try { localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(ctx)); } catch {}
  await audit('impersonation_setup', { target_id: ctx.id, target_role: ctx.role, target_email: ctx.email });
  return ctx;
}
export async function confirmActAsUser(){
  const sess = getSession();
  if (!sess || (sess.role||'').toLowerCase()!=='admin') throw new Error('Only Administrators can impersonate users');
  const ctx = getImpersonation();
  if (!ctx || !ctx.id) throw new Error('No pending impersonation to confirm');
  delete ctx.pending; ctx.confirmedAt = Date.now();
  try { localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(ctx)); } catch {}
  await audit('impersonation_confirm', { target_id: ctx.id, target_role: ctx.role, target_email: ctx.email });
  try { if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_start', at: Date.now(), target: ctx }); } catch{}
  return ctx;
}
export async function loadUsersSimple(limit=1000){
  let rows = [];
  try {
    try { await apiRequest('GET','tables/users?limit=1'); } catch {}
    const data = await apiJson('GET', `tables/users?limit=${limit}`);
    rows = data.data||[];
    try { localStorage.setItem('users', JSON.stringify(rows)); } catch {}
  } catch(e){
    try { rows = JSON.parse(localStorage.getItem('users')||'[]')||[]; } catch { rows=[]; }
    if (!rows.length){ try { rows = JSON.parse(localStorage.getItem('um_users')||'[]')||[]; } catch { rows=[]; }
    }
  }
  // filter active, non-deleted
  rows = (rows||[]).filter(u=> !u?.deleted && (u?.is_active !== false));
  return rows;
}
export async function audit(action, details){
  try {
    const sess = getSession();
    const imp = getImpersonation();
    await apiJson('POST','tables/audit_logs', {
      action,
      details: { ...(details||{}), impersonating: imp? { id: imp.id, email: imp.email, role: imp.role } : null },
      target_table: 'activities',
      target_id: details?.target_id || '*',
      actor_id: sess?.id||'',
      actor_email: sess?.email||'',
      timestamp: Date.now()
    });
  } catch {}
}

// ===== Activities API wrappers =====
export async function createActivity(payload){
  // Apply impersonation overlay for admins
  try {
    const imp = getImpersonation();
    if (imp && isAdmin()){
      payload = { ...payload, userId: imp.id, userName: imp.name||imp.email||'User', role: (imp.role||payload.role||'ae').toLowerCase(), _impersonated: true };
    }
  } catch{}

  // Try live POST first; on failure, fall back to local persistence so UI updates immediately
  try {
    const res = await apiJson('POST','tables/activities', payload, 7);
    const saved = { ...(res||{}), ...payload };
    if (!saved.id) saved.id = res?.id || ('temp:'+Date.now().toString(36));
    try { const cache = JSON.parse(localStorage.getItem('activities')||'[]'); cache.push(saved); localStorage.setItem('activities', JSON.stringify(cache)); } catch {}
    try { console.log('[activities] created', saved.id); } catch {}
    // Invalidate caches so dashboards re-fetch fresh data
    try { localStorage.removeItem('activities?limit=2000'); localStorage.removeItem('/tables/activities?limit=2000'); localStorage.removeItem('tables/activities?limit=2000'); } catch{}
    broadcastSync('ascm_activities_updated');
    try { if (window._ascmChan) window._ascmChan.postMessage({ type:'activities_updated', at: Date.now(), userId: saved.userId || saved.user_id }); } catch{}
    try { await audit('activity_create', { target_id: saved.id, week: saved.week, role: saved.role, impersonated: !!saved._impersonated }); } catch {}
    return saved;
  } catch (postErr){
    const localRec = { id: 'local:'+Date.now().toString(36), ...payload, _local:true };
    try { addLocalActivity(localRec); const cache = JSON.parse(localStorage.getItem('activities')||'[]'); cache.push(localRec); localStorage.setItem('activities', JSON.stringify(cache)); } catch{}
    try { showToast('Saved locally (network blocked). Will sync when available.', 'info'); } catch{}
    // Mark caches stale
    try { localStorage.removeItem('activities?limit=2000'); localStorage.removeItem('/tables/activities?limit=2000'); localStorage.removeItem('tables/activities?limit=2000'); } catch{}
    broadcastSync('ascm_activities_updated');
    try { if (window._ascmChan) window._ascmChan.postMessage({ type:'activities_updated', at: Date.now(), userId: localRec.userId || localRec.user_id, local:true }); } catch{}
    try { await audit('activity_create_local', { week: payload?.week, role: payload?.role, reason: String(postErr) }); } catch {}
    return localRec;
  }
}

export async function listActivities(limit=1000){
  try {
    const res = await apiJson('GET', `tables/activities?limit=${limit}`);
    let rows = res.data||[];
    try { const local = loadLocalActivities(); if (Array.isArray(local) && local.length) rows = rows.concat(local); } catch {}
    try { localStorage.setItem('activities', JSON.stringify(rows)); } catch {}
    return { ...res, data: rows, total: rows.length };
  } catch(e){
    let cached=[]; try { cached = JSON.parse(localStorage.getItem('activities')||'[]'); } catch {}
    let local=[]; try { local = loadLocalActivities(); } catch {}
    const rows = (cached||[]).concat(local||[]);
    return { data: rows, total: rows.length, page: 1, limit: rows.length, table: 'activities', schema: {} };
  }
}

export async function listUserWeekActivities(userId, week){
  const data = await listActivities(1000);
  const items = (data.data||[]).filter(a => (a.userId === userId || a.user_id===userId) && a.week === week);
  return items;
}

export async function deleteRecord(id){
  const idStr = String(id||'');
  // Resolve affected record from caches to scope broadcast by userId
  let affected = null;
  try {
    const cache = JSON.parse(localStorage.getItem('activities')||'[]') || [];
    affected = cache.find(x=> String(x.id)===idStr) || null;
    if (!affected){
      const local = JSON.parse(localStorage.getItem('activities_local')||'[]')||[];
      affected = local.find(x=> String(x.id)===idStr) || null;
    }
  } catch {}

  if (idStr.startsWith('local:') || idStr.startsWith('temp:')){
    // Local-only removal
    try { removeLocalActivity(idStr); } catch {}
    try {
      const cache = (JSON.parse(localStorage.getItem('activities')||'[]')||[]).filter(x=> String(x.id)!==idStr);
      localStorage.setItem('activities', JSON.stringify(cache));
    } catch {}
    // Invalidate caches
    try { localStorage.removeItem('activities?limit=2000'); localStorage.removeItem('/tables/activities?limit=2000'); localStorage.removeItem('tables/activities?limit=2000'); } catch{}
    broadcastSync('ascm_activities_updated');
    try { if (window._ascmChan) window._ascmChan.postMessage({ type:'activities_updated', at: Date.now(), userId: affected?.userId || affected?.user_id || null }); } catch{}
    try { await audit('activity_delete_local', { target_id: idStr, user_id: affected?.userId || affected?.user_id || '' }); } catch {}
    return;
  }
  try { await apiJson('DELETE', `tables/activities/${idStr}`); } catch(e) { /* ignore network errors for delete */ }
  try {
    const cache = (JSON.parse(localStorage.getItem('activities')||'[]')||[]).filter(x=> String(x.id)!==idStr);
    localStorage.setItem('activities', JSON.stringify(cache));
  } catch {}
  try { removeLocalActivity(idStr); } catch {}
  try { console.log('[activities] deleted', idStr); } catch {}
  try { localStorage.removeItem('activities?limit=2000'); localStorage.removeItem('/tables/activities?limit=2000'); localStorage.removeItem('tables/activities?limit=2000'); } catch{}
  broadcastSync('ascm_activities_updated');
  try { if (window._ascmChan) window._ascmChan.postMessage({ type:'activities_updated', at: Date.now(), userId: affected?.userId || affected?.user_id || null }); } catch{}
  try { await audit('activity_delete', { target_id: idStr, user_id: affected?.userId || affected?.user_id || '' }); } catch {}
}

// ===== Numeric helpers =====
export function sanitizeNumber(val){
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function sumMetrics(records, keys){
  const totals = Object.fromEntries(keys.map(k => [k,0]));
  for (const r of records) {
    for (const k of keys) totals[k] += sanitizeNumber(r[k]);
  }
  return totals;
}
