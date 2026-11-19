(() => {
  const miss = new Set();
  const tw = document.createTreeWalker(document.body, 5);
  let n;
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  while ((n = tw.nextNode())) {
    if (n.nodeType === 3) {
      const t = n.nodeValue.trim();
      if (t.length > 1 && /[A-Za-z]{2}/.test(t) && n.parentElement && vis(n.parentElement) && !n.parentElement.closest('code,pre,.monaco-editor,.markdown,.prose')) miss.add('T|' + t);
    } else {
      for (const a of ['placeholder', 'title', 'aria-label', 'data-placeholder']) { const v = n.getAttribute(a); if (v && /[A-Za-z]{2}/.test(v)) miss.add(a + '|' + v); }
    }
  }
  return JSON.stringify([...miss]);
})()
