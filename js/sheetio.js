/* Class Manager · 班级 ⇄ 试算表（Google Sheet / Excel）
 * One workbook per class. Tabs anyone can read, and some they can edit:
 *   Students 学生 / Items 加分项目 / Roles 职务 / Reading 阅读   → edits are read back
 *   Points by date 每日加分 / About 说明                           → for reading only
 *   _data (hidden)  the whole class as JSON, for everything the tabs don't hold (layout, seats, logs…)
 * Reading a workbook starts from _data and then applies what the editable tabs say.
 * Tab names and headers are fixed (English + 中文) so the language setting never matters.
 */
(function () {
  const { t } = window.I18n;
  const TAB = { about: 'About 说明', students: 'Students 学生', items: 'Items 加分项目', roles: 'Roles 职务', reading: 'Reading 阅读', daily: 'Points by date 每日加分', data: '_data' };
  const CHUNK = 30000;
  const ABOUT = [
    ['Class Manager'],
    ['You can edit the tabs Students, Items, Roles and Reading here. Class Manager reads the changes the next time it opens the class.'],
    ['可以直接在「学生」「加分项目」「职务」「阅读」分页修改，Class Manager 下次打开这个班级时会读入。'],
    ['• Add a row = add (leave ID empty). Delete a row = remove. 新增一行就是新增（ID 留空），删除一行就是删除。'],
    ['• Gender 性别: M / F. Roles 职务: names separated by commas 用逗号隔开. Group item 小组项目: Y / N.'],
    ['• Columns marked (read only) and the other tabs are not read back. 标有 (read only) 的栏和其他分页不会读回。'],
    ['• Do not edit or delete the hidden tab _data. 请不要修改或删除隐藏的 _data 分页。']
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

  const roleName = r => r.name || (r.key ? t('role_' + r.key) : '?');
  const itemName = it => window.Points.itemName(it, t);
  const groupName = (g, st) => g.name || t('groupN', { n: st.groups.indexOf(g) + 1 });
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
    tabs.push([TAB.students, [['ID', 'Name 姓名', 'Gender 性别', 'Roles 职务', 'Group 小组 (read only)', 'Points 分数 (read only)', 'Books 阅读本数 (read only)']]
      .concat(st.students.map(s => [s.id, s.name, s.gender || '', (s.roles || []).map(id => roles.get(id)).filter(Boolean).map(roleName).join(', '),
        gname(seatGroup.get(s.id)), P.total(st, s.id), R.total(st, s.id)])), [12, 18, 10, 20, 14, 12, 12]]);
    const stats = new Map(P.itemStats(st).map(x => [x.item.id, x]));
    tabs.push([TAB.items, [['ID', 'Icon 图标', 'Name 名称', 'Points 分值', 'Group item 小组项目 (Y/N)', 'Times 次数 (read only)', 'Total 总分 (read only)']]
      .concat(st.pointItems.map(it => { const x = stats.get(it.id) || { count: 0, points: 0 }; return [it.id, it.icon, itemName(it), it.points, it.group ? 'Y' : 'N', x.count, x.points]; })), [14, 8, 20, 10, 12, 10, 10]]);
    tabs.push([TAB.roles, [['ID', 'Name 名称']].concat(st.roles.map(r => [r.id, roleName(r)])), [14, 20]]);
    tabs.push([TAB.reading, [['ID', 'Name 姓名 (read only)', 'Rounds 轮数', 'This round 本轮 (0-' + (R.RB - 1) + ')', 'Total books 总本数 (read only)', 'This week 本周 (read only)']]
      .concat(st.students.map(s => { const r = R.get(st, s.id); return [s.id, s.name, r.rounds, r.progress, R.total(st, s.id), R.since(st, s.id, wk)]; })), [12, 18, 10, 14, 14, 14]]);
    const byId = new Map(st.students.map(s => [s.id, s]));
    const daily = [['Date 日期', 'Name 姓名', 'Item 项目', 'Times 次数', 'Points 分数']];
    P.days(st).forEach(d => Object.keys(st.pointDays[d]).forEach(sid => Object.keys(st.pointDays[d][sid]).forEach(iid => {
      const it = st.pointItems.find(x => x.id === iid), v = st.pointDays[d][sid][iid];
      if (it && byId.has(sid)) daily.push([d, byId.get(sid).name, itemName(it), v[0], v[1]]);
    })));
    tabs.push([TAB.daily, daily, [12, 18, 20, 10, 10]]);
    const json = JSON.stringify(st), data = [['classmanager', 'Do not edit 请勿修改']];
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
  const rowsOf = (XLSX, wb, name) => wb.Sheets[name] ? XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '' }).slice(1) : null;
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
        return Object.assign({}, o, { name: str(r[1]) === roleName(Object.assign({}, o, { name: '' })) ? '' : str(r[1]) });
      });
    }
    const roleIds = new Map();
    st.roles.forEach(r => { roleIds.set(roleName(r).toLowerCase(), r.id); if (r.name) roleIds.set(r.name.toLowerCase(), r.id); });

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
        return Object.assign({}, o, { icon: str(r[1]) || '⭐', name: o.key && name === itemName(Object.assign({}, o, { name: '' })) ? '' : name, points: int(r[3], 1), group: yes(r[4]) });
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
    return st;
  }

  const norm = st => (window.Store ? window.Store.normalize(st) : st);
  async function toBytes(st) { const XLSX = await loadXLSX(); return XLSX.write(build(XLSX, norm(st)), { type: 'array', bookType: 'xlsx' }); }
  async function fromBytes(buf) { const XLSX = await loadXLSX(); return parse(XLSX, XLSX.read(buf, { type: 'array' })); }
  async function download(st, filename) { const XLSX = await loadXLSX(); XLSX.writeFile(build(XLSX, norm(st)), filename); }

  window.SheetIO = { loadXLSX, toBytes, fromBytes, download, TAB };
})();
