/**
 * Runs before first paint (inlined in <head>) so the correct theme is applied
 * with no flash. Stored preference wins; otherwise follow the OS setting.
 */
export const themeScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');d.setAttribute('data-theme',t);d.style.colorScheme=t;}catch(e){}})();`;
