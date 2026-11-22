/* Class Manager · 创建账号 / 登录 */
(function () {
  const { t } = window.I18n;
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const nextRaw = params.get('next') || '';
  const next = /^[A-Za-z0-9_-]+\.html$/.test(nextRaw) ? nextRaw : 'admin.html';

  // First visit (no accounts yet) starts on "create"; ?mode= can force either form.
  let mode = params.get('mode') === 'create' || (params.get('mode') !== 'signin' && !window.Auth.hasAccounts()) ? 'create' : 'signin';
  let error = null;
  let busy = false;

  function render() {
    const create = mode === 'create';
    document.title = t(create ? 'accCreateTitle' : 'accSignInTitle') + ' · ' + t('appName');
    $('#brandName').textContent = t('appName');
    $('#brandSub').textContent = t('appSub');
    $('#langSel').value = window.I18n.lang;
    $('#langSel').title = t('language');
    $('#authTitle').textContent = t(create ? 'accCreateTitle' : 'accSignInTitle');
    $('#lblName').textContent = t('accName');
    $('#lblPw').textContent = t('accPassword');
    $('#lblConfirm').textContent = t('accConfirm');
    $('#pwHint').textContent = create ? t('accPwHint') : '';
    $('#pwHint').hidden = !create;
    $('#confirmRow').hidden = !create;
    $('#accPw').autocomplete = create ? 'new-password' : 'current-password';
    $('#authSubmit').textContent = t(create ? 'accCreateBtn' : 'accSignInBtn');
    $('#authSubmit').disabled = busy;
    $('#authSwitch').textContent = t(create ? 'accToSignIn' : 'accToCreate');
    $('#authNote').textContent = t('accLocalNote');
    $('#authMsg').hidden = !error;
    $('#authMsg').textContent = error ? t('err_' + error) : '';
  }

  $('#langSel').addEventListener('change', e => { window.I18n.setLang(e.target.value); render(); });
  $('#authSwitch').addEventListener('click', () => {
    mode = mode === 'create' ? 'signin' : 'create';
    error = null;
    $('#accPw').value = ''; $('#accConfirm').value = '';
    render();
    $('#accName').focus();
  });
  $('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (busy) return;
    busy = true; error = null; render();
    const name = $('#accName').value, pw = $('#accPw').value;
    try {
      error = mode === 'create'
        ? await window.Auth.createAccount(name, pw, $('#accConfirm').value)
        : await window.Auth.signIn(name, pw);
    } catch (err) { error = 'noCrypto'; }
    busy = false;
    if (!error) { location.href = next; return; }
    render();
  });

  render();
  $('#accName').focus();
})();
