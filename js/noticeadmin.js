/* Class Manager · 管理页：通知 / 作业分页
 * Write a notice or homework (plain text + simple Markdown, with a small B / I / U / link toolbar),
 * choose the days it is valid and who it is for (whole class, some groups, some students).
 * Students see the posts meant for them that are valid today on their own page (student.html).
 */
(function () {
  const { t } = window.I18n;
  const Store = window.Store, N = window.Notices;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = s => document.querySelector(s);
  let rerender = () => {};

  const fresh = () => ({ editing: null, type: 'notice', title: '', body: '', from: N.today(), to: N.today(), noEnd: false, aud: 'all', groups: [], students: [], preview: false, pickOpen: false, pickQ: '' });
  let d = fresh();
  let msg = null;
  const open = { upcoming: true, ended: false };

  const groupLabel = g => window.Layout ? window.Layout.groupName(g, Store.state) : (g.name || t('groupN', { n: Store.state.groups.indexOf(g) + 1 }));
  function dateLabel(day) {
    if (!day) return '';
    const [y, m, dd] = day.split('-').map(Number);
    try { return new Date(y, m - 1, dd).toLocaleDateString(document.documentElement.lang, { month: 'short', day: 'numeric', weekday: 'short' }); } catch (e) { return day; }
  }
  function rangeLabel(n) {
    if (!n.to) return t('ntFromOn', { d: dateLabel(n.from) });
    if (n.from === n.to) return dateLabel(n.from);
    return `${dateLabel(n.from)} – ${dateLabel(n.to)}`;
  }
  function audLabel(n, st) {
    if (n.aud === 'groups') {
      const names = n.groups.map(id => st.groups.find(g => g.id === id)).filter(Boolean).map(groupLabel);
      return names.length ? names.join('、') : t('ntNobody');
    }
    if (n.aud === 'students') {
      const names = n.students.map(id => st.students.find(s => s.id === id)).filter(Boolean).map(s => s.name);
      if (!names.length) return t('ntNobody');
      return names.length > 4 ? t('ntAndMore', { names: names.slice(0, 3).join('、'), n: names.length }) : names.join('、');
    }
    return t('ntAll');
  }

  /* ---------- sidebar ---------- */
  const pickSummary = n => (n ? t('ntPickedN', { n }) : t('ntPickStudents'));
  const chosenChips = list => list.map(s => `<span class="chip sm">${esc(s.name)}<button type="button" class="x" data-act="ntUnpick" data-id="${esc(s.id)}" aria-label="${esc(t('delete'))}">×</button></span>`).join('');
  function refreshPicked() {
    const chosen = Store.state.students.filter(s => d.students.includes(s.id));
    const sum = $('#ntPickSum'), box = $('#ntChosen');
    if (sum) sum.textContent = pickSummary(chosen.length);
    if (box) box.innerHTML = chosenChips(chosen);
  }
  function editor(st) {
    let h = `<section class="ntsec"><h3>${d.editing ? '✎ ' + esc(t('ntEditTitle')) : '📢 ' + esc(t('ntNewTitle'))}</h3>
      <div class="seg" role="radiogroup">
        <label class="${d.type === 'notice' ? 'on' : ''}"><input type="radio" name="ntType" value="notice" ${d.type === 'notice' ? 'checked' : ''}>📢 ${esc(t('ntNotice'))}</label>
        <label class="${d.type === 'hw' ? 'on' : ''}"><input type="radio" name="ntType" value="hw" ${d.type === 'hw' ? 'checked' : ''}>📝 ${esc(t('ntHomework'))}</label>
      </div>
      <input id="ntTitle" class="nttitle" maxlength="120" autocomplete="off" placeholder="${esc(t('ntTitlePh'))}" value="${esc(d.title)}">
      <div class="nttools" role="toolbar" aria-label="${esc(t('ntToolbar'))}">
        <button type="button" class="nttool" data-act="ntFmt" data-id="b" title="${esc(t('ntBold'))} (Ctrl B)"><b>B</b></button>
        <button type="button" class="nttool" data-act="ntFmt" data-id="i" title="${esc(t('ntItalic'))} (Ctrl I)"><i>I</i></button>
        <button type="button" class="nttool" data-act="ntFmt" data-id="u" title="${esc(t('ntUnderline'))} (Ctrl U)"><u>U</u></button>
        <button type="button" class="nttool" data-act="ntFmt" data-id="link" title="${esc(t('ntLink'))} (Ctrl K)">🔗</button>
        <button type="button" class="nttool" data-act="ntFmt" data-id="list" title="${esc(t('ntList'))}">•≡</button>
        <span class="spacer"></span>
        <button type="button" class="nttool ${d.preview ? 'on' : ''}" data-act="ntPreview" aria-pressed="${d.preview}">👁 ${esc(t('ntPreview'))}</button>
      </div>
      <textarea id="ntBody" rows="7" maxlength="5000" placeholder="${esc(t('ntBodyPh'))}" ${d.preview ? 'hidden' : ''}>${esc(d.body)}</textarea>
      <div id="ntPrev" class="md ntprev" ${d.preview ? '' : 'hidden'}>${N.render(d.body) || `<p class="muted">${esc(t('ntEmpty'))}</p>`}</div>
      <p class="hint small">${esc(t('ntMdHelp'))}</p>`;

    h += `<h4>📅 ${esc(t('ntValid'))}</h4>
      <div class="formrow ntdates">
        <label>${esc(t('ntFrom'))} <input type="date" id="ntFrom" value="${esc(d.from)}" required></label>
        <label>${esc(t('ntTo'))} <input type="date" id="ntTo" value="${esc(d.noEnd ? '' : d.to)}" min="${esc(d.from)}" ${d.noEnd ? 'disabled' : ''}></label>
      </div>
      <label class="check"><input type="checkbox" id="ntNoEnd" ${d.noEnd ? 'checked' : ''}> ${esc(t('ntNoEnd'))}</label>`;

    h += `<h4>👥 ${esc(t('ntWho'))}</h4>
      <div class="seg" role="radiogroup">
        ${['all', 'groups', 'students'].map(a => `<label class="${d.aud === a ? 'on' : ''}"><input type="radio" name="ntAud" value="${a}" ${d.aud === a ? 'checked' : ''}>${esc(t({ all: 'ntAll', groups: 'ntGroups', students: 'ntStudents' }[a]))}</label>`).join('')}
      </div>`;
    if (d.aud === 'groups') {
      h += st.groups.length ? `<div class="ntchecks">${st.groups.map(g => `<label class="check"><input type="checkbox" data-ntgroup="${esc(g.id)}" ${d.groups.includes(g.id) ? 'checked' : ''}> ${esc(groupLabel(g))}
          <span class="muted">${st.desks.filter(x => x.groupId === g.id && x.studentId).length}</span></label>`).join('')}</div>`
        : `<p class="hint small">${esc(t('ntNoGroups'))}</p>`;
    } else if (d.aud === 'students') {
      if (!st.students.length) h += `<p class="hint small">${esc(t('noStudents'))}</p>`;
      else {
        const chosen = st.students.filter(s => d.students.includes(s.id));
        h += `<details class="ntpick" id="ntPick" ${d.pickOpen ? 'open' : ''}>
          <summary id="ntPickSum">${esc(pickSummary(chosen.length))}</summary>
          <div class="ntpickbox">
            <input type="search" id="ntPickQ" placeholder="${esc(t('ntSearch'))}" value="${esc(d.pickQ)}" autocomplete="off">
            <div class="btnrow"><button type="button" data-act="ntPickAll">${esc(t('ntPickAll'))}</button><button type="button" data-act="ntPickNone">${esc(t('ntPickNone'))}</button></div>
            <div class="ntchecks ntscroll">${st.students.map(s => `<label class="check" data-ntname="${esc(s.name.toLowerCase())}" ${d.pickQ && !s.name.toLowerCase().includes(d.pickQ.toLowerCase()) ? 'hidden' : ''}><input type="checkbox" data-ntstudent="${esc(s.id)}" ${d.students.includes(s.id) ? 'checked' : ''}> ${esc(s.name)}</label>`).join('')}</div>
          </div></details>`;
        h += `<div class="chips ntchosen" id="ntChosen">${chosenChips(chosen)}</div>`;
      }
    }

    h += `<div class="btnrow"><button type="button" data-act="ntPublish" class="primary">${esc(t(d.editing ? 'ntSave' : 'ntPublish'))}</button>
      ${d.editing || d.body || d.title ? `<button type="button" data-act="ntCancel">${esc(t('cancel'))}</button>` : ''}</div>`;
    if (msg) h += `<div class="msg ${msg.kind}">${esc(msg.text)}</div>`;
    if (!st.studentView) h += `<p class="hint small">${esc(t('ntNeedSv'))}</p>`;
    return h + '</section>';
  }

  function card(n, st) {
    const s = N.status(n);
    return `<li class="ntcard ${s} ${n.type}${d.editing === n.id ? ' editing' : ''}">
      <div class="nthead"><span class="ntbadge ${n.type}">${n.type === 'hw' ? '📝 ' + esc(t('ntHomework')) : '📢 ' + esc(t('ntNotice'))}</span>
        <b class="ntt">${esc(n.title || N.plainText(n.body).slice(0, 40) || '—')}</b><span class="spacer"></span>
        <button class="icon" data-act="ntEdit" data-id="${esc(n.id)}" title="${esc(t('ntEdit'))}">✎</button>
        <button class="icon" data-act="ntCopy" data-id="${esc(n.id)}" title="${esc(t('ntCopy'))}">⧉</button>
        <button class="icon danger" data-act="ntDel" data-id="${esc(n.id)}" title="${esc(t('delete'))}">✕</button></div>
      <div class="ntmeta">📅 ${esc(rangeLabel(n))} · 👥 ${esc(audLabel(n, st))}</div>
      ${n.title && n.body ? `<div class="md ntbody">${N.render(n.body)}</div>` : ''}</li>`;
  }

  function listing(st) {
    const all = N.sorted(st.notices);
    const by = { active: [], upcoming: [], ended: [] };
    all.forEach(n => by[N.status(n)].push(n));
    let h = `<section><h3>📋 ${esc(t('ntListTitle'))}</h3>`;
    if (!all.length) return h + `<p class="hint">${esc(t('ntNone'))}</p></section>`;
    h += `<h4>${esc(t('ntActiveN', { n: by.active.length }))}</h4>`;
    h += by.active.length ? `<ul class="ntlist">${by.active.map(n => card(n, st)).join('')}</ul>` : `<p class="hint small">${esc(t('ntNoneToday'))}</p>`;
    [['upcoming', 'ntUpcomingN'], ['ended', 'ntEndedN']].forEach(([k, key]) => {
      if (!by[k].length) return;
      h += `<details class="ntgroup" data-ntsec="${k}" ${open[k] ? 'open' : ''}><summary>${esc(t(key, { n: by[k].length }))}</summary>
        <ul class="ntlist">${by[k].map(n => card(n, st)).join('')}</ul>
        ${k === 'ended' ? `<div class="btnrow"><button type="button" class="danger ghostbtn" data-act="ntClearEnded">${esc(t('ntClearEnded'))}</button></div>` : ''}</details>`;
    });
    return h + '</section>';
  }

  const section = st => editor(st) + listing(st);

  /* ---------- editing the text ---------- */
  function updatePreview() {
    const p = $('#ntPrev');
    if (p) p.innerHTML = N.render(d.body) || `<p class="muted">${esc(t('ntEmpty'))}</p>`;
  }
  function wrap(ta, before, after, ph) {
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const sel = v.slice(s, e);
    // already wrapped: unwrap
    if (sel && v.slice(s - before.length, s) === before && v.slice(e, e + after.length) === after) {
      ta.setRangeText(sel, s - before.length, e + after.length, 'select');
    } else {
      const inner = sel || ph;
      ta.setRangeText(before + inner + after, s, e, 'end');
      ta.setSelectionRange(s + before.length, s + before.length + inner.length);
    }
  }
  function fmt(kind) {
    const ta = $('#ntBody');
    if (!ta || d.preview) return;
    ta.focus();
    if (kind === 'b') wrap(ta, '**', '**', t('ntBold'));
    else if (kind === 'i') wrap(ta, '*', '*', t('ntItalic'));
    else if (kind === 'u') wrap(ta, '++', '++', t('ntUnderline'));
    else if (kind === 'list') {
      const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
      const ls = v.lastIndexOf('\n', s - 1) + 1;
      const block = v.slice(ls, e);
      const lines = block.split('\n');
      const on = lines.every(l => /^- /.test(l));
      const out = lines.map(l => (on ? l.replace(/^- /, '') : '- ' + l)).join('\n');
      ta.setRangeText(out, ls, e, 'select');
    } else if (kind === 'link') {
      const s = ta.selectionStart, e = ta.selectionEnd;
      const sel = ta.value.slice(s, e).trim();
      let url = prompt(t('ntLinkPh'), /^https?:\/\//i.test(sel) ? sel : 'https://');
      if (url === null) return;
      url = url.trim();
      if (!url || url === 'https://') return;
      if (!/^(https?:\/\/|mailto:)/i.test(url)) url = 'https://' + url;
      if (/[\s()]/.test(url)) url = encodeURI(decodeURI(url)).replace(/\(/g, '%28').replace(/\)/g, '%29');
      const text = sel && sel !== url ? sel.replace(/[[\]]/g, '') : t('ntLinkText');
      ta.setRangeText(`[${text}](${url})`, s, e, 'end');
      if (!sel || sel === url) ta.setSelectionRange(s + 1, s + 1 + text.length);
      ta.focus();
    }
    d.body = ta.value;
    updatePreview();
  }

  /* ---------- actions ---------- */
  function fromPost(n, copy) {
    return Object.assign(fresh(), {
      editing: copy ? null : n.id, type: n.type, title: n.title, body: n.body,
      from: copy ? N.today() : (n.from || N.today()), to: copy ? N.today() : (n.to || n.from || N.today()), noEnd: !copy && !n.to,
      aud: n.aud, groups: n.groups.slice(), students: n.students.slice(), pickOpen: false
    });
  }
  function publish() {
    const st = Store.state;
    const body = d.body.replace(/\s+$/, ''), title = d.title.trim();
    if (!body.trim() && !title) { msg = { kind: 'warn', text: t('ntNeedText') }; rerender(); return; }
    if (!/^\d{4}-\d\d-\d\d$/.test(d.from)) { msg = { kind: 'warn', text: t('ntNeedDate') }; rerender(); return; }
    const to = d.noEnd ? '' : (d.to && d.to >= d.from ? d.to : d.from);
    const groups = d.groups.filter(id => st.groups.some(g => g.id === id));
    const students = d.students.filter(id => st.students.some(s => s.id === id));
    if ((d.aud === 'groups' && !groups.length) || (d.aud === 'students' && !students.length)) { msg = { kind: 'warn', text: t('ntNeedWho') }; rerender(); return; }
    const post = { type: d.type, title, body, from: d.from, to, aud: d.aud, groups: d.aud === 'groups' ? groups : [], students: d.aud === 'students' ? students : [] };
    const editing = d.editing;
    Store.commit(s => {
      const old = editing && s.notices.find(n => n.id === editing);
      if (old) Object.assign(old, post);
      else s.notices.unshift(Object.assign({ id: Store.uid('n'), at: new Date().toISOString() }, post));
    });
    const when = N.status(post);
    d = fresh();
    msg = { kind: 'ok', text: t(editing ? 'ntSaved' : 'ntPosted') + (when === 'upcoming' ? ' ' + t('ntWillShow', { d: dateLabel(post.from) }) : '') };
    rerender();
  }

  const actions = {
    ntFmt: kind => fmt(kind),
    ntPreview: () => { d.preview = !d.preview; rerender(); },
    ntPublish: publish,
    ntCancel: () => { d = fresh(); msg = null; rerender(); },
    ntEdit: id => { const n = Store.state.notices.find(x => x.id === id); if (!n) return; d = fromPost(n); msg = null; rerender(); const s = document.getElementById('side'); if (s) s.scrollTop = 0; },
    ntCopy: id => { const n = Store.state.notices.find(x => x.id === id); if (!n) return; d = fromPost(n, true); msg = { kind: 'info', text: t('ntCopied') }; rerender(); const s = document.getElementById('side'); if (s) s.scrollTop = 0; },
    ntDel: id => {
      const n = Store.state.notices.find(x => x.id === id); if (!n) return;
      if (!confirm(t('ntConfirmDel', { name: n.title || N.plainText(n.body).slice(0, 30) }))) return;
      if (d.editing === id) d = fresh();
      Store.commit(st => { st.notices = st.notices.filter(x => x.id !== id); });
    },
    ntClearEnded: () => {
      const n = Store.state.notices.filter(x => N.status(x) === 'ended').length;
      if (n && confirm(t('ntConfirmClear', { n }))) Store.commit(st => { st.notices = st.notices.filter(x => N.status(x) !== 'ended'); });
    },
    ntPickAll: () => { const q = d.pickQ.toLowerCase(); Store.state.students.forEach(s => { if ((!q || s.name.toLowerCase().includes(q)) && !d.students.includes(s.id)) d.students.push(s.id); }); rerender(); },
    ntPickNone: () => { d.students = []; rerender(); },
    ntUnpick: id => { d.students = d.students.filter(x => x !== id); rerender(); }
  };

  // input / change events from the sidebar; true when handled
  function onInput(e) {
    const el = e.target;
    if (el.id === 'ntBody') { d.body = el.value; return true; }
    if (el.id === 'ntTitle') { d.title = el.value; return true; }
    if (el.id === 'ntPickQ') {
      d.pickQ = el.value;
      const q = el.value.trim().toLowerCase();
      document.querySelectorAll('#ntPick [data-ntname]').forEach(l => { l.hidden = !!q && !l.dataset.ntname.includes(q); });
      return true;
    }
    if (e.type !== 'change') return el.id === 'ntFrom' || el.id === 'ntTo';
    if (el.name === 'ntType') { d.type = el.value; rerender(); return true; }
    if (el.name === 'ntAud') { d.aud = el.value; d.pickOpen = el.value === 'students' && !d.students.length; rerender(); return true; }
    if (el.id === 'ntFrom') { d.from = el.value; if (d.to && d.to < d.from) d.to = d.from; rerender(); return true; }
    if (el.id === 'ntTo') { d.to = el.value; return true; }
    if (el.id === 'ntNoEnd') { d.noEnd = el.checked; if (!el.checked && (!d.to || d.to < d.from)) d.to = d.from; rerender(); return true; }
    if (el.dataset.ntgroup) {
      const id = el.dataset.ntgroup;
      d.groups = el.checked ? d.groups.concat(id) : d.groups.filter(x => x !== id);
      return true;
    }
    if (el.dataset.ntstudent) {
      const id = el.dataset.ntstudent;
      d.students = el.checked ? d.students.concat(id) : d.students.filter(x => x !== id);
      refreshPicked();
      return true;
    }
    return false;
  }
  // <details> open / closed is remembered across re-renders
  function onToggle(e) {
    const el = e.target;
    if (el.id === 'ntPick') d.pickOpen = el.open;
    else if (el.dataset && el.dataset.ntsec) open[el.dataset.ntsec] = el.open;
  }
  function onKey(e) {
    if (e.target.id !== 'ntBody' || !(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase(), map = { b: 'b', i: 'i', u: 'u', k: 'link' };
    if (!map[k]) return;
    e.preventDefault();
    fmt(map[k]);
  }

  function init(render, side) {
    rerender = render;
    side.addEventListener('toggle', onToggle, true);
    side.addEventListener('keydown', onKey);
    // toolbar buttons do not take the focus away from the text box (keeps the selection)
    side.addEventListener('mousedown', e => { if (e.target.closest('.nttool[data-act="ntFmt"]')) e.preventDefault(); });
  }

  window.NoticeAdmin = { section, actions, onInput, init };
})();
