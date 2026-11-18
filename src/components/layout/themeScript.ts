/**
 * Runs before first paint (inlined in <head>) so the correct theme is applied
 * with no flash. Stored preference wins; otherwise follow the OS setting.
 */
export const themeScript = `(function(){try{var d=document.documentElement;d.classList.add('js');var s=localStorage.getItem('theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');d.setAttribute('data-theme',t);d.style.colorScheme=t;}catch(e){}})();`;

/**
 * Runs before first paint: a fresh visit to the homepage (a new navigation or
 * a reload, with no #anchor) starts at the very top. Browsers, Safari in
 * particular, otherwise restore the previous scroll position on reload or
 * when a tab is reopened, so the page could open partway down. Back/forward
 * keeps the browser's restoration, and so does every later navigation:
 * restoration is handed back to the browser once the page has loaded. Nothing
 * here runs after the visitor starts scrolling.
 */
export const scrollStartScript = `(function(){try{if(location.pathname!=='/'||location.hash)return;var n=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward')return;if(!('scrollRestoration' in history))return;history.scrollRestoration='manual';var moved=false;var mark=function(){moved=true};['wheel','touchstart','keydown','pointerdown'].forEach(function(e){addEventListener(e,mark,{once:true,passive:true})});var top=function(){if(!moved&&window.scrollY!==0)window.scrollTo(0,0)};document.addEventListener('DOMContentLoaded',top);addEventListener('load',function(){top();setTimeout(function(){history.scrollRestoration='auto'},0)})}catch(e){}})();`;
