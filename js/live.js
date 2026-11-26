/* Class Manager · 给“使用中”的页面（班级一览、阅读打卡）用：载入班级、保存小改动
 * Without Google Drive the class lives in this browser (Store saves it).
 * With Google Drive: load the chosen class, look for changes every 30 seconds, and save small
 * changes (points, reading). If the class was changed somewhere else in the meantime, the newer
 * copy is loaded and the pending changes are replayed onto it, so nothing is lost.
 */
(function () {
  const Cloud = window.Cloud, Store = window.Store;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const live = { classes: [], id: null, version: 0, updated: null, loading: Cloud.enabled };
  const pending = [];
  let saving = false;
  let onOpen = () => {};

  function applyDelta(state, d) {
    if (d.type === 'hw') return window.Notices.apply(state, d);
    return d.type === 'read' ? window.Reading.apply(state, d) : window.Points.apply(state, d);
  }

  function needSignIn() { return Cloud.enabled && !window.Auth.current(); }

  function renderClassSel() {
    const sel = $('#classSel');
    if (!sel) return;
    const { t } = window.I18n;
    sel.hidden = !Cloud.enabled || live.classes.length < 2;
    sel.innerHTML = live.classes.map(c => `<option value="${esc(c.id)}">${esc(c.title || t('untitled'))}</option>`).join('');
    if (live.id) sel.value = live.id;
    sel.title = t('classSelect');
  }

  // A change made on this page: apply it now, and send it to Drive soon.
  function change(d) {
    Store.commit(st => { d.result = applyDelta(st, d); });
    if (Cloud.enabled && live.id && d.result) {
      pending.push(d);
      setTimeout(push, 400);
    }
    return d.result;
  }

  async function push() {
    if (saving || !pending.length || !live.id) return;
    saving = true;
    const id = live.id;
    try {
      for (let tries = 0; tries < 4 && pending.length; tries++) {
        const n = pending.length;
        try {
          const res = await Cloud.api('save', { id, state: Store.state, version: live.version });
          live.version = res.version; live.updated = res.updated;
          pending.splice(0, n);
        } catch (e) {
          if (e.code !== 'conflict' || !e.data) throw e;
          const rec = e.data.record;
          const merged = Store.normalize(rec.state);
          pending.forEach(d => applyDelta(merged, d));
          live.version = rec.version; live.updated = rec.updated;
          Store.load(merged, false);
        }
      }
    } catch (e) {
      setTimeout(push, 15000); // offline or signed out: try again later
    } finally {
      saving = false;
    }
    if (pending.length) setTimeout(push, 400);
  }

  async function open(id, refit) {
    const { record } = await Cloud.api('load', { id });
    live.id = id; live.updated = record.updated; live.version = record.version;
    pending.length = 0;
    Cloud.rememberClassId(id);
    live.loading = false;
    Store.load(record.state, false);
    renderClassSel();
    onOpen(refit);
    // a sheet written by an older version of the site: write it again so it gets the new tabs (e.g. Homework)
    if (record.outdated && !saving) {
      saving = true;
      try { const res = await Cloud.api('save', { id, state: Store.state, version: live.version }); live.version = res.version; live.updated = res.updated; } catch (e) { /* next save adds them */ }
      saving = false;
    }
  }

  async function startCloud() {
    if (!window.Auth.current()) { live.loading = false; Store.load(Store.blank(), false); return; }
    try {
      ({ classes: live.classes } = await Cloud.api('list'));
      const want = Cloud.lastClassId();
      const id = live.classes.some(c => c.id === want) ? want : (live.classes[0] || {}).id;
      if (id) await open(id, true);
      else { live.loading = false; Store.load(Store.blank(), false); }
    } catch (e) { live.loading = false; Store.load(Store.blank(), false); }
    setInterval(async () => {
      if (document.hidden || !window.Auth.token() || saving || pending.length) return;
      try {
        ({ classes: live.classes } = await Cloud.api('list'));
        const c = live.classes.find(x => x.id === live.id);
        if (c && c.updated !== live.updated) await open(live.id, false);
        else renderClassSel();
      } catch (e) { /* try again next time */ }
    }, 30000);
  }

  // opts.onOpen(refit): called after a class was loaded from Drive
  function start(opts) {
    onOpen = (opts && opts.onOpen) || onOpen;
    const sel = $('#classSel');
    if (sel) sel.addEventListener('change', async e => {
      if (pending.length) await push();
      open(e.target.value, true).catch(() => {});
    });
    window.addEventListener('beforeunload', e => { if (pending.length) { e.preventDefault(); e.returnValue = ''; } });
    if (Cloud.enabled) { Store.load(Store.blank(), false); startCloud(); }
    else {
      // changes made on another page of this site (in another tab) show up here straight away
      window.addEventListener('storage', e => {
        if (e.key === 'classmanager:v1' && e.newValue) { try { Store.load(JSON.parse(e.newValue), false); } catch (err) { /* ignore */ } }
      });
      onOpen(true);
    }
  }

  window.Live = { start, change, needSignIn, renderClassSel, get loading() { return live.loading; } };
})();
