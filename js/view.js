/* Class Manager · 班级一览：显示“管理”里最后确定的结果；点学生座位可以加分 */
(function () {
  const { t } = window.I18n;
  const Store = window.Store, Layout = window.Layout;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ui = { tab: 'view', sel: new Set(), picked: null, zoom: 1 };
  const Cloud = window.Cloud;
  const cloud = { classes: [], id: null, updated: null, loading: Cloud.enabled };

  function renderClassSel() {
    const sel = $('#classSel');
    sel.hidden = !Cloud.enabled || cloud.classes.length < 2;
    sel.innerHTML = cloud.classes.map(c => `<option value="${esc(c.id)}">${esc(c.title || t('untitled'))}</option>`).join('');
    if (cloud.id) sel.value = cloud.id;
    sel.title = t('classSelect');
  }

  function renderHeader() {
    const st = Store.state;
    document.title = (st.title ? st.title + ' · ' : '') + t('appName');
    $('#brandName').textContent = t('appName');
    $('#brandSub').textContent = t('viewSub');
    $('#classTitle').textContent = st.title || '';
    $('#printTitle').textContent = st.title || '';
    $('#langSel').value = window.I18n.lang;
    $('#langSel').title = t('language');
    $('#btnPrint span').textContent = t('print');
    $('#lnkAdmin span').textContent = t('adminLink');
    $('#zoomOut').title = t('zoomOut'); $('#zoomIn').title = t('zoomIn'); $('#zoomFit').textContent = t('zoomFit');
    $('#zoomVal').textContent = Math.round(ui.zoom * 100) + '%';
    const needSignIn = Cloud.enabled && !window.Auth.current();
    const empty = needSignIn || (!cloud.loading && !st.desks.length);
    $('#emptyNote').hidden = !empty;
    $('#emptyNote b').textContent = needSignIn ? t('viewSignIn') : t('viewEmpty');
    $('#emptyNote p').textContent = needSignIn ? t('aboutApp') : t('viewEmptyHint');
    $('#emptySignIn').hidden = !needSignIn;
    $('#emptySignIn').textContent = t('accSignInTitle');
    renderClassSel();
  }

  function nameChip(s, roles) {
    const rs = (s.roles || []).map(id => roles.get(id)).filter(Boolean);
    return `<span class="chip static${s.gender ? ' g' + s.gender : ''}">${esc(s.name)}${rs.map(r => ` <small class="badge">${esc(Layout.roleName(r))}</small>`).join('')}</span>`;
  }

  function renderSide() {
    const st = Store.state;
    const students = new Map(st.students.map(s => [s.id, s]));
    const roles = new Map(st.roles.map(r => [r.id, r]));
    let h = `<section><p class="hint">${esc(t('viewStats', { s: st.students.length, d: st.desks.length, g: st.groups.length }))}</p></section>`;
    if (st.students.length) h += pointsSections(st, students);

    if (st.groups.length) {
      h += `<section><h3>${t('groupsTitle')}</h3><ul class="vgroups">`;
      st.groups.forEach(g => {
        const members = st.desks.filter(d => d.groupId === g.id && d.studentId).map(d => students.get(d.studentId)).filter(Boolean);
        h += `<li><div class="vgname"><span class="swatch" style="background:${Layout.COLORS[g.color % Layout.COLORS.length]}"></span>${esc(Layout.groupName(g, st))} <span class="muted">${members.length}</span></div>
          <div class="chips">${members.length ? members.map(s => nameChip(s, roles)).join('') : `<span class="muted">${t('nobody')}</span>`}</div></li>`;
      });
      h += '</ul></section>';
    }

    if (st.students.length) {
      h += `<section><h3>${t('summaryTitle')}</h3><ul class="rlist">`;
      st.roles.forEach(r => {
        const who = st.students.filter(s => (s.roles || []).includes(r.id));
        h += `<li><span><b>${esc(Layout.roleName(r))}</b>: ${who.length ? who.map(s => esc(s.name)).join(', ') : `<span class="muted">${t('nobody')}</span>`}</span></li>`;
      });
      h += '</ul></section>';

      const seated = new Set(st.desks.map(d => d.studentId).filter(Boolean));
      const unseated = st.students.filter(s => !seated.has(s.id));
      if (unseated.length) {
        h += `<section><h3>${t('unseatedN', { n: unseated.length })}</h3><div class="chips">${unseated.map(s => nameChip(s, roles)).join('')}</div></section>`;
      }
    }
    $('#side').innerHTML = h;
  }

  /* ---------- points sidebar ---------- */
  function pointsSections(st, students) {
    const P = window.Points;
    let h = `<section><h3>${t('leaderboard')}</h3>`;
    if (!st.pointItems.length) h += `<p class="hint">${t('noItems')}</p>`;
    else h += `<p class="hint small">${t('clickDeskHint')}</p>`;
    h += `<ol class="lboard">${P.leaderboard(st).map(r =>
      `<li class="${r.rank <= 3 && r.total > 0 ? 'top' + r.rank : ''}"><b class="rank">${r.rank}</b><span>${esc(r.student.name)}</span><span class="spacer"></span><b class="tot">${r.total}</b></li>`).join('')}</ol></section>`;

    const gb = P.groupBoard(st);
    if (gb.length) {
      h += `<section><h3>${t('groupBoard')}</h3><ol class="lboard">${gb.map((r, i) =>
        `<li><b class="rank">${i + 1}</b><span class="swatch" style="background:${Layout.COLORS[r.group.color % Layout.COLORS.length]}"></span><span>${esc(Layout.groupName(r.group, st))}</span><span class="spacer"></span><b class="tot">${r.total}</b></li>`).join('')}</ol></section>`;
    }

    if (st.pointItems.length) {
      h += `<section><h3>${t('itemStatsTitle')}</h3><ul class="istats">`;
      P.itemStats(st).forEach(x => {
        h += `<li><div><span class="picon">${esc(x.item.icon)}</span> <b>${esc(P.itemName(x.item, t))}</b> <span class="muted">${x.item.points > 0 ? '+' : ''}${x.item.points}</span></div>
          <div class="muted">${esc(t('itemStatLine', { n: x.count, p: x.points }))}${x.top.length ? ' · ' + esc(t('itemTop', { names: x.top.map(s => s.name).join(', '), n: x.best })) : ''}</div></li>`;
      });
      h += '</ul></section>';
    }

    const recent = st.pointLog.slice(-6).reverse();
    if (recent.length) {
      const items = new Map(st.pointItems.map(it => [it.id, it]));
      h += `<section><h3>${t('recentTitle')}</h3><ul class="recent">${recent.map(e => {
        const s = students.get(e.s), it = items.get(e.i);
        const time = new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<li><span class="muted">${esc(time)}</span><span>${esc(it.icon)} ${esc(s ? s.name : '?')}</span><b class="${e.p < 0 ? 'neg' : 'pos'}">${e.p > 0 ? '+' : ''}${e.p}</b>
          <span class="spacer"></span><button class="icon" data-undo="${esc(e.id)}" title="${esc(t('undo'))}" aria-label="${esc(t('undo'))}">↶</button></li>`;
      }).join('')}</ul></section>`;
    }
    return h;
  }

  /* ---------- giving points ---------- */
  const pop = $('#award');
  let popStudent = null;
  function openPopover(studentId, x, y) {
    const st = Store.state;
    const s = st.students.find(v => v.id === studentId);
    if (!s) return;
    popStudent = studentId;
    const P = window.Points;
    pop.innerHTML = `<div class="award-head"><b>${esc(t('pointsFor', { name: s.name }))}</b><span class="muted">${esc(t('totalPoints', { n: P.total(st, s.id) }))}</span>
        <button class="icon" data-close="1" aria-label="${esc(t('close'))}">✕</button></div>` +
      (st.pointItems.length
        ? `<div class="award-items">${st.pointItems.map(it => `<button data-item="${esc(it.id)}"><span class="picon">${esc(it.icon)}</span><span>${esc(P.itemName(it, t))}</span><b class="${it.points < 0 ? 'neg' : 'pos'}">${it.points > 0 ? '+' : ''}${it.points}</b></button>`).join('')}</div>`
        : `<p class="hint">${t('noItems')}</p>`);
    pop.hidden = false;
    const wrap = pop.parentElement.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(wrap.width - w - 8, x - wrap.left - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(wrap.height - h - 8, y - wrap.top + 16)) + 'px';
    const first = pop.querySelector('[data-item]');
    if (first) first.focus();
  }
  function closePopover() { pop.hidden = true; popStudent = null; }

  function award(studentId, itemId) {
    const d = { type: 'add', s: studentId, i: itemId, id: Store.uid('e'), at: new Date().toISOString() };
    let entry = null;
    Store.commit(st => { entry = window.Points.add(st, d.s, d.i, d.id, d.at); });
    if (!entry) return;
    flyScore(studentId, entry.p);
    queue(d);
  }
  function undoAward(entryId) {
    let ok = false;
    Store.commit(st => { ok = window.Points.undo(st, entryId); });
    if (ok) queue({ type: 'undo', id: entryId });
  }
  // a small "+1" that floats up from the desk
  function flyScore(studentId, p) {
    const desk = Store.state.desks.find(d => d.studentId === studentId);
    const el = desk && $(`.desk[data-desk="${desk.id}"]`);
    if (!el) return;
    const f = document.createElement('div');
    f.className = 'fly ' + (p < 0 ? 'neg' : 'pos');
    f.textContent = (p > 0 ? '+' : '') + p;
    el.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }

  /* ---------- saving points to Google Drive ----------
   * Each award is kept as a small change until Drive has it. If the class was changed somewhere
   * else in the meantime, the newer copy is loaded and the changes are replayed onto it. */
  const pending = [];
  let saving = false;
  function queue(d) {
    if (!Cloud.enabled || !cloud.id) return;
    pending.push(d);
    setTimeout(pushPending, 400);
  }
  async function pushPending() {
    if (saving || !pending.length || !cloud.id) return;
    saving = true;
    const id = cloud.id;
    try {
      for (let tries = 0; tries < 4 && pending.length; tries++) {
        const n = pending.length;
        try {
          const res = await Cloud.api('save', { id, state: Store.state, version: cloud.version });
          cloud.version = res.version; cloud.updated = res.updated;
          pending.splice(0, n);
        } catch (e) {
          if (e.code !== 'conflict' || !e.data) throw e;
          const rec = e.data.record;
          const merged = Store.normalize(rec.state);
          pending.forEach(d => window.Points.apply(merged, d));
          cloud.version = rec.version; cloud.updated = rec.updated;
          Store.load(merged, false);
        }
      }
    } catch (e) {
      setTimeout(pushPending, 15000); // offline or signed out: try again later
    } finally {
      saving = false;
    }
    if (pending.length) setTimeout(pushPending, 400);
  }
  window.addEventListener('beforeunload', e => { if (pending.length) { e.preventDefault(); e.returnValue = ''; } });

  $('#board').addEventListener('click', e => {
    const deskEl = e.target.closest('.desk');
    const desk = deskEl && Store.state.desks.find(d => d.id === deskEl.dataset.desk);
    if (!desk || !desk.studentId) { closePopover(); return; }
    openPopover(desk.studentId, e.clientX, e.clientY);
  });
  pop.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closePopover(); return; }
    const b = e.target.closest('[data-item]');
    if (b && popStudent) { award(popStudent, b.dataset.item); closePopover(); }
  });
  $('#side').addEventListener('click', e => {
    const b = e.target.closest('[data-undo]');
    if (b) undoAward(b.dataset.undo);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

  function renderAll() {
    document.body.dataset.tab = 'view';
    ui.scores = window.Points.totals(Store.state);
    renderHeader();
    Layout.render();
    renderSide();
  }

  $('#langSel').addEventListener('change', e => { window.I18n.setLang(e.target.value); renderAll(); });
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#zoomIn').addEventListener('click', () => Layout.setZoom(ui.zoom * 1.15));
  $('#zoomOut').addEventListener('click', () => Layout.setZoom(ui.zoom / 1.15));
  $('#zoomFit').addEventListener('click', () => Layout.fit());

  // print: fit the classroom onto one landscape page
  let preZoom = null;
  window.addEventListener('beforeprint', () => {
    const desks = Store.state.desks;
    if (!desks.length) return;
    preZoom = ui.zoom;
    const x2 = Math.max(...desks.map(d => d.x + Layout.W)) + 20, y2 = Math.max(...desks.map(d => d.y + Layout.H)) + 20;
    ui.zoom = Math.min(1000 / x2, 640 / y2, 1.3);
    Layout.render();
    $('#sizer').style.width = x2 * ui.zoom + 'px';
    $('#sizer').style.height = y2 * ui.zoom + 'px';
  });
  window.addEventListener('afterprint', () => { if (preZoom !== null) { ui.zoom = preZoom; preZoom = null; } renderAll(); });

  // Changes made on the admin page in another tab show up here straight away.
  if (!Cloud.enabled) window.addEventListener('storage', e => { if (e.key === 'classmanager:v1') location.reload(); });

  /* ---------- Google Drive ---------- */
  async function openClass(id, refit) {
    const { record } = await Cloud.api('load', { id });
    cloud.id = id; cloud.updated = record.updated; cloud.version = record.version;
    pending.length = 0;
    Cloud.rememberClassId(id);
    Store.load(record.state, false);
    cloud.loading = false;
    renderAll();
    if (refit) requestAnimationFrame(() => Layout.fit());
  }
  async function startCloud() {
    if (!window.Auth.current()) { Store.load(Store.blank(), false); cloud.loading = false; renderAll(); return; }
    try {
      ({ classes: cloud.classes } = await Cloud.api('list'));
      const want = Cloud.lastClassId();
      const id = cloud.classes.some(c => c.id === want) ? want : (cloud.classes[0] || {}).id;
      if (id) await openClass(id, true);
      else { Store.load(Store.blank(), false); cloud.loading = false; renderAll(); }
    } catch (e) { cloud.loading = false; renderAll(); }
    // look for changes every 30 seconds
    setInterval(async () => {
      if (document.hidden || !window.Auth.token() || saving || pending.length) return;
      try {
        ({ classes: cloud.classes } = await Cloud.api('list'));
        const c = cloud.classes.find(x => x.id === cloud.id);
        if (c && c.updated !== cloud.updated) await openClass(cloud.id, false);
        else renderClassSel();
      } catch (e) { /* try again next time */ }
    }, 30000);
  }
  $('#classSel').addEventListener('change', async e => {
    if (pending.length) await pushPending();
    openClass(e.target.value, true).catch(() => {});
  });

  Layout.init({
    board: $('#board'), stage: $('#stage'), sizer: $('#sizer'), ui, readOnly: true,
    onSelectionChange: () => {}, onDeskClick: () => {}, onPick: () => {},
    onZoom: renderHeader
  });
  Store.subscribe(() => renderAll());
  if (Cloud.enabled) { Store.load(Store.blank(), false); startCloud(); }
  else {
    renderAll();
    requestAnimationFrame(() => { if (Store.state.desks.length) Layout.fit(); });
  }
})();
