/* Class Manager · 用 Google 账号登录 */
(function () {
  const { t } = window.I18n;
  const $ = s => document.querySelector(s);
  const nextRaw = new URLSearchParams(location.search).get('next') || '';
  const next = /^[A-Za-z0-9_-]+\.html$/.test(nextRaw) && nextRaw !== 'login.html' ? nextRaw : 'admin.html';
  const studentMode = new URLSearchParams(location.search).has('student');
  let error = null, busy = false, stuError = null;
  let lastStudent = null;
  try { lastStudent = JSON.parse(localStorage.getItem('classmanager:student') || 'null'); } catch (e) { /* ignore */ }
  if (lastStudent && !window.StudentData.parseToken(lastStudent.token)) lastStudent = null;
  const canScan = 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

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
    $('#stuTitle').textContent = t('stuLogin');
    $('#stuHint').textContent = t('stuLoginHint');
    $('#stuCode').placeholder = t('stuCodePh');
    $('#stuGo').textContent = t('stuGo');
    $('#stuScan').hidden = !canScan;
    $('#stuScan span').textContent = t('stuScan');
    $('#stuContinue').hidden = !lastStudent;
    if (lastStudent) {
      $('#stuContinue').textContent = t('stuContinue', { name: lastStudent.name || '' });
      $('#stuContinue').href = 'student.html#' + lastStudent.token;
    }
    $('#stuMsg').hidden = !stuError;
    $('#stuMsg').textContent = stuError ? t(stuError) : '';
  }

  /* ---------- students: a link / code, or the QR code on their card ---------- */
  function openStudent(text) {
    const tok = window.StudentData.parseToken(text);
    if (!tok) { stuError = 'stuBadCode'; render(); return false; }
    location.href = 'student.html#' + window.StudentData.tokenOf(tok.file, tok.secret);
    return true;
  }
  $('#stuForm').addEventListener('submit', e => { e.preventDefault(); openStudent($('#stuCode').value); });
  let stream = null;
  function stopCam() {
    if (stream) stream.getTracks().forEach(tr => tr.stop());
    stream = null;
    $('#stuCam').hidden = true;
  }
  $('#stuScan').addEventListener('click', async () => {
    if (stream) { stopCam(); return; }
    stuError = null; render();
    try {
      const det = new window.BarcodeDetector({ formats: ['qr_code'] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const video = $('#stuCam video');
      video.srcObject = stream;
      $('#stuCam').hidden = false;
      await video.play();
      const tick = async () => {
        if (!stream) return;
        try {
          const codes = await det.detect(video);
          const hit = codes.map(c => c.rawValue).find(v => window.StudentData.parseToken(v));
          if (hit) { stopCam(); openStudent(hit); return; }
        } catch (e) { /* next frame */ }
        setTimeout(tick, 250);
      };
      tick();
    } catch (e) {
      stopCam();
      stuError = 'stuNoCamera'; render();
    }
  });

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

  if (window.Auth.token() && !studentMode) { location.replace(next); return; }
  render();
  if (studentMode) $('#stuCode').focus();
  window.Auth.loadGsi().catch(() => { error = 'err_gsi'; render(); });
})();
