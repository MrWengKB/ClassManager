/* Class Manager · 加分：项目、分数、最近记录
 * state.pointItems: [{ id, key, name, icon, points }]   key = built-in item (name '' → translated name)
 * state.scores:     { studentId: { itemId: [count, pointsSum] } }   (totals only, so the file stays small)
 * state.pointLog:   [{ id, s, i, p, at }]   the most recent awards, newest last, for undo and "recent"
 */
(function () {
  const ICONS = ['⭐', '🙋', '🤝', '📘', '👥', '🎨', '🏃', '🧹', '💡', '🎵', '🏆', '👏'];
  const LOG_MAX = 50;

  function defaults() {
    return [
      { id: 'p_participate', key: 'participate', name: '', icon: '🙋', points: 1 },
      { id: 'p_helping', key: 'helping', name: '', icon: '🤝', points: 1 },
      { id: 'p_homework', key: 'homework', name: '', icon: '📘', points: 2 },
      { id: 'p_teamwork', key: 'teamwork', name: '', icon: '👥', points: 1 }
    ];
  }

  // Called from Store.normalize: keep only items, scores and log entries that still make sense.
  function normalize(b, s, studentIds) {
    b.pointItems = Array.isArray(s.pointItems) ? s.pointItems : defaults();
    b.pointItems = b.pointItems.filter(it => it && it.id).map(it => ({
      id: it.id, key: it.key || '', name: typeof it.name === 'string' ? it.name : '',
      icon: typeof it.icon === 'string' && it.icon ? it.icon : '⭐',
      points: Number.isFinite(+it.points) ? Math.max(-100, Math.min(100, Math.round(+it.points))) : 1
    }));
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
      .filter(e => e && e.id && studentIds.has(e.s) && iid.has(e.i)).slice(-LOG_MAX);
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
    const cell = ((state.scores[sid] = state.scores[sid] || {})[iid] = state.scores[sid][iid] || [0, 0]);
    cell[0] += 1; cell[1] += it.points;
    const e = { id: entryId, s: sid, i: iid, p: it.points, at: at || new Date().toISOString() };
    state.pointLog.push(e);
    if (state.pointLog.length > LOG_MAX) state.pointLog.splice(0, state.pointLog.length - LOG_MAX);
    return e;
  }
  function undo(state, entryId) {
    const k = state.pointLog.findIndex(e => e.id === entryId);
    if (k < 0) return false;
    const e = state.pointLog[k];
    const cell = state.scores[e.s] && state.scores[e.s][e.i];
    if (cell) {
      cell[0] -= 1; cell[1] -= e.p;
      if (cell[0] <= 0) delete state.scores[e.s][e.i];
      if (!Object.keys(state.scores[e.s]).length) delete state.scores[e.s];
    }
    state.pointLog.splice(k, 1);
    return true;
  }
  function apply(state, d) { return d.type === 'add' ? add(state, d.s, d.i, d.id, d.at) : undo(state, d.id); }

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
  // [{ student, total, rank }] highest first; equal totals share a rank
  function leaderboard(state) {
    const rows = state.students.map(s => ({ student: s, total: total(state, s.id) }))
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

  window.Points = { defaults, normalize, itemName, nextIcon, add, undo, apply, total, totals, leaderboard, groupBoard, itemStats, ICONS };
})();
