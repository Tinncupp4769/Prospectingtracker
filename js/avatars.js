(function(global){
  const baseColors = '006B36,3BB14A,82C341,21C0DB,F3F4F6';
  function boring(seed, size){
    const s = encodeURIComponent(String(seed||'user'));
    const px = size||56;
    return `https://source.boringavatars.com/beam/${px}/${s}?colors=${baseColors}`;
  }
  function getFallbackSeed(user){ return (user?.email||user?.name||user?.id||'user'); }
  function unavatarByEmail(email, size){
    const seed = getFallbackSeed({email});
    return `https://unavatar.io/${encodeURIComponent(String(email||'').trim().toLowerCase())}?fallback=${encodeURIComponent(boring(seed, size))}`;
  }
  function unavatarByLinkedIn(link, size){
    const seed = getFallbackSeed();
    if (!link) return boring(seed, size);
    // Accept full LinkedIn profile URLs or usernames (we'll just pass through)
    return `https://unavatar.io/${encodeURIComponent(String(link))}?fallback=${encodeURIComponent(boring(seed, size))}`;
  }
  function getAvatarUrl(user, size){
    const px = size||56;
    if (!user) return boring('user', px);
    const direct = user.avatar_url || user.avatar || '';
    if (direct) return direct;
    const li = user.linkedin_url || user.linkedin || '';
    if (li) return unavatarByLinkedIn(li, px);
    const email = user.email || '';
    if (email) return unavatarByEmail(email, px);
    return boring(getFallbackSeed(user), px);
  }
  function applyImgFallback(el, fallbackUrl){
    if (!el) return;
    el.onerror = null;
    el.src = fallbackUrl || boring('user', el.width||56);
  }
  function img(user, size, className){
    const px = size||56;
    const url = getAvatarUrl(user, px);
    const fallback = boring(getFallbackSeed(user), px);
    const alt = (user?.name || user?.email || 'User');
    const cls = className || 'avatar-img';
    return `<img src="${url}" alt="${alt}" class="${cls}" loading="lazy" width="${px}" height="${px}" onerror="this.onerror=null; this.src='${fallback}';" />`;
  }
  // Retina-friendly image with srcset 1x/2x
  function img2x(user, size, className){
    const px = size||56;
    const url1 = getAvatarUrl(user, px);
    const url2 = getAvatarUrl(user, px*2);
    const fallback = boring(getFallbackSeed(user), px);
    const alt = (user?.name || user?.email || 'User');
    const cls = className || 'avatar-img';
    return `<img src="${url1}" srcset="${url1} 1x, ${url2} 2x" alt="${alt}" class="${cls}" loading="lazy" width="${px}" height="${px}" onerror="this.onerror=null; this.src='${fallback}';" />`;
  }
  const Avatars = { boring, unavatarByEmail, unavatarByLinkedIn, getAvatarUrl, applyImgFallback, img, img2x };
  global.Avatars = Avatars;
})(window);
