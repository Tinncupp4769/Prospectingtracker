// salesDashboard.js — Modular sales prospecting dashboard
// Uses minimal libs (Chart.js via CDN), resilient fetch, localStorage cache, and BroadcastChannel sync

// ================= Config & Helpers =================
const API = {
  BASE_CANDIDATES: ['tables/', '/tables/'],
  base: 'tables/',
  endpoints: {
    activities: 'activities',
    goals: 'goals',
    users: 'users',
    kpiSummary: 'kpi-summary', // optional microservice; fallback to local compute if unavailable
  },
  retryCount: 3,
};

function looksLikeHtml(res) { const ct = (res.headers.get('content-type')||'').toLowerCase(); return ct.includes('text/html'); }
async function resolveApiBase() {
  for (const b of API.BASE_CANDIDATES) {
    try {
      const r = await fetch(`${b}${API.endpoints.users}?limit=1`, { cache:'no-store', credentials:'same-origin' });
      const ct = (r.headers.get('content-type')||'').toLowerCase();
      if (r.ok && ct.includes('application/json')) { API.base = b; break; }
    } catch {}
  }
}
function np(path) {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('tables/')) return API.base + path.slice(7);
  if (path.startsWith('/tables/')) return API.base + path.slice(8);
  return API.base + path;
}
function setApiStatus(mode) {
  const el = document.getElementById('apiStatus'); if (!el) return;
  const base = 'px-2 py-1 text-xs rounded border ';
  if (mode === 'live') { el.className = base + 'bg-emerald-50 border-emerald-200 text-emerald-700'; el.textContent = 'Live'; }
  else if (mode === 'cached') { el.className = base + 'bg-blue-50 border-blue-200 text-blue-700'; el.textContent = 'Cached'; }
  else if (mode === 'offline') { el.className = base + 'bg-red-50 border-red-200 text-red-700'; el.textContent = 'Offline'; }
  else { el.className = base + 'bg-slate-100 border-slate-200 text-slate-600'; el.textContent = 'Checking…'; }
}
function setTopStatus(text) {
  const el = document.getElementById('statusChip'); if (el) el.textContent = text;
  const sync = document.getElementById('syncChip'); if (sync) { const ts=new Date(); sync.textContent = 'Last updated ' + ts.toLocaleTimeString(); sync.title = ts.toLocaleString(); }
}

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// Resilient fetch with retries, warm-up on WAF/HTML, and cache fallback
async function fetchWithRetry(path, retries = API.retryCount) {
  const attempt = API.retryCount - retries + 1;
  const url = np(path + (path.includes('?') ? '&' : '?') + 'cb=' + Date.now());
  try {
    const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (res.status === 401 || res.status === 403 || looksLikeHtml(res)) {
      // Warm up then retry with exponential backoff
      try { await fetch(np(`${API.endpoints.activities}?limit=1&cb=${Date.now()}`), { cache:'no-store', credentials:'same-origin' }); } catch {}
      if (retries > 0) {
        const backoff = Math.min(4000, 300 * Math.pow(2, attempt));
        await sleep(backoff);
        return fetchWithRetry(path, retries - 1);
      }
      const cached = localStorage.getItem(path); if (cached) { setApiStatus('cached'); return JSON.parse(cached); }
      throw new Error('Blocked by WAF/HTML');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('Invalid JSON response');
    const json = await res.json();
    try { localStorage.setItem(path, JSON.stringify(json)); } catch {}
    setApiStatus('live');
    return json;
  } catch (err) {
    if (retries > 0) {
      const backoff = Math.min(4000, 300 * Math.pow(2, attempt));
      await sleep(backoff);
      return await fetchWithRetry(path, retries - 1);
    }
    const cached = localStorage.getItem(path);
    if (cached) { setApiStatus('cached'); return JSON.parse(cached); }
    setApiStatus('offline');
    throw err;
  }
}

// Lightweight toast
function showToast(msg, type='info'){
  let el=document.getElementById('ascm_toast');
  if(!el){ el=document.createElement('div'); el.id='ascm_toast'; el.className='ascm-toast info'; document.body.appendChild(el); }
  el.classList.remove('success','error','info'); el.classList.add(type||'info');
  el.textContent=String(msg||''); el.classList.add('show');
  clearTimeout(showToast._t); showToast._t=setTimeout(()=> el.classList.remove('show'), 1800);
}

// Debounced refresh to avoid overlaps (global)
function scheduleRefresh(immediate=false){
  clearTimeout(window._ascmRefreshDebounce);
  if (immediate){ return refreshAll(); }
  window._ascmRefreshDebounce = setTimeout(()=>{ refreshAll(); }, 220);
}

// ================= State =================
const state = {
  role: 'ae',                 // 'ae' or 'admin'
  userId: null,               // active user
  period: 'week',             // 'week' | 'month' | '7days' | 'all'
  activities: [],             // loaded activities (scoped)
  goals: {},                  // metric -> { week, month, weeks }
  kpiSummary: null,           // optional snapshot from /kpi-summary
  users: [],                  // admin selector
  memo: { compute:{}, trend:{} },
};

function getSession(){ try { return JSON.parse(localStorage.getItem('ascm_session')||'null'); } catch { return null; } }
function getImpersonation(){ try { return JSON.parse(localStorage.getItem('ascm_impersonate')||'null'); } catch { return null; } }
function getActiveRole(){
  try {
    const imp = getImpersonation(); if (imp && imp.role) return String(imp.role).toLowerCase();
    const sess = getSession(); const r = String(sess?.role||'ae').toLowerCase();
    if (r === 'admin') return 'ae';
    return r === 'am' ? 'am' : 'ae';
  } catch { return 'ae'; }
}

// ================= Data Loading =================
async function loadUsers(){
  let rows = [];
  try {
    const j = await fetchWithRetry(`${API.endpoints.users}?limit=1000`);
    rows = j.data || [];
  } catch (e) {
    // Fallbacks: cached users from various modules and local users
  }
  try {
    if (!Array.isArray(rows) || rows.length===0){
      const cached = JSON.parse(localStorage.getItem('users')||'[]');
      if (Array.isArray(cached) && cached.length) rows = cached;
    }
  } catch {}
  try {
    if (!Array.isArray(rows) || rows.length===0){
      const um = JSON.parse(localStorage.getItem('um_users')||'[]');
      if (Array.isArray(um) && um.length) rows = um;
    }
  } catch {}
  try {
    if (!Array.isArray(rows) || rows.length===0){
      const locals = JSON.parse(localStorage.getItem('ascm_local_users')||'[]');
      if (Array.isArray(locals) && locals.length) rows = locals;
    }
  } catch {}
  // Final fallback: include current session user if nothing else
  try {
    if (!Array.isArray(rows) || rows.length===0){
      const sess = getSession(); if (sess) rows = [{ id:sess.id, name:sess.name||sess.email||sess.id, email:sess.email, role:sess.role, is_active:true }];
    }
  } catch {}
  // Normalize and filter active
  rows = (rows||[]).filter(u=> !u?.deleted && (u?.is_active !== false) && (u?.id));
  rows = rows.map(u=> ({ id: u.id, name: u.name || u.email || String(u.id).slice(0,8), email: u.email || '', role: (u.role||'ae').toLowerCase(), is_active: (u.is_active!==false) }));
  // Sort by name/email for a nicer selector
  rows.sort((a,b)=> String(a.name||a.email||'').localeCompare(String(b.name||b.email||'')));
  state.users = rows;
  try { localStorage.setItem('users', JSON.stringify(rows)); } catch {}
}

async function loadGoals(){
  const ym = new Date().toISOString().slice(0,7);
  const activeRole = getActiveRole();
  try {
    // Snapshot-first: single compact doc with per-metric weekly values for AE/AM
    try {
      const snap = await fetchWithRetry(`goals_snapshots?limit=1&search=${encodeURIComponent(ym)}`);
      const row = (snap.data||[]).find(x=> !x.deleted && x.month===ym && !x.userId);
      if (row && row.values){
        const weeks = Math.max(1, Number(row.weeks||4));
        const map = {};
        Object.entries(row.values||{}).forEach(([metric, ob])=>{
          const w = Number((activeRole==='am' ? ob?.am : ob?.ae) || 0);
          map[metric] = { month:{global: Math.round(w*weeks) }, week:{global: w}, weeks };
        });
        state.goals = map;
        return;
      }
    } catch {}
    // Fallback: legacy tables/goals rows
    const j = await fetchWithRetry(`${API.endpoints.goals}?limit=1000`);
    const rows = (j.data||[]).filter(g=> !g.deleted && (!g.month || g.month===ym) && !g.userId && (String(g.role||activeRole).toLowerCase()===activeRole));
    const map = {};
    rows.forEach(g=>{
      const k = String(g.metric||''); if(!k) return;
      const per = (g.period||'month');
      map[k] = map[k] || { month:{global:null}, week:{global:null}, weeks: g.weeks||4 };
      const slot = map[k][per]; const val = Number(g.target||0)||0; if (slot.global==null) slot.global=val;
      if (g.weeks) map[k].weeks = g.weeks;
    });
    Object.values(map).forEach(v=>{ const w=Math.max(1,Number(v.weeks||4)); if(v.month.global==null && v.week.global!=null) v.month.global=Math.round(v.week.global*w); if(v.week.global==null && v.month.global!=null) v.week.global=Math.round(v.month.global/w); });
    state.goals = map;
  } catch (e) {
    // Cache fallback per role+month (seeded by goals-portal Save Draft/Publish)
    try {
      const cache = JSON.parse(localStorage.getItem(`goals_cache_role_${activeRole}_${ym}`)||'null');
      if (cache && cache.values){
        const weeks = Math.max(1, Number(cache.weeks||4));
        const map = {};
        Object.entries(cache.values||{}).forEach(([metric, vals])=>{
          const w = Number(vals?.week||0);
          map[metric] = { month:{global: Math.round((vals?.month!=null? Number(vals.month): Math.round(w*weeks))||0) }, week:{global: w}, weeks };
        });
        state.goals = map; return;
      }
    } catch {}
    try { state.goals = JSON.parse(localStorage.getItem('goals_cache')||'{}'); } catch { state.goals = {}; }
  }
}

async function loadActivities(){
  const sess = getSession();
  let uid = sess?.id || null;
  if ((sess?.role||'').toLowerCase()==='admin'){
    const imp = getImpersonation();
    if (imp?.id) uid = imp.id; // admin impersonation
  }
  state.userId = uid;
  const role = getActiveRole();
  try {
    const j = await fetchWithRetry(`${API.endpoints.activities}?limit=2000`);
    const all = j.data || [];
    state.activities = all.filter(a => (a.userId===uid || a.user_id===uid) && String((a.role||role)).toLowerCase()===role);
  } catch (e) {
    let all = [];
    try {
      const raw = localStorage.getItem(API.endpoints.activities);
      if (raw){
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) all = parsed; // plain array cache (activity-utils)
        else if (parsed && Array.isArray(parsed.data)) all = parsed.data; // wrapped {data:[]}
      }
    } catch {}
    try {
      const local = JSON.parse(localStorage.getItem('activities_local')||'[]');
      if (Array.isArray(local) && local.length) all = all.concat(local);
    } catch {}
    state.activities = all.filter(a => (a.userId===uid || a.user_id===uid) && String((a.role||role)).toLowerCase()===role);
  }
}

