/* Class Manager · 班级一览：显示“管理”里最后确定的结果；点学生座位可以加分 */
(function () {
  const { t } = window.I18n;
  const Store = window.Store, Layout = window.Layout;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ui = { tab: 'view', sel: new Set(), picked: null, zoom: 1 };
  const Cloud = window.Cloud, Live = window.Live;

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
    $('#lnkReading span').textContent = t('readTitle');
    $('#zoomOut').title = t('zoomOut'); $('#zoomIn').title = t('zoomIn'); $('#zoomFit').textContent = t('zoomFit');
    $('#zoomVal').textContent = Math.round(ui.zoom * 100) + '%';
    const needSignIn = Cloud.enabled && !window.Auth.current();
    const empty = needSignIn || (!Live.loading && !st.desks.length);
    $('#emptyNote').hidden = !empty;
    $('#emptyNote b').textContent = needSignIn ? t('viewSignIn') : t('viewEmpty');
    $('#emptyNote p').textContent = needSignIn ? t('aboutApp') : t('viewEmptyHint');
    $('#emptySignIn').hidden = !needSignIn;
    $('#emptySignIn').textContent = t('accSignInTitle');
    Live.renderClassSel();
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

    if (st.students.length) {
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
    else h += `<p class="hint small">${t('clickDeskHint')}${st.groups.length && st.pointItems.some(it => it.group) ? ' ' + t('clickGroupHint') : ''}</p>`;
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
        const it = items.get(e.i);
        const g = e.g && st.groups.find(x => x.id === e.g);
        const s = e.g ? { name: (g ? Layout.groupName(g, st) : t('forGroup')) + ' ×' + e.s.length } : students.get(e.s);
        const time = new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `<li><span class="muted">${esc(time)}</span><span>${esc(it.icon)} ${esc(s ? s.name : '?')}</span><b class="${e.p < 0 ? 'neg' : 'pos'}">${e.p > 0 ? '+' : ''}${e.p}</b>
          <span class="spacer"></span><button class="icon" data-undo="${esc(e.id)}" title="${esc(t('undo'))}" aria-label="${esc(t('undo'))}">↶</button></li>`;
      }).join('')}</ul></section>`;
    }
    return h;
  }

  /* ---------- giving points ---------- */
  const pop = $('#award');
  let popTarget = null; // { student } or { group }
  function itemButtons(list) {
    const P = window.Points;
    return `<div class="award-items">${list.map(it => `<button data-item="${esc(it.id)}"><span class="picon">${esc(it.icon)}</span><span>${esc(P.itemName(it, t))}</span><b class="${it.points < 0 ? 'neg' : 'pos'}">${it.points > 0 ? '+' : ''}${it.points}</b></button>`).join('')}</div>`;
  }
  function openPopover(target, x, y) {
    const st = Store.state;
    const P = window.Points;
    let head, body;
    if (target.group) {
      const g = st.groups.find(v => v.id === target.group);
      if (!g) return;
      const members = P.groupMembers(st, g.id);
      const list = st.pointItems.filter(it => it.group);
      head = `<b>${esc(t('groupPointsFor', { name: Layout.groupName(g, st), n: members.length }))}</b>`;
      body = !members.length ? `<p class="hint">${t('groupEmpty')}</p>` : list.length ? itemButtons(list) : `<p class="hint">${t('noGroupItems')}</p>`;
    } else {
      const s = st.students.find(v => v.id === target.student);
      if (!s) return;
      const list = st.pointItems.filter(it => !it.group);
      head = `<b>${esc(t('pointsFor', { name: s.name }))}</b><span class="muted">${esc(t('totalPoints', { n: P.total(st, s.id) }))}</span>`;
      body = list.length ? itemButtons(list) : `<p class="hint">${t(st.pointItems.length ? 'noStudentItems' : 'noItems')}</p>`;
    }
    popTarget = target;
    pop.innerHTML = `<div class="award-head">${head}<button class="icon" data-close="1" aria-label="${esc(t('close'))}">✕</button></div>` + body;
    pop.hidden = false;
    const wrap = pop.parentElement.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(wrap.width - w - 8, x - wrap.left - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(wrap.height - h - 8, y - wrap.top + 16)) + 'px';
    const first = pop.querySelector('[data-item]');
    if (first) first.focus();
  }
  function closePopover() { pop.hidden = true; popTarget = null; }

  function award(studentId, itemId) {
    const entry = Live.change({ type: 'add', s: studentId, i: itemId, id: Store.uid('e'), at: new Date().toISOString() });
    if (entry) flyScore(studentId, entry.p);
  }
  function awardGroup(groupId, itemId) {
    const members = window.Points.groupMembers(Store.state, groupId);
    const entry = Live.change({ type: 'addGroup', g: groupId, members, i: itemId, id: Store.uid('e'), at: new Date().toISOString() });
    if (entry) entry.s.forEach(sid => flyScore(sid, entry.p));
  }
  function undoAward(entryId) {
    Live.change({ type: 'undo', id: entryId });
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

  $('#board').addEventListener('click', e => {
    const label = e.target.closest('.glabel');
    if (label) { openPopover({ group: label.dataset.group }, e.clientX, e.clientY); return; }
    const deskEl = e.target.closest('.desk');
    const desk = deskEl && Store.state.desks.find(d => d.id === deskEl.dataset.desk);
    if (!desk || !desk.studentId) { closePopover(); return; }
    openPopover({ student: desk.studentId }, e.clientX, e.clientY);
  });
  pop.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closePopover(); return; }
    const b = e.target.closest('[data-item]');
    if (b && popTarget) {
      if (popTarget.group) awardGroup(popTarget.group, b.dataset.item);
      else award(popTarget.student, b.dataset.item);
      closePopover();
    }
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

  $('#langSel').addEventListener('change', e => { window.I18n.setLang(e.target.value); renderAll(); ClassTools.relang(); });
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

  ClassTools.init({ ui, board: $('#board'), rerender: () => Layout.render() });
  Layout.init({
    board: $('#board'), stage: $('#stage'), sizer: $('#sizer'), ui, readOnly: true,
    onSelectionChange: () => {}, onDeskClick: () => {}, onPick: () => {},
    onZoom: renderHeader
  });
  Store.subscribe(() => renderAll());
  Live.start({ onOpen: refit => { renderAll(); if (refit) requestAnimationFrame(() => { if (Store.state.desks.length) Layout.fit(); }); } });
})();
