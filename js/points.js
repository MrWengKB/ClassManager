/* Class Manager · 加分：项目、分数、最近记录
 * state.pointItems: [{ id, key, name, icon, points, group }]   key = built-in item (name '' → translated name)
 *                   group: true = given to a whole group (every member gets the points)
 * state.scores:     { studentId: { itemId: [count, pointsSum] } }   (totals only, so the file stays small)
 * state.pointLog:   [{ id, s, i, p, at, g? }]   the most recent awards, newest last, for undo and "recent"
 *                   a group award has g = group id and s = [member ids at that moment]
 * state.pointDays:  { 'YYYY-MM-DD': { studentId: { itemId: [count, pointsSum] } } }   points per day (local date)
 */
(function () {
  const ICONS = ['⭐', '🙋', '🤝', '📘', '👥', '🎨', '🏃', '🧹', '💡', '🎵', '🏆', '👏'];
  const LOG_MAX = 50;
  // built-in item that is always there: given automatically when homework is handed in on time
  // (see Notices.setHandIn). The teacher can change its points but not delete it.
  const ONTIME = 'p_ontime';
  function ensureOnTime(list) {
    const it = list.find(x => x && x.id === ONTIME);
    if (it) it.group = false;
    else list.push({ id: ONTIME, key: 'ontime', name: '', icon: '⏰', points: 1, group: false });
    return list;
  }

  function defaults() {
    return [
      { id: 'p_participate', key: 'participate', name: '', icon: '🙋', points: 1 },
      { id: 'p_helping', key: 'helping', name: '', icon: '🤝', points: 1 },
      { id: 'p_homework', key: 'homework', name: '', icon: '📘', points: 2 },
      { id: 'p_teamwork', key: 'teamwork', name: '', icon: '👥', points: 1, group: true }
    ];
  }

  // Called from Store.normalize: keep only items, scores and log entries that still make sense.
  function normalize(b, s, studentIds) {
    b.pointItems = Array.isArray(s.pointItems) ? s.pointItems : defaults();
    b.pointItems = b.pointItems.filter(it => it && it.id).map(it => ({
      id: it.id, key: it.key || '', name: typeof it.name === 'string' ? it.name : '',
      icon: typeof it.icon === 'string' && it.icon ? it.icon : '⭐',
      points: Number.isFinite(+it.points) ? Math.max(-100, Math.min(100, Math.round(+it.points))) : 1,
      group: !!it.group
    }));
    ensureOnTime(b.pointItems);
    const iid = new Set(b.pointItems.map(it => it.id));
    b.scores = {};
    const src = s.scores && typeof s.scores === 'object' ? s.scores : {};
    Object.keys(src).forEach(sid => {
      if (!studentIds.has(sid) || !src[sid] || typeof src[sid] !== 'object') return;
      Object.keys(src[sid]).forEach(id => {
        const v = src[sid][id];
        if (!iid.has(id) || !Array.isArray(v) || !(v[0] > 0)) return;
        (b.scores[sid] = b.scores[sid] || {})[id] = [v[0] | 0, +v[1] || 0];
      });
    });
    b.pointLog = (Array.isArray(s.pointLog) ? s.pointLog : [])
      .filter(e => e && e.id && iid.has(e.i))
      .map(e => Array.isArray(e.s) ? Object.assign({}, e, { s: e.s.filter(id => studentIds.has(id)) }) : e)
      .filter(e => Array.isArray(e.s) ? e.s.length : studentIds.has(e.s)).slice(-LOG_MAX);
    b.pointDays = {};
    const days = s.pointDays && typeof s.pointDays === 'object' ? s.pointDays : {};
    Object.keys(days).forEach(day => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !days[day] || typeof days[day] !== 'object') return;
      Object.keys(days[day]).forEach(sid => {
        const m = days[day][sid];
        if (!studentIds.has(sid) || !m || typeof m !== 'object') return;
        Object.keys(m).forEach(id => {
          const v = m[id];
          if (!iid.has(id) || !Array.isArray(v) || !(v[0] > 0)) return;
          ((b.pointDays[day] = b.pointDays[day] || {})[sid] = b.pointDays[day][sid] || {})[id] = [v[0] | 0, +v[1] || 0];
        });
      });
    });
  }
  // local date of an ISO time, as YYYY-MM-DD
  function dayOf(at) {
    const d = at ? new Date(at) : new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  // add (n = 1) or take back (n = -1) one award in the totals and in that day's record
  function bump(state, sid, iid, p, at, n) {
    state.scores = state.scores || {};
    if (n > 0) {
      const cell = ((state.scores[sid] = state.scores[sid] || {})[iid] = state.scores[sid][iid] || [0, 0]);
      cell[0] += 1; cell[1] += p;
    } else {
      const cell = state.scores[sid] && state.scores[sid][iid];
      if (cell) {
        cell[0] -= 1; cell[1] -= p;
        if (cell[0] <= 0) delete state.scores[sid][iid];
        if (!Object.keys(state.scores[sid]).length) delete state.scores[sid];
      }
    }
    const day = dayOf(at);
    state.pointDays = state.pointDays || {};
    if (n > 0) {
      const dc = (((state.pointDays[day] = state.pointDays[day] || {})[sid] = state.pointDays[day][sid] || {})[iid] = state.pointDays[day][sid][iid] || [0, 0]);
      dc[0] += 1; dc[1] += p;
    } else {
      const m = state.pointDays[day] && state.pointDays[day][sid], dc = m && m[iid];
      if (dc) {
        dc[0] -= 1; dc[1] -= p;
        if (dc[0] <= 0) delete m[iid];
        if (!Object.keys(m).length) delete state.pointDays[day][sid];
        if (!Object.keys(state.pointDays[day]).length) delete state.pointDays[day];
      }
    }
  }

  function itemName(it, t) { return it.name || (it.key ? t('pt_' + it.key) : '?'); }
  function nextIcon(state) {
    const used = new Set(state.pointItems.map(it => it.icon));
    return ICONS.find(i => !used.has(i)) || ICONS[state.pointItems.length % ICONS.length];
  }

  /* ---------- changes (also replayed onto a newer copy from Drive) ---------- */
  function add(state, sid, iid, entryId, at) {
    const it = state.pointItems.find(x => x.id === iid);
    if (!it || !state.students.some(x => x.id === sid)) return null;
    const e = { id: entryId, s: sid, i: iid, p: it.points, at: at || new Date().toISOString() };
    bump(state, sid, iid, it.points, e.at, 1);
    state.pointLog.push(e);
    if (state.pointLog.length > LOG_MAX) state.pointLog.splice(0, state.pointLog.length - LOG_MAX);
    return e;
  }
  // Everyone sitting in the group gets the item's points; one log entry for the whole group.
  function addGroup(state, gid, iid, entryId, at, members) {
    const it = state.pointItems.find(x => x.id === iid);
    if (!it || !state.groups.some(g => g.id === gid)) return null;
    const ids = (members || groupMembers(state, gid)).filter(id => state.students.some(x => x.id === id));
    if (!ids.length) return null;
    const e = { id: entryId, g: gid, s: ids, i: iid, p: it.points, at: at || new Date().toISOString() };
    ids.forEach(sid => bump(state, sid, iid, it.points, e.at, 1));
    state.pointLog.push(e);
    if (state.pointLog.length > LOG_MAX) state.pointLog.splice(0, state.pointLog.length - LOG_MAX);
    return e;
  }
  function groupMembers(state, gid) {
    return state.desks.filter(d => d.groupId === gid && d.studentId).map(d => d.studentId);
  }
  function undo(state, entryId) {
    const k = state.pointLog.findIndex(e => e.id === entryId);
    if (k < 0) return false;
    const e = state.pointLog[k];
    (Array.isArray(e.s) ? e.s : [e.s]).forEach(sid => bump(state, sid, e.i, e.p, e.at, -1));
    state.pointLog.splice(k, 1);
    return true;
  }
  function apply(state, d) {
    if (d.type === 'add') return add(state, d.s, d.i, d.id, d.at);
    if (d.type === 'addGroup') return addGroup(state, d.g, d.i, d.id, d.at, d.members);
    return undo(state, d.id);
  }

  /* ---------- summaries ---------- */
  function total(state, sid) {
    const m = state.scores[sid];
    return m ? Object.values(m).reduce((a, v) => a + v[1], 0) : 0;
  }
  function totals(state) {
    const map = new Map();
    state.students.forEach(s => map.set(s.id, total(state, s.id)));
    return map;
  }
  // [{ student, total, count, rank }] highest first; equal totals share a rank.
  // With an item id: only that item, and only students who got it.
  function leaderboard(state, itemId) {
    const rows = (itemId
      ? state.students.map(s => { const v = state.scores[s.id] && state.scores[s.id][itemId]; return v ? { student: s, total: v[1], count: v[0] } : null; }).filter(Boolean)
      : state.students.map(s => ({ student: s, total: total(state, s.id) })))
      .sort((a, b) => b.total - a.total || a.student.name.localeCompare(b.student.name));
    rows.forEach((r, i) => { r.rank = i && r.total === rows[i - 1].total ? rows[i - 1].rank : i + 1; });
    return rows;
  }
  // [{ group, total, members }] by the desks each student sits at
  function groupBoard(state) {
    const tot = totals(state);
    return state.groups.map(g => {
      const members = state.desks.filter(d => d.groupId === g.id && d.studentId).map(d => d.studentId);
      return { group: g, members: members.length, total: members.reduce((a, id) => a + (tot.get(id) || 0), 0) };
    }).sort((a, b) => b.total - a.total);
  }
  // [{ item, count, points, top: [student...] }]
  function itemStats(state) {
    return state.pointItems.map(it => {
      let count = 0, points = 0, best = 0, top = [];
      state.students.forEach(s => {
        const v = state.scores[s.id] && state.scores[s.id][it.id];
        if (!v) return;
        count += v[0]; points += v[1];
        if (v[0] > best) { best = v[0]; top = [s]; } else if (v[0] === best) top.push(s);
      });
      return { item: it, count, points, top, best };
    });
  }

  // Dates with records, newest first
  function days(state) { return Object.keys(state.pointDays || {}).sort().reverse(); }
  // { itemId: [count, sum] } for the whole class on one day
  function dayItems(state, day) {
    const out = {}, d = (state.pointDays || {})[day] || {};
    Object.values(d).forEach(m => Object.keys(m).forEach(id => { const o = out[id] = out[id] || [0, 0]; o[0] += m[id][0]; o[1] += m[id][1]; }));
    return out;
  }
  // { day: { itemId: [count, sum] } } for one student
  function studentDays(state, sid) {
    const out = {};
    Object.keys(state.pointDays || {}).forEach(day => { const m = state.pointDays[day][sid]; if (m) out[day] = m; });
    return out;
  }

  window.Points = { ONTIME, ensureOnTime, bump, dayOf, days, dayItems, studentDays, defaults, normalize, itemName, nextIcon, add, addGroup, groupMembers, undo, apply, total, totals, leaderboard, groupBoard, itemStats, ICONS };
})();