async function loadKpiSummary(){
  // Try optional backend microservice without forcing tables/ prefix
  try {
    const sess = getSession();
    const imp = getImpersonation();
    const uid = imp?.id || sess?.id || '';
    const role = (imp?.role || sess?.role || 'ae').toLowerCase();
    const candidates = [`/kpi-summary?userId=${encodeURIComponent(uid)}&role=${role}`, `kpi-summary?userId=${encodeURIComponent(uid)}&role=${role}`];
    for (const url of candidates){
      try {
        const res = await fetch(url + `&cb=${Date.now()}`, { cache:'no-store', credentials:'same-origin' });
        const ct = (res.headers.get('content-type')||'').toLowerCase();
        if (res.ok && ct.includes('application/json')){
          const j = await res.json();
          if (j && j.current && j.previous){ state.kpiSummary = j; setApiStatus('live'); return; }
        }
      } catch {}
    }
    state.kpiSummary = null;
  } catch { state.kpiSummary = null; }
}

// ================= KPI Compute =================
function filterRanges(){
  const now=new Date(); let start, prevStart; const p=state.period; if(p==='week'){ start=startOfWeek(now); prevStart=new Date(start); prevStart.setDate(prevStart.getDate()-7);} else if(p==='month'){ start=startOfMonth(now); prevStart=new Date(start); prevStart.setMonth(prevStart.getMonth()-1);} else if(p==='7days'){ start=new Date(now); start.setDate(start.getDate()-6); start.setHours(0,0,0,0); prevStart=new Date(start); prevStart.setDate(prevStart.getDate()-7);} else { start=new Date(0); prevStart=new Date(0);} const prevEnd=new Date(start); prevEnd.setMilliseconds(prevEnd.getMilliseconds()-1); return {now,start,prevStart,prevEnd};
}
function startOfWeek(d){ const x=new Date(d); const day=(x.getDay()||7); x.setHours(0,0,0,0); x.setDate(x.getDate()-day+1); return x; }
function startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function sumMetric(rows,key,from,to){ return rows.reduce((s,r)=>{ const t=new Date(r.date||r.createdAt||Date.now()); if(t>=from&&t<=to) s+=Number(r[key]||0); return s; },0); }

