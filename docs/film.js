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
  // 祖先：requires・enables・part に加え、なぜ動くかの知恵（understanding）も（S-031）。つながりの種類は線の形に使う（part＝太線、understanding＝点線）
  const EK = new Map(), RANK = { p: 4, r: 3, e: 2, u: 1 };
  for (const [f, t, k] of G.edges) if (RANK[k]) {
    const key = f + '>' + t;
    if (!EK.has(key)) (parents.get(t) || parents.set(t, []).get(t)).push(f);
    if (!EK.has(key) || RANK[k] > RANK[EK.get(key)]) EK.set(key, k);
  }
  // S-037：逆の向き（これが生んだ物）に使う子のつながりと、AI までの道（名前を優先して出す物）
  const kidsMap = new Map();
  for (const key of EK.keys()) { const [f, t] = key.split('>'); (kidsMap.get(f) || kidsMap.set(f, []).get(f)).push(t); }
  const reach = (id, m) => { const s2 = new Set(); let q = [id]; while (q.length) { const u = q.pop(); for (const v of m.get(u) || []) if (!s2.has(v) && byId.has(v)) { s2.add(v); q.push(v); } } return s2; };
  const AIPATH = new Set([G.goal, ...reach(G.goal, parents)]);
  const partsOf = new Map(), undOf = new Map();   // S-029：部品（part）と、なぜ動くかを説明する知恵（understanding）
  for (const [f, t, k] of G.edges) { if (k === 'p') (partsOf.get(t) || partsOf.set(t, []).get(t)).push(f); if (k === 'u' && byId.has(f) && byId.get(f).kind === 'idea') (undOf.get(t) || undOf.set(t, []).get(t)).push(f); }
  const EN = () => document.documentElement.lang === 'en';
  const nm = n => (EN() && n.name_en) || n.name;
  const T = {
    ask: n => EN() ? `What does it take to make ${nm(n)}?` : `${nm(n)}を作るには？`,
    count: k => EN() ? `${k} technologies` : `${k} 個の技術`,
    gen: (d, n) => EN() ? ` · ${d} step${d > 1 ? 's' : ''} back: +${n}` : `・${d} 世代前 +${n}`,
    // S-025：始まりを3つの群れに（自然から得た物・最初の道具・考え方）
    roots: g => { const n = g.nature + g.tool + g.idea, parts = [[g.nature, EN() ? 'from nature' : '自然から得た物'], [g.tool, EN() ? 'first tool' : '最初の道具'], [g.idea, EN() ? 'ideas' : '考え方']].filter(x => x[0]).map(x => `${x[1]} ${x[0]}`).join(EN() ? ', ' : '・');
      return n > 1 ? (EN() ? `From many beginnings: ${parts}` : `たくさんの始まりから：${parts}`) : (EN() ? 'It all started here.' : '全部、ここから始まった'); },
    people: (p, a) => EN() ? `${p} people + many whose names are lost (${a} technologies)` : `${p} 人＋名前の残っていない、たくさんの人たち（${a} の技術）`,
    you: EN() ? 'Now it is your turn to choose.' : '次は、あなたが選んで',
    aha: (a, b) => EN() ? `Follow "${a}" and you reach "${b}"!` : `あ！「${a}」をたどると「${b}」に行きつく`,
    ring: d => (EN() ? ['', 'parts', 'devices', 'processes & tools', 'materials', 'origins'] : ['', '部品', '素子・装置', '工程・機械・道具', '材料', '原点'])[d] || '',
    skip: EN() ? 'Skip ▶▶' : 'とばす ▶▶',
    next: EN() ? 'Next ▶' : '次へ ▶',
    close: EN() ? '✕ Close' : '✕ 閉じる',
    watch: EN() ? '▶ Watch' : '▶ できるまでを観る',
    detail: EN() ? 'Details' : '詳しく見る',
    share: EN() ? '🔗 Share' : '🔗 シェア',
    hint: EN() ? 'Tap a circle to light its links, tap again to put it in the middle' : '丸を押すとつながりが光る。もう1回押すと真ん中に',
    askUp: n => EN() ? `What did ${nm(n)} make possible?` : `${nm(n)}が生んだ物は？`,
    ahaUp: (a, b) => EN() ? `Follow "${a}" and you reach "${b}"!` : `あ！「${a}」の先に「${b}」がある`,
    made: (k, n) => EN() ? `Without ${nm(k)}, ${n} things would not exist.` : `${nm(k)}が無ければ、${n} 個の物は生まれなかった`,
    sumUp: n => EN() ? `leads to ${n}` : `${n} の物につながる`,
    watchUp: EN() ? '▶ What it made' : '▶ これが生んだ物',
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
.film .bar[hidden],.film .bar [hidden]{display:none}.film .bar a,.film .bar button{flex:1;display:flex;align-items:center;justify-content:center;min-height:44px;border:1px solid var(--accent,#2f6f8f);border-radius:10px;color:var(--accent,#2f6f8f);background:var(--panel,#fff);text-decoration:none;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.film.centerMode .cap{bottom:calc(76px + env(safe-area-inset-bottom));font-size:clamp(18px,4vw,26px)}
.film .flegend{position:absolute;left:12px;right:12px;top:74px;display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11px;color:var(--sub,#666);pointer-events:none}.film .flegend[hidden]{display:none}.film .flegend i{display:inline-block;width:9px;height:9px;border:2px solid;border-radius:50%;margin-right:3px;vertical-align:-1px}.film.story .flegend{display:none}
.film .fhint{position:absolute;left:16px;top:52px;font-size:13px;color:var(--sub,#666);pointer-events:none}
.film.story .skip,.film.story .bar,.film.story .fhint{display:none}.film.story .cnt{top:96px;left:0;right:0;text-align:center;font-size:22px}.film.story .cap{bottom:110px;font-size:24px}
@media (prefers-reduced-motion: reduce){.film,.film .cap.in{transition:none;animation:none}}`;
    document.head.appendChild(st);
  }

  // ---- 図の形（世代ごとの輪）：祖先を「何段さかのぼるか（いちばん近い道）」で分け、円の上の角度を決める ----
  function scene(id, dir = 'down') {
    const dist = new Map([[id, 0]]), via = new Map(), NB = dir === 'up' ? kidsMap : parents;   // up：真ん中から、それを使って生まれた物へ（子孫）
    let q = [id];
    // up では、真ん中より前の年の物には進まない（考え方が「説明する」古い技術から先を、生んだ物に数えないため。S-037）
    const y0 = byId.get(id).year, okUp = k => dir !== 'up' || y0 == null || byId.get(k).year == null || byId.get(k).year >= y0;
    // down では、真ん中の子孫（真ん中を前提に使う物）は祖先に入れない（理解のつながりを通ると、子孫が祖先のように見えることがあるため。S-039）
    const descR = new Set(); if (dir !== 'up') { let q4 = [id]; while (q4.length) { const u = q4.pop(); for (const v of kidsMap.get(u) || []) if (EK.get(u + '>' + v) !== 'u' && !descR.has(v)) { descR.add(v); q4.push(v); } } }
    while (q.length) { const nq = []; for (const u of q) for (const p of NB.get(u) || []) if (!dist.has(p) && byId.has(p) && okUp(p) && !descR.has(p)) { dist.set(p, dist.get(u) + 1); via.set(p, u); nq.push(p); } q = nq; }
    const LAY0 = dir === 'up' ? 'gen' : (window.FILM_LAYOUT || 'height'), und = new Set();   // S-039：本番は「作る順番」の輪（前提は必ず外の輪）
    if (LAY0 === 'D') {
      // 案D：一番内側の輪は部品（part を優先）、ほかのすぐ要る物はその外。そこから先は今と同じに前提をさかのぼる
      dist.clear(); via.clear(); dist.set(id, 0);
      const pp = (partsOf.get(id) || []).filter(k => byId.has(k)), bucket = [[id]];
      const put = (k, d, v) => { if (dist.has(k)) return; dist.set(k, d); via.set(k, v); (bucket[d] || (bucket[d] = [])).push(k); };
      for (const k of pp) put(k, 1, id);
      for (const k of parents.get(id) || []) if (byId.has(k)) put(k, pp.length ? 2 : 1, id);
      for (let d = 1; d < bucket.length; d++) for (const u of bucket[d] || []) for (const k of parents.get(u) || []) if (byId.has(k)) put(k, d + 1, u);
      // 祖先の技術が持つ「なぜ動くか」の知恵（understanding）も知恵の扇に（線は点線）
      for (const [k, d] of [...dist]) if (byId.get(k).kind !== 'idea') for (const i of undOf.get(k) || []) if (!dist.has(i)) { dist.set(i, d + 1); via.set(i, k); und.add(i); }
    }
    if (LAY0 === 'height' || LAY0 === 'gran' || LAY0 === 'pr') {
      // S-033・S-035：輪の決め方を変える（どちらも、前提の無い「始まり」はいちばん外の輪）
      //  height：始まりからの高さ（いちばん長い道）。輪＝真ん中の高さ − その物の高さ。8 輪より多い時は均等にまとめる
      //  gran：粒度（どのモノでも同じ意味）。1 製品・部品／2 素子・装置／3 工程・機械・道具（と知恵）／4 材料／5 始まり
      const set = [...dist.keys()], inSet = new Set(set);
      const ps = k => (parents.get(k) || []).filter(p => inSet.has(p));
      const psReq = k => ps(k).filter(p => EK.get(p + '>' + k) !== 'u');   // 高さは前提（requires・enables・part）だけで決める（理解のつながりは輪になることがあるため）
      const isRoot = k => k !== id && !(parents.get(k) || []).some(p => byId.has(p));
      const ring = new Map();
      if (LAY0 === 'height') {
        // S-039：輪＝作る順番。その物から真ん中までのいちばん長い道の段数（前提は必ず使う物より外になる）。
        // 前提の無い始まりは全部、いちばん外のさらに1つ外の輪。理解のつながりが輪（ループ）を作る所は、その1本を数えない
        // 前提（requires・enables・part）の子だけで数える（こちらは輪にならない）。理解のつながりでしか届かない物だけ、理解の子で数える
        const kidsR = new Map(), kidsU = new Map();
        for (const k of set) { for (const p of psReq(k)) (kidsR.get(p) || kidsR.set(p, []).get(p)).push(k); for (const p of ps(k)) if (EK.get(p + '>' + k) === 'u') (kidsU.get(p) || kidsU.set(p, []).get(p)).push(k); }
        // 子のつながり（前提＋理解）から、輪になっている所（強く結びついた組）の中の「理解」だけを外して、輪の無い形にする。
        // 前提だけでは輪にならないので、前提のつながりは1本も外さない。その上で、真ん中までのいちばん長い道を正確に数える
        const kidsAll = k => [...(kidsR.get(k) || []), ...(kidsU.get(k) || [])];
        const idx = new Map(), low = new Map(), comp = new Map(), stk = [], onS = new Set(); let cnt = 0, nc = 0;
        const tarjan = v => { idx.set(v, cnt); low.set(v, cnt); cnt++; stk.push(v); onS.add(v);
          for (const w of kidsAll(v)) { if (!idx.has(w)) { tarjan(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (onS.has(w)) low.set(v, Math.min(low.get(v), idx.get(w))); }
          if (low.get(v) === idx.get(v)) { let w; do { w = stk.pop(); onS.delete(w); comp.set(w, nc); } while (w !== v); nc++; } };
        for (const k of set) if (!idx.has(k)) tarjan(k);
        const dagKids = k => [...(kidsR.get(k) || []), ...(kidsU.get(k) || []).filter(c => comp.get(c) !== comp.get(k))];
        const Lm = new Map([[id, 0]]);
        const Ld = k => { if (Lm.has(k)) return Lm.get(k); Lm.set(k, 1); let v = 1; for (const c of dagKids(k)) v = Math.max(v, Ld(c) + 1); Lm.set(k, v); return v; };
        let maxL = 0;
        for (const k of set) if (!isRoot(k)) { ring.set(k, Ld(k)); maxL = Math.max(maxL, ring.get(k)); }
        for (const k of set) if (isRoot(k)) ring.set(k, Math.max(maxL + 1, Ld(k)));
        const R = Math.max(...[...set].map(k => ring.get(k)));
        for (const k of set) if (isRoot(k)) ring.set(k, R);   // 始まりは全部いちばん外
        ring.set(id, 0);
      } else if (LAY0 === 'pr') {   // S-039 の比べる見本：PageRank だけで輪を決める（高い物ほど内側、5 輪）
        const ks = set.filter(k => k !== id).sort((a, b) => (byId.get(b).pr || 0) - (byId.get(a).pr || 0));
        ks.forEach((k, i) => ring.set(k, 1 + Math.floor(i * 5 / Math.max(1, ks.length))));
        ring.set(id, 0);
      } else {
        for (const k of set) ring.set(k, k === id ? 0 : isRoot(k) ? 5 : (byId.get(k).gran || 3));
      }
      // 線を引く相手（via）：その物を前提に使う物のうち、いちばん真ん中に近い物
      const kidsIn = new Map();
      for (const k of set) for (const p of ps(k)) (kidsIn.get(p) || kidsIn.set(p, []).get(p)).push(k);
      via.clear();
      for (const k of set) if (k !== id) { let best = null; for (const c of kidsIn.get(k) || []) if (ring.get(c) < ring.get(k) && (best === null || ring.get(c) < ring.get(best))) best = c; via.set(k, best || id); }   // 線を引く相手は必ず内側（輪にならない）
      for (const k of set) dist.set(k, ring.get(k));
      dist.kidsIn = kidsIn;
    }
    const layers = [];
    for (const [k, d] of dist) (layers[d] || (layers[d] = [])).push(k);
    for (let d = 0; d < layers.length; d++) layers[d] = layers[d] || [];   // 空の輪も（粒度の輪は意味が決まっているので）
    // S-027（見本）：並べ方。gen＝世代だけ（今）／A＝種類の扇3つ（材料・技術・知恵）／B＝分野（幹）ごとの扇／C＝知恵は外の別の帯
    const LAY = LAY0;
    const kindOf = k => { const n = byId.get(k); return n.kind === 'idea' ? 'wisdom' : (n.kind === 'tech' && ['1', '2', '6'].includes(n.trunk)) ? 'material' : 'tech'; };
    const sectorKey = LAY === 'A' || LAY === 'D' ? kindOf : LAY === 'B' ? (k => byId.get(k).trunk) : null;
    const ang = new Map([[id, -Math.PI / 2]]);
    let sectors = null;
    if (sectorKey) {
      // 扇：種類（または幹）ごとの数で広さを分ける（狭すぎないように最低 30°）。最初の扇を真上に
      const cnt = new Map(); for (const k of dist.keys()) if (k !== id) { const g = sectorKey(k); cnt.set(g, (cnt.get(g) || 0) + 1); }
      const order = LAY === 'A' || LAY === 'D' ? ['material', 'tech', 'wisdom'].filter(g => cnt.has(g)) : [...cnt.keys()].sort((a, b) => cnt.get(b) - cnt.get(a));
      const tot = [...cnt.values()].reduce((a, b) => a + b, 0), minS = Math.PI / 6;
      let spans = order.map(g => Math.max(minS, 2 * Math.PI * cnt.get(g) / tot)); const sum = spans.reduce((a, b) => a + b, 0); spans = spans.map(x => x * 2 * Math.PI / sum);
      let a0 = -Math.PI / 2 - spans[0] / 2; sectors = [];
      order.forEach((g, i) => { sectors.push({ g, a0, a1: a0 + spans[i], n: cnt.get(g) }); a0 += spans[i]; });
      const sec = new Map(sectors.map(x => [x.g, x]));
      for (let d = 1; d < layers.length; d++) for (const x of sectors) {
        const L = layers[d].filter(k => sectorKey(k) === x.g).sort((a, b) => (byId.get(a).year ?? 0) - (byId.get(b).year ?? 0));
        const pad = Math.min(0.06, (x.a1 - x.a0) * 0.08);
        L.forEach((k, i) => ang.set(k, x.a0 + pad + (L.length === 1 ? 0.5 : i / (L.length - 1)) * (x.a1 - x.a0 - 2 * pad)));
      }
    } else {
      for (let d = 1; d < layers.length; d++) {
        const KR = { material: 0, tech: 1, wisdom: 2 };   // S-031：輪の中を種類の順に並べ替える（扇の線や帯は描かない）
        // S-033：線が交わりにくい順＝その物を使う物（内側にある物）の角度の平均で並べる
        const cmean = k => { const cs = (dist.kidsIn ? dist.kidsIn.get(k) || [] : [via.get(k)]).map(c => ang.get(c)).filter(a => a != null); if (!cs.length) return ang.get(via.get(k)) ?? 0; let x = 0, y = 0; for (const a of cs) { x += Math.cos(a); y += Math.sin(a); } return Math.atan2(y, x); };
        const key = new Map(layers[d].map(k => [k, cmean(k)]));
        const L = layers[d].filter(k => LAY !== 'C' || kindOf(k) !== 'wisdom').sort((a, b) => KR[kindOf(a)] - KR[kindOf(b)] || key.get(a) - key.get(b) || (byId.get(a).year ?? 0) - (byId.get(b).year ?? 0));
        if (LAY === 'height' && L.length < 14) {
          // 少ない輪（作る順番の輪はこれが多い）：使う物の角度の近くに置き、となりと最低 0.3 ラジアン空ける（縦に1列に並ばないように）
          const A = L.map(k => key.get(k)).sort((a, b) => a - b), gap = Math.min(0.3, 2 * Math.PI / Math.max(1, L.length));
          const byK = L.slice().sort((a, b) => key.get(a) - key.get(b));
          for (let i = 1; i < A.length; i++) if (A[i] - A[i - 1] < gap) A[i] = A[i - 1] + gap;
          // 1つ内の輪の丸とほぼ同じ角度なら、左右に交互にずらす（1本道の前提が縦の1列に重ならないように）
          const inner = d > 1 ? layers[d - 1].map(k => ang.get(k)).filter(a => a != null) : [];
          for (let i = 0; i < A.length; i++) if (inner.some(b => Math.abs(Math.atan2(Math.sin(A[i] - b), Math.cos(A[i] - b))) < 0.25)) A[i] += (d % 2 ? 1 : -1) * 0.34;
          byK.forEach((k, i) => ang.set(k, A[i]));
        } else {
          const off = d % 2 ? 0 : Math.PI / Math.max(1, L.length);
          L.forEach((k, i) => ang.set(k, -Math.PI / 2 + off + (i / L.length) * Math.PI * 2));
        }
      }
    }
    const nL = layers.length - 1;
    // 輪の間：その世代に並ぶ数（C では知恵を数えない）で広さを決める
    const ringN = d => LAY === 'C' ? layers[d].filter(k => kindOf(k) !== 'wisdom').length : layers[d].length;
    const RAD = [0]; for (let d = 1; d <= nL; d++) RAD[d] = RAD[d - 1] + Math.max(d === 1 ? (LAY === 'D' ? 92 : 64) : d === 2 && LAY === 'D' ? 84 : LAY === 'height' && ringN(d) < 14 && nL > 10 ? 18 : 34, Math.min(90, Math.max(1, ringN(d)) * (sectorKey ? 1.5 : 1.15)));
    const P = new Map([...dist.keys()].map(k => { const d = dist.get(k), a = ang.get(k); return [k, [Math.cos(a) * RAD[d], Math.sin(a) * RAD[d]]]; }));
    let band = null;
    if (LAY === 'C') {   // 知恵（考え方・発見）はいちばん外の帯にまとめる（年の順に1周）
      const W = [...dist.keys()].filter(k => k !== id && kindOf(k) === 'wisdom').sort((a, b) => (byId.get(a).year ?? 0) - (byId.get(b).year ?? 0));
      const r = RAD[nL] + 70; band = { r, n: W.length };
      W.forEach((k, i) => { const a = -Math.PI / 2 + (i + 0.5) / W.length * Math.PI * 2; ang.set(k, a); P.set(k, [Math.cos(a) * r, Math.sin(a) * r]); });
      RAD.push(r);
    }
    // 始まり＝前提の無いノード（データの中で）。光は全部の始まりから同時に、前提のつながり（via）をたどってモノへ
    const roots = dir === 'up' ? [] : [...dist.keys()].filter(k => k !== id && !(parents.get(k) || []).some(p => byId.has(p)));
    // 始まりの群れ：考え方・発見（kind idea）／最初の道具（打製石器）／自然から得た物（鉱石・鉱物など、ほかの全部）
    const grp = k => byId.get(k).kind === 'idea' ? 'idea' : k === '0-01' ? 'tool' : 'nature';
    const groups = { nature: 0, tool: 0, idea: 0 }; for (const k of roots) groups[grp(k)]++;
    // S-034「あ！」の一言：始まり（自然から得た物を先に）から via をたどって真ん中のすぐ外（部品など）まで行く道。部品の違う物を2つ
    const aha = [];
    { const cand = [];
      for (const r of roots) { const path = [r]; let u = r; while (via.has(u) && via.get(u) !== id) { u = via.get(u); path.push(u); }
        if (u === r || via.get(u) !== id) continue;
        cand.push({ part: u, root: r, path: [...path, id], score: (byId.get(r).kind !== 'idea' ? 2 : 0) + (byId.get(u).kind === 'product' ? 1 : 0) }); }
      cand.sort((a, b) => b.score - a.score || b.path.length - a.path.length || (a.root < b.root ? -1 : 1));
      const seen = new Set(); for (const c of cand) { if (seen.has(c.part)) continue; seen.add(c.part); aha.push(c); if (aha.length >= 2) break; }
      if (dir === 'up') {   // 「あ！」：真ん中の先にある大事な物（AI までの道の上のモノを先に）。道は via をたどって真ん中まで
        const far = [...dist.keys()].filter(k => k !== id && byId.get(k).kind === 'product').sort((a, b) => (AIPATH.has(b) - AIPATH.has(a)) || dist.get(b) - dist.get(a));
        for (const k of far.slice(0, 2)) { const path = [k]; let u = k; while (via.has(u)) { u = via.get(u); path.push(u); } aha.push({ part: id, root: k, path }); }
      } }
    const lit = new Map();   // 線（k→via）が光る段（始まりから何段目か。いちばん早い物）
    let hops = 1;
    for (const r of roots) { let j = 0; for (let u = r; via.has(u); u = via.get(u)) { j++; if (!lit.has(u) || lit.get(u) > j) lit.set(u, j); } hops = Math.max(hops, j); }
    // 丸の大きさ：その丸が並ぶ輪（扇・帯）の混み方から
    const rk = new Map([[id, 34]]);
    const ringNodes = new Map();
    for (const [k, d] of dist) if (d) { const key = (band && kindOf(k) === 'wisdom') ? 'band' : d + '|' + (sectorKey ? sectorKey(k) : ''); (ringNodes.get(key) || ringNodes.set(key, []).get(key)).push(k); }
    for (const [key, ks] of ringNodes) {
      const [x, y] = P.get(ks[0]), r = Math.hypot(x, y);
      const span = key === 'band' || !sectorKey ? 2 * Math.PI : (() => { const g = sectors.find(z => z.g === sectorKey(ks[0])); return g.a1 - g.a0; })();
      const v = Math.max(3, Math.min(15, 0.45 * span * r / ks.length));
      for (const k of ks) rk.set(k, v);
    }
    const all = [];   // 図の中のノードどうしの、全部のつながり（共通の祖先への線も）
    for (const [key, k] of EK) { const [f, t] = key.split('>'); if (dist.has(f) && dist.has(t)) all.push([f, t, k]); }
    // S-038：小さな揺らぎ。出てくる時刻（0〜120ms）と速さ（±13%）をノードの番号から決める（毎回同じ。止まる場所は変えない）
    const jit = new Map();
    for (const k of dist.keys()) { let h = 2166136261; for (const ch of k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
      jit.set(k, { delay: (h % 1000) / 1000 * 120, speed: 0.87 + ((h >>> 10) % 1000) / 1000 * 0.26 }); }
    // S-039：丸の大きさ＝PageRank（この図の中で上位 10% は大きく、次の 30% はそのまま、ほかは少し小さく）
    const prf = new Map(), byPr = [...dist.keys()].filter(k => k !== id).sort((a, b) => (byId.get(b).pr || 0) - (byId.get(a).pr || 0));
    byPr.forEach((k, i) => prf.set(k, i < byPr.length * 0.1 ? 1.3 : i < byPr.length * 0.4 ? 1 : 0.8));
    return { id, dir, prf, jit, aha, all, dist, via, layers, ang, nL, RAD, P, roots, grp, groups, lit, hops, sectors, band, kindOf, LAY, rk, und, sectorKey, open: new Set((window.FILM_OPEN || '').split(',').filter(Boolean)), badges: [],   // FILM_OPEN：見本で開いた扇を写す用
      total: dist.size - 1, entries: [...dist.entries()] };
  }
  const nodeR = (S, d) => d === 0 ? 34 : Math.max(3, Math.min(15, 0.45 * (2 * Math.PI * S.RAD[d]) / S.layers[d].length));
  const MW = new Map();   // 名前の幅（画面の px、12px の太字）
  const nodeRk = (S, k) => (S.rk.get(k) || nodeR(S, S.dist.get(k))) * (S.prf.get(k) || 1);
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
    root.className = 'film' + (window.FILM_STORY ? ' story' : '');   // story：インスタのストーリー用（上下の端に大事な物を置かない）
    root.setAttribute('role', 'dialog');
    root.innerHTML = `<canvas></canvas><div class="cnt"></div><div class="fhint" hidden></div><div class="flegend" hidden></div><div class="cap" aria-live="polite"></div>
      <button type="button" class="skip"></button>${reduce() && film ? `<button type="button" class="nextb">${T.next}</button>` : ''}
      <div class="bar" hidden><button type="button" class="watch">${T.watch}</button><button type="button" class="watchUp">${T.watchUp}</button><button type="button" class="share">${T.share}</button><a class="detail" href="#">${T.detail}</a></div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d', { alpha: false });
    const cap = root.querySelector('.cap'), cnt = root.querySelector('.cnt'), hint = root.querySelector('.fhint'), skip = root.querySelector('.skip'), bar = root.querySelector('.bar');
    let W = 0, H = 0, dpr = 1;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; req(); };
    addEventListener('resize', resize);
    const GC = { nature: '#3f8f4f', tool: css('--hl') || '#d2691e', idea: '#8e5bd6' };
    // S-039：丸の色＝種類（粒度）。製品・部品＝青緑、素子・装置＝赤茶、工程・機械・道具＝茶、知恵＝紫、材料＝黄土、原点＝3つの群れの色
    const GRC = { 1: css('--node-prod') || '#2f6f8f', 2: '#b0553a', 3: css('--node-tech') || '#8a6a4a', 4: '#a08a2a' };
    const colOf = k => { if (k === S.id) return GRC[1]; if (S.roots.includes(k)) return GC[S.grp(k)]; const n = byId.get(k); return n.kind === 'idea' ? GC.idea : GRC[n.gran] || GRC[3]; };
    const C = { bg: css('--bg') || '#f8f5ee', ink: css('--ink') || '#222', sub: css('--sub') || '#777', hl: css('--hl') || '#d2691e', prod: css('--node-prod') || '#2f6f8f', tech: css('--node-tech') || '#8a6a4a', font: css('--font') || 'sans-serif' };

    let DIR = opt.dir || 'down';
    let S = scene(id, DIR), mode = film ? 'film' : 'center', people = null;
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
    const timing = () => { P2 = Math.max(S.aha.length ? 5200 : 1800, Math.min(6500, S.nL * 750)); t1 = 1400; t2 = t1 + P2 + 700; t3 = t2 + 1800; t4 = t3 + 2400; t5 = t4 + 2300; STARTS = [0, t1, t2, t3, t4, t5]; };
    timing();
    const layerStart = d => t1 + (d - 1) * (P2 / Math.max(1, S.nL));
    // 時計：ふつうは performance.now()。動画に書き出すとき（S-023）は外から1コマずつ進める（window.FILM_CLOCK）
    const clk = () => window.FILM_CLOCK != null ? window.FILM_CLOCK : performance.now();
    let t0 = clk(), jump = 0, still = reduce() && film ? 0 : -1, hiddenAt = 0, done = false;
    const now = () => still >= 0 ? STARTS[still + 1] - 1 : clk() - t0 + jump;
    const onVis = () => { if (document.hidden) hiddenAt = performance.now(); else { if (hiddenAt && mode === 'film') t0 += performance.now() - hiddenAt; hiddenAt = 0; req(); } };
    document.addEventListener('visibilitychange', onVis);
    const stats = window.FILM_STATS = { id, frames: 0, start: performance.now(), first: 0, worst: 0, last: 0 };

    // 中心図の見る場所（拡大・移動）
    let zoom = 1, panX = 0, panY = 0, s = 0, centerAt = 0, TR = null, glowK = null, glowAt = 0;   // TR＝真ん中を変える動き（S-040）、glowK＝押した丸が光っている間
    function toCenter(newId, push) {
      if (newId !== S.id) {
        const old = S, ov = view, was = mode === 'center';
        S = scene(newId, DIR); people = null;
        // S-040：前の図にもあった丸は、前の画面の位置から次の位置へ動いて移る（動きを減らす設定の人はすぐ切り替える）
        const XF = (window.FILM_RECENTER || 'fade') === 'fade';   // S-043：決まるまではクロスフェード（前の図がうすく消えて、新しい場所でうすく出る）。'slide'＝S-040 のすべる形（見本）
        TR = was && !reduce() ? { at: performance.now(), xf: XF, to: new Map(S.P), from: XF ? new Map() : new Map([...old.entries].map(([k]) => { const [x, y] = old.P.get(k); return [k, [ov.cx + x * ov.sc, ov.cy + y * ov.sc]]; })), osc: ov.sc, gone: [...old.entries].filter(([k]) => XF || !S.dist.has(k)).map(([k]) => k), gpos: new Map([...old.entries].map(([k]) => { const [x, y] = old.P.get(k); return [k, [ov.cx + x * ov.sc, ov.cy + y * ov.sc]]; })), oldS: old } : null;
      }
      glowK = null; mode = 'center'; zoom = 1; panX = panY = 0; s = 0; S.sel = null; centerAt = reduce() ? 0 : performance.now();
      root.classList.add('centerMode'); root.setAttribute('aria-label', nm(byId.get(S.id)));
      skip.textContent = T.close; bar.hidden = false; hint.hidden = false; hint.textContent = T.hint;
      const lg = root.querySelector('.flegend'); lg.hidden = false;
      lg.innerHTML = (EN() ? [['#2f6f8f', 'products & parts'], ['#b0553a', 'devices'], ['#8a6a4a', 'processes & tools'], ['#a08a2a', 'materials'], ['#8e5bd6', 'ideas'], ['#3f8f4f', 'origins']]
        : [['#2f6f8f', '製品・部品'], ['#b0553a', '素子・装置'], ['#8a6a4a', '工程・機械・道具'], ['#a08a2a', '材料'], ['#8e5bd6', '知恵'], ['#3f8f4f', '原点']]).map(([c, t]) => `<span><i style="border-color:${c}"></i>${t}</span>`).join('');
      root.querySelector('.detail').href = `${opt.base || ''}node.html#${S.id}`;
      root.querySelector('.watch').hidden = !countOf(S.id, 'down'); root.querySelector('.watchUp').hidden = !countOf(S.id, 'up');
      const sb = root.querySelector('.share'); sb.dataset.share = S.id; sb.dataset.shareView = 'center';   // share.js が拾う（S-024）
      const nx = root.querySelector('.nextb'); if (nx) nx.remove();
      cap.style.bottom = bar.offsetHeight ? `${bar.offsetHeight + 10}px` : '';   // ボタンが2行になって下の帯が高いときも、文が隠れないように
      cap.dataset.t = ''; if (push !== false && opt.onCenter) opt.onCenter(S.id);
      req();
    }
    function startFilm(newId) {
      if (newId !== S.id || S.dir !== DIR) S = scene(newId, DIR);
      mode = 'film'; people = null; loadPeople(); timing();
      t0 = clk(); jump = 0; still = reduce() ? 0 : -1; s = 0;
      root.classList.remove('centerMode'); cap.style.bottom = ''; skip.textContent = T.skip; bar.hidden = true; hint.hidden = true;
      root.setAttribute('aria-label', (DIR === 'up' ? T.askUp : T.ask)(byId.get(S.id)));
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
    root.querySelector('.watch').onclick = e => { e.stopPropagation(); DIR = 'down'; startFilm(S.id); };
    root.querySelector('.watchUp').onclick = e => { e.stopPropagation(); DIR = 'up'; startFilm(S.id); };
    root.querySelector('.detail').addEventListener('click', e => e.stopPropagation());
    root.addEventListener('keydown', e => { if (e.key === 'Escape') { if (mode === 'film') toCenter(S.id); else close(); } });

    // ---- 指・マウス：ムービー中は押すと次の場面、中心図では動かす・拡大・押した丸を真ん中に ----
    const ptrs = new Map(); let moved = 0, pinch0 = 0, zoom0 = 1;
    cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 取れないときも続ける */ } ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); zoom0 = zoom; } });
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
      if (S.LAY === 'D') {   // 扇の「＋〇個」を押すと開く／とじる
        const { cx, cy, sc } = view;
        const b = S.badges.find(z => Math.abs(cx + z.x * sc - e.clientX) <= z.w * sc / 2 + 6 && Math.abs(cy + z.y * sc - e.clientY) <= z.h * sc / 2 + 6);
        if (b) { if (S.open.has(b.g)) S.open.delete(b.g); else S.open.add(b.g); s = 0; zoom = 1; panX = panY = 0; req(); return; }
      }
      const k = hit(e.clientX, e.clientY);
      if (!k) { S.sel = null; req(); return; }
      if (k === S.id) return;
      if (glowK) return;   // 光っている間の2回目は無視
      if (S.sel === k) { if (reduce()) toCenter(k); else { glowK = k; glowAt = performance.now(); req(); setTimeout(() => { if (!done && glowK === k) toCenter(k); }, 260); } }   // S-040：押した丸が少し光ってから真ん中へ
      else { S.sel = k; req(); }   // S-032：1回目は前提と使う物の線を光らせる、もう1回で真ん中に
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => ptrs.delete(e.pointerId));
    cv.addEventListener('wheel', e => { if (mode !== 'center') return; e.preventDefault(); zoom = Math.max(0.6, Math.min(8, zoom * Math.exp(-e.deltaY * 0.0015))); req(); }, { passive: false });
    let view = { cx: 0, cy: 0, sc: 1 };
    function hit(x, y) {
      const { cx, cy, sc } = view; let best = null, bd = 1e9;
      for (const [k, d] of S.entries) {
        if (S.LAY === 'D' && d > 2 && !S.open.has(S.sectorKey(k))) continue;   // 閉じた扇の外の輪は押せない
        const [px, py] = S.P.get(k), sx = cx + px * sc, sy = cy + py * sc, r = Math.max(12, nodeRk(S, k) * sc);
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
      const ST = !!window.FILM_STORY;   // story：図を少し上に小さく（下の文と、上下の端を空ける）
      const outer = film ? S.RAD[Math.max(1, shown)] + 18 : (S.LAY === 'D' && !S.open.size ? (S.RAD[Math.min(3, S.nL)] || 0) + 60 : Math.max(...S.RAD) + (S.sectors || S.band ? 70 : 18));   // 案D：閉じているときは内側3輪に合わせる   // 中心図は外の帯・扇の名前まで入れる
      const want = Math.min(1.6, (Math.min(W, H * (ST ? 0.56 : film ? 0.72 : 0.66)) / 2 - 24) / outer);
      s = s ? s + (want - s) * (film && still < 0 ? 0.06 : 1) : want;
      const sc = s * (film ? 1 : zoom), cx = W / 2 + (film ? 0 : panX), cy = H * (ST ? 0.41 : film ? 0.46 : 0.44) + (film ? 0 : panY);
      view = { cx, cy, sc };
      ctx.translate(cx, cy); ctx.scale(sc, sc);
      const px = 1 / sc;
      // S-040：動いている間は、丸ごとに前の画面の位置→次の位置（S-038 の揺らぎ：遅れ 0〜120ms・速さ ±13%）
      let trEl = 0;
      if (TR && !film) {
        trEl = (performance.now() - TR.at) / (window.FILM_TR_SLOW || 1);   // FILM_TR_SLOW：途中の写真を撮るときだけゆっくりに
        if (trEl > 900) { S.P = TR.to; TR = null; }
        else {
          const P = new Map();
          for (const [k] of S.entries) {
            const to = TR.to.get(k), fr = TR.from.get(k);
            if (!fr) { P.set(k, to); continue; }
            const jt = S.jit.get(k), q = ease((trEl - (k === S.id ? 0 : jt.delay)) / (600 * jt.speed)), x0 = (fr[0] - cx) / sc, y0 = (fr[1] - cy) / sc;
            P.set(k, [x0 + (to[0] - x0) * q, y0 + (to[1] - y0) * q]);
          }
          S.P = P; req();
        }
      }
      const trA = k => !TR || film || TR.from.has(k) ? 1 : ease((trEl - 250) / 450);   // 新しく出る丸・線はうすく出る
      // 線
      let arrived = 0;
      ctx.lineWidth = px; ctx.strokeStyle = C.sub; ctx.globalAlpha = film ? 0.25 : 0.3; ctx.beginPath();
      const runs = [], wl = [], fadeL = [];
      // 案D：外の輪（3つ目から）は、開いた扇の物だけ出す
      const hid = k => S.LAY === 'D' && S.dist.get(k) > 2 && !S.open.has(S.sectorKey(k));
      for (const [k, d] of S.entries) {
        if (!d) continue;
        const jt = S.jit.get(k), ls = layerStart(d) + jt.delay, p = film ? ease((t - ls) / (700 * jt.speed)) : 1;
        if (p <= 0) continue;
        if (p >= 1) arrived++;
        const [x, y] = S.P.get(k), [vx, vy] = S.P.get(S.via.get(k));
        if (!film) continue;   // 止まった後は下で全部のつながりを描く
        if ((S.LAY === 'A' || S.LAY === 'C' || S.LAY === 'D') && S.kindOf(k) === 'wisdom') { if (S.LAY !== 'C' || S.dist.get(k) <= 2) wl.push([x, y, vx, vy]); continue; }
        if (p < 1) { fadeL.push([x, y, vx, vy, p]); continue; }   // S-043：線は伸びずに、その場でうすく出る
        ctx.moveTo(vx, vy); ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (const [x, y, vx, vy, p] of fadeL) { ctx.globalAlpha = 0.25 * p; ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(x, y); ctx.stroke(); }
      if (!film) {   // S-032：止まった後は、輪の中のノードどうしのつながりを全部（細く・薄く）。part は太く、understanding は点線
        const fade = TR ? 1 : Math.min(1, (performance.now() - centerAt) / 500);
        const draw = (list, alpha, col, w) => {
          for (const kk of ['r', 'p', 'u']) {
            const L = list.filter(e => (e[2] === 'e' ? 'r' : e[2]) === kk); if (!L.length) continue;
            ctx.strokeStyle = kk === 'u' ? '#8e5bd6' : col; ctx.lineWidth = (kk === 'p' ? 2.4 : 1) * w * px;
            ctx.setLineDash(kk === 'u' ? [3 * px, 3 * px] : []);
            for (const shared of TR ? [true, false] : [false]) {   // S-040：前の図にもあった線は端といっしょに動く（うすくしない）、新しい線はうすく出る
              ctx.globalAlpha = alpha * (shared ? 1 : TR ? Math.min(fade, trA('')) : fade); ctx.beginPath();
              for (const [f, t2] of L) { if (hid(f) || hid(t2)) continue; if (TR && shared !== (TR.from.has(f) && TR.from.has(t2))) continue; const [x1, y1] = S.P.get(f), [x2, y2] = S.P.get(t2); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
              ctx.stroke();
            }
          }
          ctx.setLineDash([]);
        };
        draw(S.all, 0.16, C.sub, 1);
        if (S.sel) draw(S.all.filter(e => e[0] === S.sel || e[1] === S.sel), 0.95, C.hl, 1.8);
        if (fade < 1) req();
      }
      if (wl.length) { ctx.setLineDash([3 * px, 3 * px]); ctx.strokeStyle = '#8e5bd6'; ctx.globalAlpha = 0.45; ctx.beginPath(); for (const [x, y, vx, vy] of wl) { ctx.moveTo(x, y); ctx.lineTo(vx, vy); } ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = C.sub; }
      // S-027 の見本：扇の境と名前、外の帯
      if (S.sectors && !film) {
        const R = S.LAY === 'D' && !S.open.size ? (S.RAD[Math.min(3, S.nL)] || 0) + 34 : S.RAD[S.nL] + 30;
        ctx.globalAlpha = 0.5; ctx.strokeStyle = C.sub; ctx.lineWidth = px; ctx.setLineDash([4 * px, 4 * px]); ctx.beginPath();
        for (const x of S.sectors) { ctx.moveTo(Math.cos(x.a0) * 40, Math.sin(x.a0) * 40); ctx.lineTo(Math.cos(x.a0) * R, Math.sin(x.a0) * R); }
        ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.font = `700 ${13 * px}px ${C.font}`; ctx.textAlign = 'center'; ctx.lineWidth = 4 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = C.ink;
        for (const x of S.sectors) {
          const a = (x.a0 + x.a1) / 2, nmx = S.LAY === 'A' || S.LAY === 'D' ? ({ material: EN() ? 'Materials' : '材料', tech: EN() ? 'Techniques' : '技術', wisdom: EN() ? 'Ideas' : '知恵' })[x.g] : (G.nodes.find(n => n.trunk === x.g) || {}).trunk_name;
          if (S.LAY === 'B' && x.a1 - x.a0 < 0.35) continue;   // 狭い扇は名前を出さない（拡大で見える）
          const t3 = `${nmx} ${x.n}`, lx = Math.cos(a) * (R + 14 * px), ly = Math.sin(a) * (R + 14 * px);
          ctx.strokeText(t3, lx, ly); ctx.fillText(t3, lx, ly);
        }
      }
      if (S.LAY === 'D' && !film) {
        S.badges = [];
        const r3 = S.RAD[Math.min(3, S.nL)] || S.RAD[S.nL];
        ctx.font = `700 ${13 * px}px ${C.font}`; ctx.textAlign = 'center';
        for (const x of S.sectors) {
          const n = S.entries.filter(([k, d]) => d > 2 && S.sectorKey(k) === x.g).length;
          if (!n) continue;
          const a = (x.a0 + x.a1) / 2, bx = Math.cos(a) * r3, by = Math.sin(a) * r3, op = S.open.has(x.g);
          const t4 = op ? (EN() ? 'close' : 'とじる') : `+${n}`, w = ctx.measureText(t4).width + 16 * px, h = 24 * px;
          ctx.globalAlpha = 1; ctx.fillStyle = op ? C.bg : C.ink; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5 * px;
          ctx.beginPath(); ctx.rect(bx - w / 2, by - h / 2, w, h); ctx.fill(); ctx.stroke();
          ctx.fillStyle = op ? C.ink : C.bg; ctx.fillText(t4, bx, by + 5 * px);
          S.badges.push({ g: x.g, x: bx, y: by, w, h });
        }
      }
      if ((S.LAY === 'gran' || S.LAY === 'height') && !film) {   // 輪の名前（粒度）・段（高さ）を輪の上に小さく
        ctx.globalAlpha = 0.85; ctx.font = `700 ${11 * px}px ${C.font}`; ctx.textAlign = 'left'; ctx.lineWidth = 4 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = C.sub;
        const GN = EN() ? ['', 'products & parts', 'devices', 'processes & tools', 'materials', 'origins'] : ['', '製品・部品', '素子・装置', '工程・機械・道具', '材料', '原点（始まり）'];
        for (let d = 1; d <= S.nL; d++) if (S.layers[d].length && (S.LAY === 'gran' || d === S.nL)) {   // 作る順番の輪は、いちばん外の「原点」だけ名前
          const t5 = S.LAY === 'gran' ? `${GN[d] || ''} ${S.layers[d].length}` : (d === S.nL ? (EN() ? `origins ${S.layers[d].length}` : `原点 ${S.layers[d].length}`) : `${d}`);
          const x = 6 * px, y = -S.RAD[d] - 4 * px; ctx.strokeText(t5, x, y); ctx.fillText(t5, x, y);
        }
        ctx.globalAlpha = 1;
      }
      if (S.band && !film) {
        ctx.globalAlpha = 0.35; ctx.strokeStyle = '#8e5bd6'; ctx.lineWidth = 22 * px; ctx.beginPath(); ctx.arc(0, 0, S.band.r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.font = `700 ${13 * px}px ${C.font}`; ctx.textAlign = 'center'; ctx.lineWidth = 4 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = '#6a3fb0';
        const t3 = EN() ? `Ideas ${S.band.n}` : `知恵（考え方・発見） ${S.band.n}`; ctx.strokeText(t3, 0, -S.band.r - 18 * px); ctx.fillText(t3, 0, -S.band.r - 18 * px);
      }
      ctx.globalAlpha = 1; ctx.fillStyle = C.hl;
      for (const [x, y] of runs) ctx.fillRect(x - 1.5 * px, y - 1.5 * px, 3 * px, 3 * px);
      // 5 の場面：光が全部の始まりから同時に、前提のつながりを通ってモノへ流れ込む
      if (film && t >= t4 && false) {   // S-034：外から内へ流れ込む光は使わない（真ん中から外へ分解する流れにした）
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
      // S-040：次の図に無い丸は、前の場所でうすく消える
      if (TR && !film && TR.gone.length) {
        const g = 1 - ease(trEl / 350);
        if (g > 0) { ctx.globalAlpha = g; if (TR.xf) { ctx.strokeStyle = C.sub; ctx.lineWidth = px; ctx.globalAlpha = 0.16 * g; ctx.beginPath(); for (const [f, t2] of TR.oldS.all) { const A1 = TR.gpos.get(f), B1 = TR.gpos.get(t2); if (!A1 || !B1) continue; ctx.moveTo((A1[0] - cx) / sc, (A1[1] - cy) / sc); ctx.lineTo((B1[0] - cx) / sc, (B1[1] - cy) / sc); } ctx.stroke(); ctx.globalAlpha = g; }
          for (const k of TR.gone) { const [fx, fy] = TR.gpos.get(k), x = (fx - cx) / sc, y = (fy - cy) / sc, r = Math.max(2 * px, nodeRk(TR.oldS, k) * TR.osc / sc * 0.8); ctx.fillStyle = colOf(k); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } }
      }
      // 点
      ctx.imageSmoothingEnabled = false;
      const rootSet = film && t >= t2 ? new Set(S.roots) : null;
      const labels = [];
      for (const [k, d] of S.entries) {
        const n = byId.get(k);
        let [x, y] = S.P.get(k), a = 1, swell = 1;
        if (film && d) {
          const jt = S.jit.get(k), q = (t - layerStart(d) - jt.delay) / (700 * jt.speed), p = ease(q); if (p <= 0) continue;
          swell = q < 1 ? 1 + 0.12 * Math.sin(Math.PI * Math.max(0, q)) : 1;   // 出てくる時に少しふくらんで元へ（控えめ）
          a = p;   // S-043：すべって来ずに、その場所でうすく出る（＋少しふくらんで戻る）
        } else if (film) a = ease(t / 900);
        if (!film && TR) a = trA(k);
        const r = nodeRk(S, k) * (film && !d ? 0.6 + 0.4 * a : 1) * swell, rs = r * sc;   // rs＝画面での半径
        ctx.globalAlpha = a;
        if (!film && glowK === k) { const q = Math.min(1, (performance.now() - glowAt) / 260); ctx.globalAlpha = 0.7 * (1 - q * 0.5); ctx.fillStyle = C.hl; ctx.beginPath(); ctx.arc(x, y, r + (4 + 10 * q) * px, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = a; req(); }   // S-040：押した丸が光る
        if (!film && hid(k)) continue;
        if (!film && rs < 3 && d) { ctx.fillStyle = colOf(k); ctx.fillRect(x - 2 * px, y - 2 * px, 4 * px, 4 * px); continue; }   // 混んだ輪は小さな点
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = C.bg; ctx.fill();
        const glow = (rootSet && rootSet.has(k)) || (!film && S.sel === k);
        ctx.lineWidth = (glow ? 3.5 : d ? 2 : 3) * Math.min(px, 1 / Math.max(0.5, s * 0.8)); ctx.strokeStyle = glow ? (!film && S.sel === k ? C.hl : GC[S.grp(k)]) : colOf(k); ctx.stroke();
        const sl = A.slot.get(k);
        if (sl && rs >= 3) ctx.drawImage(A.c, sl[0], sl[1], 16, 16, x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4);
        if (film && d === 1 && a >= 1 && rs >= 5 && t < t2) labels.push([x, y + r + 13 * px, nm(n), d]);   // 分解の始め：部品の名前を読める速さで
        if (!film && d && S.dir === 'up' && AIPATH.has(k) && n.kind === 'product' && rs >= 2) labels.push([x, y + r + 13 * px, nm(n), 0]);
        if (!film && d && (rs >= 9 || (S.LAY === 'D' && d <= 2 && rs >= 4) || (n.pr || 0) >= 8 && rs >= 4)) labels.push([x, y + r + 13 * px, nm(n), d, n.pr || 0, a]);
      }
      // 始まりの光（3 の場面）：全部の始まりに輪が1回だけ広がる
      if (film && t >= t2 && t < t3 + 400) {
        const q = still >= 0 ? 0.5 : (t - t2) / 1400;
        if (q > 0 && q < 1) {
          ctx.globalAlpha = (1 - q) * 0.9; ctx.lineWidth = 3 * px;
          for (const g of ['nature', 'tool', 'idea']) {   // 群れごとの色：自然＝緑、最初の道具＝だいだい、考え方＝紫
            ctx.strokeStyle = GC[g]; ctx.beginPath();
            for (const k of S.roots) if (S.grp(k) === g) { const [x, y] = S.P.get(k), r0 = nodeRk(S, k); ctx.moveTo(x + r0 + 4 * px + q * 14 * px, y); ctx.arc(x, y, r0 + 4 * px + q * 14 * px, 0, Math.PI * 2); }
            ctx.stroke();
          }
        }
      }
      // S-034「あ！」：その一言が出ている間、部品から原点までの道を光らせる
      const ahaNow = film && t >= t1 && t < t2 ? S.aha[(t - t1) / P2 < 0.62 ? 0 : 1] : null;
      if (ahaNow && (t - t1) / P2 > 0.3) {
        ctx.globalAlpha = 0.9; ctx.strokeStyle = C.hl; ctx.lineWidth = 3 * px; ctx.beginPath();
        ahaNow.path.forEach((k, i) => { if (S.dist.get(k) && t < layerStart(S.dist.get(k)) + 700) return; const [x, y] = S.P.get(k); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
      // モノに光が届いた：輪が1回広がる
      if (film && t >= t4 + 1700 && false) {
        const q = still >= 0 ? 0.4 : (t - t4 - 1700) / 600;
        if (q > 0 && q < 1) { ctx.globalAlpha = 1 - q; ctx.strokeStyle = C.hl; ctx.lineWidth = 3 * px; ctx.beginPath(); ctx.arc(0, 0, nodeR(S, 0) + 6 * px + q * 30 * px, 0, Math.PI * 2); ctx.stroke(); }
      }
      // 中心図の名前：画面で大きく見える丸だけ、重ならない物を（内側の輪から）
      if (labels.length) {
        ctx.globalAlpha = 1; ctx.font = `700 ${12 * px}px ${C.font}`; ctx.textAlign = 'center'; ctx.lineWidth = 3 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = C.ink;
        const boxes = [];
        labels.sort((a, b) => (b[4] || 0) - (a[4] || 0) || a[3] - b[3]);   // S-039：混んでいる所は PageRank の高い物の名前を先に
        for (const [x, y, text, , , la] of labels) {
          let w0 = MW.get(text); if (w0 == null) { w0 = 0; for (const ch of text) w0 += ch.codePointAt(0) > 0x2e80 ? 12 : 7.2; MW.set(text, w0); }   // 文字の幅は数えて見積もる（measureText は日本語で重い、S-040）
          const w = w0 * px, b = [x - w / 2, y - 12 * px, x + w / 2, y + 3 * px];
          if (boxes.some(o => o[0] < b[2] && b[0] < o[2] && o[1] < b[3] && b[1] < o[3])) continue;
          boxes.push(b); ctx.globalAlpha = la ?? 1; ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
        }
      }
      // 混んだ輪の「＋数」：点だけになった輪は、輪の右下に数
      if (!film) {
        ctx.globalAlpha = 1; ctx.font = `700 ${12 * px}px ${C.font}`; ctx.textAlign = 'left'; ctx.lineWidth = 4 * px; ctx.strokeStyle = C.bg; ctx.fillStyle = C.sub;
        for (let d = 1; d <= S.nL; d++) if (!S.sectors && S.LAY !== 'C' && S.LAY !== 'height' && nodeR(S, d) * sc < 3) { const t2x = `+${S.layers[d].length}`, x = Math.cos(0.6) * S.RAD[d] + 6 * px, y = Math.sin(0.6) * S.RAD[d] + 4 * px; ctx.strokeText(t2x, x, y); ctx.fillText(t2x, x, y); }   // 文字のまわりを地の色でふちどり（点と重ならないように）
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 人の肖像（4 の場面）
      if (film && t >= t3 && people) {
        const k = people.pics.length, sz = Math.min(48, Math.max(30, W / 12));
        const rx = W / 2 - sz / 2 - 6, ry = window.FILM_STORY ? H * 0.21 : Math.min(H * 0.46 - sz / 2 - 8, H * 0.36 - sz / 2);   // story：下の文と重ならないように内側へ
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
        const fr = (t - t1) / P2, ah = sc5 === 1 && fr > 0.3 ? S.aha[fr < 0.62 ? 0 : 1] : null;
        const ASK = S.dir === 'up' ? T.askUp : T.ask, AHA = S.dir === 'up' ? T.ahaUp : T.aha;
        capText = [ASK(target), ah ? AHA(nm(byId.get(ah.part)), nm(byId.get(ah.root))) : ASK(target), S.dir === 'up' ? T.made(target, S.total) : T.roots(S.groups), people ? T.people(people.n, people.anon) : '…', T.you][sc5];
        ct = sc5 >= 1 ? T.count(Math.min(S.total, sc5 >= 2 ? S.total : arrived)) + (sc5 === 1 && shown ? (S.LAY === 'gran' ? `・${T.ring(shown)} +${S.layers[shown].length}` : S.dir === 'up' ? (EN() ? ` · ${shown} step${shown > 1 ? 's' : ''} ahead: +${S.layers[shown].length}` : `・${shown} 世代先 +${S.layers[shown].length}`) : T.gen(shown, S.layers[shown].length)) : '') : '';
      } else {
        if (S.sel && byId.has(S.sel)) {
          const a = S.all.filter(e => e[1] === S.sel).length, b = S.all.filter(e => e[0] === S.sel).length;
          capText = EN() ? `${nm(byId.get(S.sel))}: needs ${a}, used by ${b}` : `${nm(byId.get(S.sel))}：前提 ${a}・使う物 ${b}`;
        } else capText = `[${S.id}] ${nm(target)}`;
        ct = S.dir === 'up' ? T.sumUp(S.total) : S.total ? T.sum(S.total, S.roots.length) : (EN() ? 'A starting point (no prerequisites)' : '始まりの1つ（前提なし）');
      }
      if (cap.dataset.t !== capText) { cap.dataset.t = capText; cap.textContent = capText; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in'); }
      if (cnt.textContent !== ct) cnt.textContent = ct;
      if (film) req();
    }
    root.tabIndex = -1; root.focus();
    resize();
    if (film) { skip.textContent = T.skip; root.setAttribute('aria-label', (DIR === 'up' ? T.askUp : T.ask)(byId.get(id))); req(); }
    else toCenter(id, false);
    return { center: k => toCenter(k, false), close, get id() { return S.id; }, get mode() { return mode; }, get view() { return view; } };   // view：真ん中の画面の位置（S-041 の見本が使う）
  }
  const play = (id, opt) => open(id, opt, true);
  const playUp = (id, opt) => open(id, { ...opt, dir: 'up' }, true);
  const center = (id, opt) => open(id, opt, false);
  // 初めての1回だけ（ブラウザに「見た」を保存。保存できない環境では出さない）
  function firstTime(id, opt) {
    try { if (localStorage.getItem('tn-film-seen')) return null; localStorage.setItem('tn-film-seen', '1'); } catch (e) { return null; }
    return play(id, opt);
  }
  const countOf = (id, dir) => scene(id, dir).total;   // 中心図と同じ数え方（up は年の決まりも）
  window.Film = { play, playUp, center, firstTime, countOf, scene };   // scene はテスト用（tools/test_rings.mjs）
})();
