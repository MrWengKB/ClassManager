/* Class Manager · 在老师自己的 Google Drive 里读写班级资料（Drive API，drive.file 权限）
 * Each class is one Google Sheet in the folder “Class Manager” (see sheetio.js for its tabs),
 * marked with appProperties app=classmanager. It is written by uploading an .xlsx that Drive
 * converts, and read by exporting it as .xlsx, so edits made in Google Sheets are read back.
 * The file's Drive "version" number goes up with every change, by this site or in Sheets;
 * it is used to notice when the class was changed somewhere else in the meantime.
 */
(function () {
  const cfg = window.CM_CONFIG || {};
  const enabled = !!cfg.useDrive;
  const { t } = window.I18n;
  const API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
  const FOLDER_NAME = 'Class Manager';
  const FOLDER_MIME = 'application/vnd.google-apps.folder';
  const SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
  const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  class CloudError extends Error {
    constructor(code, message, data) { super(message || code); this.code = code; this.data = data; }
  }

  /* ---------- requests ---------- */
  async function request(method, url, opts, retried) {
    let tk = window.Auth.token();
    if (!tk) tk = await reauth();
    let res;
    try {
      res = await fetch(url, { method, headers: Object.assign({ Authorization: 'Bearer ' + tk }, opts && opts.headers), body: opts && opts.body });
    } catch (e) { throw new CloudError('network'); }
    if (res.status === 401 && !retried) { await reauth(true); return request(method, url, opts, true); }
    if (res.status === 404) throw new CloudError('notFound');
    if (!res.ok) throw new CloudError(res.status === 403 ? 'forbidden' : 'server', await res.text().catch(() => ''));
    if (res.status === 204) return {};
    return opts && opts.bytes ? res.arrayBuffer() : res.json();
  }
  const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

  // metadata (JSON) + an .xlsx file, for Drive to convert into a Google Sheet
  function multipartXlsx(meta, bytes) { return multipart(meta, new Uint8Array(bytes), XLSX_MIME); }
  function multipart(meta, content, mime) {
    const boundary = 'cm' + Math.random().toString(36).slice(2);
    const body = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
      content, `\r\n--${boundary}--`]);
    return { headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body };
  }

  /* ---------- sign-in expired ---------- */
  let reauthPromise = null;
  function reauth(force) {
    if (!force && window.Auth.token()) return Promise.resolve(window.Auth.token());
    if (!reauthPromise) reauthPromise = askToSignIn().finally(() => { reauthPromise = null; });
    return reauthPromise;
  }
  // Google's popup needs a click, so show a small dialog with a button.
  function askToSignIn() {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'mdo';
      wrap.innerHTML = `<div class="mdc" role="dialog" aria-modal="true"><div class="mdicon" aria-hidden="true">🔑</div>
        <h3></h3><p></p><p class="msg warn" hidden></p><div class="mdbtns"><button class="mdbtn primary" type="button"></button></div></div>`;
      wrap.querySelector('h3').textContent = t('accSignInTitle');
      wrap.querySelector('p').textContent = t('signInAgain');
      const btn = wrap.querySelector('button');
      btn.textContent = t('continueGoogle');
      btn.addEventListener('click', async () => {
        try { const tk = await window.Auth.signIn(); wrap.remove(); resolve(tk); }
        catch (e) { const m = wrap.querySelector('.msg'); m.hidden = false; m.textContent = t(authErrorKey(e)); }
      });
      document.body.appendChild(wrap);
      btn.focus();
    });
  }
  function authErrorKey(e) { return { scope: 'err_scope', gsi: 'err_gsi' }[e && e.code] || 'err_popup'; }

  /* ---------- the "Class Manager" folder ---------- */
  const who = () => ((window.Auth.current() || {}).email || '').toLowerCase();
  const store = {
    get: k => { try { return localStorage.getItem(k + ':' + who()); } catch (e) { return null; } },
    set: (k, v) => { try { v ? localStorage.setItem(k + ':' + who(), v) : localStorage.removeItem(k + ':' + who()); } catch (e) { /* ignore */ } }
  };
  async function folderId() {
    const cached = store.get('classmanager:folder');
    if (cached) return cached;
    const found = await request('GET', `${API}/files?q=${encodeURIComponent(`mimeType=${q(FOLDER_MIME)} and name=${q(FOLDER_NAME)} and trashed=false`)}&fields=files(id)&spaces=drive`);
    let id = found.files && found.files[0] && found.files[0].id;
    if (!id) {
      id = (await request('POST', `${API}/files?fields=id`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME })
      })).id;
    }
    store.set('classmanager:folder', id);
    return id;
  }

  function lastClassId() { return store.get('classmanager:classId'); }
  function rememberClassId(id) { store.set('classmanager:classId', id); }
  const fileName = state => (String(state.title || '').trim() || t('untitled')).replace(/[\\/]/g, '_').slice(0, 100);
  const titleOf = f => f.name;
  const meta = id => request('GET', `${API}/files/${encodeURIComponent(id)}?fields=id,name,mimeType,modifiedTime,version,appProperties`);

  /* ---------- actions ---------- */
  async function list() {
    const fid = await folderId();
    const query = `${q(fid)} in parents and trashed=false and appProperties has { key='app' and value='classmanager' }`;
    let res;
    try {
      res = await request('GET', `${API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc&pageSize=200`);
    } catch (e) {
      if (e.code === 'notFound') { store.set('classmanager:folder', null); return list(); }
      throw e;
    }
    const files = (res.files || []).filter(f => f.mimeType === SHEET_MIME);
    return { classes: files.map(f => ({ id: f.id, title: titleOf(f), updated: f.modifiedTime })) };
  }

  async function load(id) {
    const m = await meta(id);
    const buf = await request('GET', `${API}/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(XLSX_MIME)}`, { bytes: true });
    let state;
    try { state = await window.SheetIO.fromBytes(buf); } catch (e) { throw new CloudError('badSheet', e.message); }
    return { record: { id, version: Number(m.version) || 0, updated: m.modifiedTime, state, outdated: !!state.outdated } };
  }

  async function create(state) {
    const fid = await folderId();
    const body = multipartXlsx({ name: fileName(state), mimeType: SHEET_MIME, parents: [fid], appProperties: { app: 'classmanager' } }, await window.SheetIO.toBytes(state));
    const res = await request('POST', `${UPLOAD}/files?uploadType=multipart&fields=id`, body);
    const m = await meta(res.id); // the version after Drive has converted the file
    return { id: res.id, version: Number(m.version) || 0, updated: m.modifiedTime };
  }

  async function save(id, state, version) {
    const cur = Number((await meta(id)).version) || 0;
    if (cur !== version) throw new CloudError('conflict', 'changed elsewhere', await load(id));
    await request('PATCH', `${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=multipart&fields=id`,
      multipartXlsx({ name: fileName(state) }, await window.SheetIO.toBytes(state)));
    const m = await meta(id);
    publishStudents(state);
    return { version: Number(m.version) || 0, updated: m.modifiedTime };
  }

  /* ---------- student view (see studentdata.js) ---------- */
  // Turn it on: a JSON file in the folder that anyone with the link can read (it only holds encrypted entries).
  async function studentsOn(title) {
    const fid = await folderId();
    const name = 'Class Manager · student view · ' + (String(title || '').trim() || t('untitled')).replace(/[\\/]/g, '_').slice(0, 80) + '.json';
    const res = await request('POST', `${UPLOAD}/files?uploadType=multipart&fields=id`,
      multipart({ name, mimeType: 'application/json', parents: [fid], appProperties: { app: 'classmanager-students' } }, '{"app":"classmanager-students","v":1,"s":{}}', 'application/json'));
    try {
      await request('POST', `${API}/files/${encodeURIComponent(res.id)}/permissions`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone', allowFileDiscovery: false })
      });
    } catch (e) {
      await request('DELETE', `${API}/files/${encodeURIComponent(res.id)}`).catch(() => {});
      throw new CloudError(e.code === 'network' ? 'network' : 'shareBlocked', e.message);
    }
    return { file: res.id };
  }
  async function studentsOff(file) {
    try { await request('DELETE', `${API}/files/${encodeURIComponent(file)}`); } catch (e) { if (e.code !== 'notFound') throw e; }
    lastPublished.delete(file);
    return {};
  }
  // After each save: upload the students' entries again, if anything they can see has changed.
  const lastPublished = new Map(); // file id → plain snapshots last uploaded from this page
  let publishing = Promise.resolve(), pubState = null;
  const pubStatus = { error: null, listeners: [] };
  function publishStudents(state) {
    if (!state || !state.studentView || !window.StudentData) return publishing;
    const first = !pubState;
    pubState = state;
    if (first) publishing = publishing.then(async () => {
      const st = pubState; pubState = null;
      const file = st.studentView.file, plain = window.StudentData.plain(st);
      if (lastPublished.get(file) === plain) return;
      try {
        await request('PATCH', `${UPLOAD}/files/${encodeURIComponent(file)}?uploadType=media&fields=id`, {
          headers: { 'Content-Type': 'application/json' }, body: await window.StudentData.build(st)
        });
        lastPublished.set(file, plain);
        setPubError(null);
      } catch (e) { setPubError(e.code || 'server'); }
    });
    return publishing;
  }
  function setPubError(code) {
    if (pubStatus.error === code) return;
    pubStatus.error = code;
    pubStatus.listeners.forEach(fn => fn(code));
  }

  async function version(id) {
    return { version: Number((await meta(id)).version) || 0 };
  }

  // Same shape for every caller: api('list'), api('load', {id}), api('create', {state}), api('save', {id, state, version})
  function api(action, p) {
    p = p || {};
    if (action === 'list') return list();
    if (action === 'load') return load(p.id);
    if (action === 'create') return create(p.state);
    if (action === 'save') return save(p.id, p.state, p.version);
    if (action === 'version') return version(p.id);
    if (action === 'studentsOn') return studentsOn(p.title);
    if (action === 'studentsOff') return studentsOff(p.file);
    if (action === 'publishStudents') return publishStudents(p.state);
    return Promise.reject(new CloudError('badAction'));
  }


  window.Cloud = {
    enabled, api, lastClassId, rememberClassId, authErrorKey, CloudError,
    get publishError() { return pubStatus.error; }, onPublish: fn => pubStatus.listeners.push(fn)
  };
})();