function computeFromActivities(){
  const {now,start,prevStart,prevEnd} = filterRanges();
  const keys=['accountsTargeted','callsMade','emailsSent','linkedinMessages','vidyardVideos','abmCampaigns','meetingsBooked','successfulContacts','meetingsConducted','opportunitiesGenerated','referralsGenerated','pipelineGenerated','revenueClosed','generalAbmCampaigns','crossSellAbmCampaigns','upSellAbmCampaigns','dormantAbmCampaigns'];
  const sig = datasetSignature();
  const memoKey = `${sig}|${state.period}`;
  if (state.memo.compute[memoKey]) return state.memo.compute[memoKey];
  const current={}, previous={};
  // Use de-duplicated dataset to avoid double counting
  const dedup = dedupeActivities(state.activities);
  keys.forEach(k=>{ current[k]=sumMetric(dedup,k,start,now); previous[k]=sumMetric(dedup,k,prevStart,prevEnd); });
  const out = { current, previous };
  state.memo.compute[memoKey] = out;
  return out;
}

function getGoalFor(metric){
  const g=state.goals[metric]; if(!g) return 0;
  const per=(state.period==='week'||state.period==='7days')?'week':'month';
  return Number(g[per]?.global||0);
}

function buildViewModel(){
  // Use snapshot if present; otherwise compute from activities
  const snap = state.kpiSummary; // should mirror structure if provided
  let cur={}, prev={};
  if (snap && snap.current && snap.previous){ cur=snap.current; prev=snap.previous; }
  else { const c = computeFromActivities(); cur=c.current; prev=c.previous; }

  function pct(a,b){ if(!b) return 0; return Math.min(100, Math.max(0, (a/b)*100)); }
  function cfg(){ const role = getActiveRole(); return (window.METRICS_CATALOG||{ae:{},am:{}})[role] || {}; }
  const catalog = cfg();
  const vm = { groups: { Activities:[], Results:[], Financials:[], ABM:[] } };
  [['Activities','Activities'],['Results','Results'],['Financials','Financials'],['ABM','ABM']].forEach(([key,label])=>{
    const list = (catalog[key]||[]);
    list.forEach(([metric, mlabel, icon])=>{
      const current = Number(cur[metric]||0); const previous = Number(prev[metric]||0); const goal = getGoalFor(metric);
      const trend = (previous>0) ? Math.round(((current-previous)/previous)*100) : (current>0?100:0);
      const attainment = pct(current, goal);
      vm.groups[key].push({ key:metric, label:mlabel, icon: icon||'fa-solid fa-chart-simple', current, previous, goal, trend, attainment, money: (metric==='pipelineGenerated'||metric==='revenueClosed') });
    });
  });
  return vm;
}

// ================= Gamification & Heatmap (with WebGL detection and 2D fallback) =================
function sumActivityOnly(rows, from, to){
  const keys=['accountsTargeted','callsMade','emailsSent','linkedinMessages','vidyardVideos','generalAbmCampaigns','crossSellAbmCampaigns','upSellAbmCampaigns','dormantAbmCampaigns'];
  return rows.reduce((s,r)=>{
    const t=new Date(r.date||r.createdAt||Date.now());
    if (t>=from && t<=to){ s += keys.reduce((a,k)=> a + (Number(r[k]||0)||0), 0); }
    return s;
  },0);
}
function weeklyGoalSum(){ try{ const vals=Object.values(state.goals||{}); return vals.reduce((a,g)=> a + (Number(g?.week?.global||0)||0), 0); }catch{ return 0; } }
function updateGamify(){
  try {
    const bar=document.getElementById('progressBar'); const label=document.getElementById('progressLabel'); const badgeRow=document.getElementById('badgeRow'); if(!bar||!label||!badgeRow) return;
    const now=new Date(); let start; if (state.period==='week'||state.period==='7days'){ start = startOfWeek(now); } else if (state.period==='month'){ start = startOfMonth(now);} else { start = new Date(0); }
    const dedup = dedupeActivities(state.activities);
    const totalA = sumActivityOnly(dedup, start, now);
    const goal = (state.period==='week'||state.period==='7days') ? weeklyGoalSum() : Math.round(weeklyGoalSum()*Math.max(1,Number(state.goals[Object.keys(state.goals)[0]]?.weeks||4)));
    const pct = Math.max(0, Math.min(100, goal>0? (totalA/goal*100) : 0));
    bar.style.width = pct.toFixed(1)+'%'; bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    label.textContent = `${Math.round(pct)}% of weekly goal (${totalA}/${goal})`;
    // Badges at 25/50/75/100
    const marks=[25,50,75,100]; badgeRow.innerHTML=''; marks.forEach(m=>{
      const got = pct>=m; const span=document.createElement('span'); span.className='px-2 py-1 text-xs rounded-full '+(got? 'bg-emerald-100 text-emerald-800 border border-emerald-200':'bg-slate-100 text-slate-600 border border-slate-200'); span.innerHTML = `<i class="fa-solid ${got?'fa-trophy':'fa-circle-dot'} mr-1"></i>${m}%`;
      badgeRow.appendChild(span);
    });
    if (pct>=100 && !updateGamify._celebrated){ try{ if (window.confetti){ window.confetti({ particleCount: 120, spread: 70, origin:{ y:0.2 } }); } }catch{} updateGamify._celebrated=true; }
  } catch{}
}

