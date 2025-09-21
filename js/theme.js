// theme.js — applies persisted theme across pages and reacts to cross-tab changes
(function(){
  try {
    const apply = (val)=>{
      if (val === 'dark') document.documentElement.dataset.theme = 'dark';
      else document.documentElement.removeAttribute('data-theme');
    };
    const saved = localStorage.getItem('ascm_theme');
    apply(saved);
    window.addEventListener('storage', (e)=>{ if (e.key==='ascm_theme'){ apply(e.newValue); } });
  } catch {}
})();
