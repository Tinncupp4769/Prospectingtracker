(function(global){
  const KEY='ascm_avatar_queue';
  const SUM_KEY='ascm_avatar_queue_summary';
  const BASE_DELAY=2000; // 2s base
  const MAX_DELAY=5*60*1000; // 5 minutes cap
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'[]'); }catch{ return []; } }
  function save(list){ try{ localStorage.setItem(KEY, JSON.stringify(list)); }catch{} }
  function summary(){ const list=load(); const now=Date.now(); const next = list.length? Math.max(0, Math.min(...list.map(it=> (it.nextAt||now) )) - now) : 0; const lastErr = (list.find(it=> it.lastError) || {}).lastError || ''; const s={ size:list.length, nextInSec: Math.round(next/1000), lastError: lastErr }; try{ localStorage.setItem(SUM_KEY, JSON.stringify({ ...s, at: now })); }catch{} return s; }
  function enqueue(item){ const list=load(); list.push({ ...item, id: item.id||('q_'+Date.now().toString(36)), attempts:0, nextAt:Date.now(), lastError:'' }); save(list); schedule(); broadcast(); }
  function broadcast(){ try{ if (!global._ascmChan) global._ascmChan = new BroadcastChannel('ascm_sync'); const s = summary(); global._ascmChan.postMessage({ type:'avatars_queue_update', at: Date.now(), size: s.size, nextInSec: s.nextInSec, lastError: s.lastError }); }catch{} }
  let timer=null; function schedule(){ if (timer) return; timer=setInterval(tick, 8000); tick(); }
  function kick(){ try{ tick(); }catch{} }
  function normalizePath(base, p){ if (/^https?:\/\//i.test(p)) return p; if (p.startsWith('tables/')) return base + p.slice('tables/'.length); if (p.startsWith('/tables/')) return base + p.slice('/tables/'.length); return p; }
  async function resolveApiBase(){ const bases=['tables/','/tables/']; for(const b of bases){ try{ const r=await fetch(`${b}users?limit=1`,{cache:'no-store',credentials:'same-origin'}); const ct=(r.headers.get('content-type')||'').toLowerCase(); if(r.ok && ct.includes('application/json')) return b; }catch{} } return 'tables/'; }
  async function tick(){ const list=load(); if (!list.length) { clearInterval(timer); timer=null; summary(); broadcast(); return; } const base=await resolveApiBase(); const now=Date.now(); let changed=false; for (const it of list){ if ((it.nextAt||0)>now) continue; try{ const url = normalizePath(base, `tables/users/${encodeURIComponent(it.userId)}`); const ctrl=new AbortController(); const tt=setTimeout(()=>ctrl.abort('timeout'), 12000); const res = await fetch(url,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ avatar_url: it.avatar_url, linkedin_url: it.linkedin_url }), cache:'no-store', credentials:'same-origin', signal: ctrl.signal }); clearTimeout(tt); if (res.ok){ // success -> remove
            const idx=list.findIndex(x=>x.id===it.id); if (idx>=0){ list.splice(idx,1); changed=true; }
          } else {
            it.attempts++; it.lastError = `HTTP ${res.status}`; it.nextAt = now + Math.min(MAX_DELAY, BASE_DELAY*Math.pow(2, it.attempts)) + Math.floor(Math.random()*800);
          }
        } catch(e){
          it.attempts++; it.lastError = String(e?.message||e||'error'); it.nextAt = now + Math.min(MAX_DELAY, BASE_DELAY*Math.pow(2, it.attempts)) + Math.floor(Math.random()*800);
        }
      }
      save(list);
      summary();
      broadcast();
    }
  global.AvatarsQueue = { enqueue, size: ()=> load().length, list: load, schedule, kick };
})(window);
