/* Class Manager · 在老师自己的 Google Drive 里读写班级资料（Drive API，drive.file 权限）
 * Each class is one JSON file in the folder “Class Manager”. The file's appProperties
 * hold app=classmanager and v=<version>; the version is used to notice when the same
 * class was changed somewhere else (another tab or computer) in the meantime.
 */
(function () {
  const cfg = window.CM_CONFIG || {};
  const enabled = !!cfg.useDrive;
  const { t } = window.I18n;
  const API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
  const FOLDER_NAME = 'Class Manager';
  const FOLDER_MIME = 'application/vnd.google-apps.folder';

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
    return opts && opts.raw ? res.text() : res.json();
  }
  const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

  function multipart(meta, content) {
    const boundary = 'cm' + Math.random().toString(36).slice(2);
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(content)}\r\n--${boundary}--`;
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

  const fileName = state => (String(state.title || '').trim() || t('untitled')).replace(/[\\/]/g, '_').slice(0, 100) + '.json';
  const titleOf = f => f.name.replace(/\.json$/i, '');

  /* ---------- actions ---------- */
  async function list() {
    const fid = await folderId();
    const query = `${q(fid)} in parents and trashed=false and appProperties has { key='app' and value='classmanager' }`;
    let res;
    try {
      res = await request('GET', `${API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=200`);
    } catch (e) {
      if (e.code === 'notFound') { store.set('classmanager:folder', null); return list(); }
      throw e;
    }
    return { classes: (res.files || []).map(f => ({ id: f.id, title: titleOf(f), updated: f.modifiedTime })) };
  }

  async function load(id) {
    const meta = await request('GET', `${API}/files/${encodeURIComponent(id)}?fields=id,modifiedTime,appProperties`);
    const content = JSON.parse(await request('GET', `${API}/files/${encodeURIComponent(id)}?alt=media`, { raw: true }));
    return { record: { id, version: Number(meta.appProperties && meta.appProperties.v) || 0, updated: meta.modifiedTime, state: content.state || content } };
  }

  async function create(state) {
    const fid = await folderId();
    const meta = { name: fileName(state), mimeType: 'application/json', parents: [fid], appProperties: { app: 'classmanager', v: '1' } };
    const res = await request('POST', `${UPLOAD}/files?uploadType=multipart&fields=id,modifiedTime`, multipart(meta, { app: 'classmanager', version: 1, state }));
    return { id: res.id, version: 1, updated: res.modifiedTime };
  }

  async function save(id, state, version) {
    const meta = await request('GET', `${API}/files/${encodeURIComponent(id)}?fields=appProperties`);
    const cur = Number(meta.appProperties && meta.appProperties.v) || 0;
    if (cur !== version) throw new CloudError('conflict', 'changed elsewhere', await load(id));
    const v = cur + 1;
    const res = await request('PATCH', `${UPLOAD}/files/${encodeURIComponent(id)}?uploadType=multipart&fields=id,modifiedTime`,
      multipart({ name: fileName(state), appProperties: { v: String(v) } }, { app: 'classmanager', version: v, state }));
    return { version: v, updated: res.modifiedTime };
  }

  async function version(id) {
    const meta = await request('GET', `${API}/files/${encodeURIComponent(id)}?fields=appProperties`);
    return { version: Number(meta.appProperties && meta.appProperties.v) || 0 };
  }

  // Same shape for every caller: api('list'), api('load', {id}), api('create', {state}), api('save', {id, state, version})
  function api(action, p) {
    p = p || {};
    if (action === 'list') return list();
    if (action === 'load') return load(p.id);
    if (action === 'create') return create(p.state);
    if (action === 'save') return save(p.id, p.state, p.version);
    if (action === 'version') return version(p.id);
    return Promise.reject(new CloudError('badAction'));
  }

  function lastClassId() { return store.get('classmanager:classId'); }
  function rememberClassId(id) { store.set('classmanager:classId', id); }

  window.Cloud = { enabled, api, lastClassId, rememberClassId, authErrorKey, CloudError };
})();
