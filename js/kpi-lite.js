/* KPI-Lite: Minimal, independent KPI aggregation/rendering pipeline.
 * Goals:
 *  - Fetch identical user-scoped activities but compute KPIs with small, testable code
 *  - Optionally fetch backend snapshot at /kpi-summary (when available)
 *  - Provide drop-in functions: kpiLite.load(userId, role, period), kpiLite.compute(), kpiLite.render()
 */
(function(){
  const Lite = {
    state: {
      userId: '', role: 'ae', period: 'week',
      activities: [], goals: {},
      summary: null, // from /kpi-summary when available
    },
    // Normalize API path (tables/ vs /tables/)
    _API_BASE: 'tables/',
    async _resolveBase(){
      const bases=['tables/','/tables/'];
      for (const b of bases){ try{ const r=await fetch(`${b}activities?limit=1`,{cache:'no-store',credentials:'same-origin'}); const ct=(r.headers.get('content-type')||'').toLowerCase(); if(r.ok&&ct.includes('application/json')){ this._API_BASE=b; break; } }catch{} }
    },
    _np(p){ if(/^https?:\/\//i.test(p)) return p; if(p.startsWith('tables/')) return this._API_BASE+p.slice(7); if(p.startsWith('/tables/')) return this._API_BASE+p.slice(8); return p; },
    async load(userId, role, period){
      this.state.userId = userId; this.state.role = (role||'ae').toLowerCase(); this.state.period = period||'week';
      await this._resolveBase();
      // Load activities (user + role scoped)
      const aurl = this._np(`tables/activities?limit=2000&cb=${Date.now()}`);
      const j = await fetch(aurl, {cache:'no-store', credentials:'same-origin'}).then(r=>r.json()).catch(()=>({data:[]}));
      const all = (j.data||[]);
      this.state.activities = all.filter(a => (a.userId===userId || a.user_id===userId) && (String(a.role||'ae').toLowerCase()===this.state.role));
      // Load goals (role-global for current month)
      const ym = new Date().toISOString().slice(0,7);
      const gurl = this._np(`tables/goals?limit=1000&cb=${Date.now()}`);
      const gj = await fetch(gurl, {cache:'no-store', credentials:'same-origin'}).then(r=>r.json()).catch(()=>({data:[]}));
      const rows = (gj.data||[]).filter(g=> !g.deleted && g.month===ym && (g.role||this.state.role)===this.state.role && !g.userId);
      const map={}; rows.forEach(g=>{ const m=String(g.metric||''); if(!m) return; const per=(g.period||'month'); map[m]=map[m]||{month:{global:null},week:{global:null},weeks:g.weeks||4}; const slot=map[m][per]; const val=Number(g.target||0)||0; if(slot.global==null) slot.global=val; if(g.weeks) map[m].weeks=g.weeks; });
      const w = Math.max(1, Number(Object.values(map)[0]?.weeks||4));
      Object.values(map).forEach(v=>{ if(v.month.global==null && v.week.global!=null) v.month.global = Math.round(v.week.global*w); if(v.week.global==null && v.month.global!=null) v.week.global = Math.round(v.month.global/w); });
      this.state.goals = map;
      // Optional snapshot fetch (feature-flagged by backend availability)
      try{ const s = await fetch('/kpi-summary?userId='+encodeURIComponent(userId)+'&role='+this.state.role+'&cb='+Date.now(), {cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null); this.state.summary = s; }catch{}
      return this.state;
    },
    _startOfWeek(d){ const x=new Date(d); const day=(x.getDay()||7); x.setHours(0,0,0,0); x.setDate(x.getDate()-day+1); return x; },
    _startOfMonth(d){ const x=new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; },
    _filterRanges(){ const now=new Date(); let start, prevStart; const p=this.state.period; if(p==='week'){ start=this._startOfWeek(now); prevStart=new Date(start); prevStart.setDate(prevStart.getDate()-7);} else if (p==='month'){ start=this._startOfMonth(now); prevStart=new Date(start); prevStart.setMonth(prevStart.getMonth()-1);} else if (p==='7days'){ start=new Date(now); start.setDate(start.getDate()-6); start.setHours(0,0,0,0); prevStart=new Date(start); prevStart.setDate(prevStart.getDate()-7);} else { start=new Date(0); prevStart=new Date(0);} const prevEnd=new Date(start); prevEnd.setMilliseconds(prevEnd.getMilliseconds()-1); return {now,start,prevStart,prevEnd}; },
    _sum(rows,key,from,to){ return rows.reduce((s,r)=>{ const t=new Date(r.date||r.createdAt||Date.now()); if(t>=from&&t<=to) s+=Number(r[key]||0); return s; },0); },
    compute(){
      const { now,start,prevStart,prevEnd } = this._filterRanges();
      const rows=this.state.activities;
      const keys=['callsMade','emailsSent','linkedinMessages','vidyardVideos','abmCampaigns','meetingsBooked','successfulContacts','meetingsConducted','opportunitiesGenerated','referralsGenerated','pipelineGenerated','revenueClosed','accountsTargeted','generalAbmCampaigns','crossSellAbmCampaigns','upSellAbmCampaigns','dormantAbmCampaigns'];
      const cur={}; const prev={};
      keys.forEach(k=>{ cur[k]=this._sum(rows,k,start,now); prev[k]=this._sum(rows,k,prevStart,prevEnd); });
      return { current: cur, previous: prev, goals: this.state.goals, role:this.state.role, period:this.state.period };
    },
    // Minimal render helper that returns a POJO the caller can use to patch DOM
    // This is for A/B testing; not tied to existing DOM
    buildViewModel(data){
      function pct(a,b){ if(!b) return 0; return Math.min(100, Math.max(0, (a/b)*100)); }
      function fmt(v, money){ return money? ('$'+Number(v||0).toLocaleString()): Number(v||0).toLocaleString(); }
      const moneyKeys=['pipelineGenerated','revenueClosed'];
      const vm={ groups:{ Activities:[], Results:[], Financials:[], ABM:[] }, primary:{ pipeline:0, revenue:0 } };
      vm.primary.pipeline = data.current.pipelineGenerated||0;
      vm.primary.revenue  = data.current.revenueClosed||0;
      function goalFor(metric){ const g=data.goals[metric]; if(!g) return 0; const per=(data.period==='week'||data.period==='7days')?'week':'month'; return Number(g[per]?.global||0); }
      const catalog = (window.METRICS_CATALOG||{ae:{},am:{}})[data.role]||{Activities:[],Results:[],Financials:[],ABM:[]};
      ['Activities','Results','Financials','ABM'].forEach(gr=>{
        (catalog[gr]||[]).forEach(([key,label,icon])=>{
          const cur=data.current[key]||0; const pre=data.previous[key]||0; const g=goalFor(key);
          const att=pct(cur,g); const money=moneyKeys.includes(key);
          vm.groups[gr].push({ key,label,icon, current:cur, previous:pre, attainment:att, money, goal:g, displayCurrent: fmt(cur, money), displayGoal: fmt(g, money) });
        });
      });
      return vm;
    }
  };
  try{ window.kpiLite = Lite; }catch{}
})();
