// 「〇〇を作るには？」のミニムービー（S-017 の見本 → S-020 で本番）。モノの番号を渡すだけで動く1つの部品：Film.play(id, { onEnd })
// 1 真ん中にモノ →「〇〇を作るには？」 2 前提の技術が世代ごとに（近い→遠い）外から集まって線でつながる（数を数える）
// 3 いちばん奥の打製石器 →「全部、ここから始まった」 4 まわりに人の肖像 →「〇人＋名前の残っていない、たくさんの人たち」
// 5 石器 → モノへ光が走る →「次は、あなたが選んで」。数はすべてデータ（tech_network_graph.js・tech_network_detail.js）から数える。
// 10〜15 秒。右上の「とばす」でいつでも終わり、画面のどこを押しても次の場面へ、Esc でも終わる。音は無し。
// 「動きを減らす」の設定（prefers-reduced-motion）では動かさず、同じ内容を静止画の5枚で（押すと次）。
// 軽く（S-020）：canvas 1枚にまとめて描く。アイコンは1枚の絵（アトラス）にまとめて写す。DOM は文と数とボタンだけ。
// requestAnimationFrame、タブが裏にある間は止まって時間も進めない。効果はドット絵に合わせて、ぼかさない・点滅しない
(function () {
  const G = window.TECH_GRAPH;
  const byId = new Map(G.nodes.map(n => [n.id, n]));
  const parents = new Map();
  for (const [f, t, k] of G.edges) if (k === 'r' || k === 'e' || k === 'p') (parents.get(t) || parents.set(t, []).get(t)).push(f);
  const EN = () => document.documentElement.lang === 'en';
  const nm = n => (EN() && n.name_en) || n.name;
  const T = {
    ask: n => EN() ? `What does it take to make ${nm(n)}?` : `${nm(n)}を作るには？`,
    count: k => EN() ? `${k} technologies` : `${k} 個の技術`,
    gen: (d, n) => EN() ? ` · ${d} step${d > 1 ? 's' : ''} back: +${n}` : `・${d} 世代前 +${n}`,
    origin: EN() ? 'It all started here.' : '全部、ここから始まった',
    people: (p, a) => EN() ? `${p} people + many whose names are lost (${a} technologies)` : `${p} 人＋名前の残っていない、たくさんの人たち（${a} の技術）`,
    you: EN() ? 'Now it is your turn to choose.' : '次は、あなたが選んで',
    skip: EN() ? 'Skip ▶▶' : 'とばす ▶▶',
    next: EN() ? 'Next ▶' : '次へ ▶',
  };
  const reduce = () => !!window.FILM_STILL || matchMedia('(prefers-reduced-motion: reduce)').matches;   // FILM_STILL：見本で静止画を確かめる用
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  let detailP = null;
  const loadDetail = () => detailP || (detailP = window.TECH_DETAIL ? Promise.resolve() : new Promise(res => {
    const s = document.createElement('script'); s.src = (window.FILM_BASE || '') + 'tech_network_detail.js'; s.onload = res; s.onerror = res; document.head.appendChild(s);
  }));
  // 画面の文・ボタンの見た目（ページの CSS に無くても動くように、ここで1回だけ入れる）
  function style() {
    if (document.getElementById('film-css')) return;
    const st = document.createElement('style'); st.id = 'film-css';
    st.textContent = `.film{position:fixed;inset:0;z-index:100;background:var(--bg,#f8f5ee);transition:opacity 400ms;outline:none;cursor:pointer}.film.out{opacity:0}
.film canvas{position:absolute;inset:0}.film .cap{position:absolute;left:16px;right:16px;bottom:calc(10% + env(safe-area-inset-bottom));text-align:center;font-family:var(--font-pixel,sans-serif);font-size:clamp(20px,4.5vw,34px);line-height:1.4;color:var(--ink,#222);text-shadow:0 0 6px var(--bg,#fff),0 0 12px var(--bg,#fff)}
.film .cap.in{animation:filmcap 400ms ease-out}@keyframes filmcap{from{opacity:0;transform:translateY(8px)}}
.film .cnt{position:absolute;left:16px;top:18px;font-size:clamp(15px,3.6vw,20px);color:var(--sub,#666);font-weight:700}
.film .skip{position:absolute;right:12px;top:12px;min-height:48px;padding:0 18px;font:inherit;font-size:16px;font-weight:700;border:1px solid var(--accent,#2f6f8f);color:var(--accent,#2f6f8f);background:var(--panel,#fff);border-radius:12px;cursor:pointer}
.film .nextb{position:absolute;right:12px;bottom:16px;min-height:48px;padding:0 18px;font:inherit;font-size:16px;font-weight:700;border:0;color:var(--panel,#fff);background:var(--accent,#2f6f8f);border-radius:12px}
@media (prefers-reduced-motion: reduce){.film,.film .cap.in{transition:none;animation:none}}`;
    document.head.appendChild(st);
  }

  // 祖先を世代（何段さかのぼるか、いちばん近い道）で分け、円の上の角度を決める
  function build(id) {
    const dist = new Map([[id, 0]]), via = new Map();
    let q = [id];
    while (q.length) { const nq = []; for (const u of q) for (const p of parents.get(u) || []) if (!dist.has(p) && byId.has(p)) { dist.set(p, dist.get(u) + 1); via.set(p, u); nq.push(p); } q = nq; }
    const layers = [];
    for (const [k, d] of dist) (layers[d] || (layers[d] = [])).push(k);
    const ang = new Map([[id, -Math.PI / 2]]);
    for (let d = 1; d < layers.length; d++) {
      const L = layers[d].sort((a, b) => ang.get(via.get(a)) - ang.get(via.get(b)) || (byId.get(a).year ?? 0) - (byId.get(b).year ?? 0));
      const off = d % 2 ? 0 : Math.PI / L.length;
      L.forEach((k, i) => ang.set(k, -Math.PI / 2 + off + (i / L.length) * Math.PI * 2));
    }
    return { dist, via, layers, ang };
  }
  // アイコンのアトラス：使うアイコンを 16×16 で1枚の canvas に並べる（読めた物から順に）
  function atlas(ids) {
    const cols = 32, c = document.createElement('canvas'), slot = new Map();
    c.width = cols * 16; c.height = Math.ceil(ids.length / cols) * 16 || 16;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    ids.forEach((id, i) => {
      const n = byId.get(id); if (!n || !n.icon) return;
      const im = new Image(), x = (i % cols) * 16, y = Math.floor(i / cols) * 16;
      im.onload = () => { g.drawImage(im, x, y, 16, 16); slot.set(id, [x, y]); };
      im.src = n.icon;
    });
    return { c, slot };
  }

  function play(id, opt = {}) {
    const target = byId.get(id); if (!target) return;
    style();
    const { dist, via, layers, ang } = build(id);
    const total = dist.size - 1, nL = layers.length - 1;
    const stone = dist.has('0-01') ? '0-01' : layers[nL][0];
    const P2 = Math.max(1800, Math.min(6500, nL * 750));
    const t1 = 1400, t2 = t1 + P2 + 700, t3 = t2 + 1800, t4 = t3 + 2400, t5 = t4 + 2300;
    const STARTS = [0, t1, t2, t3, t4, t5];
    const A = atlas([...dist.keys()]);
    loadDetail();

    const root = document.createElement('div');
    root.className = 'film';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', T.ask(target));
    root.innerHTML = `<canvas></canvas><div class="cap" aria-live="polite"></div><div class="cnt"></div>
      <button type="button" class="skip">${T.skip}</button>${reduce() ? `<button type="button" class="nextb">${T.next}</button>` : ''}`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false }), cap = root.querySelector('.cap'), cnt = root.querySelector('.cnt');
    let W = 0, H = 0, dpr = 1;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
    resize(); addEventListener('resize', resize);
    const C = { bg: css('--bg') || '#f8f5ee', ink: css('--ink') || '#222', sub: css('--sub') || '#777', hl: css('--hl') || '#d2691e', prod: css('--node-prod') || '#2f6f8f', tech: css('--node-tech') || '#8a6a4a' };

    let people = null;
    loadDetail().then(() => {
      const D = window.TECH_DETAIL; if (!D) return;
      const seen = new Map(); let anon = 0;
      for (const k of dist.keys()) {
        const ps = (D.nodes[k] && D.nodes[k].people) || [];
        if (!ps.length && k !== id) anon++;
        for (const p of ps) if (!seen.has(p.name)) seen.set(p.name, p.pi != null ? D.portraits[p.pi] : null);
      }
      const pics = [...seen.values()].filter(Boolean).slice(0, 28).map(src => { const im = new Image(); im.src = src; return im; });
      people = { n: seen.size, anon, pics };
    });

    // 世代の円の半径：数の多い世代ほど間を広く、少ない世代（遠い昔）は詰める。1つ目の円は真ん中の大きな丸に重ならないように
    const RAD = [0]; for (let d = 1; d <= nL; d++) RAD[d] = RAD[d - 1] + Math.max(d === 1 ? 64 : 34, Math.min(90, layers[d].length * 1.15));
    const P = new Map([...dist.keys()].map(k => { const d = dist.get(k), a = ang.get(k); return [k, [Math.cos(a) * RAD[d], Math.sin(a) * RAD[d]]]; }));
    const nodeR = d => d === 0 ? 34 : Math.max(3, Math.min(15, 0.45 * (2 * Math.PI * RAD[d]) / layers[d].length));
    const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
    const layerStart = d => t1 + (d - 1) * (P2 / Math.max(1, nL));
    const path = []; for (let u = stone; u; u = via.get(u)) path.push(u);
    const entries = [...dist.entries()];

    // 時間：タブが裏にある間は止める（戻ったとき続きから）
    let t0 = performance.now(), jump = 0, done = false, still = reduce() ? 0 : -1, hiddenAt = 0;
    const onVis = () => { if (document.hidden) hiddenAt = performance.now(); else if (hiddenAt) { t0 += performance.now() - hiddenAt; hiddenAt = 0; requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', onVis);
    const now = () => still >= 0 ? STARTS[still + 1] - 1 : performance.now() - t0 + jump;
    const stats = window.FILM_STATS = { id, frames: 0, start: performance.now(), first: 0, worst: 0, last: 0 };
    function next() {
      if (still >= 0) { still++; if (still > 4) return end(); return; }
      const t = now(), n = STARTS.find(s => s > t);
      if (n == null || n >= t5) return end();
      jump += n - t;
    }
    function end() {
      if (done) return; done = true;
      root.classList.add('out');
      document.removeEventListener('visibilitychange', onVis);
      setTimeout(() => { root.remove(); removeEventListener('resize', resize); opt.onEnd && opt.onEnd(id); }, reduce() ? 0 : 400);
    }
    root.querySelector('.skip').onclick = e => { e.stopPropagation(); end(); };
    root.addEventListener('click', next);
    root.addEventListener('keydown', e => { if (e.key === 'Escape') end(); });

    let s = 0;
    function frame() {
      if (done || document.hidden) return;
      const fnow = performance.now();
      if (!stats.first) stats.first = fnow - stats.start;
      if (stats.last) stats.worst = Math.max(stats.worst, fnow - stats.last);
      stats.last = fnow; stats.frames++;
      const t = now();
      if (t >= t5 && still < 0) { end(); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      let shown = 0; for (let d = 1; d <= nL; d++) if (t >= layerStart(d)) shown = d;
      const want = Math.min(1.6, (Math.min(W, H * 0.72) / 2 - 24) / (RAD[Math.max(1, shown)] + 18));
      s = s ? s + (want - s) * (still >= 0 ? 1 : 0.06) : want;
      const cx = W / 2, cy = H * 0.46;
      ctx.translate(cx, cy); ctx.scale(s, s);
      const px = 1 / s;   // 画面の 1px
      // 線：前提 → 子。つながった瞬間、光の点が線を走って子へ届く（300ms）
      let arrived = 0;
      ctx.lineWidth = px; ctx.strokeStyle = C.sub; ctx.globalAlpha = 0.25; ctx.beginPath();
      const runs = [];
      for (const [k, d] of entries) {
        if (!d) continue;
        const ls = layerStart(d), p = ease((t - ls) / 700);
        if (p <= 0) continue;
        if (p >= 1) arrived++;
        const [x, y] = P.get(k), [vx, vy] = P.get(via.get(k));
        ctx.moveTo(vx, vy); ctx.lineTo(vx + (x - vx) * p, vy + (y - vy) * p);
        const r = (t - ls - 700) / 300;
        if (r > 0 && r < 1 && still < 0) runs.push([x + (vx - x) * r, y + (vy - y) * r]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = C.hl;
      for (const [x, y] of runs) ctx.fillRect(x - 1.5 * px, y - 1.5 * px, 3 * px, 3 * px);   // 四角い光の点（ドット絵に合わせて、ぼかさない）
      // 点：外から飛んできて円の上へ。飛んでいる間は短い光の尾
      ctx.imageSmoothingEnabled = false;
      for (const [k, d] of entries) {
        const n = byId.get(k);
        let [x, y] = P.get(k), a = 1;
        if (d) {
          const q = (t - layerStart(d)) / 700, p = ease(q); if (p <= 0) continue;
          const far = (Math.max(W, H) / s) * 0.9, aa = ang.get(k), at = pp => far + (RAD[d] - far) * pp;
          x = Math.cos(aa) * at(p); y = Math.sin(aa) * at(p); a = p;
          if (q < 1 && still < 0) {   // 光の尾：少し前の場所から今の場所へ
            const pb = ease(q - 0.12), bx = Math.cos(aa) * at(Math.max(0, pb)), by = Math.sin(aa) * at(Math.max(0, pb));
            ctx.globalAlpha = 0.5 * p; ctx.strokeStyle = C.hl; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y); ctx.stroke();
          }
        } else a = ease(t / 900);
        const r = nodeR(d) * (d ? 1 : 0.6 + 0.4 * a);
        ctx.globalAlpha = a;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = C.bg; ctx.fill();
        const glow = (t >= t2 && k === stone) || (t >= t4 && pathLit(k, t));
        ctx.lineWidth = (glow ? 4 : d ? 1.5 : 3) / Math.max(1, s * 0.8); ctx.strokeStyle = glow ? C.hl : n.kind === 'product' ? C.prod : C.tech; ctx.stroke();
        const sl = A.slot.get(k);
        if (sl && r >= 5) ctx.drawImage(A.c, sl[0], sl[1], 16, 16, x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
      }
      // 打製石器にたどり着いた：光の波が3つ、1回だけ広がる（くり返さない）
      if (t >= t2) {
        const [x, y] = P.get(stone), r0 = nodeR(dist.get(stone));
        for (let i = 0; i < 3; i++) {
          const q = still >= 0 ? 0.5 : (t - t2 - i * 200) / 1200;
          if (q <= 0 || q >= 1) continue;
          ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = C.hl; ctx.lineWidth = 3 * px;
          ctx.beginPath(); ctx.arc(x, y, r0 + 6 * px + q * 40 * px, 0, Math.PI * 2); ctx.stroke();
        }
      }
      // 光の道（5 の場面）：石器 → モノ。走る先に四角い光
      if (t >= t4) {
        const p = Math.min(1, (t - t4) / 1500), m = p * (path.length - 1), i = Math.floor(m);
        ctx.globalAlpha = 1; ctx.strokeStyle = C.hl; ctx.lineWidth = 4 * px; ctx.beginPath();
        let hx = 0, hy = 0;
        for (let j = 0; j <= Math.min(i, path.length - 2); j++) {
          const [ax, ay] = P.get(path[j]), [bx, by] = P.get(path[j + 1]), f = j < i ? 1 : m - i;
          ctx.moveTo(ax, ay); hx = ax + (bx - ax) * f; hy = ay + (by - ay) * f; ctx.lineTo(hx, hy);
        }
        ctx.stroke();
        if (p < 1 && still < 0) { ctx.fillStyle = C.hl; ctx.fillRect(hx - 4 * px, hy - 4 * px, 8 * px, 8 * px); }
        if (p >= 1) {   // モノに届いた：輪が1回広がる
          const q = still >= 0 ? 0.4 : (t - t4 - 1500) / 600;
          if (q > 0 && q < 1) { ctx.globalAlpha = 1 - q; ctx.lineWidth = 3 * px; ctx.beginPath(); ctx.arc(0, 0, nodeR(0) + 6 * px + q * 30 * px, 0, Math.PI * 2); ctx.stroke(); }
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 人の肖像（4 の場面）：画面のふちに、1人ずつ少し下からふわっと並ぶ
      if (t >= t3 && people) {
        const k = people.pics.length, sz = Math.min(48, Math.max(30, W / 12));
        const rx = W / 2 - sz / 2 - 6, ry = Math.min(H * 0.46 - sz / 2 - 8, H * 0.36 - sz / 2);
        people.pics.forEach((im, i) => {
          if (!im.complete || !im.naturalWidth) return;
          const p = still >= 0 ? 1 : ease((t - t3 - i * 40) / 600), a = -Math.PI / 2 + (i / k) * Math.PI * 2;
          if (p <= 0) return;
          ctx.globalAlpha = p * (t >= t4 ? Math.max(0.25, 1 - (t - t4) / 1200) : 1);
          ctx.drawImage(im, Math.round(cx + Math.cos(a) * rx - sz / 2), Math.round(cy + Math.sin(a) * ry - sz / 2 + (1 - p) * 10), sz, sz);
        });
      }
      ctx.globalAlpha = 1;
      const sc = t < t1 ? 0 : t < t2 ? 1 : t < t3 ? 2 : t < t4 ? 3 : 4;
      const capText = [T.ask(target), T.ask(target), `${T.origin}（${nm(byId.get(stone))}）`, people ? T.people(people.n, people.anon) : '…', T.you][sc];
      if (cap.dataset.t !== capText) { cap.dataset.t = capText; cap.textContent = capText; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
      const ct = sc >= 1 ? T.count(Math.min(total, sc >= 2 ? total : arrived)) + (sc === 1 && shown ? T.gen(shown, layers[shown].length) : '') : '';
      if (cnt.textContent !== ct) cnt.textContent = ct;
      requestAnimationFrame(frame);
    }
    function pathLit(k, t) { const i = path.indexOf(k); return i >= 0 && (t - t4) / 1500 >= i / Math.max(1, path.length - 1); }
    root.tabIndex = -1; root.focus();
    requestAnimationFrame(frame);
  }
  // 初めての1回だけ（ブラウザに「見た」を保存。保存できない環境では出さない）
  function firstTime(id, opt) {
    try { if (localStorage.getItem('tn-film-seen')) return false; localStorage.setItem('tn-film-seen', '1'); } catch (e) { return false; }
    play(id, opt); return true;
  }
  window.Film = { play, firstTime };
})();
