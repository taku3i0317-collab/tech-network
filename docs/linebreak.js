// 日本語の折り返し（S-016）：言葉の途中で改行しないように、文節（「たどり着いた」のようなまとまり）の切れ目でだけ折り返す。
// 切れ目は BudouX（Google の文節の道具、docs/vendor/budoux-ja.min.js、Apache License 2.0）が見つけ、見えない空白（ゼロ幅スペース）を入れる。
// Safari でも効く。CSS の word-break: auto-phrase（Chrome）も design.css で一緒に使う。英語のときは何もしない（英語は hyphens: auto）。
// 画面が書き換わったら（カード・ページの中身）、新しい文にも入れる
(function () {
  let parser = null, obs = null;
  const isJa = () => document.documentElement.lang !== 'en';
  function getParser() {
    if (!parser && window.customElements && customElements.get('budoux-ja')) { parser = document.createElement('budoux-ja').parser; if (parser.htmlProcessor) parser.htmlProcessor.className = 'bx'; }   // 済んだ箱に bx を付け、二度目は飛ばす（見えない空白が何重にも入らないように）
    return parser;
  }
  const SKIP = 'svg, canvas, script, style, input, textarea, select, button, code, pre, .results';
  function apply(root) {
    const p = getParser();
    if (!p || !isJa() || !root || root.nodeType !== 1 || root.closest(SKIP)) return;
    // 文の途中の小さな箱（ふりがなの span など）なら、その段落の箱ごとやり直す
    while (root.parentElement && root !== document.body && /^inline/.test(getComputedStyle(root).display)) root = root.parentElement;
    if (obs) obs.disconnect();
    // 何度やっても同じになるように、前に入れた見えない空白と「済み」の印を消してから入れ直す
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const t = w.currentNode; if (t.nodeValue.includes('​')) t.nodeValue = t.nodeValue.replace(/​/g, ''); }
    root.classList.remove('bx'); root.querySelectorAll('.bx').forEach(e => e.classList.remove('bx'));
    try { p.applyToElement(root); } catch (e) { /* 折り返しは見た目だけなので、失敗しても先へ */ }
    watch();
  }
  function watch() {
    if (!obs) obs = new MutationObserver(ms => {
      const roots = new Set();
      for (const m of ms) for (const n of m.addedNodes) {
        const el = n.nodeType === 1 ? n : n.parentElement;
        if (n.nodeType === 3 && el) el.classList.remove('bx');   // 済んだ箱に新しい文が入ったら、もう一度
        if (el && el.isConnected && !(el.tagName === 'RT')) roots.add(el);
      }
      for (const r of roots) apply(r);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function init() { apply(document.body); }
  window.LineBreak = { init, apply };
})();
