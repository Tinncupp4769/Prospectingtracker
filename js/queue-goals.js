// Goals Async Save Queue with exponential backoff and persistent per-item status
// Client-only module for static SPA. No external deps.
// Responsibility:
// - Store queued goal writes in localStorage
// - Retry with exponential backoff on 401/403/5xx or HTML responses (WAF)
// - Auto-recover roughly every 15s
// - Broadcast status via localStorage event and BroadcastChannel('ascm_sync')
// - Provide subscribe() for UIs to reflect per-item status summaries

export const GoalsQueue = (function(){
  const STORAGE_KEY = 'goals_async_queue_v2';
  const STORAGE_SUMMARY_KEY = 'goals_async_queue_summary';
  const CHANNEL = 'ascm_sync';
  const TABLE_PATH = 'tables/goals';
  const MAX_ATTEMPTS = 8; // 1,2,4,8,16,32,64,128 sec (cap applies)
  const BASE_DELAY = 1000; // 1s base
  const MAX_DELAY = 5 * 60 * 1000; // 5 minutes cap
  const TICK_MS = 15000; // background scheduler cadence

  // Detect API base (tables/ vs /tables/)
  let API_BASE = 'tables/';
  const CANDIDATES = ['tables/','/tables/'];
  async function resolveApiBase(){
    for (const b of CANDIDATES){
      try {
        const r = await fetch(`${b}goals?limit=1`, { cache:'no-store', credentials:'same-origin' });
        const ct = (r.headers.get('content-type')||'').toLowerCase();
        if (r.ok && ct.includes('application/json')) { API_BASE = b; break; }
      } catch {}
    }
  }
  function npath(p){
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('tables/')) return API_BASE + p.slice('tables/'.length);
    if (p.startsWith('/tables/')) return API_BASE + p.slice('/tables/'.length);
    return p;
  }

  function looksLikeHtml(res){ const ct=(res.headers?.get?.('content-type')||'').toLowerCase(); return ct.includes('text/html'); }
  const sleep = (ms)=> new Promise(r=>setTimeout(r, ms));

  function now(){ return Date.now(); }
  function jitter(ms){ return Math.floor(ms * (0.85 + Math.random()*0.30)); }
  function computeNextDelay(attempt){
    const d = Math.min(MAX_DELAY, BASE_DELAY * Math.pow(2, Math.max(0, attempt-1)));
    return jitter(d);
  }

  function readQueue(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } }
  function writeQueue(list){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); publishSummary(list); } catch {} }

  function summarize(list){
    const s = { queued:0, retrying:0, success:0, failed:0, total: list.length, nextDue: null };
    for (const it of list){
      s[it.status] = (s[it.status]||0) + 1;
      if ((it.status==='queued' || it.status==='retrying') && typeof it.nextAttemptAt==='number'){
        if (s.nextDue==null || it.nextAttemptAt < s.nextDue) s.nextDue = it.nextAttemptAt;
      }
    }
    return s;
  }
  function publishSummary(list){
    const s = summarize(list);
    try { localStorage.setItem(STORAGE_SUMMARY_KEY, JSON.stringify({ ...s, ts: now() })); } catch {}
    try { if (!window._ascmChan) window._ascmChan = new BroadcastChannel(CHANNEL); window._ascmChan.postMessage({ type:'goals_queue_update', summary: s, at: now() }); } catch {}
  }

  function sanitizePayload(p){
    const out = { ...p };
    out.period = (out.period==='week' ? 'week' : 'month');
    out.role = String(out.role||'').toLowerCase()==='am' ? 'am' : 'ae';
    out.metric = String(out.metric||'').trim();
    out.target = Number(out.target||0) || 0;
    out.weeks = Math.max(1, Number(out.weeks||4));
    if (out.userId == null) delete out.userId; // prefer omitting null userId
    // Only keep allowed keys
    const allowed = new Set(['metric','period','target','role','month','weeks','userId']);
    for (const k of Object.keys(out)){ if(!allowed.has(k)) delete out[k]; }
    return out;
  }

  function newItem(payload){
    const p = sanitizePayload(payload||{});
    const id = 'gq_' + Math.random().toString(36).slice(2) + '_' + now().toString(36);
    return { id, payload: p, status: 'queued', attempts: 0, lastError: '', nextAttemptAt: 0, createdAt: now(), updatedAt: now() };
  }

  function enqueueBatch(payloads){
    if (!Array.isArray(payloads) || payloads.length===0) return { total:0 };
    const list = readQueue();
    const items = payloads.map(newItem);
    list.push(...items);
    writeQueue(list);
    return { total: items.length };
  }

  async function apiRequest(method, path, body, tries=2){
    let lastText = '';
    for (let i=0;i<tries;i++){
      const res = await fetch(npath(path), { method, headers:{'Content-Type':'application/json'}, body: body!=null?JSON.stringify(body):undefined, cache:'no-store', credentials:'same-origin' });
      if (res.status===401 || res.status===403 || looksLikeHtml(res)){
        try { lastText = await res.text(); } catch{}
        // warm-up GET then short pause
        try { await fetch(npath('tables/goals?limit=1'), { cache:'no-store', credentials:'same-origin' }); } catch{}
        await sleep(1000);
        continue;
      }
      return res;
    }
    throw new Error('API blocked '+ lastText.slice(0,140));
  }

  async function tryPost(payload){
    // First attempt with full payload; if it fails, try minimal schema subset
    try {
      const r = await apiRequest('POST', TABLE_PATH, payload, 2);
      if (!r.ok){ let t=''; try{t=await r.text();}catch{}; throw new Error(`${r.status} ${t.slice(0,160)}`); }
      return true;
    } catch (e1){
      try {
        const minimal = sanitizePayload({ metric: payload.metric, period: payload.period, target: payload.target, role: payload.role, month: payload.month, weeks: payload.weeks });
        const r2 = await apiRequest('POST', TABLE_PATH, minimal, 2);
        if (!r2.ok){ let t=''; try{t=await r2.text();}catch{}; throw new Error(`${r2.status} ${t.slice(0,160)}`); }
        return true;
      } catch(e2){ throw (e2||e1); }
    }
  }

  async function processDue(){
    const list = readQueue(); if (!list.length) return;
    let changed = false; const nowTs = now();
    for (const it of list){
      if (it.status==='success' || it.status==='failed') continue;
      if ((it.status==='queued' && it.nextAttemptAt<=nowTs) || (it.status==='retrying' && it.nextAttemptAt<=nowTs)){
        try {
          it.status = 'retrying'; it.updatedAt = now(); changed = true;
          await resolveApiBase();
          await tryPost(it.payload);
          it.status = 'success'; it.updatedAt = now(); changed = true;
          // Broadcast successful goals update to other tabs
          try { localStorage.setItem('ascm_goals_updated', String(now())); } catch {}
          try { if (!window._ascmChan) window._ascmChan = new BroadcastChannel(CHANNEL); window._ascmChan.postMessage({ type:'goals_updated', at: now() }); } catch {}
        } catch(err){
          it.attempts = (it.attempts||0) + 1; it.lastError = String(err?.message||err||'error'); it.updatedAt = now();
          if (it.attempts >= MAX_ATTEMPTS){ it.status = 'failed'; changed = true; }
          else { it.status = 'retrying'; it.nextAttemptAt = now() + computeNextDelay(it.attempts); changed = true; }
        }
      }
    }
    if (changed) writeQueue(list); else publishSummary(list);
  }

  function list(){ return readQueue(); }
  function getSummary(){ return summarize(readQueue()); }

  // Subscribe to changes (storage + BroadcastChannel summary)
  const subscribers = new Set();
  function notifySubs(){ const s = getSummary(); subscribers.forEach(cb => { try { cb(s); } catch{} }); }
  function subscribe(cb){ if (typeof cb==='function'){ subscribers.add(cb); cb(getSummary()); } return ()=> subscribers.delete(cb); }

  // Storage and channel listeners to keep subscribers updated across tabs
  try { window.addEventListener('storage', (e)=>{ if (e.key===STORAGE_KEY || e.key===STORAGE_SUMMARY_KEY){ notifySubs(); } }); } catch{}
  try { if (!window._ascmChan) window._ascmChan = new BroadcastChannel(CHANNEL); window._ascmChan.onmessage = (e)=>{ if (e?.data?.type==='goals_queue_update') notifySubs(); }; } catch{}

  // Background scheduler (~15s) for auto-recovery
  (function start(){ try { if (!window._goalsQueueTimer){ window._goalsQueueTimer = setInterval(processDue, TICK_MS); } } catch{} })();

  // Public API
  return {
    enqueueBatch,
    processNow: processDue,
    list,
    getSummary,
    subscribe,
    kick(){ processDue(); },
  };
})();
