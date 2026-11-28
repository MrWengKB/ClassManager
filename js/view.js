/* Class Manager · 班级一览：显示“管理”里最后确定的结果；点学生座位或小组：加分、记录作业提交 */
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
    if ($('#lnkFeedback')) $('#lnkFeedback').textContent = t('feedback');
    $('#lnkSupport span').textContent = t('support');
    $('#lnkSupport').title = t('supportTip');
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
  let lbItem = 'all'; // leaderboard filter: 'all' or an item id
  function pointsSections(st, students) {
    const P = window.Points;
    if (lbItem !== 'all' && !st.pointItems.some(it => it.id === lbItem)) lbItem = 'all';
    let h = `<section><div class="sbtns">
      <button data-stats="items">📊 ${esc(t('itemStatsTitle'))}</button><button data-stats="daily">📅 ${esc(t('dailyTitle'))}</button><button data-stats="progress">👤 ${esc(t('progressTitle'))}</button></div></section>`;
    h += `<section><h3>${t('leaderboard')}</h3>`;
    if (!st.pointItems.length) h += `<p class="hint">${t('noItems')}</p>`;
    else {
      h += `<p class="hint small">${t('clickDeskHint')}${st.groups.length && st.pointItems.some(it => it.group) ? ' ' + t('clickGroupHint') : ''} ${t('clickNameHint')}</p>`;
      h += `<select id="lbFilter" class="lbfilter" aria-label="${esc(t('leaderboard'))}"><option value="all">${esc(t('lbAll'))}</option>${st.pointItems.map(it =>
        `<option value="${esc(it.id)}"${it.id === lbItem ? ' selected' : ''}>${esc(it.icon + ' ' + P.itemName(it, t))}</option>`).join('')}</select>`;
    }
    const rows = P.leaderboard(st, lbItem === 'all' ? null : lbItem);
    h += rows.length ? `<ol class="lboard">${rows.map(r =>
      `<li class="${r.rank <= 3 && r.total > 0 ? 'top' + r.rank : ''}" data-prog="${esc(r.student.id)}"><b class="rank">${r.rank}</b><span>${esc(r.student.name)}</span><span class="spacer"></span>${r.count ? `<span class="muted small">${r.count}×</span>` : ''}<b class="tot">${r.total}</b></li>`).join('')}</ol>`
      : `<p class="hint">${t('noHistory')}</p>`;
    h += `</section>`;

    const gb = P.groupBoard(st);
    if (gb.length) {
      h += `<section><h3>${t('groupBoard')}</h3><ol class="lboard">${gb.map((r, i) =>
        `<li><b class="rank">${i + 1}</b><span class="swatch" style="background:${Layout.COLORS[r.group.color % Layout.COLORS.length]}"></span><span>${esc(Layout.groupName(r.group, st))}</span><span class="spacer"></span><b class="tot">${r.total}</b></li>`).join('')}</ol></section>`;
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

  /* ---------- points statistics pop-up: by item, by date, one student ---------- */
  const sm = document.createElement('div');
  sm.className = 'mdo statsmodal';
  sm.hidden = true;
  document.body.appendChild(sm);
  const SM = { tab: 'items', student: null };
  function openStats(tab, student) {
    SM.tab = tab; if (student) SM.student = student;
    sm.hidden = false; renderStats();
  }
  function closeStats() { sm.hidden = true; }
  const signed = n => (n > 0 ? '+' : '') + n;
  // true when some of these points were given before per-day records existed
  function undated(st, sids) {
    let all = 0, dated = 0;
    sids.forEach(sid => {
      Object.values(st.scores[sid] || {}).forEach(v => { all += v[0]; });
      Object.values(st.pointDays || {}).forEach(d => Object.values(d[sid] || {}).forEach(v => { dated += v[0]; }));
    });
    return all > dated;
  }
  function renderStats() {
    if (sm.hidden) return;
    const st = Store.state, P = window.Points;
    const items = st.pointItems;
    const iname = it => esc(P.itemName(it, t));
    const md = d => esc(d.slice(5).replace('-', '/'));
    let body = '';
    if (SM.tab === 'items') {
      body = !items.length ? `<p class="hint">${t('noItems')}</p>` : `<ul class="istats big">${P.itemStats(st).map(x =>
        `<li><span class="picon">${esc(x.item.icon)}</span><div><b>${iname(x.item)}</b> <span class="muted">${signed(x.item.points)}${x.item.group ? ' · ' + esc(t('forGroup')) : ''}</span>
          <div class="muted">${esc(t('itemStatLine', { n: x.count, p: x.points }))}${x.top.length ? ' · ' + esc(t('itemTop', { names: x.top.map(s => s.name).join(', '), n: x.best })) : ''}</div></div>
          <button class="ghostbtn small" data-lb="${esc(x.item.id)}">🏆</button></li>`).join('')}</ul>`;
    } else if (SM.tab === 'daily') {
      const days = P.days(st);
      body = !days.length ? `<p class="hint">${t('noHistory')}</p>` : `<div class="mtx"><table><thead><tr><th>${t('colDate')}</th>${items.map(it => `<th title="${iname(it)}">${esc(it.icon)}<small>${iname(it)}</small></th>`).join('')}<th class="tcol">${t('dailyTotal')}</th></tr></thead><tbody>${days.map(d => {
        const m = P.dayItems(st, d);
        const tot = Object.values(m).reduce((a, v) => a + v[1], 0);
        return `<tr><td class="dcol">${md(d)}</td>${items.map(it => { const v = m[it.id]; return `<td class="${v ? 'hasv' : ''}">${v ? `${v[0]}×<small>${signed(v[1])}</small>` : '-'}</td>`; }).join('')}<td class="tcol">${tot}</td></tr>`;
      }).join('')}</tbody></table></div>${undated(st, st.students.map(x => x.id)) ? `<p class="hint small">${t('historyNote')}</p>` : ''}`;
    } else {
      if (!st.students.some(s => s.id === SM.student)) SM.student = (P.leaderboard(st)[0] || {}).student ? P.leaderboard(st)[0].student.id : null;
      const s = st.students.find(x => x.id === SM.student);
      const sel = `<select id="progSel" class="lbfilter">${P.leaderboard(st).map(r => `<option value="${esc(r.student.id)}"${r.student.id === SM.student ? ' selected' : ''}>${esc(r.student.name)} (${r.total})</option>`).join('')}</select>`;
      if (!s) body = `<p class="hint">${t('noStudentsRead')}</p>`;
      else {
        const sd = P.studentDays(st, s.id), days = Object.keys(sd).sort().reverse();
        const sc = st.scores[s.id] || {};
        body = `<div class="proghead">${sel}<b class="scb">${P.total(st, s.id)} ⭐</b></div>` + (!days.length && !Object.keys(sc).length ? `<p class="hint">${t('noHistory')}</p>` :
          `<div class="mtx"><table><thead><tr><th>${t('colItem')}</th><th class="tcol">${t('colTotal')}</th>${days.map(d => `<th>${md(d)}</th>`).join('')}</tr></thead><tbody>${items.map(it => {
            const v = sc[it.id];
            return `<tr><td class="icol">${esc(it.icon)} ${iname(it)}</td><td class="tcol">${v ? `${v[0]}×<small>${signed(v[1])}</small>` : '-'}</td>${days.map(d => { const c = sd[d][it.id]; return `<td class="${c ? 'hasv' : ''}">${c ? `${c[0]}×<small>${signed(c[1])}</small>` : '-'}</td>`; }).join('')}</tr>`;
          }).join('')}<tr class="trow"><td>${t('dailyTotal')}</td><td class="tcol">${P.total(st, s.id)}</td>${days.map(d => `<td>${Object.values(sd[d]).reduce((a, v) => a + v[1], 0)}</td>`).join('')}</tr></tbody></table></div>${undated(st, [s.id]) ? `<p class="hint small">${t('historyNote')}</p>` : ''}`);
      }
    }
    const tabs = [['items', '📊', 'itemStatsTitle'], ['daily', '📅', 'dailyTitle'], ['progress', '👤', 'progressTitle']];
    sm.innerHTML = `<div class="mdc statscard"><div class="cthead"><h3>📊 ${esc(t('statsTitle'))}${st.title ? ' · ' + esc(st.title) : ''}</h3><button class="icon" data-sclose="1" aria-label="${esc(t('close'))}">✕</button></div>
      <div class="stabs">${tabs.map(([k, ic, lab]) => `<button class="${SM.tab === k ? 'on' : ''}" data-stab="${k}">${ic} ${esc(t(lab))}</button>`).join('')}</div>${body}</div>`;
  }
  sm.addEventListener('click', e => {
    if (e.target === sm || e.target.closest('[data-sclose]')) { closeStats(); return; }
    const tb = e.target.closest('[data-stab]');
    if (tb) { SM.tab = tb.dataset.stab; renderStats(); return; }
    const lb = e.target.closest('[data-lb]');
    if (lb) { lbItem = lb.dataset.lb; closeStats(); renderSide(); }
  });
  sm.addEventListener('change', e => { if (e.target.id === 'progSel') { SM.student = e.target.value; renderStats(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sm.hidden) closeStats(); });

  /* ---------- giving points ---------- */
  const pop = $('#award');
  let popTarget = null; // { student } or { group }
  function itemButtons(list) {
    const P = window.Points;
    return `<div class="award-items">${list.map(it => `<button data-item="${esc(it.id)}"><span class="picon">${esc(it.icon)}</span><span>${esc(P.itemName(it, t))}</span><b class="${it.points < 0 ? 'neg' : 'pos'}">${it.points > 0 ? '+' : ''}${it.points}</b></button>`).join('')}</div>`;
  }
  // The pop-up has two choices: 加分 (points) and 作业 (homework still open); each opens its own list.
  let popMode = null; // null = the two choices, 'points' or 'hw'
  function popInfo(target) {
    const st = Store.state, P = window.Points, N = window.Notices;
    if (target.group) {
      const g = st.groups.find(v => v.id === target.group);
      if (!g) return null;
      const members = P.groupMembers(st, g.id);
      const hws = N.openHomework(st).map(n => ({ n, ids: members.filter(id => N.isFor(st, n, id)) })).filter(x => x.ids.length);
      return { name: Layout.groupName(g, st), members, hws, items: st.pointItems.filter(it => it.group && it.id !== P.ONTIME) };
    }
    const s = st.students.find(v => v.id === target.student);
    if (!s) return null;
    const hws = N.openHomework(st).filter(n => N.isFor(st, n, s.id)).map(n => ({ n, ids: [s.id] }));
    return { name: s.name, student: s, hws, items: st.pointItems.filter(it => !it.group && it.id !== P.ONTIME) };
  }
  function popBody(target, info) {
    const st = Store.state, P = window.Points, N = window.Notices;
    const close = `<button class="icon" data-close="1" aria-label="${esc(t('close'))}">✕</button>`;
    const back = `<button class="icon" data-popback="1" title="${esc(t('popBack'))}" aria-label="${esc(t('popBack'))}">‹</button>`;
    if (!popMode) {
      const sub = info.student ? `<span class="muted">${esc(t('totalPoints', { n: P.total(st, info.student.id) }))}</span>` : `<span class="muted">${esc(t('popMembers', { n: info.members.length }))}</span>`;
      return `<div class="award-head"><b>${esc(info.name)}</b>${sub}${close}</div>
        <div class="award-items award-menu"><button data-popmode="points"><span class="picon">⭐</span><span>${esc(t('popPoints'))}</span><b>›</b></button>
        <button data-popmode="hw"><span class="picon">📝</span><span>${esc(t('popHomework'))}</span><b class="muted small">${info.hws.length ? esc(t('hwOpenN', { n: info.hws.length })) : ''} ›</b></button></div>`;
    }
    if (popMode === 'points') {
      let head, body;
      if (target.group) {
        head = `<b>${esc(t('groupPointsFor', { name: info.name, n: info.members.length }))}</b>`;
        body = !info.members.length ? `<p class="hint">${t('groupEmpty')}</p>` : info.items.length ? itemButtons(info.items) : `<p class="hint">${t('noGroupItems')}</p>`;
      } else {
        head = `<b>${esc(t('pointsFor', { name: info.name }))}</b><span class="muted">${esc(t('totalPoints', { n: P.total(st, info.student.id) }))}</span>`;
        body = info.items.length ? itemButtons(info.items) : `<p class="hint">${t(st.pointItems.length ? 'noStudentItems' : 'noItems')}</p>`;
      }
      return `<div class="award-head">${back}${head}${close}</div>` + body;
    }
    const head = `<div class="award-head">${back}<b>${esc(t('hwFor', { name: info.name }))}</b>${close}</div>`;
    if (!info.hws.length) return head + `<p class="hint">${esc(t('hwNoneOpen'))}</p>`;
    return head + (target.group ? `<p class="hint small">${esc(t('hwGroupTap'))}</p>` : '') + `<div class="award-items">${info.hws.map(({ n, ids }) => {
      const k = ids.filter(id => N.handedIn(n, id)).length, all = k === ids.length;
      const state = target.group ? `${k} / ${ids.length}` : all ? '✓ ' + t('hwHanded') : t('hwNotYet');
      return `<button data-hw="${esc(n.id)}" class="hwbtn${all ? ' done' : ''}" aria-pressed="${all}"><span class="picon">${all ? '✅' : '📝'}</span><span>${esc(n.title || N.plainText(n.body).slice(0, 40) || t('ntHomework'))}</span><b>${esc(state)}</b></button>`;
    }).join('')}</div>`;
  }
  function fillPopover() {
    if (!popTarget) return false;
    const info = popInfo(popTarget);
    if (!info) { closePopover(); return false; }
    pop.innerHTML = popBody(popTarget, info);
    return true;
  }
  let popXY = [0, 0];
  function placePopover() {
    const [x, y] = popXY;
    const wrap = pop.parentElement.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(8, Math.min(wrap.width - w - 8, x - wrap.left - w / 2)) + 'px';
    pop.style.top = Math.max(8, Math.min(wrap.height - h - 8, y - wrap.top + 16)) + 'px';
    const first = pop.querySelector('[data-popmode],[data-item],[data-hw]');
    if (first) first.focus();
  }
  function openPopover(target, x, y) {
    popTarget = target; popMode = null; popXY = [x, y];
    if (!fillPopover()) return;
    pop.hidden = false;
    placePopover();
  }
  function markHomework(hid) {
    const info = popTarget && popInfo(popTarget);
    const hw = info && info.hws.find(x => x.n.id === hid);
    if (!hw) return;
    const N = window.Notices;
    const on = !hw.ids.every(id => N.handedIn(hw.n, id));
    const res = Live.change({ type: 'hw', n: hid, s: hw.ids, on, day: N.today(), id: Store.uid('h') });
    if (res) hw.ids.forEach(id => { const p = res.pts && res.pts[id]; if (p) flyScore(id, p); else if (on) flyText(id, '✓'); });
    fillPopover();
  }
  function closePopover() { pop.hidden = true; popTarget = null; popMode = null; }

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
  function flyScore(studentId, p) { flyText(studentId, (p > 0 ? '+' : '') + p, p < 0); }
  function flyText(studentId, text, neg) {
    const desk = Store.state.desks.find(d => d.studentId === studentId);
    const el = desk && $(`.desk[data-desk="${desk.id}"]`);
    if (!el) return;
    const f = document.createElement('div');
    f.className = 'fly ' + (neg ? 'neg' : 'pos');
    f.textContent = text;
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
    const m = e.target.closest('[data-popmode]');
    if (m) { popMode = m.dataset.popmode; fillPopover(); placePopover(); return; }
    if (e.target.closest('[data-popback]')) { popMode = null; fillPopover(); placePopover(); return; }
    const hb = e.target.closest('[data-hw]');
    if (hb && popTarget) { markHomework(hb.dataset.hw); return; }
    const b = e.target.closest('[data-item]');
    if (b && popTarget) {
      if (popTarget.group) awardGroup(popTarget.group, b.dataset.item);
      else award(popTarget.student, b.dataset.item);
      closePopover();
    }
  });
  $('#side').addEventListener('click', e => {
    const b = e.target.closest('[data-undo]');
    if (b) { undoAward(b.dataset.undo); return; }
    const sb = e.target.closest('[data-stats]');
    if (sb) { openStats(sb.dataset.stats); return; }
    const pr = e.target.closest('[data-prog]');
    if (pr) openStats('progress', pr.dataset.prog);
  });
  $('#side').addEventListener('change', e => { if (e.target.id === 'lbFilter') { lbItem = e.target.value; renderSide(); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

  /* ---------- mobile: student and group lists instead of the seating plan ---------- */
  let mTab = 'students';
  function renderMobile() {
    const el = $('#mobileMain');
    if (!window.Mobile.on) { el.innerHTML = ''; return; }
    const st = Store.state, P = window.Points;
    if (Live.needSignIn()) {
      el.innerHTML = `<div class="mcard"><b>${t('viewSignIn')}</b><p class="hint">${t('aboutApp')}</p><a class="navbtn primary" href="login.html?next=index.html">${t('accSignInTitle')}</a></div>`;
      return;
    }
    if (Live.loading) { el.innerHTML = `<div class="mcard"><p class="hint">${t('syncLoading')}</p></div>`; return; }
    if (!st.students.length) { el.innerHTML = `<div class="mcard"><b>${t('viewEmpty')}</b><p class="hint">${t('viewEmptyHint')}</p></div>`; return; }
    const tot = P.totals(st);
    let h = `<div class="mdraw">${[['all', '🎲', 'drawAll'], ['M', '👦', 'drawBoys'], ['F', '👧', 'drawGirls']].map(([k, ic, lab]) =>
      `<button class="fsbtn" data-fdraw="${k}">${ic} ${esc(t(lab))}</button>`).join('')}</div>`;
    h += `<div class="mseg"><button class="${mTab === 'students' ? 'on' : ''}" data-mtab="students">👤 ${esc(t('mStudents'))} (${st.students.length})</button><button class="${mTab === 'groups' ? 'on' : ''}" data-mtab="groups">👥 ${esc(t('mGroups'))} (${st.groups.length})</button></div>`;
    h += `<p class="hint small">${esc(t(mTab === 'students' ? 'mTapStudent' : 'mTapGroup'))}</p>`;
    if (mTab === 'students') {
      h += `<ul class="mlist">${st.students.map(s => `<li data-ms="${esc(s.id)}" class="${s.gender ? 'g' + s.gender : ''}"><span class="mname">${esc(s.name)}</span><b class="mscore${tot.get(s.id) < 0 ? ' neg' : ''}">${tot.get(s.id) || 0}</b></li>`).join('')}</ul>`;
    } else if (!st.groups.length) {
      h += `<p class="hint">${esc(t('mNoGroups'))}</p>`;
    } else {
      const byId = new Map(st.students.map(s => [s.id, s]));
      h += `<ul class="mlist mgroups">${P.groupBoard(st).map(r => {
        const names = P.groupMembers(st, r.group.id).map(id => byId.get(id)).filter(Boolean).map(s => esc(s.name)).join('、');
        return `<li data-mg="${esc(r.group.id)}" style="--gc:${Layout.COLORS[r.group.color % Layout.COLORS.length]}"><div><span class="mname">${esc(Layout.groupName(r.group, st))}</span><div class="muted small">${names || '-'}</div></div><b class="mscore">${r.total}</b></li>`;
      }).join('')}</ul>`;
    }
    const recent = st.pointLog.slice(-3).reverse();
    if (recent.length) {
      const items = new Map(st.pointItems.map(it => [it.id, it]));
      const byId = new Map(st.students.map(s => [s.id, s]));
      h += `<h3 class="mh">${t('recentTitle')}</h3><ul class="recent">${recent.map(e => {
        const it = items.get(e.i), g = e.g && st.groups.find(x => x.id === e.g);
        const who = e.g ? (g ? Layout.groupName(g, st) : t('forGroup')) + ' ×' + e.s.length : (byId.get(e.s) || {}).name || '?';
        return `<li><span>${esc(it.icon)} ${esc(who)}</span><b class="${e.p < 0 ? 'neg' : 'pos'}">${e.p > 0 ? '+' : ''}${e.p}</b><span class="spacer"></span><button class="icon" data-undo="${esc(e.id)}" aria-label="${esc(t('undo'))}">↶</button></li>`;
      }).join('')}</ul>`;
    }
    el.innerHTML = h;
  }
  $('#mobileMain').addEventListener('click', e => {
    const d = e.target.closest('[data-fdraw]');
    if (d) { ClassTools.draw(d.dataset.fdraw); return; }
    const tb = e.target.closest('[data-mtab]');
    if (tb) { mTab = tb.dataset.mtab; renderMobile(); return; }
    const u = e.target.closest('[data-undo]');
    if (u) { undoAward(u.dataset.undo); return; }
    const s = e.target.closest('[data-ms]');
    if (s) { openPopover({ student: s.dataset.ms }, 0, 0); return; }
    const g = e.target.closest('[data-mg]');
    if (g) openPopover({ group: g.dataset.mg }, 0, 0);
  });
  // on a phone the award menu is a sheet at the bottom of the screen
  function placePop(on) { (on ? document.body : $('.stage-wrap')).appendChild(pop); closePopover(); }
  if (window.Mobile.on) placePop(true);
  window.Mobile.subscribe(on => { placePop(on); renderAll(); if (!on) requestAnimationFrame(() => Layout.fit()); });

  function renderAll() {
    document.body.dataset.tab = 'view';
    ui.scores = window.Points.totals(Store.state);
    renderHeader();
    renderMobile();
    if (window.Mobile.on) return;
    Layout.render();
    renderSide();
    renderStats();
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
