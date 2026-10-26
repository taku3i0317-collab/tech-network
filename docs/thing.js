// 物のページ・入口・章の一覧の小さな動き（S-061・S-064）。本文は HTML に最初から書いてある（JS が無くても読める）
// - 言語：言語の一覧（lang/index.json）から選ぶ。?lang=xx か、前に選んだ言語（tn-lang）。
//   data-k="<キー>" の所は その言語 → 英語 → 日本語（元の文）の順。data-en だけの所は 英語。アラビア語などは右から左。日本語のときだけ ふりがな
// - 機械訳の言語では、小さく「機械訳」の印と「訳を直す」（言語つきの Issue）
// - ▶ できるまで（data-film）：ムービー（film.js）。共有（data-share）：share.js
(function () {
  const ROOT = (document.currentScript && document.currentScript.src.replace(/thing\.js.*$/, '')) || '';
  let lang = 'ja';
  try { const q = new URLSearchParams(location.search).get('lang'); if (q) localStorage.setItem('tn-lang', q); lang = localStorage.getItem('tn-lang') || 'ja'; } catch (e) { /* 保存できない */ }
  const cache = {};
  const load = l => cache[l] || (cache[l] = fetch(ROOT + 'lang/' + l + '.json').then(r => r.ok ? r.json() : null).catch(() => null));
  const FONTS = { 'zh-Hans': 'Noto+Sans+SC', ko: 'Noto+Sans+KR', hi: 'Noto+Sans+Devanagari', ar: 'Noto+Sans+Arabic' };
  const font = l => {
    if (!FONTS[l] || document.getElementById('font-' + l)) return;
    const k = document.createElement('link'); k.id = 'font-' + l; k.rel = 'stylesheet'; k.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[l] + ':wght@400;700&display=swap'; document.head.appendChild(k);
    document.documentElement.style.setProperty('--lang-font', `"${FONTS[l].replace(/\+/g, ' ')}"`);
  };
  async function apply() {
    const L = lang === 'ja' ? null : await load(lang), E = lang === 'ja' ? null : await load('en');
    const S = (L && L.s) || {}, ES = (E && E.s) || {};
    const meta = (L && L._meta) || { dir: 'ltr', machine: false };
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir || 'ltr';
    font(lang);
    document.querySelectorAll('[data-k],[data-en]').forEach(el => {
      if (el.dataset.ja === undefined) el.dataset.ja = el.textContent;
      if (lang === 'ja') { el.textContent = el.dataset.ja; return; }
      const k = el.dataset.k;
      el.textContent = (k && (S[k] || ES[k])) || el.dataset.en || el.dataset.ja;
    });
    document.querySelectorAll('[data-en-ph]').forEach(el => { if (el.dataset.jaPh === undefined) el.dataset.jaPh = el.placeholder; el.placeholder = lang === 'ja' ? el.dataset.jaPh : ((S['ui.search_placeholder'] || ES['ui.search_placeholder']) || el.dataset.enPh); });
    let mt = document.getElementById('mtNote');
    if (lang !== 'ja' && meta.machine) {
      if (!mt) { mt = document.createElement('p'); mt.id = 'mtNote'; mt.className = 'meta'; (document.querySelector('.wrap') || document.body).prepend(mt); }
      const fix = 'https://github.com/taku3i0317-collab/tech-network/issues/new?' + new URLSearchParams({ title: `[translation ${lang}] ${location.pathname.split('/').pop()}`, body: `Language: ${lang}\nPage: ${location.href}\n\nWhat is wrong / better wording:\n` });
      mt.innerHTML = `${S['ui.machine_translation'] || ES['ui.machine_translation'] || 'Machine translation'} · <a href="${fix}" rel="noopener">${S['ui.fix_translation'] || ES['ui.fix_translation'] || 'Fix this translation'}</a>`;
    } else if (mt) mt.remove();
    const fb = document.getElementById('furiBtn'); if (fb) fb.hidden = lang !== 'ja';
  }
  // English のボタンを、言語の一覧（えらぶ）にかえる
  async function menu() {
    const b = document.getElementById('langBtn'); if (!b) return;
    let list = [];
    try { list = await (await fetch(ROOT + 'lang/index.json')).json(); } catch (e) { /* 一覧が無い：English だけ */ }
    const sel = document.createElement('select'); sel.id = 'langSel'; sel.setAttribute('aria-label', 'Language / 言語');
    const opts = [{ lang: 'ja', name: '日本語' }, ...list.sort((a, b) => (a.lang === 'en' ? -1 : b.lang === 'en' ? 1 : 0))];
    if (!opts.some(o => o.lang === 'en')) opts.splice(1, 0, { lang: 'en', name: 'English' });
    sel.innerHTML = opts.map(o => `<option value="${o.lang}"${o.lang === lang ? ' selected' : ''}>${o.name}</option>`).join('');
    sel.addEventListener('change', () => { lang = sel.value; try { localStorage.setItem('tn-lang', lang); } catch (e) { /* 保存できない */ } apply(); });
    b.replaceWith(sel);
  }
  menu(); apply();
  // 前のウィキの URL から来た時など：#it-… の目印へ、字の読み込みで位置がずれた後にもう一度
  const toHash = () => { const h = decodeURIComponent(location.hash.slice(1)); const el = h && document.getElementById(h); if (el) el.scrollIntoView(); };
  if (location.hash) { addEventListener('load', toHash); if (document.fonts && document.fonts.ready) document.fonts.ready.then(toHash); }
  document.addEventListener('click', e => {
    const f = e.target.closest('[data-film]');
    if (f && window.Film) { e.preventDefault(); Film.play(f.dataset.film, { onClose: () => {} }); }
  });
})();
