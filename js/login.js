/* Class Manager · 用 Google 账号登录 */
(function () {
  const { t } = window.I18n;
  const $ = s => document.querySelector(s);
  const nextRaw = new URLSearchParams(location.search).get('next') || '';
  const next = /^[A-Za-z0-9_-]+\.html$/.test(nextRaw) && nextRaw !== 'login.html' ? nextRaw : 'admin.html';
  let error = null, busy = false;

  function render() {
    document.title = t('accSignInTitle') + ' · ' + t('appName');
    $('#brandName').textContent = t('appName');
    $('#brandSub').textContent = t('appSub');
    $('#langSel').value = window.I18n.lang;
    $('#langSel').title = t('language');
    $('#authTitle').textContent = t('accSignInTitle');
    $('#authIntro').textContent = t('signInPrompt');
    $('#gsignText').textContent = t('signInGoogle');
    $('#gsign').disabled = busy;
    $('#authNote').textContent = t(window.Cloud.enabled ? 'signInNoteDrive' : 'signInNoteLocal');
    $('#authMsg').hidden = !error;
    $('#authMsg').textContent = error ? t(error) : '';
  }

  $('#gsign').addEventListener('click', async () => {
    busy = true; error = null; render();
    try {
      await window.Auth.signIn();
      location.href = next;
      return;
    } catch (e) {
      error = window.Cloud.authErrorKey(e);
    }
    busy = false; render();
  });
  $('#langSel').addEventListener('change', e => { window.I18n.setLang(e.target.value); render(); });

  if (window.Auth.token()) { location.replace(next); return; }
  render();
  window.Auth.loadGsi().catch(() => { error = 'err_gsi'; render(); });
})();
