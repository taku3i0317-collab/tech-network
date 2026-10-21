// 自動生成：tools/gen_sw.py（手で直さない）。オフラインで見るための service worker（S-026）
const VERSION = 'tn-8eebdb64b87c';
const CORE = ["./", "network.html", "node.html", "glossary.html", "people.html", "credits.html", "design.css", "tech_network_graph.js", "tech_network_detail.js", "glossary.js", "autolink.js", "furigana.js", "furigana_dict.js", "linebreak.js", "vendor/budoux-ja.min.js", "ui_icons.js", "film.js", "share.js", "pwa.js", "manifest.webmanifest", "app_icon_192.png", "app_icon_512.png", "apple-touch-icon.png"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tn-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 保存した物をすぐ出し、裏で取り直して保存（次に開いたとき新しい）。フォント（Google Fonts）も同じ。そのほかの外のサイトはそのまま
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const ok = u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || u.hostname === 'cdnjs.cloudflare.com';
  if (!ok) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const key = u.origin === location.origin ? new Request(u.origin + u.pathname) : r;   // ?v= や #番号 は同じ物として保存
    const hit = await c.match(key);
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
