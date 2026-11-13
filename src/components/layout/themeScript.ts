/**
 * Runs before first paint (inlined in <head>) so the correct theme is applied
 * with no flash. Stored preference wins; otherwise follow the OS setting.
 */
export const themeScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');d.setAttribute('data-theme',t);d.style.colorScheme=t;}catch(e){}})();`;

/**
 * Runs before first paint, next to the theme script: picks the homepage
 * presentation. An explicit ?view=quick|detailed wins (and is remembered);
 * otherwise the stored preference; otherwise Quick View for first visits.
 * CSS shows or hides view-specific blocks from html[data-view], so the
 * server markup never depends on it and there is no hydration mismatch.
 */
export const viewScript = `(function(){try{var d=document.documentElement;var q=new URLSearchParams(location.search).get('view');var s=null;try{s=localStorage.getItem('sree:view')}catch(e){}var v=(q==='quick'||q==='detailed')?q:((s==='quick'||s==='detailed')?s:'quick');if(q===v){try{localStorage.setItem('sree:view',v)}catch(e){}}d.setAttribute('data-view',v);}catch(e){}})();`;
