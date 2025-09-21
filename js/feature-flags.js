// Simple Feature Flags helper
// Usage:
// - Enable via localStorage.setItem('ascm_flag_<name>','1') or query ?ff_<name>=1
// - Disable via localStorage.removeItem('ascm_flag_<name>') or query ?ff_<name>=0
(function(){
  function parseQuery(){
    try{ const out={}; const q=new URLSearchParams(location.search); q.forEach((v,k)=>{ if(k.startsWith('ff_')) out[k.slice(3)] = v; }); return out; }catch{ return {}; }
  }
  const queryFlags = parseQuery();
  const Flags = {
    isEnabled(name){
      try{
        if (queryFlags[name]!==undefined) return queryFlags[name]==='1' || queryFlags[name]==='true';
        return localStorage.getItem('ascm_flag_'+name)==='1';
      }catch{ return false; }
    },
    getVariant(name, def='old'){
      try{ const v = localStorage.getItem('ascm_flag_'+name+'_variant') || queryFlags[name+'_variant']; return v || def; }catch{ return def; }
    }
  };
  try{ window.FeatureFlags = Flags; }catch{}
})();