// WebGL detection + 3D/2D heatmap renderer
function detectWebGL(){
  const out={ gl2:false, gl1:false, renderer:null };
  try{
    const c=document.createElement('canvas');
    const gl2=c.getContext('webgl2',{antialias:true,depth:true,stencil:false});
    const gl1=gl2 || c.getContext('webgl',{antialias:true,depth:true,stencil:false}) || c.getContext('experimental-webgl');
    if (gl1){ out.gl1=true; out.gl2=(typeof WebGL2RenderingContext!=='undefined' && gl1 instanceof WebGL2RenderingContext); try{ const ext=gl1.getExtension('WEBGL_debug_renderer_info'); if (ext) out.renderer=gl1.getParameter(ext.UNMASKED_RENDERER_WEBGL)||''; }catch{} }
  }catch{}
  return out;
}
function setHeatStatus(mode, reason){ const el=document.getElementById('heatStatusChip'); if(!el) return; const base='px-2 py-1 text-xs rounded border '; if(mode==='3d'){ el.className=base+'bg-emerald-50 border-emerald-200 text-emerald-700'; el.textContent='3D (WebGL)'; } else if(mode==='2d'){ el.className=base+'bg-blue-50 border-blue-200 text-blue-700'; el.textContent='2D (Canvas)'; } else { el.className=base+'bg-slate-100 border-slate-200 text-slate-600'; el.textContent='Detecting…'; } if (reason) el.title=String(reason); }
function computeHeatGrid(){ const grid=Array.from({length:7},()=>Array.from({length:24},()=>0)); const rows=dedupeActivities(state.activities); rows.forEach(a=>{ const d=new Date(a.date||a.createdAt||Date.now()); const day=d.getDay(); const hour=d.getHours(); const count=(Number(a.callsMade||0)+Number(a.emailsSent||0)+Number(a.linkedinMessages||0)+Number(a.vidyardVideos||0)); grid[day][hour]+= count>0?count:(a.meetingsBooked||a.pipelineGenerated||a.revenueClosed?1:0); }); return grid; }
function renderHeatMap(mode){ try{ const el=document.getElementById('heat3d'); if(!el||!window.echarts) return; try{ if (renderHeatMap._inst){ renderHeatMap._inst.dispose(); renderHeatMap._inst=null; } }catch{} const chart=echarts.init(el); const grid=computeHeatGrid(); const maxVal=grid.reduce((m,row)=>Math.max(m,...row),1); const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; if (mode==='3d'){ const data=[]; for(let d=0; d<7; d++){ for(let h=0; h<24; h++){ data.push([d,h,grid[d][h]]); } } const option={ tooltip:{}, visualMap:{ max:Math.max(1,maxVal), inRange:{ color:['#083344','#065f46','#10b981','#a7f3d0'] } }, xAxis3D:{ type:'category', data:days }, yAxis3D:{ type:'category', data:Array.from({length:24},(_,i)=> String(i)) }, zAxis3D:{ type:'value' }, grid3D:{ boxDepth:60, boxWidth:110, light:{ main:{ intensity:1.2 }, ambient:{ intensity:0.5 } } }, series:[{ type:'bar3D', shading:'lambert', data:data.map(item=>({ value:item })), barSize:6 }] }; chart.setOption(option); } else { const data=[]; for(let d=0; d<7; d++){ for(let h=0; h<24; h++){ data.push([h,d,grid[d][h]||0]); } } const option={ tooltip:{ position:'top' }, grid:{ height:'70%', top:'10%' }, xAxis:{ type:'category', data:Array.from({length:24},(_,i)=> String(i)), splitArea:{ show:true } }, yAxis:{ type:'category', data:days, splitArea:{ show:true } }, visualMap:{ min:0, max:Math.max(1,maxVal), calculable:true, orient:'horizontal', left:'center', bottom:0, inRange:{ color:['#e0f2fe','#7dd3fc','#0ea5e9','#0369a1'] } }, series:[{ type:'heatmap', data, emphasis:{ itemStyle:{ shadowBlur:10, shadowColor:'rgba(0,0,0,0.3)' } } }] }; chart.setOption(option); } renderHeatMap._inst=chart; }catch(e){ console.warn('renderHeatMap failed', e); } }
function initHeatMap(){ const helpBtn=document.getElementById('heatHelpBtn'); const help=document.getElementById('heatHelp'); if (helpBtn&&help){ helpBtn.onclick=()=> help.classList.toggle('hidden'); } const mode2=document.getElementById('heatMode2D'); const mode3=document.getElementById('heatMode3D'); const info=detectWebGL(); try{ const sup=document.getElementById('glSupport'); if (sup) sup.textContent = info.gl2? 'WebGL2' : (info.gl1? 'WebGL1' : 'No'); const rr=document.getElementById('glRendererRow'); const rn=document.getElementById('glRenderer'); if (info.renderer && rn && rr){ rn.textContent=info.renderer; rr.classList.remove('hidden'); } }catch{} let pref=(localStorage.getItem('ascm_heatmap_mode')||'auto'); let mode=(pref==='3d'||pref==='2d')? pref : ((info.gl2||info.gl1)? '3d':'2d'); if (mode==='3d' && !(info.gl2||info.gl1)) mode='2d'; setHeatStatus(mode, info.gl2? 'Using WebGL2' : info.gl1? 'Using WebGL1' : 'WebGL unavailable; using 2D'); if (mode2) mode2.classList.toggle('bg-white', mode==='2d'); if (mode3) mode3.classList.toggle('bg-white', mode==='3d'); renderHeatMap(mode); if (mode2) mode2.onclick=()=>{ localStorage.setItem('ascm_heatmap_mode','2d'); setHeatStatus('2d'); renderHeatMap('2d'); mode2.classList.add('bg-white'); mode3&&mode3.classList.remove('bg-white'); }; if (mode3) mode3.onclick=()=>{ if (!(info.gl2||info.gl1)){ setHeatStatus('2d','WebGL not supported; showing 2D'); renderHeatMap('2d'); return; } localStorage.setItem('ascm_heatmap_mode','3d'); setHeatStatus('3d'); renderHeatMap('3d'); mode3.classList.add('bg-white'); mode2&&mode2.classList.remove('bg-white'); }; window.addEventListener('resize', ()=>{ try{ renderHeatMap._inst && renderHeatMap._inst.resize(); }catch{} }, { passive:true }); }

// ================= Rendering =================
function formatValue(val, money){ return money? ('$'+Number(val||0).toLocaleString()): Number(val||0).toLocaleString(); }
function trendIconCls(t){ return t>0? 'fa-arrow-up text-emerald-600' : (t<0? 'fa-arrow-down text-red-600' : 'fa-minus text-slate-400'); }
function trendAria(t, current, previous){
  const dir = t>0? 'up' : (t<0? 'down' : 'no change');
  const pct = Math.abs(Number(t||0)) + '%';
  return `Trend ${dir} ${pct} versus previous period. Current ${current}, previous ${previous}.`;
}

