/* Class Manager · 阅读打卡（数据）：和加分完全分开，不计入分数
 * state.reading: { studentId: { progress: 0-9, rounds: n, days: { 'YYYY-MM-DD': books } } }
 * 10 books = 1 round. `days` keeps how many books were logged on each day (for week / month stats).
 */
(function () {
  const RB = 10;

  function normalize(b, s, studentIds) {
    b.reading = {};
    const src = s.reading && typeof s.reading === 'object' ? s.reading : {};
    Object.keys(src).forEach(sid => {
      const r = src[sid];
      if (!studentIds.has(sid) || !r || typeof r !== 'object') return;
      const days = {};
      if (r.days && typeof r.days === 'object') Object.keys(r.days).forEach(k => { const v = r.days[k] | 0; if (/^\d{4}-\d\d-\d\d$/.test(k) && v) days[k] = v; });
      b.reading[sid] = { progress: Math.max(0, Math.min(RB - 1, r.progress | 0)), rounds: Math.max(0, r.rounds | 0), days };
    });
  }

  const get = (state, sid) => state.reading[sid] || { progress: 0, rounds: 0, days: {} };
  const total = (state, sid) => { const r = get(state, sid); return r.rounds * RB + r.progress; };
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  function weekStart() { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); }
  const monthStart = () => today().slice(0, 8) + '01';
  const since = (state, sid, from) => Object.entries(get(state, sid).days).reduce((a, [k, v]) => a + (k >= from ? v : 0), 0);

  // Change a student's count by d books (+ or −), rolling over into rounds. Returns { roundDone } or null.
  function apply(state, delta) {
    const sid = delta.s;
    if (!state.students.some(x => x.id === sid) || !delta.d) return null;
    const r = state.reading[sid] = state.reading[sid] || { progress: 0, rounds: 0, days: {} };
    let n = r.rounds * RB + r.progress + delta.d;
    if (n < 0) n = 0;
    const before = r.rounds;
    r.rounds = Math.floor(n / RB); r.progress = n % RB;
    const day = delta.date || today();
    r.days[day] = (r.days[day] || 0) + delta.d;
    if (!r.days[day]) delete r.days[day];
    return { roundDone: r.rounds > before };
  }
  // Clicking book i (0-9) of the current round: ticks up to it, or unticks back to it.
  function toggleDelta(state, sid, i) {
    const p = get(state, sid).progress;
    return i < p ? i - p : i + 1 - p;
  }

  window.Reading = { RB, normalize, get, total, since, weekStart, monthStart, today, apply, toggleDelta };
})();
