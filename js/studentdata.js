/* Class Manager · 学生端（只读）的数据：每个学生只能看到自己的
 * When the teacher turns on the student view for a class, one JSON file in the teacher's Drive
 * ("Class Manager" folder) is shared as "anyone with the link can view". It holds one entry per
 * student, each encrypted (AES-GCM) with that student's own secret key:
 *   { app: 'classmanager-students', v: 1, at: ISO time, s: { tag: [iv, data] } }
 * The tag is a hash of the secret, so the file does not show who is who, and without a student's
 * secret nobody can read that student's entry, not even with the file itself.
 * A student's link is student.html#<fileId>.<secret>; the secret never leaves the teacher's class
 * (state.studentView.keys, saved in the teacher's own Google Sheet) and the student's link / QR code.
 *
 * state.studentView: { file: Drive file id, keys: { studentId: secret } }   (absent = turned off)
 */
(function () {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; // no 0/O, 1/l/I
  const SECRET_LEN = 16; // about 93 bits
  const SITE = 'https://mrwengkb.github.io/ClassManager/';
  const enc = new TextEncoder();

  function newSecret() {
    const out = [];
    const max = 256 - (256 % ALPHABET.length);
    while (out.length < SECRET_LEN) {
      const buf = crypto.getRandomValues(new Uint8Array(32));
      for (const b of buf) if (b < max && out.length < SECRET_LEN) out.push(ALPHABET[b % ALPHABET.length]);
    }
    return out.join('');
  }
  const SECRET_RE = new RegExp('^[' + ALPHABET + ']{' + SECRET_LEN + '}$');
  const validSecret = s => typeof s === 'string' && SECRET_RE.test(s);

  /* ---------- links ---------- */
  const tokenOf = (file, secret) => file + '.' + secret;
  // a link, a token, or the part after # → { file, secret } or null
  function parseToken(text) {
    const s = String(text || '').trim();
    const raw = s.includes('#') ? s.slice(s.indexOf('#') + 1) : s;
    const m = decodeURIComponent(raw).trim().match(/^([A-Za-z0-9_-]{10,})\.([A-Za-z0-9]{16})$/);
    return m && validSecret(m[2]) ? { file: m[1], secret: m[2] } : null;
  }
  function pageUrl() {
    // offline copies (file://) cannot be opened by students: use the website's address
    return /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)
      ? new URL('student.html', location.href).href : SITE + 'student.html';
  }
  const linkOf = (file, secret) => pageUrl() + '#' + tokenOf(file, secret);

  /* ---------- crypto ---------- */
  async function sha(text) { return new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(text))); }
  const hex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  const b64 = b => { let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function tagOf(secret) { return hex(await sha('classmanager-student-id:' + secret)).slice(0, 24); }
  async function keyOf(secret, use) {
    return crypto.subtle.importKey('raw', await sha('classmanager-student-key:' + secret), 'AES-GCM', false, [use]);
  }
  async function seal(secret, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyOf(secret, 'encrypt'), enc.encode(JSON.stringify(obj)));
    return [b64(iv), b64(new Uint8Array(ct))];
  }
  // the student's own entry in the public file, or null when the link is no longer valid
  async function open(file, secret) {
    const box = file && file.s && file.s[await tagOf(secret)];
    if (!box) return null;
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box[0]) }, await keyOf(secret, 'decrypt'), unb64(box[1]));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  /* ---------- what a student sees ---------- */
  // Names of built-in items / roles / groups are sent as keys, and translated on the student's page.
  const itemOf = (it, v) => ({ i: it.icon, k: it.key || '', n: it.name || '', c: v[0], p: v[1] });
  function snapshot(st, sid) {
    const P = window.Points, R = window.Reading;
    const s = st.students.find(x => x.id === sid);
    if (!s) return null;
    const items = new Map(st.pointItems.map(it => [it.id, it]));
    const lb = P.leaderboard(st), me = lb.find(r => r.student.id === sid) || { total: 0, rank: lb.length };
    const mine = st.scores[sid] || {};
    const out = {
      c: st.title || '', n: s.name,
      roles: (s.roles || []).map(id => st.roles.find(r => r.id === id)).filter(Boolean).map(r => ({ k: r.key || '', n: r.name || '' })),
      pts: me.total, rank: me.rank, of: lb.length,
      items: st.pointItems.filter(it => mine[it.id]).map(it => itemOf(it, mine[it.id])),
      days: []
    };
    const sd = P.studentDays(st, sid);
    out.days = Object.keys(sd).sort().reverse().slice(0, 30).map(d => ({
      d, it: Object.keys(sd[d]).filter(id => items.has(id)).map(id => itemOf(items.get(id), sd[d][id]))
    }));
    const desk = st.desks.find(d => d.studentId === sid && d.groupId);
    if (desk) {
      const gb = P.groupBoard(st), k = gb.findIndex(x => x.group.id === desk.groupId);
      if (k >= 0) {
        let rank = k + 1;
        while (rank > 1 && gb[rank - 2].total === gb[k].total) rank--;
        const g = gb[k].group;
        out.g = { n: g.name || '', no: st.groups.indexOf(g) + 1, p: gb[k].total, rank, of: gb.length, m: gb[k].members };
      }
    }
    const r = R.get(st, sid);
    const from = new Date(); from.setDate(from.getDate() - 70);
    const cut = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
    const rdays = {};
    Object.keys(r.days || {}).forEach(d => { if (d >= cut) rdays[d] = r.days[d]; });
    out.rd = { r: r.rounds, p: r.progress, rb: R.RB, days: rdays };
    return out;
  }
  // The plain snapshots (to notice when nothing changed) and the file to upload.
  function plain(st) {
    const sv = st.studentView;
    if (!sv) return '';
    return JSON.stringify(st.students.filter(s => validSecret(sv.keys[s.id])).map(s => [sv.keys[s.id], snapshot(st, s.id)]));
  }
  async function build(st) {
    const sv = st.studentView, s = {};
    for (const stu of st.students) {
      const secret = sv.keys[stu.id];
      if (validSecret(secret)) s[await tagOf(secret)] = await seal(secret, snapshot(st, stu.id));
    }
    return JSON.stringify({ app: 'classmanager-students', v: 1, at: new Date().toISOString(), s });
  }

  window.StudentData = { newSecret, validSecret, parseToken, tokenOf, linkOf, snapshot, plain, build, open };
})();
