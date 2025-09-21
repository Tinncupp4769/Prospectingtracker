/* Lightweight Telemetry & Diagnostics for ASCM SPA
 * - Client-only; no external services
 * - Logs API timings, UI events, and render durations
 * - Stores recent events in-memory and mirrors to localStorage (ring buffer)
 * - Optional best-effort flush to audit_logs via RESTful Table API (action:'telemetry')
 */
(function(){
  const LS_KEY = 'ascm_telemetry_events';
  const CFG_KEY = 'ascm_telemetry_enabled';
  const MAX_EVENTS = 400; // ring buffer size

  function now(){ return Date.now(); }
  function readLS(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]')||[]; }catch{ return []; } }
  function writeLS(arr){ try{ localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(-MAX_EVENTS))); }catch{} }

  class Telemetry {
    constructor(){
      this.enabled = this._readEnabled();
      this.events = readLS();
    }
    _readEnabled(){ try{ return localStorage.getItem(CFG_KEY)==='1'; }catch{ return false; } }
    setEnabled(on){ this.enabled = !!on; try{ localStorage.setItem(CFG_KEY, on?'1':'0'); }catch{} }
    _push(ev){
      if (!this.enabled) return;
      try {
        ev.ts = now();
        this.events.push(ev);
        if (this.events.length > MAX_EVENTS) this.events = this.events.slice(-MAX_EVENTS);
        writeLS(this.events);
        window.dispatchEvent(new CustomEvent('ascm_telemetry', { detail: ev }));
      } catch {}
    }
    log(kind, data){ this._push({ kind, ...data }); }
    logApi({ method, path, status, ms }){ this._push({ kind:'api', method, path, status, ms }); }
    logRender({ part, ms }){ this._push({ kind:'render', part, ms }); }
    logEvent({ type, detail }){ this._push({ kind:'event', type, detail }); }
    getAll(){ return (this.events||[]).slice(); }
    clear(){ this.events = []; writeLS(this.events); }
    copyToClipboard(){ try{ navigator.clipboard.writeText(JSON.stringify(this.getAll(), null, 2)); }catch{} }
    async flushToAuditLogs(apiJson){
      // Compress multiple events into one payload to avoid large writes
      if (!this.enabled) return;
      try{
        const items = this.getAll().slice(-100);
        const details = { events: items, note: 'client_telemetry_batch', count: items.length };
        await apiJson('POST','tables/audit_logs', {
          action: 'telemetry',
          target_table: 'dashboard',
          target_id: '*',
          actor_id: (JSON.parse(localStorage.getItem('ascm_session')||'null')||{}).id || '',
          actor_email: (JSON.parse(localStorage.getItem('ascm_session')||'null')||{}).email || '',
          details,
          timestamp: Date.now()
        });
      }catch(e){ /* ignore */ }
    }
  }

  try { window.AscmTelemetry = new Telemetry(); } catch {}
})();
