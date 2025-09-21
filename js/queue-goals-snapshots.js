(function(global){
  // Goals Snapshots Async Publish Queue (client-only)
  // - Persists queued snapshot payloads in localStorage
  // - Exponential backoff with jitter
  // - WAF/HTML/401/403 detection + warm-up GET + retries
  // - Path normalization for tables/ vs /tables/
  // - Cross-tab summary via localStorage + BroadcastChannel('ascm_sync')

  const STORAGE_KEY = 'goals_snapshot_queue_v1';
  const STORAGE_SUMMARY_KEY = 'goals_snapshot_queue_summary';
  const CHANNEL = 'ascm_sync';
  const TABLE_PATH = 'tables/goals_snapshots';
  const MAX_ATTEMPTS = 8; // ~1s -> 2m gradual backoff (capped below)
  const BASE_DELAY = 1000; // 1s base
  const MAX_DELAY = 5 * 60 * 1000; // 5 minutes cap
  const TICK_MS = 15000; // scheduler cadence ~15s

  // API base detection
  let API_BASE = 'tables/';
  const CANDIDATES = ['tables/','/tables/'];
  async function resolveApiBase(){
    for (const b of CANDIDATES){
      try {
        const r = await fetch(`${b}users?limit=1`, { cache:'no-store', credentials:'same-origin' });
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
  function nextDelay(attempt){ return Math.min(MAX_DELAY, BASE_DELAY * Math.pow(2, Math.max(0, attempt-1))); }

  function readQueue(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; } }
  function writeQueue(list){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); publishSummary(list); } catch {} }

  function summarize(list){
    const s = { queued:0, retrying:0, success:0, failed:0, total:list.length, nextDue:null };
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
    try { if (!global._ascmChan) global._ascmChan = new BroadcastChannel(CHANNEL); global._ascmChan.postMessage({ type:'goals_queue_update', summary:s, at: now() }); } catch {}
  }

  function sanitizeSnapshotPayload(p){
    const out = { ...p };
    // Keep only fields used by tables/goals_snapshots
    const allowed = new Set(['month','weeks','values','userId','updated_at']);
    // month YYYY-MM, weeks integer 1..6, values object of metric -> {ae,am}
    out.month = String(out.month||'').slice(0,7);
    out.weeks = Math.max(1, Math.min(6, Number(out.weeks||4)));
    if (out.userId == null) delete out.userId; // omit nulls
    if (typeof out.updated_at !== 'number') out.updated_at = now();
    for (const k of Object.keys(out)){ if (!allowed.has(k)) delete out[k]; }
    return out;
  }

  function newItem(payload){
    const p = sanitizeSnapshotPayload(payload||{});
    const id = 'gsq_' + Math.random().toString(36).slice(2) + '_' + now().toString(36);
    return { id, payload:p, status:'queued', attempts:0, lastError:'', nextAttemptAt:0, createdAt: now(), updatedAt: now() };
  }

  function enqueue(payload){
    const list = readQueue();
    const item = newItem(payload);
    list.push(item);
    writeQueue(list);
    schedule();
    return { id:item.id };
  }

  async function apiRequest(method, path, body, tries=2){
    let lastText='';
    for (let i=0;i<tries;i++){
      const url = npath(path) + (path.includes('?')?'&':'?') + `cb=${Date.now()}_${i}`;
      try{
        const ctrl = new AbortController();
        const t = setTimeout(()=> ctrl.abort(), 15000 + i*1000);
        const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: body!=null?JSON.stringify(body):undefined, cache:'no-store', credentials:'same-origin', signal: ctrl.signal });
        clearTimeout(t);
        if (res.status===401 || res.status===403 || looksLikeHtml(res)){
          try { lastText = await res.text(); } catch {}
          // Warm-up GET then short pause
          try { const wu = npath('tables/users?limit=1'); await fetch(wu + (wu.includes('?')?'&':'?') + `cb=${Date.now()}`, { cache:'no-store', credentials:'same-origin' }); } catch {}
          await sleep(800*(i+1));
          continue;
        }
        return res;
      }catch(e){ lastText = String(e?.message||e); await sleep(600*(i+1) + Math.floor(Math.random()*200)); }
    }
    throw new Error('API blocked '+ lastText.slice(0,180));
  }

  async function tryPostSnapshot(payload){
    const r = await apiRequest('POST', TABLE_PATH, payload, 2);
    if (!r.ok){ let t=''; try{t=await r.text();}catch{}; throw new Error(`${r.status} ${t.slice(0,160)}`); }
    return true;
  }

  async function processDue(){
    const list = readQueue(); if (!list.length) return;
    let changed=false; const nowTs=now();
    for (const it of list){
      if (it.status==='success' || it.status==='failed') continue;
      if ((it.status==='queued' && it.nextAttemptAt<=nowTs) || (it.status==='retrying' && it.nextAttemptAt<=nowTs)){
        try{
          it.status='retrying'; it.updatedAt=now(); changed=true;
          await resolveApiBase();
          await tryPostSnapshot(it.payload);
          it.status='success'; it.updatedAt=now(); changed=true;
          // Cross-tab notify so dashboards switch to Live snapshot
          try { localStorage.setItem('ascm_goals_updated', String(now())); } catch {}
          try { if (!global._ascmChan) global._ascmChan = new BroadcastChannel(CHANNEL); global._ascmChan.postMessage({ type:'goals_updated', at: now() }); } catch {}
        }catch(err){
          it.attempts=(it.attempts||0)+1; it.lastError=String(err?.message||err||'error'); it.updatedAt=now();
          if (it.attempts>=MAX_ATTEMPTS){ it.status='failed'; changed=true; }
          else { it.status='retrying'; it.nextAttemptAt = now() + jitter(nextDelay(it.attempts)); changed=true; }
        }
      }
    }
    if (changed) writeQueue(list); else publishSummary(list);
  }

  // Public API
  let timer=null;
  function schedule(){ if (timer) return; try{ timer=setInterval(processDue, TICK_MS); }catch{} processDue(); }
  function kick(){ processDue(); }
  function list(){ return readQueue(); }
  function getSummary(){ return summarize(readQueue()); }

  const subs = new Set();
  function notifySubs(){ const s=getSummary(); subs.forEach(cb=>{ try{ cb(s); }catch{} }); }
  function subscribe(cb){ if (typeof cb==='function'){ subs.add(cb); try{ cb(getSummary()); }catch{} } return ()=> subs.delete(cb); }

  try { window.addEventListener('storage', (e)=>{ if (e.key===STORAGE_KEY || e.key===STORAGE_SUMMARY_KEY) notifySubs(); }); } catch{}
  try { if (!global._ascmChan) global._ascmChan = new BroadcastChannel(CHANNEL); const prev = global._ascmChan.onmessage; global._ascmChan.onmessage = (ev)=>{ if (ev?.data?.type==='goals_queue_update') notifySubs(); if (typeof prev==='function') prev(ev); }; } catch{}

  global.GoalsSnapshotQueue = { enqueue, kick, list, getSummary, subscribe, schedule };
})(window);
