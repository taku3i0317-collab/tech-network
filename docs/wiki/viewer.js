// ウィキの「3D で見る」（S-058）と、斜め上から見た絵（S-057）。外の道具は使わない自作の小さな 3D（canvas 2D、正投影）。
// ブロックのモデル（wiki/models.json＝A の wiki_export.json の block_models・multiblocks）を箱の集まりにして、
// 面ごとに MOD の自作のテクスチャ（wiki/tex/）を貼る。Mojang の絵は使わない：バニラのテクスチャの所は単色、バニラのブロックは単色の箱＋名前。
// 使い方：<button data-3d="semiconductor-lab:xxx"> を押すと #v3d に出る。マルチブロックは「段」のボタンで下から1段ずつ。
// window.V3D.png(id, size) → 斜め上から見た絵（data URL）。tools/gen_wiki_iso.mjs がこれで wiki/iso/*.png を作る
(function () {
  const BASE = (document.currentScript && document.currentScript.src.replace(/viewer\.js.*$/, '')) || './';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let DATA = null;
  const load = () => DATA ? Promise.resolve(DATA) : fetch(BASE + 'models.json').then(r => r.json()).then(d => (DATA = d));
  const IMG = new Map();
  const tex = t => {
    if (!t || !t.startsWith('semiconductor-lab:block/')) return null;   // MOD の自作の絵だけ
    if (!IMG.has(t)) { const im = new Image(); im.src = BASE + 'tex/' + t.split('/').slice(1).join('/') + '.png'; IMG.set(t, im); }
    return IMG.get(t);
  };
  const ready = ims => Promise.all(ims.filter(Boolean).map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
  // ---- モデル → 箱 ----
  const F = { north: [[1, 1, 0], [0, 1, 0], [0, 0, 0], [1, 0, 0]], south: [[0, 1, 1], [1, 1, 1], [1, 0, 1], [0, 0, 1]], west: [[0, 1, 0], [0, 1, 1], [0, 0, 1], [0, 0, 0]],
    east: [[1, 1, 1], [1, 1, 0], [1, 0, 0], [1, 0, 1]], up: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], down: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]] };
  const full = faces => [{ from: [0, 0, 0], to: [16, 16, 16], faces }];
  const all6 = t => ({ north: t, south: t, east: t, west: t, up: t, down: t });
  const TEMPLATES = {   // バニラの「親」のモデルの形（形だけ。絵は子のモデルの MOD のテクスチャ）
    'minecraft:block/cube_all': () => full(all6('#all')),
    'minecraft:block/orientable': () => full({ north: '#front', south: '#side', east: '#side', west: '#side', up: '#top', down: '#top' }),
    'minecraft:block/orientable_with_bottom': () => full({ north: '#front', south: '#side', east: '#side', west: '#side', up: '#top', down: '#bottom' }),
    'minecraft:block/cube_bottom_top': () => full({ north: '#side', south: '#side', east: '#side', west: '#side', up: '#top', down: '#bottom' }),
    'minecraft:block/template_cube_bottom_top': () => full({ north: '#side', south: '#side', east: '#side', west: '#side', up: '#top', down: '#bottom' }),
    'minecraft:block/cube_column': () => full({ north: '#side', south: '#side', east: '#side', west: '#side', up: '#end', down: '#end' }),
    'minecraft:block/cube': () => full({ north: '#north', south: '#south', east: '#east', west: '#west', up: '#up', down: '#down' }),
    'minecraft:block/carpet': () => [{ from: [0, 0, 0], to: [16, 1, 16], faces: all6('#wool') }],
    'minecraft:block/crop': () => [[4, 0], [12, 0]].flatMap(([p]) => [{ from: [p, 0, 0], to: [p, 16, 16], faces: { east: '#crop', west: '#crop' } }, { from: [0, 0, p], to: [16, 16, p], faces: { north: '#crop', south: '#crop' } }]),
    'minecraft:block/cross': () => [{ from: [8, 0, 0], to: [8, 16, 16], faces: { east: '#cross', west: '#cross' } }, { from: [0, 0, 8], to: [16, 16, 8], faces: { north: '#cross', south: '#cross' } }],
  };
  function resolve(models, name) {
    let m = models[name], textures = {}, elements = null, guard = 0;
    while (m && guard++ < 8) {
      textures = { ...(m.textures || {}), ...textures };
      if (!elements && m.elements) elements = m.elements.map(e => ({ from: e.from, to: e.to, faces: Object.fromEntries(Object.entries(e.faces || {}).map(([k, f]) => [k, f.texture])) }));
      if (!elements && TEMPLATES[m.parent]) elements = TEMPLATES[m.parent]();
      m = models[m.parent];
    }
    const look = (t, n = 0) => t && t.startsWith('#') && n < 6 ? look(textures[t.slice(1)], n + 1) : t;
    return (elements || full(all6('#all'))).map(e => ({ ...e, faces: Object.fromEntries(Object.entries(e.faces).map(([k, t]) => [k, look(t)])) }));
  }
  function blockBoxes(id, at = [0, 0, 0], solid = null) {
    if (!id.startsWith('semiconductor-lab:') || !DATA.models[id]) return [{ from: [0, 0, 0], to: [16, 16, 16], at, color: solid || '#b9a58f', faces: all6(null) }];   // バニラのブロック：単色の箱
    const bm = DATA.models[id], vs = bm.blockstate && bm.blockstate.variants ? bm.blockstate.variants : null;
    let v = vs ? (Object.entries(vs).find(([k]) => /facing=north/.test(k) && !/lit=true/.test(k)) || Object.entries(vs)[0])[1] : null;
    if (Array.isArray(v)) v = v[0];
    const name = v ? v.model : Object.keys(bm.models || {})[0];
    return resolve(bm.models || {}, name).map(e => ({ ...e, at, rotY: (v && v.y) || 0 }));
  }
  // ---- 描く（正投影。面ごとにテクスチャを平行四辺形に貼る＝正投影なのでずれない） ----
  function draw(ctx, W, H, boxes, yaw, pitch, scale, opts = {}) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const ext = opts.ext || [16, 16, 16];
    const P = ([x, y, z]) => { x -= ext[0] / 2; y -= ext[1] / 2; z -= ext[2] / 2; const X = x * cy - z * sy, Z = x * sy + z * cy, Y = y * cp + Z * sp, D = -y * sp + Z * cp; return [W / 2 + X * scale, H / 2 - Y * scale + (opts.dy || 0), D]; };   // pitch＞0 で上から見下ろす
    const quads = [];
    for (const b of boxes) {
      const r = ((b.rotY || 0) / 90) & 3;
      const rot = ([x, y, z]) => { for (let i = 0; i < r; i++) [x, z] = [16 - z, x]; return [x, y, z]; };
      const bc = P([b.at[0] * 16 + 8, b.at[1] * 16 + 8, b.at[2] * 16 + 8])[2];   // 箱の真ん中の奥行き（箱ごとに奥から描く）
      for (const [face, t] of Object.entries(b.faces)) {
        if (!(face in F) || (b.skip && b.skip.has(face))) continue;
        const c = F[face].map(([i, j, k]) => { const p = rot([i ? b.to[0] : b.from[0], j ? b.to[1] : b.from[1], k ? b.to[2] : b.from[2]]); return P([p[0] + b.at[0] * 16, p[1] + b.at[1] * 16, p[2] + b.at[2] * 16]); });
        const cross = (c[1][0] - c[0][0]) * (c[3][1] - c[0][1]) - (c[1][1] - c[0][1]) * (c[3][0] - c[0][0]);
        const flat = b.from.some((v, i) => v === b.to[i]);
        if (cross > 0 && !flat) continue;   // 裏の面は描かない（板は両面）
        quads.push({ c, t, face, depth: bc * 1000 + (c[0][2] + c[1][2] + c[2][2] + c[3][2]) / 4, b });
      }
    }
    quads.sort((a, b) => a.depth - b.depth);
    ctx.imageSmoothingEnabled = false;
    const SHADE = { up: 0, north: 0.12, south: 0.12, east: 0.22, west: 0.22, down: 0.35 };
    const shaded = (im, face) => { const k = face, m = im._sh || (im._sh = {}); if (m[k]) return m[k]; const s = Math.min(im.naturalWidth, im.naturalHeight), c = document.createElement('canvas'); c.width = c.height = s; const g = c.getContext('2d'); g.drawImage(im, 0, 0, s, s, 0, 0, s, s); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = SHADE[face]; g.fillStyle = '#000'; g.fillRect(0, 0, s, s); return (m[k] = c); };   // 面の向きの暗さは、絵のある所だけ（すき間は暗くしない）
    for (const q of quads) {
      const [p0, p1, p2, p3] = q.c, im = q.b.color ? null : tex(q.t);
      ctx.save(); ctx.globalAlpha = q.b.alpha ?? 1;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath();
      if (im && im.naturalWidth) {
        ctx.clip();
        const s = Math.min(im.naturalWidth, im.naturalHeight);   // 動くテクスチャ（縦長）は1コマ目だけ
        ctx.setTransform(...(() => { const m = ctx.getTransform(); const a = (p1[0] - p0[0]) / s, b = (p1[1] - p0[1]) / s, c = (p3[0] - p0[0]) / s, d = (p3[1] - p0[1]) / s; return [m.a * a + m.c * b, m.b * a + m.d * b, m.a * c + m.c * d, m.b * c + m.d * d, m.a * p0[0] + m.c * p0[1] + m.e, m.b * p0[0] + m.d * p0[1] + m.f]; })());
        ctx.drawImage(shaded(im, q.face), 0, 0, s, s, 0, 0, s, s);
      } else {
        ctx.fillStyle = q.b.color || '#9a9088'; ctx.fill();
        ctx.globalAlpha = (q.b.alpha ?? 1) * SHADE[q.face]; ctx.fillStyle = '#000'; ctx.fill();
        ctx.globalAlpha = (q.b.alpha ?? 1) * 0.35; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
      if (q.b.front && q.face === 'north') {   // 正面（画面を開く面）の印
        const mx = (p0[0] + p2[0]) / 2, my = (p0[1] + p2[1]) / 2;
        ctx.save(); ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#fffdf8'; ctx.fillStyle = '#c9861e'; ctx.strokeText('正面', mx, my); ctx.fillText('正面', mx, my); ctx.restore();
      }
    }
  }
  // ---- マルチブロック：下の段から ----
  const PAL = ['#b0553a', '#8a6a4a', '#a08a2a', '#2f6f8f', '#3f8f4f', '#8e5bd6'];
  function multiBoxes(mb, upto) {
    const boxes = [], keys = Object.keys(mb.legend || {});
    const solid = (x, y, z) => { const r = mb.layers[y] && mb.layers[y][z]; const ch = r && r[x]; return !!ch && ch !== ' ' && ch !== '.' && y <= upto; };
    const NB = { east: [1, 0, 0], west: [-1, 0, 0], up: [0, 1, 0], down: [0, -1, 0], south: [0, 0, 1], north: [0, 0, -1] };
    mb.layers.forEach((layer, y) => layer.forEach((row, z) => [...row].forEach((ch, x) => {
      if (ch === ' ' || ch === '.') return;
      const id = ch === mb.controller ? mb.controller_block : (mb.legend[ch] || {}).block;
      if (!id) return;
      const col = PAL[Math.max(0, keys.indexOf(ch)) % PAL.length];
      const skip = y <= upto ? new Set(Object.entries(NB).filter(([, d]) => solid(x + d[0], y + d[1], z + d[2])).map(([f]) => f)) : null;   // となりがふさいでいる面は描かない
      for (const b of blockBoxes(id, [x, y, z], col)) { b.alpha = y <= upto ? 1 : 0.12; b.skip = skip; boxes.push(b); }
    })));
    return boxes;
  }
  function counts(mb) {
    const n = {};
    mb.layers.forEach(l => l.forEach(row => [...row].forEach(ch => { if (ch !== ' ' && ch !== '.') n[ch] = (n[ch] || 0) + 1; })));
    return Object.entries(n).map(([ch, k]) => { const L = ch === mb.controller ? { name_text: { ja: '制御のブロック（' + mb.controller_block.split(':')[1] + '）' } } : (mb.legend[ch] || {}); return `${(L.name_text && L.name_text.ja) || L.name || ch} ×${k}${L.block && L.block.startsWith('minecraft:') ? '（バニラ）' : ''}`; });
  }
  // ---- 画面に出す ----
  async function show(id) {
    await load();
    const host = document.getElementById('v3d'); host.innerHTML = '';
    const cv = document.createElement('canvas'), bar = document.createElement('div'); bar.className = 'v3bar';
    host.append(cv, bar);
    const mb = (DATA.multiblocks || []).find(m => m.controller_block === id);
    let yaw = -0.6, pitch = 0.5, zoom = 1, upto = mb ? 0 : 0, spin = !reduce() && !mb, raf = 0;
    const ext = mb ? [mb.width * 16, mb.height * 16, mb.depth * 16] : [16, 16, 16];
    const boxesOf = () => mb ? multiBoxes(mb, upto) : blockBoxes(id).map(b => ({ ...b, front: true }));
    await ready([...new Set(boxesOf().flatMap(b => Object.values(b.faces)))].map(tex));
    const render = () => {
      raf = 0; const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
      const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const size = Math.max(...ext) * 1.75; draw(ctx, W, H, boxesOf(), yaw, pitch, Math.min(W, H) / size * zoom, { ext });
      if (spin) { yaw += 0.012; req(); }
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(render); };
    // 指・マウスで回す・拡大
    const pt = new Map(); let pd = 0, pz = 1;
    cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 続ける */ } pt.set(e.pointerId, [e.clientX, e.clientY]); spin = false; if (pt.size === 2) { const [a, b] = [...pt.values()]; pd = Math.hypot(a[0] - b[0], a[1] - b[1]); pz = zoom; } });
    cv.addEventListener('pointermove', e => { if (!pt.has(e.pointerId)) return; const [x, y] = pt.get(e.pointerId); pt.set(e.pointerId, [e.clientX, e.clientY]);
      if (pt.size === 2) { const [a, b] = [...pt.values()]; zoom = Math.max(0.5, Math.min(4, pz * Math.hypot(a[0] - b[0], a[1] - b[1]) / (pd || 1))); }
      else { yaw += (e.clientX - x) * 0.01; pitch = Math.max(-1.2, Math.min(1.4, pitch + (e.clientY - y) * 0.01)); } req(); });
    const end = e => pt.delete(e.pointerId); cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(0.5, Math.min(4, zoom * Math.exp(-e.deltaY * 0.0015))); req(); }, { passive: false });
    if (mb) {
      const btns = mb.layers.map((_, i) => `<button type="button" class="btn" data-l="${i}" aria-pressed="${i === upto}">${i + 1} 段</button>`).join('');
      bar.innerHTML = `<button type="button" class="btn" data-next>▶ 次の段</button>${btns}<div class="v3list" style="flex-basis:100%">${mb.width}×${mb.depth}×${mb.height}。置くブロック：${counts(mb).join('・')}。今の段だけ濃く、上の段はうすく。指で回す・広げる</div>`;
      bar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; upto = b.dataset.next != null ? (upto + 1) % mb.layers.length : +b.dataset.l; bar.querySelectorAll('[data-l]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.l === upto)); req(); });
    } else bar.innerHTML = `<span class="v3list">指・マウスで回す、2本の指・ホイールで拡大。「正面」＝画面を開く面</span>`;
    render();
  }
  async function png(id, size = 256) {
    await load();
    const mb = (DATA.multiblocks || []).find(m => m.controller_block === id);
    const boxes = mb ? multiBoxes(mb, mb.layers.length) : blockBoxes(id);
    await ready([...new Set(boxes.flatMap(b => Object.values(b.faces)))].map(tex));
    const ext = mb ? [mb.width * 16, mb.height * 16, mb.depth * 16] : [16, 16, 16];
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    draw(cv.getContext('2d'), size, size, boxes, -0.6, 0.5, size / (Math.max(...ext) * 1.75));
    return cv.toDataURL('image/png');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-3d]'); if (b) { e.preventDefault(); show(b.dataset['3d']); } });
  window.V3D = { show, png, load };
})();
