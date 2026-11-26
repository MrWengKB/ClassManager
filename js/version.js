/* Class Manager · 版本检查：网页有新版本时自动刷新（避免浏览器 / App 一直用旧的缓存）
 * BUILD must match version.json; bump both with every release.
 * On opening a page: newer version → reload once straight away (nothing has been changed yet).
 * Coming back to an open page later: show a small “new version” button instead, so nothing being typed is lost.
 */
(function () {
  const BUILD = '20261126d';
  window.CM_BUILD = BUILD;
  const KEY = 'classmanager:reloadedFor';
  let shown = false, last = 0;
  async function latest() {
    try {
      const res = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return null;
      const v = (await res.json()).v;
      return typeof v === 'string' ? v : null;
    } catch (e) { return null; }
  }
  function toast() {
    if (shown || !document.body) return;
    shown = true;
    const b = document.createElement('button');
    b.className = 'cm-update';
    b.type = 'button';
    b.textContent = (window.I18n && window.I18n.t('newVersion')) || '🔄 New version: tap to update';
    b.addEventListener('click', () => location.reload());
    document.body.appendChild(b);
  }
  async function check(first) {
    if (location.protocol === 'file:') return;
    last = Date.now();
    const v = await latest();
    if (!v || v <= BUILD) return;
    let done = null;
    try { done = sessionStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (first && done !== v) {
      try { sessionStorage.setItem(KEY, v); } catch (e) { /* ignore */ }
      location.reload();
    } else toast();
  }
  check(true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - last > 5 * 60000) check(false); });
})();
