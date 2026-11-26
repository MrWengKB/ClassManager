/* Class Manager · 班级 ⇄ 试算表（Google Sheet / Excel）
 * One workbook per class. Tabs anyone can read, and some they can edit:
 *   Students 学生 / Items 加分项目 / Roles 职务 / Reading 阅读   → edits are read back
 *   Homework 作业 (only when there is homework): one column per homework, ✓ = handed in → read back
 *   Points by date 每日加分 / About 说明                           → for reading only
 *   _data (hidden)  the whole class as JSON, for everything the tabs don't hold (layout, seats, logs…)
 * Reading a workbook starts from _data and then applies what the editable tabs say.
 * Tab names, headers and built-in names are always in English; the site shows them in the page language.
 */
(function () {
  const { t } = window.I18n;
  const en = (k, v) => window.I18n.tIn('en', k, v);
  const TAB = { about: 'About', students: 'Students', items: 'Items', roles: 'Roles', reading: 'Reading', homework: 'Homework', daily: 'Points by date', data: '_data' };
  const CLOSED = ' [closed]';
  const CHUNK = 30000;
  const ABOUT = [
    ['Class Manager'],
    ['You can edit the tabs Students, Items, Roles, Reading and Homework here. Class Manager reads the changes the next time it opens the class.'],
    ['• Add a row to add (leave ID empty). Delete a row to remove.'],
    ['• Gender: M / F. Roles: names separated by commas. Group item: Y / N.'],
    ['• Homework: one column per homework. ✓ (or anything) = handed in, empty = not yet, — = not for this student. Add or remove “ [closed]” after a title to close or reopen it.'],
    ['• Columns marked (read only) and the other tabs are not read back.'],
    ['• Do not edit or delete the hidden tab _data.']
  ];

  // SheetJS is bundled in js/vendor (works offline); the CDN is only a fallback.
  const SOURCES = ['js/vendor/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'];
  let loading = null;
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    const one = src => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error('xlsx')));
      s.onerror = () => { s.remove(); reject(new Error('xlsx')); };
      document.head.appendChild(s);
    });
    if (!loading) loading = SOURCES.reduce((p, src) => p.catch(() => one(src)), Promise.reject(new Error('start'))).catch(e => { loading = null; throw e; });
    return loading;
  }

  // names as written in the sheet: built-in ones in English
  const roleName = r => r.name || (r.key ? en('role_' + r.key) : '?');
  const itemName = it => window.Points.itemName(it, en);
  const groupName = (g, st) => g.name || en('groupN', { n: st.groups.indexOf(g) + 1 });
  // a built-in name typed in English or in the page language counts as unchanged
  const builtIn = (key, v) => !!key && (v === en(key) || v === t(key));
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);

  /* ---------- class → workbook ---------- */
  function build(XLSX, st) {
    const P = window.Points, R = window.Reading;
    const roles = new Map(st.roles.map(r => [r.id, r]));
    const seatGroup = new Map(st.desks.filter(d => d.studentId && d.groupId).map(d => [d.studentId, d.groupId]));
    const gname = id => { const g = st.groups.find(x => x.id === id); return g ? groupName(g, st) : ''; };
    const wk = R.weekStart();
    const tabs = [];
    tabs.push([TAB.about, [[st.title || ''], ...ABOUT], [110]]);
    tabs.push([TAB.students, [['ID', 'Name', 'Gender', 'Roles', 'Group (read only)', 'Points (read only)', 'Books read (read only)']]
      .concat(st.students.map(s => [s.id, s.name, s.gender || '', (s.roles || []).map(id => roles.get(id)).filter(Boolean).map(roleName).join(', '),
        gname(seatGroup.get(s.id)), P.total(st, s.id), R.total(st, s.id)])), [12, 18, 10, 20, 14, 12, 12]]);
    const stats = new Map(P.itemStats(st).map(x => [x.item.id, x]));
    tabs.push([TAB.items, [['ID', 'Icon', 'Name', 'Points', 'Group item (Y/N)', 'Times (read only)', 'Total (read only)']]
      .concat(st.pointItems.map(it => { const x = stats.get(it.id) || { count: 0, points: 0 }; return [it.id, it.icon, itemName(it), it.points, it.group ? 'Y' : 'N', x.count, x.points]; })), [14, 8, 20, 10, 12, 10, 10]]);
    tabs.push([TAB.roles, [['ID', 'Name']].concat(st.roles.map(r => [r.id, roleName(r)])), [14, 20]]);
    tabs.push([TAB.reading, [['ID', 'Name (read only)', 'Rounds', 'This round (0-' + (R.RB - 1) + ')', 'Total books (read only)', 'This week (read only)']]
      .concat(st.students.map(s => { const r = R.get(st, s.id); return [s.id, s.name, r.rounds, r.progress, R.total(st, s.id), R.since(st, s.id, wk)]; })), [12, 18, 10, 14, 14, 14]]);
    const N = window.Notices, hws = N ? N.homework(st) : [];
    if (hws.length) {
      const who = hws.map(n => new Set(N.members(st, n)));
      const rows = [['ID', 'Name (read only)'].concat(hws.map(n => (n.title || N.plainText(n.body).slice(0, 40) || 'Homework') + (n.closed ? CLOSED : ''))),
        ['Homework ID (do not edit)', ''].concat(hws.map(n => n.id))];
      st.students.forEach(s => rows.push([s.id, s.name].concat(hws.map((n, j) => (!who[j].has(s.id) ? '—' : N.handedIn(n, s.id) ? '✓' : '')))));
      rows.push(['', 'Handed in (read only)'].concat(hws.map((n, j) => [...who[j]].filter(id => N.handedIn(n, id)).length + ' / ' + who[j].size)));
      tabs.push([TAB.homework, rows, [12, 18].concat(hws.map(() => 16))]);
    }
    const byId = new Map(st.students.map(s => [s.id, s]));
    const daily = [['Date', 'Name', 'Item', 'Times', 'Points']];
    P.days(st).forEach(d => Object.keys(st.pointDays[d]).forEach(sid => Object.keys(st.pointDays[d][sid]).forEach(iid => {
      const it = st.pointItems.find(x => x.id === iid), v = st.pointDays[d][sid][iid];
      if (it && byId.has(sid)) daily.push([d, byId.get(sid).name, itemName(it), v[0], v[1]]);
    })));
    tabs.push([TAB.daily, daily, [12, 18, 20, 10, 10]]);
    const json = JSON.stringify(st), data = [['classmanager', 'Do not edit']];
    for (let i = 0; i < json.length; i += CHUNK) data.push([json.slice(i, i + CHUNK)]);
    tabs.push([TAB.data, data]);

    const wb = XLSX.utils.book_new();
    tabs.forEach(([name, rows, widths]) => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      if (widths) ws['!cols'] = widths.map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    wb.Workbook = { Sheets: wb.SheetNames.map(n => ({ Hidden: n === TAB.data ? 1 : 0 })) };
    return wb;
  }

  /* ---------- workbook → class ---------- */
  // a tab by its English name (older sheets had “English 中文” names)
  const tabOf = (wb, name) => wb.Sheets[name] || wb.Sheets[wb.SheetNames.find(n => n.split(' ')[0] === name.split(' ')[0] && n.startsWith(name)) || ''];
  const rowsOf = (XLSX, wb, name) => tabOf(wb, name) ? XLSX.utils.sheet_to_json(tabOf(wb, name), { header: 1, raw: true, defval: '' }).slice(1) : null;
  const str = v => String(v === null || v === undefined ? '' : v).trim();
  const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
  function gender(v) {
    const s = str(v).toLowerCase();
    if (['m', 'male', 'boy', '男', 'l', 'lelaki', 'ஆண்', '♂'].includes(s)) return 'M';
    if (['f', 'female', 'girl', '女', 'p', 'perempuan', 'பெண்', '♀'].includes(s)) return 'F';
    return '';
  }
  const yes = v => ['y', 'yes', 'true', '1', '是', 'ya', 'ஆம்'].includes(str(v).toLowerCase());

  function parse(XLSX, wb) {
    const raw = rowsOf(XLSX, wb, TAB.data);
    if (!raw) throw new Error('no _data');
    const st = JSON.parse(raw.map(r => str(r[0])).join(''));
    st.roles = st.roles || []; st.students = st.students || []; st.pointItems = st.pointItems || []; st.reading = st.reading || {};

    const roleRows = rowsOf(XLSX, wb, TAB.roles);
    if (roleRows) {
      const old = new Map(st.roles.map(r => [r.id, r]));
      st.roles = roleRows.filter(r => str(r[1])).map(r => {
        const o = old.get(str(r[0]));
        if (!o) return { id: uid('r'), key: '', name: str(r[1]) };
        return Object.assign({}, o, { name: o.key && builtIn('role_' + o.key, str(r[1])) ? '' : str(r[1]) });
      });
    }
    const roleIds = new Map();
    st.roles.forEach(r => { roleIds.set(roleName(r).toLowerCase(), r.id); if (r.key) roleIds.set(t('role_' + r.key).toLowerCase(), r.id); });

    const stuRows = rowsOf(XLSX, wb, TAB.students);
    if (stuRows) {
      const old = new Map(st.students.map(s => [s.id, s]));
      st.students = stuRows.filter(r => str(r[1])).map(r => {
        const o = old.get(str(r[0])) || { id: uid('s') };
        const roles = str(r[3]).split(/[,，、;]/).map(x => roleIds.get(x.trim().toLowerCase())).filter(Boolean);
        return Object.assign({}, o, { name: str(r[1]), gender: gender(r[2]), roles });
      });
    }

    const itemRows = rowsOf(XLSX, wb, TAB.items);
    if (itemRows) {
      const old = new Map(st.pointItems.map(it => [it.id, it]));
      st.pointItems = itemRows.filter(r => str(r[2])).map(r => {
        const o = old.get(str(r[0])) || { id: uid('p'), key: '', name: '' };
        const name = str(r[2]);
        return Object.assign({}, o, { icon: str(r[1]) || '⭐', name: o.key && builtIn('pt_' + o.key, name) ? '' : name, points: int(r[3], 1), group: yes(r[4]) });
      });
    }

    const readRows = rowsOf(XLSX, wb, TAB.reading);
    if (readRows) {
      const R = window.Reading;
      readRows.forEach(r => {
        const sid = str(r[0]);
        if (!st.students.some(s => s.id === sid)) return;
        const rounds = Math.max(0, int(r[2], 0)), progress = Math.max(0, Math.min(R.RB - 1, int(r[3], 0)));
        const cur = st.reading[sid] || { progress: 0, rounds: 0, days: {} };
        if (cur.rounds === rounds && cur.progress === progress) return;
        st.reading[sid] = Object.assign({}, cur, { rounds, progress });
      });
    }
    const hwTab = tabOf(wb, TAB.homework);
    if (hwTab && Array.isArray(st.notices)) readHomework(XLSX.utils.sheet_to_json(hwTab, { header: 1, raw: true, defval: '' }), st);
    return st;
  }

  // the Homework tab: titles (with “ [closed]”) in row 1, homework IDs in row 2, then one row per student
  const NOT_IN = ['', '-', '—', '–', 'x', '✗', '✘', '×', 'n', 'no', 'false', '0', '否', '未交', '没交', 'tidak', 'belum', 'இல்லை'];
  function cellDay(v) {
    if (typeof v === 'number' && v > 30000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 86400000)); return d.toISOString().slice(0, 10); }
    const m = str(v).match(/\d{4}-\d\d-\d\d/);
    return m ? m[0] : '';
  }
  function readHomework(rows, st) {
    if (rows.length < 2) return;
    const ids = rows[1].map(str);
    const today = (window.Notices ? window.Notices.today : () => new Date().toISOString().slice(0, 10))();
    const sids = new Set(st.students.map(s => s.id));
    ids.forEach((hid, j) => {
      if (j < 2 || !hid) return;
      const n = st.notices.find(x => x && x.id === hid && x.type === 'hw');
      if (!n) return;
      const head = str(rows[0][j]);
      if (head) {
        n.closed = /\[closed\]\s*$/i.test(head);
        const title = head.replace(/\s*\[closed\]\s*$/i, '').trim();
        const was = (n.title || (window.Notices ? window.Notices.plainText(n.body).slice(0, 40) : '') || 'Homework').trim();
        if (title && title !== was) n.title = title.slice(0, 120);
      }
      const subs = n.subs && typeof n.subs === 'object' ? n.subs : {};
      rows.slice(2).forEach(r => {
        const sid = str(r[0]);
        if (!sids.has(sid)) return;
        const v = r[j], s = str(v);
        if (s === '—') return; // not for this student
        const done = typeof v === 'boolean' ? v : !NOT_IN.includes(s.toLowerCase());
        n.subs = subs;
        // with Notices loaded, an on-time hand-in typed in the sheet gets its points here (once)
        if (window.Notices) window.Notices.setHandIn(st, n, sid, done, done ? cellDay(v) || today : '');
        else if (done && !Object.prototype.hasOwnProperty.call(subs, sid)) subs[sid] = cellDay(v) || today;
        else if (!done) delete subs[sid];
      });
      n.subs = subs;
    });
  }

  const norm = st => (window.Store ? window.Store.normalize(st) : st);
  async function toBytes(st) { const XLSX = await loadXLSX(); return XLSX.write(build(XLSX, norm(st)), { type: 'array', bookType: 'xlsx' }); }
  async function fromBytes(buf) { const XLSX = await loadXLSX(); return parse(XLSX, XLSX.read(buf, { type: 'array' })); }
  async function download(st, filename) { const XLSX = await loadXLSX(); XLSX.writeFile(build(XLSX, norm(st)), filename); }

  window.SheetIO = { loadXLSX, toBytes, fromBytes, download, TAB };
})();