function renderKPIs(vm){
  const groups = { Activities:'kpiActivities', Results:'kpiResults', Financials:'kpiFinancials', ABM:'kpiABM' };
  Object.entries(groups).forEach(([g,id])=>{
    const el = document.getElementById(id); if (!el) return; el.innerHTML = '';
    (vm.groups[g]||[]).forEach(it=>{
      const card = document.createElement('div'); card.className='kpi-card';
      const help = (window.KPI_INFO && window.KPI_INFO[it.key]) ? `<i class="fa-solid fa-circle-info text-slate-400 ml-2" title="${window.KPI_INFO[it.key]}"></i>` : '';
      card.innerHTML = `
        ${it.goal===0? '<div class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-1"><i class="fa-regular fa-flag mr-1"></i>Set this goal to track progress.</div>' : ''}
        <div class="flex items-center gap-3 mb-1">
          <div class="w-10 h-10 rounded-md grid place-items-center text-white" style="background:${it.money?'#006B36':'#21C0DB'}"><i class="${it.icon}"></i></div>
          <div class="text-sm font-semibold">${it.label}${help}</div>
        </div>
        <div class="text-2xl font-extrabold">${formatValue(it.current, it.money)}</div>
        <div class="text-xs text-slate-600 mb-2" aria-label="${trendAria(it.trend, it.current, it.previous)}">Goal: ${formatValue(it.goal, it.money)} · <i class="fa-solid ${trendIconCls(it.trend)}" aria-hidden="true"></i> ${(it.trend>0?'+':'')+it.trend}% <span class="sr-only">${trendAria(it.trend, it.current, it.previous)}</span></div>
        <div class="relative h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(it.attainment)}" aria-label="KPI attainment toward goal"><div class="absolute left-0 top-0 bottom-0 bg-emerald-500" style="width:${Math.round(it.attainment)}%"></div></div>
      `;
      el.appendChild(card);
    });
  });
  document.getElementById('abmCard').style.display = (vm.groups.ABM||[]).length? '' : 'none';

  // Populate read-only Goals Overview table for transparency
  try {
    const body = document.getElementById('goalsOverviewBody');
    const empty = document.getElementById('goalsOverviewEmpty');
    const meta = document.getElementById('goalsMeta');
    if (!body || !meta) return;
    const role = getActiveRole();
    const rows = [];
    ['Activities','Results','Financials','ABM'].forEach(g => {
      (vm.groups[g]||[]).forEach(it => { rows.push({ metric: it.label, period: (state.period==='week'||state.period==='7days')?'Weekly':'Monthly', target: formatValue(it.goal, it.money) }); });
    });
    body.innerHTML = rows.map(r => `<tr class="border-t"><td class="px-4 py-2">${r.metric}</td><td class="px-4 py-2">${r.period}</td><td class="px-4 py-2">${r.target}</td></tr>`).join('');
    empty.classList.toggle('hidden', rows.length>0);
    meta.textContent = `${role.toUpperCase()} · ${new Date().toISOString().slice(0,7)}`;
  } catch {}
}

function renderDistribution(vm){
  const ctx = document.getElementById('distChart').getContext('2d');
  const totalsByGroup = ['Activities','Results','Financials','ABM'].map(g=>{
    const list = vm.groups[g]||[]; const goals=list.reduce((s,it)=> s + Number(it.goal||0), 0); const cur=list.reduce((s,it)=> s + Number(it.current||0), 0); return goals>0? Math.min(100,(cur/goals)*100) : 0;
  });
  const data = {
    labels: ['Activities','Results','Financials','ABM'],
    datasets: [{ data: totalsByGroup, backgroundColor:['#21C0DB','#82C341','#006B36','#F59E0B'], borderWidth:0 }]
  };
  if (!window._distModChart){
    window._distModChart = new Chart(ctx, { type:'doughnut', data, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } } });
  } else { window._distModChart.data = data; window._distModChart.update(); }
}

function renderTrend(vm){
  const sel = document.getElementById('trendMetric'); if (!sel) return;
  const options = (['Activities','Results','Financials','ABM'].flatMap(g => (vm.groups[g]||[]).map(it=>({key:it.key,label:it.label}))));
  sel.innerHTML = options.map(o=>`<option value="${o.key}">${o.label}</option>`).join('');
  const key = sel.value || (options[0]?.key || 'callsMade');

  // Build day series for current vs previous window using deduped data
  const {now,start,prevStart,prevEnd} = filterRanges();
  const days = state.period==='week'? 7 : (state.period==='month'? 30 : (state.period==='7days'? 7 : 30));
  const labels=[], curData=[], prevData=[];
  const dedup = dedupeActivities(state.activities);
  for (let i=days-1;i>=0;i--){
    const d = new Date(now); d.setDate(d.getDate()-i);
    const s1=new Date(d); s1.setHours(0,0,0,0); const e1=new Date(d); e1.setHours(23,59,59,999);
    const prevD = new Date(d); if (state.period==='week'||state.period==='7days') prevD.setDate(prevD.getDate()-7); else prevD.setMonth(prevD.getMonth()-1);
    const s2=new Date(prevD); s2.setHours(0,0,0,0); const e2=new Date(prevD); e2.setHours(23,59,59,999);
    labels.push(d.toLocaleDateString(undefined,{month:'short',day:'numeric'}));
    curData.push(sumMetric(dedup, key, s1, e1));
    prevData.push(sumMetric(dedup, key, s2, e2));
  }
  const ctx = document.getElementById('trendChart').getContext('2d');
  const data = { labels, datasets:[
    { label:'Current', data: curData, borderColor:'#006B36', backgroundColor:'rgba(0,107,54,0.10)', tension:0.35, borderWidth:2, fill:true },
    { label:'Previous', data: prevData, borderColor:'#9CA3AF', backgroundColor:'rgba(156,163,175,0.12)', tension:0.35, borderWidth:2, borderDash:[5,5], fill:true }
  ]};
  if (!window._trendModChart){ window._trendModChart = new Chart(ctx, { type:'line', data, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } }, interaction:{ intersect:false, mode:'index' } } }); }
  else { window._trendModChart.data=data; window._trendModChart.update(); }
  sel.onchange = ()=> renderTrend(vm);
}

