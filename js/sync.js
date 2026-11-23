/* Class Manager · 管理页：班级列表、自动保存到 Google Drive */
(function () {
  const Cloud = window.Cloud, Store = window.Store;
  if (!Cloud.enabled) return;
  const { t } = window.I18n;
  const $ = s => document.querySelector(s);

  let classes = [];        // [{id, title, updated}]
  let currentId = null;
  let version = 0;         // version of the current class on Drive
  let status = 'loading';  // loading | saved | saving | error | offline
  let loading = true;
  let timer = null, saving = null, dirty = false;

  document.body.classList.add('cloud-on');

  function renderStatus() {
    const el = $('#syncStatus');
    el.className = 'sync ' + status;
    el.textContent = t({ loading: 'syncLoading', saved: 'syncSaved', saving: 'syncSaving', error: 'syncError' }[status] || 'syncSaved');
  }
  function renderClasses() {
    const sel = $('#classSel');
    const cur = classes.find(c => c.id === currentId);
    if (cur) cur.title = Store.state.title || '';
    sel.innerHTML = classes.map(c => `<option value="${c.id}">${escapeHtml(c.title || t('untitled'))}</option>`).join('') +
      `<option value="__new">＋ ${escapeHtml(t('newClass'))}</option>`;
    sel.value = currentId || '';
    sel.title = t('classSelect');
  }
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function render() { renderStatus(); renderClasses(); }

  async function open(id, refit = true) {
    loading = true; status = 'loading'; render();
    const { record } = await Cloud.api('load', { id });
    currentId = id; version = record.version || 0;
    Cloud.rememberClassId(id);
    Store.load(record.state);
    loading = false; status = 'saved'; render();
    if (refit) requestAnimationFrame(() => window.Layout.fit());
  }

  // Start a new class on Drive, empty or from the given data (e.g. a file the teacher opened).
  async function create(data) {
    await flush();
    status = 'saving'; render();
    const state = Store.normalize(data || Store.blank());
    delete state.studentView; // a copy of a class does not share the other class's student links
    let res;
    try { res = await Cloud.api('create', { state }); } catch (e) { status = 'error'; render(); throw e; }
    currentId = res.id; version = res.version; dirty = false;
    classes.unshift({ id: res.id, title: state.title || '', updated: res.updated });
    loading = true;
    Store.load(state);
    loading = false;
    Cloud.rememberClassId(res.id);
    status = 'saved'; render();
    requestAnimationFrame(() => window.Layout.fit());
  }

  function schedule() {
    if (loading || !currentId) return;
    dirty = true;
    status = 'saving'; render();
    clearTimeout(timer);
    timer = setTimeout(saveNow, 1500);
  }
  async function saveNow() {
    clearTimeout(timer); timer = null;
    if (saving) { await saving; if (!dirty) return; }
    if (!dirty || !currentId) return;
    dirty = false;
    status = 'saving'; render();
    const id = currentId;
    saving = Cloud.api('save', { id, state: Store.state, version })
      .then(res => { if (id === currentId) { version = res.version; status = dirty ? 'saving' : 'saved'; } })
      .catch(async e => {
        if (e.code === 'conflict' && e.data && e.data.record && id === currentId) {
          alert(t('syncConflict'));
          loading = true;
          version = e.data.record.version || 0;
          Store.load(e.data.record.state);
          loading = false;
          status = 'saved';
        } else {
          dirty = true; status = 'error';
          clearTimeout(timer); timer = setTimeout(saveNow, 15000);
        }
      })
      .finally(() => { saving = null; render(); });
    return saving;
  }
  async function flush() { if (dirty || saving) await saveNow(); }

  async function start() {
    render();
    try {
      ({ classes } = await Cloud.api('list'));
      const want = Cloud.lastClassId();
      if (classes.some(c => c.id === want)) await open(want);
      else if (classes.length) await open(classes[0].id);
      else await create(Store.state); // first time: move what's in this browser to Drive
    } catch (e) {
      loading = false; status = 'error'; render();
    }
  }

  Store.subscribe((state, reason) => { if (reason !== 'load') schedule(); });
  $('#classSel').addEventListener('change', async e => {
    const v = e.target.value;
    try {
      if (v === '__new') await create();
      else if (v !== currentId) { await flush(); await open(v); }
    } catch (err) { status = 'error'; render(); }
  });
  // Coming back to this tab: pick up points given in the class view (or changes made elsewhere) meanwhile.
  async function checkRemote() {
    if (document.hidden || loading || dirty || saving || timer || !currentId || !window.Auth.token()) return;
    try {
      const { version: v } = await Cloud.api('version', { id: currentId });
      if (v !== version && !dirty && !saving) await open(currentId, false);
    } catch (e) { /* ignore */ }
  }
  window.addEventListener('focus', checkRemote);
  document.addEventListener('visibilitychange', checkRemote);
  window.addEventListener('beforeunload', e => { if (dirty || saving) { e.preventDefault(); e.returnValue = ''; } });

  window.Sync = { create, flush, render };
  start();
})();
