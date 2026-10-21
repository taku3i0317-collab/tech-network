// シェアボタン（S-024）。<button data-share="番号" data-share-view="center|map|node"> を押すと：
// スマホなど Web Share API が使える機器は、機器のシェアの画面（LINE・インスタ・X など）を出す。
// 使えないとき（パソコンなど）は小さな窓に「リンクをコピー」「X」「LINE」。外の会社のシェア用のスクリプトは読み込まない（ただのリンクの URL）。
// 送る物：今見ている物の URL（開くと同じ所が出る）と短い文（「スマホを作るには、254 の技術が要った。」数はデータから数える）
(function () {
  const G = window.TECH_GRAPH;
  const byId = new Map(G.nodes.map(n => [n.id, n]));
  const parents = new Map();
  for (const [f, t, k] of G.edges) if (k === 'r' || k === 'e' || k === 'p' || k === 'u') (parents.get(t) || parents.set(t, []).get(t)).push(f);   // 中心図・ムービーと同じ数え方（S-031：なぜ動くかの知恵も）
  const EN = () => document.documentElement.lang === 'en';
  const nm = n => (EN() && n.name_en) || n.name;
  function ancestors(id) {
    const seen = new Set([id]); let q = [id];
    while (q.length) { const nq = []; for (const u of q) for (const p of parents.get(u) || []) if (!seen.has(p) && byId.has(p)) { seen.add(p); nq.push(p); } q = nq; }
    return seen.size - 1;
  }
  function payload(id, view) {
    const n = byId.get(id), page = view === 'node' ? 'nodes/' : view === 'map' ? 'network.html#map/' : 'network.html#center/';
    const url = new URL(page + encodeURIComponent(id) + (view === 'node' ? '.html' : ''), document.baseURI).href;   // S-054：ノードのページ。<base> のあるページでも正しい URL に
    const k = ancestors(id), title = EN() ? 'Technology network' : '技術ネットワーク';
    const text = !n ? title : k
      ? (EN() ? `To make ${nm(n)}, it took ${k} technologies.` : `${nm(n)}を作るには、${k} の技術が要った。`)
      : (EN() ? `${nm(n)} — where it all started.` : `${nm(n)}——ここから始まった。`);
    return { title, text, url };
  }
  let box = null;
  function sheet(p) {
    if (!box) {
      box = document.createElement('div'); box.className = 'shareSheet'; box.hidden = true; box.setAttribute('role', 'dialog');
      document.body.appendChild(box);
      document.addEventListener('pointerdown', e => { if (!box.hidden && !box.contains(e.target) && !e.target.closest('[data-share]')) box.hidden = true; }, true);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') box.hidden = true; });
    }
    const x = 'https://twitter.com/intent/tweet?' + new URLSearchParams({ text: p.text, url: p.url });
    const line = 'https://social-plugins.line.me/lineit/share?' + new URLSearchParams({ url: p.url, text: p.text });
    box.innerHTML = `<p class="t">${p.text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>
      <div class="row"><button type="button" class="btn copy">📋 ${EN() ? 'Copy link' : 'リンクをコピー'}</button>
      <a class="btn" href="${x}" target="_blank" rel="noopener noreferrer">X</a><a class="btn" href="${line}" target="_blank" rel="noopener noreferrer">LINE</a>
      <button type="button" class="btn close" aria-label="${EN() ? 'Close' : '閉じる'}">✕</button></div><p class="done" hidden></p>`;
    box.hidden = false;
    box.querySelector('.close').onclick = () => { box.hidden = true; };
    box.querySelector('.copy').onclick = async () => {
      const done = box.querySelector('.done');
      try { await navigator.clipboard.writeText(p.url); done.textContent = EN() ? 'Copied' : 'コピーしました'; }
      catch (e) { done.textContent = p.url; }   // コピーできない環境では URL を見せる（自分で選んでコピー）
      done.hidden = false;
    };
  }
  async function share(id, view) {
    const p = payload(id, view);
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share(p); return; } catch (e) { if (e && e.name === 'AbortError') return; }   // やめたときは何もしない
    }
    sheet(p);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-share]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); share(b.dataset.share, b.dataset.shareView || 'center');
  }, true);
  window.Share = { share, payload };
})();
