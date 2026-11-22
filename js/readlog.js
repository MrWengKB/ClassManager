/* Class Manager · 阅读打卡页面：点书本打卡，满 10 本 = 1 轮；和加分完全分开 */
(function () {
  const { t } = window.I18n;
  const Store = window.Store, Live = window.Live, R = window.Reading;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let anim = null;

  function renderHeader() {
    const st = Store.state;
    document.title = t('readTitle') + (st.title ? ' · ' + st.title : '') + ' · ' + t('appName');
    $('#brandName').textContent = t('appName');
    $('#brandSub').textContent = t('readTitle');
    $('#classTitle').textContent = st.title || '';
    $('#langSel').value = window.I18n.lang;
    $('#langSel').title = t('language');
    $('#lnkView span').textContent = t('viewLinkFull');
    $('#lnkAdmin span').textContent = t('adminLink');
    Live.renderClassSel();
  }

  function renderMain() {
    const st = Store.state;
    if (Live.needSignIn()) {
      $('#readMain').innerHTML = `<div class="rcard empty-card"><b>${t('viewSignIn')}</b><p>${t('aboutApp')}</p>
        <a class="navbtn primary" href="login.html?next=readlog.html">${t('accSignInTitle')}</a></div>`;
      $('#readSide').innerHTML = '';
      return;
    }
    if (Live.loading) { $('#readMain').innerHTML = `<div class="rcard"><p class="hint">${t('syncLoading')}</p></div>`; $('#readSide').innerHTML = ''; return; }
    const sts = st.students;
    const books = s => {
      const p = R.get(st, s.id).progress;
      return Array.from({ length: R.RB }, (_, i) =>
        `<button class="rbk${i < p ? ' on' : ''}${anim === s.id + ':' + i ? ' pop' : ''}" data-s="${esc(s.id)}" data-i="${i}" title="${esc(i < p ? t('bookUntick') : t('bookTick'))}" aria-label="${esc(s.name)} ${i + 1}">📖</button>`).join('');
    };
    if (window.Mobile.on) { renderMobile(st, sts, books); return; }
    const rows = !sts.length ? `<p class="hint">${t('noStudentsRead')}</p>` : sts.map(s => `<div class="rrow">
        <div class="rname"><span class="rav${s.gender ? ' g' + s.gender : ''}">${esc(s.name.charAt(0))}</span><strong>${esc(s.name)}</strong></div>
        <div class="rbooks">${books(s)}</div>
        <div class="rmed">🏅 <b>${R.get(st, s.id).rounds}</b> ${t('roundUnit')}</div></div>`).join('');
    $('#readMain').innerHTML = `<div class="rcard"><h2>📚 ${t('readTitle')}</h2><p class="hint small">${esc(t('readHint', { n: R.RB }))}</p>${rows}</div>`;
    anim = null;

    if (!sts.length) { $('#readSide').innerHTML = ''; return; }
    const wk = R.weekStart(), mo = R.monthStart();
    const total = sts.reduce((a, s) => a + R.total(st, s.id), 0);
    const stat = (n, l, c) => `<div class="rst" style="--c:${c}"><div class="rsn">${n}</div><div>${esc(l)}</div></div>`;
    const rank = sts.map(s => ({ s, total: R.total(st, s.id), week: R.since(st, s.id, wk) }))
      .filter(r => r.total > 0).sort((a, b) => b.total - a.total || b.week - a.week).slice(0, 10);
    $('#readSide').innerHTML = `<div class="rcard"><h2>📊 ${t('readStats')}</h2><div class="rsts">
        ${stat(sts.length, t('stStudents'), '#457B9D')}
        ${stat(sts.reduce((a, s) => a + R.get(st, s.id).rounds, 0), t('stRounds'), '#E08A2E')}
        ${stat(total, t('stBooks'), '#2A9D8F')}
        ${stat((total / sts.length).toFixed(1), t('stAvg'), '#9B5DE5')}
        ${stat(sts.reduce((a, s) => a + R.since(st, s.id, wk), 0), t('stWeek'), '#D9488F')}
        ${stat(sts.reduce((a, s) => a + R.since(st, s.id, mo), 0), t('stMonth'), '#C8443A')}
      </div></div>
      <div class="rcard"><h2>🏆 ${t('readRank')}</h2>${!rank.length ? `<p class="hint">${t('noReadingYet')}</p>` :
        `<ol class="rrank">${rank.map((r, i) => `<li><span class="medal">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</span>
          <b>${esc(r.s.name)}</b><span class="spacer"></span><span class="muted">${esc(t('rankLine', { w: r.week, t: r.total }))}</span></li>`).join('')}</ol>`}</div>`;
  }

  /* ---------- mobile: one line per student, + logs a book, tap the name for progress ---------- */
  let openSid = null;
  function renderMobile(st, sts, books) {
    $('#readSide').innerHTML = '';
    const wk = R.weekStart();
    $('#readMain').innerHTML = !sts.length ? `<div class="rcard"><p class="hint">${t('noStudentsRead')}</p></div>` :
      `<div class="rcard"><h2>📚 ${t('readTitle')}</h2><p class="hint small">${esc(t('mReadHint', { n: R.RB }))}</p><ul class="mlist mread">${sts.map(s => {
        const r = R.get(st, s.id), open = openSid === s.id;
        return `<li class="${open ? 'open' : ''}"><div class="mrow"><button class="mname-btn" data-mopen="${esc(s.id)}"><span class="rav${s.gender ? ' g' + s.gender : ''}">${esc(s.name.charAt(0))}</span><span class="mname">${esc(s.name)}</span>
          <span class="muted small">🏅${r.rounds} · ${r.progress}/${R.RB}</span></button><button class="mplus" data-plus="${esc(s.id)}" aria-label="${esc(t('bookTick'))}">+</button></div>
          ${open ? `<div class="mdetail"><div class="rbooks">${books(s)}</div><p class="muted small">${esc(t('mReadLine', { r: r.rounds, w: R.since(st, s.id, wk), t: R.total(st, s.id) }))}</p></div>` : ''}</li>`;
      }).join('')}</ul></div>`;
    anim = null;
  }
  $('#readMain').addEventListener('click', e => {
    const o = e.target.closest('[data-mopen]');
    if (o) { openSid = openSid === o.dataset.mopen ? null : o.dataset.mopen; renderMain(); return; }
    const p = e.target.closest('[data-plus]');
    if (!p) return;
    const sid = p.dataset.plus;
    anim = sid + ':' + R.get(Store.state, sid).progress;
    const res = Live.change({ type: 'read', s: sid, d: 1, date: R.today() });
    const s = Store.state.students.find(x => x.id === sid);
    if (res && res.roundDone) toast(t('roundDone', { name: s ? s.name : '' }));
    else if (s) toast(`📖 ${s.name} +1`);
  });
  window.Mobile.subscribe(() => renderMain());

  function renderAll() { renderHeader(); renderMain(); }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg; el.className = 'show';
    clearTimeout(toast.t); toast.t = setTimeout(() => { el.className = ''; }, 2600);
  }

  $('#readMain').addEventListener('click', e => {
    const b = e.target.closest('.rbk');
    if (!b) return;
    const sid = b.dataset.s, i = +b.dataset.i;
    const d = R.toggleDelta(Store.state, sid, i);
    if (!d) return;
    anim = sid + ':' + i;
    const res = Live.change({ type: 'read', s: sid, d, date: R.today() });
    if (res && res.roundDone) {
      const s = Store.state.students.find(x => x.id === sid);
      setTimeout(() => toast(t('roundDone', { name: s ? s.name : '' })), 250);
    }
  });
  $('#langSel').addEventListener('change', e => { window.I18n.setLang(e.target.value); renderAll(); });

  Store.subscribe(() => renderAll());
  Live.start({ onOpen: () => renderAll() });
})();
