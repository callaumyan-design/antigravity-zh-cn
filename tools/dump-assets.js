(async () => {
  const urls = [...document.querySelectorAll('script[src],link[rel=stylesheet],link[rel=modulepreload]')].map(e => e.src || e.href);
  const perf = performance.getEntriesByType('resource').map(e => e.name).filter(n => /\.(m?js|css)(\?|$)/.test(n));
  const all = [...new Set([...urls, ...perf])];
  return JSON.stringify({ lang: navigator.language, html: document.documentElement.outerHTML.slice(0, 3000), all });
})()
