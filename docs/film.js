// 「〇〇を作るには？」のミニムービーと、その最後に止まる「中心図」（S-017 → S-020 本番 → S-021）。
// Film.play(id, opt)：ムービー。Film.center(id, opt)：中心図だけ。opt = { onCenter(id), onClose(id) }
// ムービー：1 真ん中にモノ「〇〇を作るには？」 2 前提の技術が世代ごとに（近い→遠い）外から集まって線でつながる
// 3 前提の無い「始まり」を全部光らせる「たくさんの始まりから」 4 人の肖像「〇人＋名前の残っていない、たくさんの人たち」
// 5 光が全部の始まりから同時に、本当の前提のつながりを通ってモノへ流れ込む（1本の道を選ばない）→ 中心図で止まる。
// 「とばす」でも中心図へ。数はすべてデータから数える。音は無し。動きを減らす設定では静止画5枚（押すと次）→ 中心図。
// 中心図：真ん中にそのモノ、内側の輪＝すぐ要る物、外へいくほど昔の前提。丸を押すとその丸が真ん中に。
// 指で動かす・2本の指やホイールで拡大。混んだ輪は小さな点と「＋数」でまとめ、拡大すると絵と名前が出る。
// 軽く：canvas 1枚、アイコンは1枚の絵（アトラス）から、ノードごとの DOM は作らない、タブが裏の間は止める
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
    roots: n => n > 1 ? (EN() ? `From many beginnings (${n} starting points)` : `たくさんの始まりから（${n} 個の始まり）`) : (EN() ? 'It all started here.' : '全部、ここから始まった'),
    people: (p, a) => EN() ? `${p} people + many whose names are lost (${a} technologies)` : `${p} 人＋名前の残っていない、たくさんの人たち（${a} の技術）`,
    you: EN() ? 'Now it is your turn to choose.' : '次は、あなたが選んで',
    skip: EN() ? 'Skip ▶▶' : 'とばす ▶▶',
    next: EN() ? 'Next ▶' : '次へ ▶',
    close: EN() ? '✕ Close' : '✕ 閉じる',
    watch: EN() ? '▶ Watch' : '▶ できるまでを観る',
    detail: EN() ? 'Details' : '詳しく見る',
    hint: EN() ? 'Tap a circle to put it in the middle' : '丸を押すと、それが真ん中に',
    sum: (n, r) => EN() ? `${n} technologies · ${r} starting points` : `${n} の技術・${r} 個の始まり`,
  };
  const reduce = () => !!window.FILM_STILL || matchMedia('(prefers-reduced-motion: reduce)').matches;   // FILM_STILL：見本で静止画を確かめる用
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  let detailP = null;
  const loadDetail = () => detailP || (detailP = window.TECH_DETAIL ? Promise.resolve() : new Promise(res => {
    const s = document.createElement('script'); s.src = (window.FILM_BASE || '') + 'tech_network_detail.js'; s.onload = res; s.onerror = res; document.head.appendChild(s);
  }));
  function style() {
    if (document.getElementById('film-css')) return;
    const st = document.createElement('style'); st.id = 'film-css';
    st.textContent = `.film{position:fixed;inset:0;z-index:100;background:var(--bg,#f8f5ee);transition:opacity 400ms;outline:none;touch-action:none}.film.out{opacity:0}
.film canvas{position:absolute;inset:0}.film .cap{position:absolute;left:16px;right:16px;bottom:calc(10% + env(safe-area-inset-bottom));text-align:center;font-family:var(--font-pixel,sans-serif);font-size:clamp(20px,4.5vw,34px);line-height:1.4;color:var(--ink,#222);text-shadow:0 0 6px var(--bg,#fff),0 0 12px var(--bg,#fff);pointer-events:none}
.film .cap.in{animation:filmcap 400ms ease-out}@keyframes filmcap{from{opacity:0;transform:translateY(8px)}}
.film .cnt{position:absolute;left:16px;top:18px;right:150px;font-size:clamp(15px,3.6vw,20px);color:var(--sub,#666);font-weight:700;pointer-events:none}
.film .skip{position:absolute;right:12px;top:12px;min-height:48px;padding:0 18px;font:inherit;font-size:16px;font-weight:700;border:1px solid var(--accent,#2f6f8f);color:var(--accent,#2f6f8f);background:var(--panel,#fff);border-radius:12px;cursor:pointer}
.film .nextb{position:absolute;right:12px;bottom:16px;min-height:48px;padding:0 18px;font:inherit;font-size:16px;font-weight:700;border:0;color:var(--panel,#fff);background:var(--accent,#2f6f8f);border-radius:12px}
.film .bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;padding:8px 12px calc(8px + env(safe-area-inset-bottom));background:var(--panel,#fff);border-top:1px solid var(--line,#ddd)}
.film .bar[hidden]{display:none}.film .bar a,.film .bar button{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border:1px solid var(--accent,#2f6f8f);border-radius:10px;color:var(--accent,#2f6f8f);background:var(--panel,#fff);text-decoration:none;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.film.centerMode .cap{bottom:calc(76px + env(safe-area-inset-bottom));font-size:clamp(18px,4vw,26px)}
.film .fhint{position:absolute;left:16px;top:52px;font-size:13px;color:var(--sub,#666);pointer-events:none}
@media (prefers-reduced-motion: reduce){.film,.film .cap.in{transition:none;animation:none}}`;
    document.head.appendChild(st);
  }

  // ---- 図の形（世代ごとの輪）：祖先を「何段さかのぼるか（いちばん近い道）」で分け、円の上の角度を決める ----
  function scene(id) {
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
    const nL = layers.length - 1;
    const RAD = [0]; for (let d = 1; d <= nL; d++) RAD[d] = RAD[d - 1] + Math.max(d === 1 ? 64 : 34, Math.min(90, layers[d].length * 1.15));
    const P = new Map([...dist.keys()].map(k => { const d = dist.get(k), a = ang.get(k); return [k, [Math.cos(a) * RAD[d], Math.sin(a) * RAD[d]]]; }));
    // 始まり＝前提の無いノード（データの中で）。光は全部の始まりから同時に、前提のつながり（via）をたどってモノへ
    const roots = [...dist.keys()].filter(k => k !== id && !(parents.get(k) || []).some(p => byId.has(p)));
    const lit = new Map();   // 線（k→via）が光る段（始まりから何段目か。いちばん早い物）
    let hops = 1;
    for (const r of roots) { let j = 0; for (let u = r; via.has(u); u = via.get(u)) { j++; if (!lit.has(u) || lit.get(u) > j) lit.set(u, j); } hops = Math.max(hops, j); }
    return { id, dist, via, layers, ang, nL, RAD, P, roots, lit, hops, total: dist.size - 1, entries: [...dist.entries()] };
  }
  const nodeR = (S, d) => d === 0 ? 34 : Math.max(3, Math.min(15, 0.45 * (2 * Math.PI * S.RAD[d]) / S.layers[d].length));
  // アイコンのアトラス：全部のノードのアイコンを 16×16 で1枚の canvas に（1回だけ、読めた物から）
  let ATL = null;
  function atlas() {
    if (ATL) return ATL;
    const cols = 32, c = document.createElement('canvas'), slot = new Map();
    c.width = cols * 16; c.height = Math.ceil(G.nodes.length / cols) * 16;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    G.nodes.forEach((n, i) => {
      if (!n.icon) return;
      const im = new Image(), x = (i % cols) * 16, y = Math.floor(i / cols) * 16;
      im.onload = () => { g.drawImage(im, x, y, 16, 16); slot.set(n.id, [x, y]); if (ATL && ATL.cb && !ATL.t) ATL.t = setTimeout(() => { ATL.t = 0; ATL.cb && ATL.cb(); }, 50); };   // 読めたら描き直す（中心図は止まっているので）
      im.src = n.icon;
    });
    return (ATL = { c, slot, cb: null, t: 0 });
  }
  const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

  // ---- 1つの重ね（ムービーにも中心図にも使う） ----
  function open(id, opt = {}, film = true) {
    if (!byId.has(id)) return null;
    style(); loadDetail();
    const A = atlas();
    A.cb = () => req();
    const root = document.createElement('div');
    root.className = 'film';
    root.setAttribute('role', 'dialog');
    root.innerHTML = `<canvas></canvas><div class="cnt"></div><div class="fhint" hidden></div><div class="cap" aria-live="polite"></div>
      <button type="button" class="skip"></button>${reduce() && film ? `<button type="button" class="nextb">${T.next}</button>` : ''}
      <div class="bar" hidden><button type="button" class="watch">${T.watch}</button><a class="detail" href="#">${T.detail}</a></div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false });
    const cap = root.querySelector('.cap'), cnt = root.querySelector('.cnt'), hint = root.querySelector('.fhint'), skip = root.querySelector('.skip'), bar = root.querySelector('.bar');
    let W = 0, H = 0, dpr = 1;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; req(); };
    addEventListener('resize', resize);
    const C = { bg: css('--bg') || '#f8f5ee', ink: css('--ink') || '#222', sub: css('--sub') || '#777', hl: css('--hl') || '#d2691e', prod: css('--node-prod') || '#2f6f8f', tech: css('--node-tech') || '#8a6a4a', font: css('--font') || 'sans-serif' };

    let S = scene(id), mode = film ? 'film' : 'center', people = null;
    const loadPeople = () => loadDetail().then(() => {
      const D = window.TECH_DETAIL; if (!D) return;
      const seen = new Map(); let anon = 0;
      for (const k of S.dist.keys()) {
        const ps = (D.nodes[k] && D.nodes[k].people) || [];
        if (!ps.length && k !== S.id) anon++;
        for (const p of ps) if (!seen.has(p.name)) seen.set(p.name, p.pi != null ? D.portraits[p.pi] : null);
      }
      people = { n: seen.size, anon, pics: [...seen.values()].filter(Boolean).slice(0, 28).map(src => { const im = new Image(); im.src = src; im.onload = req; return im; }) };
    });
    if (film) loadPeople();

    // ムービーの時間割（ms）
    let P2, t1, t2, t3, t4, t5, STARTS;
    const timing = () => { P2 = Math.max(1800, Math.min(6500, S.nL * 750)); t1 = 1400; t2 = t1 + P2 + 700; t3 = t2 + 1800; t4 = t3 + 2400; t5 = t4 + 2300; STARTS = [0, t1, t2, t3, t4, t5]; };
    timing();
    const layerStart = d => t1 + (d - 1) * (P2 / Math.max(1, S.nL));
    let t0 = performance.now(), jump = 0, still = reduce() && film ? 0 : -1, hiddenAt = 0, done = false;
    const now = () => still >= 0 ? STARTS[still + 1] - 1 : performance.now() - t0 + jump;
    const onVis = () => { if (document.hidden) hiddenAt = performance.now(); else { if (hiddenAt && mode === 'film') t0 += performance.now() - hiddenAt; hiddenAt = 0; req(); } };
    document.addEventListener('visibilitychange', onVis);
    const stats = window.FILM_STATS = { id, frames: 0, start: performance.now(), first: 0, worst: 0, last: 0 };

    // 中心図の見る場所（拡大・移動）
    let zoom = 1, panX = 0, panY = 0, s = 0;
    function toCenter(newId, push) {
      if (newId !== S.id) { S = scene(newId); people = null; }
      mode = 'center'; zoom = 1; panX = panY = 0; s = 0;
      root.classList.add('centerMode'); root.setAttribute('aria-label', nm(byId.get(S.id)));
      skip.textContent = T.close; bar.hidden = false; hint.hidden = false; hint.textContent = T.hint;
      root.querySelector('.detail').href = `${opt.base || ''}node.html#${S.id}`;
      const nx = root.querySelector('.nextb'); if (nx) nx.remove();
      cap.dataset.t = ''; if (push !== false && opt.onCenter) opt.onCenter(S.id);
      req();
    }
    function startFilm(newId) {
      if (newId !== S.id) S = scene(newId);
      mode = 'film'; people = null; loadPeople(); timing();
      t0 = performance.now(); jump = 0; still = reduce() ? 0 : -1; s = 0;
      root.classList.remove('centerMode'); skip.textContent = T.skip; bar.hidden = true; hint.hidden = true;
      root.setAttribute('aria-label', T.ask(byId.get(S.id)));
      if (still >= 0 && !root.querySelector('.nextb')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'nextb'; b.textContent = T.next; root.appendChild(b); }
      req();
    }
    function close() {
      if (done) return; done = true;
      root.classList.add('out');
      document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', resize);
      setTimeout(() => { root.remove(); opt.onClose && opt.onClose(S.id); }, reduce() ? 0 : 400);
    }
    function next() {
      if (mode !== 'film') return;
      if (still >= 0) { still++; if (still > 4) toCenter(S.id); else req(); return; }
      const t = now(), n = STARTS.find(x => x > t);
      if (n == null || n >= t5) return toCenter(S.id);
      jump += n - t;
    }
    skip.onclick = e => { e.stopPropagation(); if (mode === 'film') toCenter(S.id); else close(); };
    root.querySelector('.watch').onclick = e => { e.stopPropagation(); startFilm(S.id); };
    root.querySelector('.detail').addEventListener('click', e => e.stopPropagation());
    root.addEventListener('keydown', e => { if (e.key === 'Escape') { if (mode === 'film') toCenter(S.id); else close(); } });

    // ---- 指・マウス：ムービー中は押すと次の場面、中心図では動かす・拡大・押した丸を真ん中に ----
    const ptrs = new Map(); let moved = 0, pinch0 = 0, zoom0 = 1;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = zoom; } });
    cv.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId) || mode !== 'center') return;
      const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; zoom = Math.max(0.6, Math.min(8, zoom0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pinch0 || 1))); moved = 99; }
      else { panX += e.clientX - px; panY += e.clientY - py; moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py); }
      req();
    });
    const up = e => {
      const wasTap = ptrs.size === 1 && moved < 8; ptrs.delete(e.pointerId);
      if (!wasTap) return;
      if (mode === 'film') return next();
      const k = hit(e.clientX, e.clientY);
      if (k && k !== S.id) toCenter(k);
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => ptrs.delete(e.pointerId));
    cv.addEventListener('wheel', e => { if (mode !== 'center') return; e.preventDefault(); zoom = Math.max(0.6, Math.min(8, zoom * Math.exp(-e.deltaY * 0.0015))); req(); }, { passive: false });
    let view = { cx: 0, cy: 0, sc: 1 };
    function hit(x, y) {
      const { cx, cy, sc } = view; let best = null, bd = 1e9;
      for (const [k, d] of S.entries) {
        const [px, py] = S.P.get(k), sx = cx + px * sc, sy = cy + py * sc, r = Math.max(12, nodeR(S, d) * sc);
        const dd = (sx - x) ** 2 + (sy - y) ** 2;
        if (dd <= r * r && dd < bd) { bd = dd; best = k; }
      }
      return best;
    }

    let raf = 0;
    function req() { if (!raf && !done) raf = requestAnimationFrame(frame); }
    function frame() {
      raf = 0;
      if (done || document.hidden) return;
      const fnow = performance.now();
      if (!stats.first) stats.first = fnow - stats.start;
      if (stats.last && mode === 'film') stats.worst = Math.max(stats.worst, fnow - stats.last);
      stats.last = fnow; stats.frames++;
      const film = mode === 'film', t = film ? now() : 1e9;
      if (film && t >= t5 && still < 0) { toCenter(S.id); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      let shown = 0; for (let d = 1; d <= S.nL; d++) if (t >= layerStart(d)) shown = d;
      const want = Math.min(1.6, (Math.min(W, H * (film ? 0.72 : 0.66)) / 2 - 24) / (S.RAD[Math.max(1, shown)] + 18));
      s = s ? s + (want - s) * (film && still < 0 ? 0.06 : 1) : want;
      const sc = s * (film ? 1 : zoom), cx = W / 2 + (film ? 0 : panX), cy = H * (film ? 0.46 : 0.44) + (film ? 0 : panY);
      view = { cx, cy, sc };
      ctx.translate(cx, cy); ctx.scale(sc, sc);
      const px = 1 / sc;
      // 線
      let arrived = 0;
      ctx.lineWidth = px; ctx.strokeStyle = C.sub; ctx.globalAlpha = film ? 0.25 : 0.3; ctx.beginPath();
      const runs = [];
      for (const [k, d] of S.entries) {
        if (!d) continue;
        const ls = layerStart(d), p = film ? ease((t - ls) / 700) : 1;
        if (p <= 0) continue;
        if (p >= 1) arrived++;
        const [x, y] = S.P.get(k), [vx, vy] = S.P.get(S.via.get(k));
        ctx.moveTo(vx, vy); ctx.lineTo(vx + (x - vx) * p, vy + (y - vy) * p);
        const r = (t - ls - 700) / 300;
        if (film && r > 0 && r < 1 && still < 0) runs.push([x + (vx - x) * r, y + (vy - y) * r]);
      }
      ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = C.hl;
      for (const [x, y] of runs) ctx.fillRect(x - 1.5 * px, y - 1.5 * px, 3 * px, 3 * px);
      // 5 の場面：光が全部の始まりから同時に、前提のつながりを通ってモノへ流れ込む
      if (film && t >= t4) {
        const prog = still >= 0 ? S.hops : Math.min(S.hops, (t - t4) / 1700 * S.hops);
        ctx.strokeStyle = C.hl; ctx.lineWidth = 2.5 * px; ctx.globalAlpha = 0.85; ctx.beginPath();
        const heads = [];
        for (const [k, j] of S.lit) {
          const f = Math.max(0, Math.min(1, prog - (j - 1)));
          if (f <= 0) continue;
          const [x, y] = S.P.get(k), [vx, vy] = S.P.get(S.via.get(k));
          ctx.moveTo(x, y); ctx.lineTo(x + (vx - x) * f, y + (vy - y) * f);
          if (f < 1 && still < 0) heads.push([x + (vx - x) * f, y + (vy - y) * f]);
        }
        ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = C.hl;
        for (const [x, y] of heads) ctx.fillRect(x - 3 * px, y - 3 * px, 6 * px, 6 * px);
      }
      // 点
      ctx.imageSmoothingEnabled = false;
      const rootSet = film && t >= t2 ? new Set(S.roots) : null;
      const labels = [];
      for (const [k, d] of S.entries) {
        const n = byId.get(k);
        let [x, y] = S.P.get(k), a = 1;
        if (film && d) {
          const q = (t - layerStart(d)) / 700, p = ease(q); if (p <= 0) continue;
          const far = (Math.max(W, H) / sc) * 0.9, aa = S.ang.get(k), at = pp => far + (S.RAD[d] - far) * pp;
          x = Math.cos(aa) * at(p); y = Math.sin(aa) * at(p); a = p;
          if (q < 1 && still < 0) {
            const pb = ease(q - 0.12), bx = Math.cos(aa) * at(Math.max(0, pb)), by = Math.sin(aa) * at(Math.max(0, pb));
            ctx.globalAlpha = 0.5 * p; ctx.strokeStyle = C.hl; ctx.lineWidth = 2 * px; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y); ctx.stroke();
          }
        } else if (film) a = ease(t / 900);
        const r = nodeR(S, d) * (film && !d ? 0.6 + 0.4 * a : 1), rs = r * sc;   // rs＝画面での半径
        ctx.globalAlpha = a;
        if (!film && rs < 3 && d) { ctx.fillStyle = n.kind === 'product' ? C.prod : C.tech; ctx.fillRect(x - 2 * px, y - 2 * px, 4 * px, 4 * px); continue; }   // 混んだ輪は小さな点
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = C.bg; ctx.fill();
        const glow = rootSet && rootSet.has(k);
        ctx.lineWidth = (glow ? 3.5 : d ? 1.5 : 3) * Math.min(px, 1 / Math.max(0.5, s * 0.8)); ctx.strokeStyle = glow ? C.hl : n.kind === 'product' ? C.prod : C.tech; ctx.stroke();
        const sl = A.slot.get(k);
        if (sl && rs >= 3) ctx.drawImage(A.c, sl[0], sl[1], 16, 16, x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
        if (!film && d && rs >= 9) labels.push([x, y + r + 13 * px, nm(n), d]);
      }
      // 始まりの光（3 の場面）：全部の始まりに輪が1回だけ広がる
      if (film && t >= t2 && t < t3 + 400) {
        const q = still >= 0 ? 0.5 : (t - t2) / 1400;
        if (q > 0 && q < 1) {
          ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = C.hl; ctx.lineWidth = 3 * px; ctx.beginPath();
          for (const k of S.roots) { const [x, y] = S.P.get(k), r0 = nodeR(S, S.dist.get(k)); ctx.moveTo(x + r0 + 4 * px + q * 14 * px, y); ctx.arc(x, y, r0 + 4 * px + q * 14 * px, 0, Math.PI * 2); }
          ctx.stroke();
        }
      }
      // モノに光が届いた：輪が1回広がる
      if (film && t >= t4 + 1700) {
        const q = still >= 0 ? 0.4 : (t - t4 - 1700) / 600;
        if (q > 0 && q < 1) { ctx.globalAlpha = 1 - q; ctx.strokeStyle = C.hl; ctx.lineWidth = 3 * px; ctx.beginPath(); ctx.arc(0, 0, nodeR(S, 0) + 6 * px + q * 30 * px, 0, Math.PI * 2); ctx.stroke(); }
      }
      // 中心図の名前：画面で大きく見える丸だけ、重ならない物を（内側の輪から）
      if (labels.length) {
        ctx.globalAlpha = 1; ctx.font = `700 ${12 * px}px ${C.font}`; ctx.textAlign = 'center'; ctx.lineWidth = 3 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = C.ink;
        const boxes = [];
        labels.sort((a, b) => a[3] - b[3]);
        for (const [x, y, text] of labels) {
          const w = ctx.measureText(text).width, b = [x - w / 2, y - 12 * px, x + w / 2, y + 3 * px];
          if (boxes.some(o => o[0] < b[2] && b[0] < o[2] && o[1] < b[3] && b[1] < o[3])) continue;
          boxes.push(b); ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
        }
      }
      // 混んだ輪の「＋数」：点だけになった輪は、輪の右下に数
      if (!film) {
        ctx.globalAlpha = 1; ctx.font = `700 ${12 * px}px ${C.font}`; ctx.textAlign = 'left'; ctx.lineWidth = 4 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = C.sub;
        for (let d = 1; d <= S.nL; d++) if (nodeR(S, d) * sc < 3) { const t2x = `+${S.layers[d].length}`, x = Math.cos(0.6) * S.RAD[d] + 6 * px, y = Math.sin(0.6) * S.RAD[d] + 4 * px; ctx.strokeText(t2x, x, y); ctx.fillText(t2x, x, y); }   // 文字のまわりを地の色でふちどり（点と重ならないように）
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 人の肖像（4 の場面）
      if (film && t >= t3 && people) {
        const k = people.pics.length, sz = Math.min(48, Math.max(30, W / 12));
        const rx = W / 2 - sz / 2 - 6, ry = Math.min(H * 0.46 - sz / 2 - 8, H * 0.36 - sz / 2);
        people.pics.forEach((im, i) => {
          if (!im.complete || !im.naturalWidth) return;
          const p = still >= 0 ? 1 : ease((t - t3 - i * 40) / 600), a = -Math.PI / 2 + (i / k) * Math.PI * 2;
          if (p <= 0) return;
          ctx.globalAlpha = p * (t >= t4 ? Math.max(0.25, 1 - (t - t4) / 1200) : 1);
          ctx.drawImage(im, Math.round(W / 2 + Math.cos(a) * rx - sz / 2), Math.round(cy + Math.sin(a) * ry - sz / 2 + (1 - p) * 10), sz, sz);
        });
      }
      ctx.globalAlpha = 1;
      // 文と数
      const target = byId.get(S.id);
      let capText, ct;
      if (film) {
        const sc5 = t < t1 ? 0 : t < t2 ? 1 : t < t3 ? 2 : t < t4 ? 3 : 4;
        capText = [T.ask(target), T.ask(target), T.roots(S.roots.length), people ? T.people(people.n, people.anon) : '…', T.you][sc5];
        ct = sc5 >= 1 ? T.count(Math.min(S.total, sc5 >= 2 ? S.total : arrived)) + (sc5 === 1 && shown ? T.gen(shown, S.layers[shown].length) : '') : '';
      } else {
        capText = `[${S.id}] ${nm(target)}`;
        ct = T.sum(S.total, S.roots.length);
      }
      if (cap.dataset.t !== capText) { cap.dataset.t = capText; cap.textContent = capText; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
      if (cnt.textContent !== ct) cnt.textContent = ct;
      if (film) req();
    }
    root.tabIndex = -1; root.focus();
    resize();
    if (film) { skip.textContent = T.skip; root.setAttribute('aria-label', T.ask(byId.get(id))); req(); }
    else toCenter(id, false);
    return { center: k => toCenter(k, false), close, get id() { return S.id; }, get mode() { return mode; } };
  }
  const play = (id, opt) => open(id, opt, true);
  const center = (id, opt) => open(id, opt, false);
  // 初めての1回だけ（ブラウザに「見た」を保存。保存できない環境では出さない）
  function firstTime(id, opt) {
    try { if (localStorage.getItem('tn-film-seen')) return null; localStorage.setItem('tn-film-seen', '1'); } catch (e) { return null; }
    return play(id, opt);
  }
  window.Film = { play, center, firstTime };
})();