function normalizeActivity(a){
  // Normalize id/date/role fields and ensure numeric metrics
  const id = a.id || a._id || a.uuid || `${a.userId||a.user_id||'u'}-${a.createdAt||a.date||''}`;
  const date = new Date(a.date || a.createdAt || Date.now());
  const role = String(a.role||getActiveRole()||'ae').toLowerCase();
  const userId = a.userId || a.user_id || null;
  const metrics = ['accountsTargeted','callsMade','emailsSent','linkedinMessages','vidyardVideos','abmCampaigns','meetingsBooked','successfulContacts','meetingsConducted','opportunitiesGenerated','referralsGenerated','pipelineGenerated','revenueClosed','generalAbmCampaigns','crossSellAbmCampaigns','upSellAbmCampaigns','dormantAbmCampaigns'];
  const m = {}; metrics.forEach(k=> m[k] = Number(a[k]||0)||0);
  return { id, date, role, userId, ...m, raw:a };
}

function groupForActivity(a){
  const isABM = a.generalAbmCampaigns>0 || a.crossSellAbmCampaigns>0 || a.upSellAbmCampaigns>0 || a.dormantAbmCampaigns>0;
  const isFin = !isABM && (a.pipelineGenerated>0 || a.revenueClosed>0);
  const isRes = !isABM && !isFin && (a.meetingsBooked>0 || a.successfulContacts>0);
  return isABM? 'ABM' : (isFin? 'Financials' : (isRes? 'Results' : 'Activities'));
}

function dedupeActivities(rows){
  // Remove duplicates by id or by (userId + isoDate + metrics signature)
  const seen = new Set();
  const out = [];
  for (const r of rows){
    const a = normalizeActivity(r);
    const day = new Date(a.date); day.setHours(0,0,0,0);
    const signature = JSON.stringify({ u:a.userId, d:day.getTime(), role:a.role, m:{
      acc:a.accountsTargeted, calls:a.callsMade, emails:a.emailsSent, li:a.linkedinMessages, vid:a.vidyardVideos,
      abm:a.abmCampaigns, book:a.meetingsBooked, succ:a.successfulContacts, cond:a.meetingsConducted, opp:a.opportunitiesGenerated, ref:a.referralsGenerated, pipe:a.pipelineGenerated, rev:a.revenueClosed,
      gabm:a.generalAbmCampaigns, cabm:a.crossSellAbmCampaigns, uabm:a.upSellAbmCampaigns, dabm:a.dormantAbmCampaigns
    }});
    const key = a.id || signature;
    if (seen.has(key) || seen.has(signature)) continue;
    seen.add(key); seen.add(signature);
    out.push(a);
  }
  return out;
}

function datasetSignature(){
  // Lightweight signature of current deduped dataset for memoization
  const rows = dedupeActivities(state.activities);
  let maxTs = 0; let sum = 0;
  for (const a of rows){
    const ts = (a.date instanceof Date ? a.date : new Date(a.date||a.createdAt||Date.now())).getTime();
    if (ts>maxTs) maxTs = ts;
    sum += (a.accountsTargeted + a.callsMade + a.emailsSent + a.linkedinMessages + a.vidyardVideos + a.abmCampaigns + a.meetingsBooked + a.successfulContacts + a.meetingsConducted + a.opportunitiesGenerated + a.referralsGenerated + a.pipelineGenerated + a.revenueClosed + a.generalAbmCampaigns + a.crossSellAbmCampaigns + a.upSellAbmCampaigns + a.dormantAbmCampaigns);
  }
  return `${rows.length}|${maxTs}|${sum}`;
}

function renderRecent(){
  const tbody = document.getElementById('recentTbody'); const empty = document.getElementById('recentEmpty');
  const now = new Date(); let start = (state.period==='week'? startOfWeek(now) : state.period==='month'? startOfMonth(now) : state.period==='7days'? new Date(now.getFullYear(), now.getMonth(), now.getDate()-6) : new Date(0));
  // Filter to period, then de-duplicate
  const filtered = state.activities.filter(a=>{ const t=new Date(a.date||a.createdAt||Date.now()); return t>=start && t<=now; });
  const itemsRaw = dedupeActivities(filtered).sort((a,b)=> b.date - a.date);
  // Apply category filters
  const f = state.activityFilters||{Activities:true,Results:true,Financials:true,ABM:true};
  const itemsAll = itemsRaw.filter(a=> !!f[groupForActivity(a)]);

  // Pagination / windowing defaults
  const pager = document.getElementById('recentPager');
  state.recent = state.recent || { page:1, size:25 };
  const sizeSel = document.getElementById('recentPageSize');
  if (sizeSel && sizeSel.value) state.recent.size = Number(sizeSel.value)||25;
  const total = itemsAll.length; const pages = Math.max(1, Math.ceil(total / state.recent.size));
  if (state.recent.page>pages) state.recent.page=pages;
  if (state.recent.page<1) state.recent.page=1;
  const startIdx = (state.recent.page-1)*state.recent.size;
  const pageItems = itemsAll.slice(startIdx, startIdx + state.recent.size);

  const countEl = document.getElementById('recentCount');
  if (countEl) countEl.textContent = total? `${pageItems.length} of ${total} shown` : '';

  if (!pageItems.length){ tbody.innerHTML=''; empty.classList.remove('hidden'); if(pager) pager.classList.add('hidden'); return; }
  empty.classList.add('hidden'); if (pager) pager.classList.remove('hidden');

  const isAdminView = (getSession()?.role||'').toLowerCase()==='admin' && !!getImpersonation();
  tbody.innerHTML = pageItems.map(r=>{
    const when = new Date(r.date||Date.now());
    const group = groupForActivity(r);
    const keys = ['accountsTargeted','callsMade','emailsSent','linkedinMessages','vidyardVideos','abmCampaigns','meetingsBooked','successfulContacts','meetingsConducted','opportunitiesGenerated','referralsGenerated','pipelineGenerated','revenueClosed','generalAbmCampaigns','crossSellAbmCampaigns','upSellAbmCampaigns','dormantAbmCampaigns'];
    const parts=[]; keys.forEach(k=>{ const v=Number(r[k]||0); if(v>0) parts.push(`${k}:${v}`); });
    const userBadge = isAdminView ? `<span class=\"ml-2 text-xs text-slate-500\">(${r.raw?.userName||r.raw?.user_id||r.raw?.userId||'user'} · ${(r.raw?.role||'ae').toUpperCase()})</span>` : '';
    return `<tr class=\"border-t\"><td class=\"px-4 py-2\">${when.toLocaleString()}</td><td class=\"px-4 py-2\">${group}</td><td class=\"px-4 py-2 text-slate-600\">${parts.join(' · ')||'-'} ${userBadge}</td></tr>`;
  }).join('');

  // Wire pager controls lazily each render
  const prev = document.getElementById('recentPrev');
  const next = document.getElementById('recentNext');
  const info = document.getElementById('recentPageInfo');
  if (info) info.textContent = `Page ${state.recent.page} / ${pages}`;
  if (prev) prev.onclick = ()=>{ if (state.recent.page>1){ state.recent.page--; renderRecent(); } };
  if (next) next.onclick = ()=>{ if (state.recent.page<pages){ state.recent.page++; renderRecent(); } };
  if (sizeSel) sizeSel.onchange = ()=>{ state.recent.page=1; state.recent.size=Number(sizeSel.value)||25; renderRecent(); };
}

