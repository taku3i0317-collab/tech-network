// 物のページ・入口・章の一覧の小さな動き（S-061）。本文は HTML に最初から書いてある（JS が無くても読める）
// - 英語：?lang=en か、ほかのページで English を押した（tn-lang）とき、data-en のある所を英語に
// - ▶ できるまで（data-film）：ムービー（film.js）。共有（data-share）：share.js
(function () {
  let en = false;
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'ja') localStorage.setItem('tn-lang', q); en = localStorage.getItem('tn-lang') === 'en'; } catch (e) { /* 保存できない */ }
  const apply = () => {
    document.documentElement.lang = en ? 'en' : 'ja';
    document.querySelectorAll('[data-en]').forEach(el => { if (!el.dataset.ja) el.dataset.ja = el.textContent; el.textContent = en ? el.dataset.en : el.dataset.ja; });
    document.querySelectorAll('[data-en-ph]').forEach(el => { if (!el.dataset.jaPh) el.dataset.jaPh = el.placeholder; el.placeholder = en ? el.dataset.enPh : el.dataset.jaPh; });
    const b = document.getElementById('langBtn'); if (b) b.textContent = en ? '日本語' : 'English';
  };
  apply();
  // 前のウィキの URL から来た時など：#it-… の目印へ、字の読み込みで位置がずれた後にもう一度
  const toHash = () => { const h = decodeURIComponent(location.hash.slice(1)); const el = h && document.getElementById(h); if (el) el.scrollIntoView(); };
  if (location.hash) { addEventListener('load', toHash); if (document.fonts && document.fonts.ready) document.fonts.ready.then(toHash); }
  document.addEventListener('click', e => {
    if (e.target.closest('#langBtn')) { en = !en; try { localStorage.setItem('tn-lang', en ? 'en' : 'ja'); } catch (er) { /* 保存できない */ } apply(); return; }
    const f = e.target.closest('[data-film]');
    if (f && window.Film) { e.preventDefault(); Film.play(f.dataset.film, { onClose: () => {} }); }
  });
})();
