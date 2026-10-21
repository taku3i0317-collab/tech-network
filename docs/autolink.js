// 自動リンク（S-009）：文の中にノード・人物・用語集の言葉があれば、ウィキのようにリンクにする。
// 決まり：長い言葉を先に／同じリンク先は段落の最初の1回だけ／自分自身にはリンクしない／すでにあるリンクの中は触らない／
// カタカナだけ・英字の言葉は、前後が同じ種類の文字なら別の言葉の一部とみなしてリンクしない（「カリ」と「カリウム」など）
// 言葉の辞書は tools/gen_tree_views.py が tech_network_detail.js の terms・terms_en に入れる。用語集は glossary.js
(function () {
  let RE = null, MAP = null;
  const KATA = /^[ァ-ヶー・]+$/, ASCII = /^[\x20-\x7e]+$/;
  const isKata = c => /[ァ-ヶー]/.test(c || ''), isWord = c => /[A-Za-z0-9]/.test(c || '');
  function init(terms) {
    MAP = new Map();
    for (const [t, g] of terms || []) if (t && !MAP.has(t)) MAP.set(t, g);
    const keys = [...MAP.keys()].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    RE = keys.length ? new RegExp(keys.join('|'), 'g') : null;
  }
  // html：エスケープ済みの HTML（タグを含んでよい）。selfId：自分のノード番号。nodeHref(id)：ノードへの href
  function link(html, selfId, nodeHref) {
    if (!RE || !html) return html;
    const used = new Set(); let inA = 0;
    return html.split(/(<[^>]+>)/).map(part => {
      if (part.startsWith('<')) { if (/^<a[\s>]/i.test(part)) inA++; else if (/^<\/a>/i.test(part)) inA = Math.max(0, inA - 1); return part; }
      if (inA || !part) return part;
      return part.replace(RE, (m, off, all) => {
        const g = MAP.get(m);
        if (!g || g === selfId || used.has(g)) return m;
        if (KATA.test(m) && (isKata(all[off - 1]) || isKata(all[off + m.length]))) return m;
        if (ASCII.test(m) && (isWord(all[off - 1]) || isWord(all[off + m.length]))) return m;
        if (/^&\w*;?$/.test(m)) return m;
        used.add(g);
        const href = g.startsWith('g:') ? `glossary.html#${encodeURIComponent(g.slice(2))}` : nodeHref(g);
        return `<a class="al" href="${href}" data-al="${g}">${m}</a>`;
      });
    }).join('');
  }
  // プレビュー：リンクにマウスを乗せると小さなカード。スマホは長押し（0.5 秒）
  function preview(root, info) {
    let box = document.getElementById('alprev');
    if (!box) { box = document.createElement('div'); box.id = 'alprev'; box.className = 'alprev'; box.hidden = true; document.body.appendChild(box); }
    const show = (a) => {
      const d = info(a.dataset.al); if (!d) return;
      box.innerHTML = `${d.icon ? `<img src="${d.icon}" alt="">` : ''}<div><b>${d.name}</b>${d.text ? `<p>${d.text}</p>` : ''}</div>`;
      box.hidden = false;
      const r = a.getBoundingClientRect(), w = Math.min(300, window.innerWidth - 16);
      box.style.width = w + 'px';
      box.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + 'px';
      const below = r.bottom + 8, h = box.offsetHeight;
      box.style.top = (below + h > window.innerHeight ? Math.max(8, r.top - h - 8) : below) + 'px';
    };
    const hide = () => { box.hidden = true; };
    root.addEventListener('mouseover', e => { const a = e.target.closest && e.target.closest('a.al'); if (a) show(a); });
    root.addEventListener('mouseout', e => { const a = e.target.closest && e.target.closest('a.al'); if (a) hide(); });
    let timer = null, longShown = false;
    root.addEventListener('touchstart', e => {
      const a = e.target.closest && e.target.closest('a.al'); if (!a) return;
      longShown = false; timer = setTimeout(() => { show(a); longShown = true; }, 500);
    }, { passive: true });
    root.addEventListener('touchend', () => clearTimeout(timer));
    root.addEventListener('touchmove', () => clearTimeout(timer), { passive: true });
    root.addEventListener('click', e => { if (longShown && e.target.closest && e.target.closest('a.al')) { e.preventDefault(); longShown = false; } }, true);
    document.addEventListener('scroll', hide, { passive: true });
    document.addEventListener('touchstart', e => { if (!e.target.closest || !e.target.closest('a.al')) hide(); }, { passive: true });
  }
  window.AutoLink = { init, link, preview };
})();