// Goals warning: disable KPI updates if any goal missing
function enforceGoalsGuard(vm){
  const all = ['Activities','Results','Financials','ABM'].flatMap(g => vm.groups[g]||[]);
  const missing = all.some(it => Number(it.goal||0)===0);
  const warn = document.getElementById('goalsWarning');
  if (missing) {
    warn.classList.remove('hidden');
    // Disable KPI updates by greying cards
    ['kpiActivities','kpiResults','kpiFinancials','kpiABM'].forEach(id=>{
      const el = document.getElementById(id); if (!el) return; el.style.opacity = '0.5'; el.setAttribute('aria-disabled','true');
    });
  } else {
    warn.classList.add('hidden');
    ['kpiActivities','kpiResults','kpiFinancials','kpiABM'].forEach(id=>{
      const el = document.getElementById(id); if (!el) return; el.style.opacity = '1'; el.removeAttribute('aria-disabled');
    });
  }
}

// ================= Controls & Sync =================
function wireControls(){
  document.getElementById('refreshBtn').addEventListener('click', refreshAll);
  ['f_week','f_month','f_7days','f_all'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return; el.addEventListener('click', ()=>{ state.period = el.dataset.period; if(state.recent) state.recent.page=1; refreshAll(); });
  });
  document.getElementById('reloadBtn').addEventListener('click', async()=>{ try{ await fetch(np(`${API.endpoints.activities}?limit=1&cb=${Date.now()}`)); await refreshAll(); } catch { await refreshAll(); } });
  try { window.AscmTelemetry?.logEvent({ type:'ui_click', detail:{ id:'reloadBtn' } }); } catch{}

  // Font scaling controls (persisted via CSS var --ui-scale)
  try {
    const root = document.documentElement;
    const applyScale = (s)=>{ s = Math.max(0.85, Math.min(1.4, Number(s)||1)); root.style.setProperty('--ui-scale', String(s)); localStorage.setItem('ascm_ui_scale', String(s)); try{ if (window._distModChart) window._distModChart.resize(); if (window._trendModChart) window._trendModChart.resize(); }catch{} };
    const saved = parseFloat(localStorage.getItem('ascm_ui_scale')||'1'); if (!isNaN(saved) && saved && saved !== 1) applyScale(saved);
    const inc = document.getElementById('fontInc'); const dec = document.getElementById('fontDec');
    if (inc) inc.addEventListener('click', ()=>{ const cur = parseFloat(getComputedStyle(root).getPropertyValue('--ui-scale')||'1'); applyScale(cur + 0.1); });
    if (dec) dec.addEventListener('click', ()=>{ const cur = parseFloat(getComputedStyle(root).getPropertyValue('--ui-scale')||'1'); applyScale(cur - 0.1); });
  } catch {}

  // Category filters
  state.activityFilters = state.activityFilters || { Activities:true, Results:true, Financials:true, ABM:true };
  const setFilter=(grp,val)=>{ state.activityFilters[grp]=val; if(state.recent) state.recent.page=1; renderRecent(); };
  const setAll=(val)=>{ ['Activities','Results','Financials','ABM'].forEach(g=> state.activityFilters[g]=val); renderRecent(); };
  ['Activities','Results','Financials','ABM'].forEach(g=>{ const btn=document.getElementById('flt_'+g); if(btn) btn.addEventListener('click', ()=> setFilter(g, !(state.activityFilters[g])) ); });
  const allBtn=document.getElementById('flt_all'); if(allBtn) allBtn.addEventListener('click', ()=> setAll(true));

  // Progressive disclosure for Recent table
  try { const btn=document.getElementById('toggleRecent'); if(btn){ const target=()=>{ try{ return document.getElementById('recentTbody')?.closest('div'); }catch{} return null; }; const pagerEl = document.getElementById('recentPager'); btn.addEventListener('click', ()=>{ const c=target(); if(!c) return; const hide = !c.classList.contains('hidden'); c.classList.toggle('hidden'); if (pagerEl) pagerEl.classList.toggle('hidden', hide); btn.textContent = hide? 'Details' : 'Hide'; }); if (window.innerWidth<768){ const c=target(); if(c) c.classList.add('hidden'); if (pagerEl) pagerEl.classList.add('hidden'); } } }catch{}

  // Admin controls
  const sess=getSession(); const isAdmin=(sess?.role||'').toLowerCase()==='admin';
  if (isAdmin){
    document.getElementById('adminControls').classList.remove('hidden');
    const sel = document.getElementById('userSelector');
    const clearBtn = document.getElementById('clearUserFilter');

    function rebuildUserSelector(){
      if (!sel) return;
      sel.innerHTML = state.users.map(u=>`<option value="${u.id}">${u.name||u.email||u.id}</option>`).join('') || '<option value="">No users found</option>';
      try { const imp=getImpersonation(); if (imp?.id) sel.value = imp.id; } catch {}
    }

    loadUsers().then(rebuildUserSelector);

    if (sel) sel.addEventListener('change', async(e)=>{
      try {
        const user = state.users.find(u=> String(u.id)===String(e.target.value));
        if (!user || !user.id){ showToast('Invalid user selection','error'); return; }
        if (window.setupActAsUser) await window.setupActAsUser(user);
        if (window.confirmActAsUser) await window.confirmActAsUser();
        else {
          localStorage.setItem('ascm_impersonate', JSON.stringify({ id: user.id, role: (user.role||'ae').toLowerCase(), name: user.name||'', email: user.email||'' }));
          try { if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_start', at: Date.now(), target: { id: user.id, role: user.role } }); } catch {}
        }
      } catch(err){ showToast(err?.message||'Impersonation failed','error'); }
      await refreshAll();
    });

    if (clearBtn) clearBtn.addEventListener('click', async()=>{
      try {
        if (window.stopImpersonation) await window.stopImpersonation();
        else { localStorage.removeItem('ascm_impersonate'); try{ if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_stop', at: Date.now() }); } catch {} }
      } catch(err){ showToast(err?.message||'Failed to stop impersonation','error'); }
      await refreshAll();
      try { if (sel) sel.value=''; } catch{}
    });

    // Rebuild selector when users caches change (admin console writes these), or on users_updated broadcast
    window.addEventListener('storage', (e)=>{
      if (e.key==='users' || e.key==='um_users'){
        loadUsers().then(rebuildUserSelector);
      }
    });
    try {
      if (!window._ascmChan) window._ascmChan = new BroadcastChannel('ascm_sync');
      const prev = window._ascmChan.onmessage;
      window._ascmChan.onmessage = (ev)=>{
        const t = ev?.data?.type;
        if (t==='users_updated'){
          loadUsers().then(rebuildUserSelector);
        }
        if (typeof prev === 'function') prev(ev);
      };
    } catch {}
  }

  // Using global scheduleRefresh()
  // Cross-tab sync (event-driven refresh only)
  window.addEventListener('storage', (e)=>{
    if (e.key==='ascm_impersonate' || e.key==='ascm_activities_updated' || e.key==='ascm_goals_updated') {
      try { localStorage.removeItem('activities?limit=2000'); localStorage.removeItem('/tables/activities?limit=2000'); localStorage.removeItem('tables/activities?limit=2000'); } catch{}
      try { window.AscmTelemetry?.logEvent({ type:'storage_event', detail:{ key:e.key } }); } catch{}
      scheduleRefresh();
    }
  });
  try {
    if (!window._ascmChan) window._ascmChan = new BroadcastChannel('ascm_sync');
    window._ascmChan.onmessage = (e)=>{
      const t=e?.data?.type;
      const incomingUid = e?.data?.userId || null;
      if (t==='activities_updated'){
        // If event has a userId, only refresh when it matches the active scoped user
        const activeUid = state.userId || (getImpersonation()?.id) || (getSession()?.id) || null;
        if (incomingUid && activeUid && String(incomingUid) !== String(activeUid)) {
          try { window.AscmTelemetry?.logEvent({ type:'broadcast_event_skip', detail:{ reason:'user_mismatch', incomingUid, activeUid } }); } catch{}
          return;
        }
      }
      if (t==='impersonation_start'||t==='impersonation_stop'||t==='activities_updated'||t==='goals_updated'||t==='goals_reset'){
        try { localStorage.removeItem('activities?limit=2000'); localStorage.removeItem('/tables/activities?limit=2000'); localStorage.removeItem('tables/activities?limit=2000'); } catch{}
        try { window.AscmTelemetry?.logEvent({ type:'broadcast_event', detail:{ type:t, userId:incomingUid } }); } catch{}
        scheduleRefresh();
      }
    };
  } catch {}
  // Optional SSE/WebSocket push for activities/goals
  (function initPush(){
    const sseUrl = localStorage.getItem('ascm_sse_activities_url');
    const wsUrl  = localStorage.getItem('ascm_ws_activities_url');
    if (sseUrl){
      try {
        const es = new EventSource(sseUrl);
        es.onmessage = (ev)=>{ try{ const data=JSON.parse(ev.data||'{}'); if (data?.type==='activities_updated'||data?.event==='activities_updated'){ scheduleRefresh(); } }catch{} };
        es.onerror = ()=>{ try{ window.AscmTelemetry?.logEvent({ type:'sse_error' }); }catch{} };
      } catch{}
    }
    if (wsUrl){
      try {
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (ev)=>{ try{ const data=JSON.parse(ev.data||'{}'); if (data?.type==='activities_updated'||data?.event==='activities_updated'){ scheduleRefresh(); } }catch{} };
        ws.onerror = ()=>{ try{ window.AscmTelemetry?.logEvent({ type:'ws_error' }); }catch{} };
      } catch{}
    }
  })();
}

// ================= Main Refresh =================
let _refreshing = false;
async function refreshAll(){
  if (_refreshing) { try { window.AscmTelemetry?.logEvent({ type:'refresh_skipped_overlap' }); } catch{} return; }
  _refreshing = true;
  const t0 = performance.now();
  try {
    document.getElementById('loadingOverlay')?.classList.remove('hidden');
    setTopStatus('Syncing…');
    await resolveApiBase();
    await Promise.all([loadGoals(), loadActivities(), loadKpiSummary().catch(()=>null)]);

    // Build ViewModel
    const vm = buildViewModel();

    // Enforce goals guard
    enforceGoalsGuard(vm);

    // Render
    renderKPIs(vm);
    renderDistribution(vm);
    renderTrend(vm);
    renderRecent();
    updateGamify();
    initHeatMap();

    setTopStatus('Live');
    try { window.AscmTelemetry?.logRender({ part:'dashboard_refresh', ms: Math.round(performance.now()-t0) }); } catch{}
  } catch (e){
    console.warn('refreshAll failed', e);
    showToast('Data refresh failed. Using cached data if available.', 'error');
  } finally {
    document.getElementById('loadingOverlay')?.classList.add('hidden');
    _refreshing = false;
  }
}

// ================= Init =================
(async function init(){
  const sess = getSession(); if (!sess) { window.location.replace('index.html'); return; }
  state.role = (sess.role||'ae').toLowerCase()==='admin' ? 'admin' : 'ae';
  state.userId = sess.id;
  wireControls();
  await refreshAll();
  // Replace frequent auto-refresh with optional long-interval timer controlled by preference
  try {
    const pref = localStorage.getItem('ascm_periodic_refresh_minutes');
    if (pref) {
      const minutes = Math.max(5, Number(pref)||0);
      if (minutes && isFinite(minutes)) {
        if (window._ascmPeriodicTimer) { clearInterval(window._ascmPeriodicTimer); window._ascmPeriodicTimer=null; }
        window._ascmPeriodicTimer = setInterval(()=>{ if (!document.hidden) scheduleRefresh(true); }, minutes*60000);
        window.AscmTelemetry?.logEvent({ type:'timer_set', detail:{ minutes } });
      }
    } else {
      if (window._ascmPeriodicTimer) { clearInterval(window._ascmPeriodicTimer); window._ascmPeriodicTimer=null; window.AscmTelemetry?.logEvent({ type:'timer_clear' }); }
    }
  } catch{}
  // Event-driven re-render already wired in wireControls()

})();
