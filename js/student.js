/* Class Manager · 学生页（只读）：student.html#<file>.<secret>
 * Reads the class's public student file with an API key (no sign-in), opens only this student's
 * entry with the secret from the link, and shows it. Nothing here can change the class.
 */
(function () {
  const { t } = window.I18n;
  const SD = window.StudentData, R = window.Reading;
  const cfg = window.CM_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'classmanager:student';

  const fromHash = SD.parseToken(location.hash);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* ignore */ }
  const tok = fromHash || (saved && SD.parseToken(saved.token));
  if (!tok) { location.replace('login.html?student=1'); return; }
  if (!fromHash) history.replaceState(null, '', '#' + SD.tokenOf(tok.file, tok.secret));

  let data = null, error = null, loading = true, at = null;

  async function load() {
    loading = true; render();
    try {
      if (!cfg.googleApiKey) throw Object.assign(new Error('nokey'), { code: 'nokey' });
      let res;
      try {
        res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(tok.file)}?alt=media&key=${encodeURIComponent(cfg.googleApiKey)}`, { cache: 'no-store' });
      } catch (e) { throw Object.assign(new Error('net'), { code: 'net' }); }
      if (res.status === 404) throw Object.assign(new Error('gone'), { code: 'gone' });
      if (!res.ok) throw Object.assign(new Error('http ' + res.status), { code: res.status === 403 ? 'nokey' : 'net' });
      const file = await res.json();
      const mine = await SD.open(file, tok.secret).catch(() => null);
      if (!mine) throw Object.assign(new Error('gone'), { code: 'gone' });
      data = mine; at = file.at || null; error = null;
      try { localStorage.setItem(KEY, JSON.stringify({ token: SD.tokenOf(tok.file, tok.secret), name: mine.n })); } catch (e) { /* ignore */ }
    } catch (e) {
      error = e.code || 'net';
      if (error === 'gone') { data = null; forget(); }
    }
    loading = false; render();
  }
  function forget() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && SD.parseToken(s.token) && SD.parseToken(s.token).secret === tok.secret) localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  const itemName = it => it.n || (it.k ? t('pt_' + it.k) : '?');
  const roleName = r => r.n || (r.k ? t('role_' + r.k) : '?');
  const sign = n => (n > 0 ? '+' : '') + n;
  function dateLabel(d) {
    const [y, m, dd] = d.split('-').map(Number);
    try { return new Date(y, m - 1, dd).toLocaleDateString(document.documentElement.lang, { weekday: 'short', month: 'short', day: 'numeric' }); } catch (e) { return d; }
  }
  function timeLabel(iso) {
    try { return new Date(iso).toLocaleString(document.documentElement.lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; }
  }

  function body() {
    if (loading && !data) return `<p class="hint stu-center">${esc(t('stuLoading'))}</p>`;
    if (!data) {
      const key = { nokey: 'stuErrNoKey', gone: 'stuErrGone' }[error] || 'stuErrNet';
      return `<div class="stu-card stu-center"><div class="stu-big">🙁</div><p>${esc(t(key))}</p>
        ${error === 'net' ? `<button data-x="refresh" class="primary">${esc(t('stuRefresh'))}</button>` : `<a class="navbtn" href="login.html?student=1">${esc(t('stuLogin'))}</a>`}</div>`;
    }
    const d = data;
    let h = `<div class="stu-card stu-hello"><div class="stu-name">${esc(d.n)}</div>
      ${d.c ? `<div class="muted">${esc(d.c)}</div>` : ''}
      ${d.roles && d.roles.length ? `<div class="stu-roles">${d.roles.map(r => `<span class="badge">${esc(roleName(r))}</span>`).join('')}</div>` : ''}</div>`;
    // notices / homework meant for this student and valid today
    const N = window.Notices;
    const nts = N && Array.isArray(d.nt) ? N.activeOn(d.nt.map(n => ({ type: n.y, title: n.t || '', body: n.b || '', from: n.f || '', to: n.e || '' }))) : [];
    if (nts.length) {
      const today = N.today();
      h += `<div class="stu-card"><h3>📢 ${esc(t('stuNotices'))}</h3><ul class="stu-nts">${nts.map(n => `<li>
        <div class="stu-nthead"><span class="ntbadge ${n.type === 'hw' ? 'hw' : ''}">${n.type === 'hw' ? '📝 ' + esc(t('ntHomework')) : '📢 ' + esc(t('ntNotice'))}</span>${n.title ? `<b>${esc(n.title)}</b>` : ''}</div>
        ${n.body ? `<div class="md">${N.render(n.body)}</div>` : ''}
        ${n.to ? `<div class="stu-ntdue">⏰ ${esc(n.to === today ? t('stuDueToday') : t('stuDueOn', { d: dateLabel(n.to) }))}</div>` : ''}</li>`).join('')}</ul></div>`;
    }
    h += `<div class="stu-card stu-points"><h3>⭐ ${esc(t('stuPoints'))}</h3><div class="stu-big">${d.pts}</div>
      ${d.of > 1 ? `<div class="muted">${esc(t('stuRank', { r: d.rank, n: d.of }))}</div>` : ''}</div>`;
    if (d.g) {
      h += `<div class="stu-card"><h3>👥 ${esc(t('stuGroup'))}</h3><div class="stu-gname">${esc(d.g.n || t('groupN', { n: d.g.no }))}</div>
        <div class="muted">${esc(t('stuGroupLine', { p: d.g.p, r: d.g.rank, n: d.g.of, m: d.g.m }))}</div></div>`;
    }
    h += `<div class="stu-card"><h3>📊 ${esc(t('stuItems'))}</h3>`;
    h += d.items.length ? `<ul class="stu-list">${d.items.map(it => `<li><span class="stu-ic">${esc(it.i)}</span><span>${esc(itemName(it))}</span><span class="spacer"></span><span class="muted small">${it.c}×</span><b>${sign(it.p)}</b></li>`).join('')}</ul>`
      : `<p class="hint">${esc(t('stuNoPoints'))}</p>`;
    h += '</div>';
    if (d.days.length) {
      h += `<div class="stu-card"><h3>📅 ${esc(t('stuRecent'))}</h3><ul class="stu-days">${d.days.slice(0, 14).map(day => {
        const tot = day.it.reduce((a, it) => a + it.p, 0);
        return `<li><div class="stu-dhead"><b>${esc(dateLabel(day.d))}</b><span class="spacer"></span><b>${sign(tot)}</b></div>
          <div class="stu-dits">${day.it.map(it => `<span>${esc(it.i)} ${esc(itemName(it))}${it.c > 1 ? ' ×' + it.c : ''}</span>`).join('')}</div></li>`;
      }).join('')}</ul></div>`;
    }
    if (d.rd) {
      const rb = d.rd.rb || 10, total = d.rd.r * rb + d.rd.p;
      const week = Object.entries(d.rd.days || {}).reduce((a, [k, v]) => a + (k >= R.weekStart() ? v : 0), 0);
      h += `<div class="stu-card"><h3>📚 ${esc(t('readTitle'))}</h3>
        <div class="stu-books">${Array.from({ length: rb }, (_, i) => `<span class="${i < d.rd.p ? 'on' : ''}">📘</span>`).join('')}</div>
        <div>${esc(t('stuReadRound', { p: d.rd.p, n: rb }))}</div>
        <div class="muted">${esc(t('mReadLine', { r: d.rd.r, w: week, t: total }))}</div></div>`;
    }
    h += `<p class="hint small stu-center">🔒 ${esc(t('stuViewOnly'))}${at ? ' · ' + esc(t('stuUpdated', { time: timeLabel(at) })) : ''}</p>`;
    return h;
  }

  function render() {
    document.title = (data ? data.n + ' · ' : '') + t('appName');
    $('#brandName').textContent = t('appName');
    $('#brandSub').textContent = t('stuSub');
    $('#langSel').value = window.I18n.lang;
    $('#langSel').title = t('language');
    $('#btnRefresh span').textContent = t('stuRefresh');
    $('#btnRefresh').disabled = loading;
    $('#btnOut span').textContent = t('stuSignOut');
    $('#stuMain').innerHTML = body();
  }

  $('#langSel').addEventListener('change', e => { window.I18n.setLang(e.target.value); render(); });
  $('#btnRefresh').addEventListener('click', load);
  $('#stuMain').addEventListener('click', e => { if (e.target.closest('[data-x="refresh"]')) load(); });
  $('#btnOut').addEventListener('click', () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    location.replace('login.html?student=1');
  });
  // coming back to the page: show the latest points
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !loading && data) load(); });
  window.addEventListener('hashchange', () => location.reload());
  load();
})();
