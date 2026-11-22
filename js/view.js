/* Class Manager · 班级一览（只读）：显示“管理”里四个步骤最后确定的结果 */
(function () {
  const { t } = window.I18n;
  const Store = window.Store, Layout = window.Layout;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ui = { tab: 'view', sel: new Set(), picked: null, zoom: 1 };

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
    const empty = !st.desks.length;
    $('#emptyNote').hidden = !empty;
    $('#emptyNote b').textContent = t('viewEmpty');
    $('#emptyNote p').textContent = t('viewEmptyHint');
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

  function renderAll() {
    document.body.dataset.tab = 'view';
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
  window.addEventListener('storage', e => { if (e.key === 'classmanager:v1') location.reload(); });

  Layout.init({
    board: $('#board'), stage: $('#stage'), sizer: $('#sizer'), ui, readOnly: true,
    onSelectionChange: () => {}, onDeskClick: () => {}, onPick: () => {},
    onZoom: renderHeader
  });
  renderAll();
  requestAnimationFrame(() => { if (Store.state.desks.length) Layout.fit(); });
})();
