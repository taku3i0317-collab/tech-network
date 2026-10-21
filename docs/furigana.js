// ふりがな（S-012 決定1）：「ふりがな」ボタンでオン・オフ。オンのときだけ辞書 furigana_dict.js を読み込み、
// 漢字のある言葉に <ruby> で読みを付ける。辞書は tools/gen_furigana.py が作る（読みの手直しは docs/furigana_fix.json）。
// 設定はブラウザに保存（tn-furi）。英語のときは何もしない。図（SVG・canvas）の文字には付けない
(function () {
  const KEY = 'tn-furi', SKIP = /^(SCRIPT|STYLE|RUBY|RT|RP|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE|SVG|CANVAS|TITLE)$/i;
  let on = false, RE = null, obs = null, loading = null;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) { /* 保存できない環境 */ }
  const isEn = () => document.documentElement.lang === 'en';
  function load() {
    if (window.FURI_DICT) return Promise.resolve();
    if (!loading) loading = new Promise((ok, ng) => {
      const s = document.createElement('script'); s.src = 'furigana_dict.js'; s.onload = ok; s.onerror = ng; document.head.appendChild(s);
    });
    return loading;
  }
  function regex() {
    if (RE) return RE;
    const keys = Object.keys(window.FURI_DICT).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return (RE = new RegExp(keys.join('|'), 'g'));
  }
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  function ruby(w) {
    const v = window.FURI_DICT[w], [pre, r, suf] = Array.isArray(v) ? v : [0, v, 0];
    const mid = w.slice(pre, w.length - suf);
    return esc(w.slice(0, pre)) + `<ruby class="fu">${esc(mid)}<rt>${esc(r)}</rt></ruby>` + esc(w.slice(w.length - suf));
  }
  function apply(root) {
    if (!on || isEn() || !window.FURI_DICT || !root) return;
    const re = regex(), list = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(t) {
        for (let p = t.parentNode; p && p !== root.parentNode; p = p.parentNode) if (p.nodeType === 1 && (SKIP.test(p.nodeName) || p.closest && p.closest('svg'))) return NodeFilter.FILTER_REJECT;
        return /[一-龥々]/.test(t.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while (w.nextNode()) list.push(w.currentNode);
    if (obs) obs.disconnect();
    for (const t of list) {
      re.lastIndex = 0;
      const s = t.nodeValue; let html = '', last = 0, m, hit = false;
      while ((m = re.exec(s))) { html += esc(s.slice(last, m.index)) + ruby(m[0]); last = m.index + m[0].length; hit = true; }
      if (!hit) continue;
      const span = document.createElement('span'); span.className = 'fuw'; span.innerHTML = html + esc(s.slice(last));
      t.replaceWith(span);
    }
    watch();
  }
  function remove() {
    if (obs) obs.disconnect();
    document.querySelectorAll('span.fuw').forEach(sp => {
      sp.querySelectorAll('rt').forEach(rt => rt.remove());
      sp.replaceWith(document.createTextNode(sp.textContent));
    });
  }
  // 画面が書き換わったら（カードを開く・ページの中身を作り直す）、新しい文字にも付ける
  function watch() {
    if (!obs) obs = new MutationObserver(ms => {
      const roots = new Set();
      for (const m of ms) for (const n of m.addedNodes) if (!(n.nodeType === 1 && n.classList.contains('fuw'))) roots.add(n.nodeType === 1 ? n : n.parentNode);
      for (const r of roots) if (r && r.isConnected) apply(r);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  function setBtn(b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('on', on); }
  // btn：「ふりがな」ボタン（英語のときは隠す）
  function init(btn) {
    if (btn) {
      btn.hidden = isEn();
      setBtn(btn);
      btn.addEventListener('click', () => {
        on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* 保存できない */ }
        setBtn(btn);
        if (on) load().then(() => apply(document.body)); else remove();
      });
    }
    if (on && !isEn()) load().then(() => apply(document.body));
  }
  window.Furigana = { init, apply };
})();
