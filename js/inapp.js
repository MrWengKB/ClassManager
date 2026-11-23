/* Class Manager · 在安卓应用（TWA）里打开时才显示「看广告支持作者」按钮，点了打开应用里的原生广告页 */
(function () {
  const PKG = 'io.github.mrwengkb.classmanager';
  let inApp = false;
  try {
    if (/[?&]app=android\b/.test(location.search) || document.referrer.indexOf('android-app://' + PKG) === 0) sessionStorage.setItem('cm_app', 'android');
    inApp = sessionStorage.getItem('cm_app') === 'android';
  } catch (e) {}
  window.InApp = { android: inApp, supportUrl: 'intent://support#Intent;scheme=classmanager;package=' + PKG + ';end' };
  if (inApp) document.documentElement.classList.add('in-app');
})();
(function () {
  const a = document.getElementById('lnkSupport');
  if (!a || !window.InApp.android) return;
  a.href = window.InApp.supportUrl;
  a.hidden = false;
})();
