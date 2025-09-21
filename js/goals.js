// Goals module: role-global goals with history and live sync
// Snapshot-first goals API: prefers tables/goals_snapshots (fallback to tables/goals for legacy)
// Stores role-wide goals (userId: null) for AE/AM; supports month+week targets and weeks in month

import { GoalsQueue } from './queue-goals.js';

export const GoalsAPI = (function(){
  function getSession(){ try { return JSON.parse(localStorage.getItem('ascm_session')||'null'); } catch { return null; } }
  async function audit(action, details){ try { await j('POST','tables/audit_logs', { action, details, target_table:'goals', target_id:'*', actor_id: getSession()?.id||'', actor_email: getSession()?.email||'', timestamp: Date.now() }); } catch{} }
  let API_BASE = 'tables/';
  const CANDIDATES = ['tables/','/tables/'];
  let _schemaFields = null;
  const _dbg = ()=> (typeof location!=='undefined' && location.search.includes('debug=1'));
  async function resolveBase(){ for(const b of CANDIDATES){ try{ const r = await fetch(`${b}goals?limit=1&cb=${Date.now()}`, {cache:'no-store', credentials:'same-origin'}); const ct=(r.headers.get('content-type')||'').toLowerCase(); if(r.ok && ct.includes('application/json')){ API_BASE=b; break; } }catch{} } }
  function npath(p){ if(/^https?:\/\//i.test(p)) return p; if(p.startsWith('tables/')) return API_BASE + p.slice('tables/'.length); if(p.startsWith('/tables/')) return API_BASE + p.slice('/tables/'.length); return p; }
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  function looksLikeHtml(res){ const ct=(res.headers?.get?.('content-type')||'').toLowerCase(); return ct.includes('text/html'); }
  async function req(method, path, body, tries=7){ let last=''; for(let i=0;i<tries;i++){ let url = npath(path); const sep = url.includes('?') ? '&' : '?'; url = `${url}${sep}cb=${Date.now()}_${i}`; if (_dbg()) console.log('[GoalsAPI][req]', method, url); const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: body!=null?JSON.stringify(body):undefined, cache:'no-store', credentials:'same-origin' }); if(res.status===401||res.status===403||looksLikeHtml(res)){ try{ last = await res.text(); }catch{} if (_dbg()) console.warn('[GoalsAPI][req] blocked/challenge, warming up', last.slice(0,120)); try{ let wu = npath('tables/goals?limit=1'); const wsep = wu.includes('?') ? '&' : '?'; await fetch(`${wu}${wsep}cb=${Date.now()}`, { cache:'no-store', credentials:'same-origin' }); }catch{} await sleep(800*(i+1)); continue; } return res; } throw new Error('API blocked '+last.slice(0,180)); }
  async function j(method, path, body, tries=7){ const r=await req(method,path,body,tries); if(!r.ok){ let t=''; try{ t=await r.text(); }catch{}; throw new Error(`${method} ${path} -> ${r.status} ${t.slice(0,200)}`);} if(r.status===204) return {}; try{ return await r.json(); }catch{ return {}; } }

  async function fetchGoalsSchema(){ try{ const probe = await j('GET','tables/goals?limit=1'); const s = probe?.schema || null; if (s){ const fields = Array.isArray(s.fields)? s.fields : (Array.isArray(s)? s : (Object.values(s?.fields||{}))); _schemaFields = new Set((fields||[]).map(f=> f.name || f)); if (_dbg()) console.log('[GoalsAPI] schema fields', [..._schemaFields]); } }catch(e){ if (_dbg()) console.warn('[GoalsAPI] schema fetch failed', e); } }
  function sanitizePayload(p){ const out = { ...p }; // enforce allowed enums/types
    out.period = (out.period==='week' ? 'week' : 'month');
    out.role = String(out.role||'').toLowerCase()==='am' ? 'am' : 'ae';
    out.metric = String(out.metric||'').trim();
    out.target = Number(out.target||0) || 0;
    out.weeks = Math.max(1, Number(out.weeks||4));
    // prefer omitting userId entirely if null to avoid schema rejects
    if (out.userId == null) delete out.userId;
    // drop unknown fields if schema present
    if (_schemaFields){ for (const k of Object.keys(out)){ if(!_schemaFields.has(k)) delete out[k]; }
    }
    return out;
  }
  
  // Legacy pending queue preserved for backward compatibility (no-op processing)
  function enqueuePending(payloads){ /* deprecated in favor of GoalsQueue */ try{ localStorage.setItem('goals_pending_writes','[]'); }catch{} }
  async function processPending(){ /* handled by GoalsQueue */ }
  (function(){ /* disable legacy timer */ })();
  
  async function init(){ await resolveBase(); await fetchGoalsSchema(); }
  
  // Load goals for a given role+month; returns map metric -> {month, week, weeks}
  async function loadRoleGoals(role, month){ const out={}; try{ if (_dbg()) console.log('[GoalsAPI] loadRoleGoals', {role, month}); // snapshot first
  try{
    const snap = await jGET(`tables/goals_snapshots?limit=1&search=${encodeURIComponent(month)}`);
    const row = (snap.data||[]).find(x=> !x.deleted && x.month===month && !x.userId);
    if (row && row.values){ const weeks=Math.max(1, Number(row.weeks||4)); for(const [metric,ob] of Object.entries(row.values||{})){ out[metric]={ month: Math.round(Number((ob?.ae||0)+ (ob?.am||0))/2 * weeks), week: Math.round(Number((ob?.ae||0)+ (ob?.am||0))/2), weeks }; } return out; }
  }catch{}
  const jres = await jGET(`tables/goals?limit=1000`); const rows=jres.data||[]; const rel = rows.filter(r=> (r.role===role) && (r.month===month) && !r.deleted && !r.userId); const weeks = Math.max(1, Number(rel.find(x=>x.weeks!=null)?.weeks||4)); for(const r of rel){ const k=String(r.metric||''); if(!k) continue; out[k] = out[k] || {month:0,week:0,weeks}; if(r.period==='month') out[k].month = Number(r.target||0)||0; if(r.period==='week') out[k].week = Number(r.target||0)||0; } // derive missing
    for(const [k,v] of Object.entries(out)){ if(!v.month && v.week){ v.month = Math.round(v.week * v.weeks); } if(!v.week && v.month){ v.week = Math.round(v.month / v.weeks); } }
    if (_dbg()) console.log('[GoalsAPI] loaded', Object.keys(out).length, 'metrics');
  }catch(e){ if (_dbg()) console.warn('[GoalsAPI] loadRoleGoals failed', e); }
    return out; }
  
  async function saveRoleGoals(role, month, valuesMap, weeks, actor){ // valuesMap: { metric: {month, week} }
    const sess = getSession();
    const isAdmin = (sess?.role||'').toLowerCase()==='admin';
    if (!isAdmin){
      await audit('goals_save_denied', { reason:'non_admin', role:sess?.role||'', month, count:Object.keys(valuesMap||{}).length });
      throw new Error('Not authorized: only Administrators can save goals');
    }
    const w=Math.max(1, Number(weeks||4));
    const payloads=[];
    for(const [metric,vals] of Object.entries(valuesMap||{})){
      payloads.push(sanitizePayload({ metric, period:'month', target:Number(vals.month||0), role, month, weeks:w, userId:null, updated_by: actor||sess?.email||'admin', effective_from: Date.now() }));
      payloads.push(sanitizePayload({ metric, period:'week',  target:Number(vals.week||0),  role, month, weeks:w, userId:null, updated_by: actor||sess?.email||'admin', effective_from: Date.now() }));
    }
    await audit('goals_save_attempt', { role, month, items: payloads.length });
    // Async queue with exponential backoff; returns immediately
    const enq = GoalsQueue.enqueueBatch(payloads);
    if (_dbg()) console.log('[GoalsAPI] enqueued goals', enq.total);
    try { GoalsQueue.kick(); } catch {}
    try { localStorage.setItem('goals_cache_role_'+role+'_'+month, JSON.stringify({ weeks:w, values:valuesMap })); } catch {}
    try { if(!window._ascmChan) window._ascmChan = new BroadcastChannel('ascm_sync'); window._ascmChan.postMessage({ type:'goals_queue_update', summary: GoalsQueue.getSummary(), at: Date.now() }); } catch {}
    await audit('goals_save_enqueued', { role, month, queued: enq.total });
    return { queued: enq.total, summary: GoalsQueue.getSummary() };
  }
  
  // history (latest 50)
  async function history(limit=50){ try{ const jres = await j('GET',`tables/goals_snapshots?limit=${limit}`); const rows=jres.data||[]; return rows.sort((a,b)=> (b.updated_at||0)-(a.updated_at||0)).slice(0,limit); }catch(e){ return []; } }
  
  async function jGET(path){ return await j('GET', path); }
  return { init, loadRoleGoals, saveRoleGoals, history };
})();
