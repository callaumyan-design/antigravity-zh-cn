
// ==== Antigravity 简体中文汉化注入（agy-zh-CN patch）====
(function agyZhCN() {
    'use strict';
    try {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        if (!/^https:\/\/127\.0\.0\.1:\d+\//.test(String(location.href))) return;
        if (window.__agyZhCN) return;
        window.__agyZhCN = true;
        const DICT = /*__DICT__*/ {};
        const RULES = /*__RULES__*/ [];
        const rules = RULES.map(([p, r]) => [new RegExp('^' + p + '$'), r]);
        const ATTRS = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'alt'];
        const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'KBD', 'SAMP']);
        // 不翻译：代码编辑器、可编辑区、终端、对话 Markdown 正文
        const SKIP_SEL = '[contenteditable=""],[contenteditable="true"],.monaco-editor,.cm-editor,.xterm,.markdown,.prose,[data-agy-no-zh],' +
            '[data-testid="agent-response"] .select-text,[data-testid="user-message-content"],[data-testid="breadcrumb-segment"],' +
            '[data-testid="conversation-row-sidebar"] .truncate,[data-testid="agent-input-box"] [contenteditable],input[type=text]:not([placeholder])';
        const has = (k) => Object.prototype.hasOwnProperty.call(DICT, k);
        // 规则替换串中 $T1..$T9 表示「该捕获组先查词典再代入」
        const applyRule = (t, re, r) => {
            const m = re.exec(t);
            return r.replace(/\$(T?)(\d)/g, (_, tr, n) => {
                const g = m[+n] ?? '';
                if (!tr) return g;
                if (has(g)) return DICT[g];
                for (const [re2, r2] of rules) { if (re2 !== re && re2.test(g)) return applyRule(g, re2, r2); }
                return g;
            });
        };
        const lookup = (raw) => {
            if (!raw) return null;
            const t = raw.trim();
            if (t.length < 2 || !/[A-Za-z]/.test(t)) return null;
            let v = has(t) ? DICT[t] : undefined;
            if (v === undefined) {
                for (const [re, r] of rules) { if (re.test(t)) { v = applyRule(t, re, r); break; } }
            }
            if (v === undefined || v === t) return null;
            if (t === raw) return v;
            const i = raw.indexOf(t);
            return raw.slice(0, i) + v + raw.slice(i + t.length);
        };
        const skipped = (el) => !!el && (SKIP_TAGS.has(el.tagName) || !!(el.closest && el.closest(SKIP_SEL)));
        const doText = (n) => {
            const p = n.parentElement;
            if (!p || skipped(p)) return;
            const v = lookup(n.nodeValue);
            if (v !== null) n.nodeValue = v;
        };
        const doAttrs = (el) => {
            if (!el.getAttribute) return;
            for (const a of ATTRS) {
                const cur = el.getAttribute(a);
                if (cur) { const v = lookup(cur); if (v !== null) el.setAttribute(a, v); }
            }
        };
        const walk = (root) => {
            if (root.nodeType === 3) { doText(root); return; }
            if (root.nodeType !== 1 && root.nodeType !== 11) return;
            if (root.nodeType === 1) {
                if (SKIP_TAGS.has(root.tagName)) { if (root.tagName === 'TEXTAREA') doAttrs(root); return; }
                doAttrs(root);
                if (root.closest && root.closest(SKIP_SEL)) return;
            }
            const tw = document.createTreeWalker(root, 5, {
                acceptNode: (n) => {
                    if (n.nodeType !== 1) return 1;
                    if (SKIP_TAGS.has(n.tagName)) { if (n.tagName === 'TEXTAREA') doAttrs(n); return 2; }
                    if (n.matches && n.matches(SKIP_SEL)) { doAttrs(n); return 2; }
                    return 1;
                },
            });
            let n;
            while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
        };
        let textQ = new Set(), attrQ = new Set(), scheduled = false;
        const flush = () => {
            scheduled = false;
            const tq = textQ, aq = attrQ;
            textQ = new Set(); attrQ = new Set();
            for (const n of tq) if (n.isConnected) walk(n);
            for (const el of aq) if (el.isConnected) doAttrs(el);
        };
        const kick = () => { if (!scheduled) { scheduled = true; queueMicrotask(flush); } };
        const obs = new MutationObserver((muts) => {
            for (const m of muts) {
                if (m.type === 'childList') m.addedNodes.forEach((n) => textQ.add(n));
                else if (m.type === 'characterData') textQ.add(m.target);
                else attrQ.add(m.target);
            }
            kick();
        });
        const start = () => {
            if (!document.documentElement) return;
            walk(document.documentElement);
            obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
        else start();
    } catch (e) {
        try { console.warn('[agy-zh] injector failed', e); } catch (_) { /* ignore */ }
    }
})();
