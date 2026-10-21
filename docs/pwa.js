// ホーム画面に置けるアプリ（S-026）：service worker を登録し、「ホーム画面に追加」の案内を出す。
// Android など（beforeinstallprompt が来る機器）：メニューの中に「ホーム画面に追加」ボタン。
// iPhone（Safari）：アプリとして開いていなければ、1回だけ「共有 → ホーム画面に追加」の短い説明（自動で何度も出さない）
(function () {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  const EN = () => document.documentElement.lang === 'en';
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferred = e;
    const b = document.getElementById('installBtn'); if (b) b.hidden = false;
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest('#installBtn'); if (!b || !deferred) return;
    deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; b.hidden = true;
  });
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
  if (ios && !standalone) {
    let seen = false; try { seen = localStorage.getItem('tn-ios-hint') === '1'; localStorage.setItem('tn-ios-hint', '1'); } catch (e) { seen = true; }
    if (!seen) window.addEventListener('load', () => setTimeout(() => {
      const d = document.createElement('div'); d.className = 'iosHint'; d.setAttribute('role', 'note');
      d.innerHTML = (EN() ? 'Add to your Home Screen: tap <b>Share</b>, then <b>Add to Home Screen</b>.' : 'ホーム画面に置けます：<b>共有</b> → <b>ホーム画面に追加</b>')
        + '<button type="button" aria-label="' + (EN() ? 'Close' : '閉じる') + '">✕</button>';
      d.querySelector('button').onclick = () => d.remove();
      document.body.appendChild(d); setTimeout(() => d.remove(), 12000);
    }, 2500));
  }
})();
