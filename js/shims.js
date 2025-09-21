/*
 Global compatibility shims for legacy test harnesses and simple role-based routing.
 This file exposes three functions on window so external tests (and older pages) can call them:
   - showSection(name)
   - updateAEDashboard()
   - updateAMDashboard()
 The implementations are safe, idempotent, and work across all pages in this project.
*/
(function(){
  if (window.__ascmShimsInstalled) return; // idempotent guard
  window.__ascmShimsInstalled = true;

  // Map friendly section names to routes used by this app
  const ROUTES = {
    dashboard: 'sales-dashboard-modular.html',
    analytics: 'analytics-dashboard.html',
    goals: 'goals-portal.html',
    users: 'user-management.html',
    leaderboard: 'leaderboard.html',
    entry: 'activity-entry-router.html',
    home: 'app.html',
    app: 'app.html'
  };

  function goTo(route){
    if (!route) return;
    // Prefer same-tab navigation for test harnesses
    try { window.location.href = route; } catch(e){ console.warn('Navigation failed', e); }
  }

  // Expose showSection if not already defined by a page
  if (typeof window.showSection !== 'function'){
    window.showSection = function(name){
      try {
        const key = String(name||'').toLowerCase();
        const route = ROUTES[key] || ROUTES.dashboard;
        goTo(route);
      } catch(e){ console.warn('showSection failed', e); }
    }
  }

  // Helper to set a temporary role override when navigating to the dashboard
  function setRoleOverride(role){
    try { localStorage.setItem('dash_role_override', role); } catch{}
  }

  async function applyRoleAndRefresh(role){
    try {
      // If we are already on the dashboard page and it exposes state/refreshAll, update in-place
      if (/sales-dashboard-modular\.html$/i.test((window.location.pathname||'').split('/').pop())){
        if (window.state){ window.state.role = role; }
        if (document.getElementById('roleAE') && document.getElementById('roleAM')){
          try {
            document.getElementById('roleAE').classList.toggle('toggle-btn-active', role==='ae');
            document.getElementById('roleAM').classList.toggle('toggle-btn-active', role==='am');
            if (typeof window.moveToggleIndicators==='function') window.moveToggleIndicators();
          } catch{}
        }
        if (typeof window.refreshAll === 'function') { await window.refreshAll(); return; }
      }
      // Otherwise, set override and navigate to dashboard
      setRoleOverride(role);
      goTo(ROUTES.dashboard);
    } catch(e){ console.warn('applyRoleAndRefresh failed', e); }
  }

  if (typeof window.updateAEDashboard !== 'function'){
    window.updateAEDashboard = function(){ return applyRoleAndRefresh('ae'); };
  }
  if (typeof window.updateAMDashboard !== 'function'){
    window.updateAMDashboard = function(){ return applyRoleAndRefresh('am'); };
  }
  
  // Admin impersonation globals for test harnesses (legacy support)
  // Expose setupActAsUser/confirmActAsUser/stopImpersonation so tests can drive impersonation
  if (typeof window.setupActAsUser !== 'function' || typeof window.confirmActAsUser !== 'function') {
    // Minimal API helpers for audit logs (best-effort, no heavy retries)
    let API_BASE_IMP = 'tables/';
    function np(p){
      if (/^https?:\/\//i.test(p)) return p;
      if (p.startsWith('tables/')) return API_BASE_IMP + p.slice(7);
      if (p.startsWith('/tables/')) return API_BASE_IMP + p.slice(8);
      return p;
    }
    (async function resolveBaseOnce(){
      try {
        const cand=['tables/','/tables/'];
        for (const b of cand){
          try{
            const r=await fetch(`${b}audit_logs?limit=1`,{cache:'no-store',credentials:'same-origin'});
            const ct=(r.headers.get('content-type')||'').toLowerCase();
            if (r.ok && ct.includes('application/json')) { API_BASE_IMP=b; break; }
          }catch{}
        }
      }catch{}
    })();

    function getSessionShim(){ try { return JSON.parse(localStorage.getItem('ascm_session')||'null'); } catch { return null; } }
    function isAdminShim(){ try { return (getSessionShim()?.role||'').toLowerCase()==='admin'; } catch { return false; } }
    async function auditShim(action, details){
      try {
        const sess = getSessionShim();
        await fetch(np('tables/audit_logs'), {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            action,
            details: details||{},
            target_table: 'impersonation',
            target_id: details?.target_id || '*',
            actor_id: sess?.id||'',
            actor_email: sess?.email||'',
            timestamp: Date.now()
          }),
          cache:'no-store',
          credentials:'same-origin'
        });
      } catch {}
    }
    try { if (!window._ascmChan) window._ascmChan = new BroadcastChannel('ascm_sync'); } catch{}

    if (typeof window.setupActAsUser !== 'function'){
      window.setupActAsUser = async function(user){
        const sess = getSessionShim();
        if (!sess || !isAdminShim()) throw new Error('Only Administrators can impersonate users');
        if (!user || !user.id) throw new Error('Invalid user for impersonation');
        const ctx = { id: user.id, name: user.name||user.email||'User', email: user.email||'', role: (user.role||'ae').toLowerCase(), startedAt: Date.now(), startedBy: sess.email||sess.id, pending:true };
        try { localStorage.setItem('ascm_impersonate', JSON.stringify(ctx)); } catch {}
        await auditShim('impersonation_setup', { target_id: ctx.id, target_role: ctx.role, target_email: ctx.email });
        return ctx;
      };
    }
    if (typeof window.confirmActAsUser !== 'function'){
      window.confirmActAsUser = async function(){
        const sess = getSessionShim();
        if (!sess || !isAdminShim()) throw new Error('Only Administrators can impersonate users');
        let ctx = null;
        try { ctx = JSON.parse(localStorage.getItem('ascm_impersonate')||'null'); } catch { ctx=null; }
        if (!ctx || !ctx.id) throw new Error('No pending impersonation to confirm');
        delete ctx.pending; ctx.confirmedAt = Date.now();
        try { localStorage.setItem('ascm_impersonate', JSON.stringify(ctx)); } catch {}
        await auditShim('impersonation_confirm', { target_id: ctx.id, target_role: ctx.role, target_email: ctx.email });
        try { if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_start', at: Date.now(), target: ctx }); } catch{}
        try { if (typeof window.refreshAll === 'function') window.refreshAll(); } catch{}
        return ctx;
      };
    }
    if (typeof window.stopImpersonation !== 'function'){
      window.stopImpersonation = async function(){
        const sess = getSessionShim();
        if (!sess || !isAdminShim()) throw new Error('Only Administrators can impersonate users');
        let ctx=null; try{ ctx = JSON.parse(localStorage.getItem('ascm_impersonate')||'null'); }catch{}
        try { localStorage.removeItem('ascm_impersonate'); } catch {}
        await auditShim('impersonation_stop', { target_id: ctx?.id||'', target_role: ctx?.role||'' });
        try { if (window._ascmChan) window._ascmChan.postMessage({ type:'impersonation_stop', at: Date.now() }); } catch{}
        try { if (typeof window.refreshAll === 'function') window.refreshAll(); } catch{}
        return true;
      };
    }
  }

})();
