/* Class Manager · 用 Google 账号登录，并取得访问老师自己 Google Drive 的权限
 * Scope drive.file: the site can only see the files it created itself, nothing else in the Drive.
 * The access token lasts about an hour and is kept in this browser.
 */
(function () {
  const KEY = 'classmanager:google';
  const GSI_SRC = 'https://accounts.google.com/gsi/client';
  const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';
  const cfg = window.CM_CONFIG || {};

  function read() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.token ? s : null; } catch (e) { return null; }
  }
  function write(s) { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }

  // A valid access token, or null when signed out / expired.
  function token() {
    const s = read();
    return s && s.exp > Date.now() + 60000 ? s.token : null;
  }
  // Who signed in last (kept after the token expires, so we can sign them back in quickly).
  function current() {
    const s = read();
    return s ? { email: s.email, name: s.name || s.email } : null;
  }
  function signOut() {
    const s = read();
    write(null);
    if (s && s.token && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(s.token, () => {});
  }
  function requireLogin() {
    if (current()) return true; // an expired token is renewed when it is needed
    location.replace(loginUrl());
    return false;
  }
  function loginUrl() {
    const page = location.pathname.split('/').pop() || 'index.html';
    return 'login.html?next=' + encodeURIComponent(page);
  }

  /* ---------- Google Identity Services (token model) ---------- */
  let gsiPromise = null;
  function loadGsi() {
    if (!gsiPromise) {
      gsiPromise = new Promise((resolve, reject) => {
        if (window.google && google.accounts && google.accounts.oauth2) return resolve();
        const s = document.createElement('script');
        s.src = GSI_SRC; s.async = true;
        s.onload = () => resolve();
        s.onerror = () => { gsiPromise = null; reject(Object.assign(new Error('gsi'), { code: 'gsi' })); };
        document.head.appendChild(s);
      });
    }
    return gsiPromise;
  }

  // Must be called from a click: opens Google's sign-in popup (it closes by itself when nothing needs confirming).
  async function signIn() {
    await loadGsi();
    const prev = current();
    const resp = await new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: cfg.googleClientId,
        scope: SCOPES,
        hint: prev ? prev.email : undefined,
        callback: r => (r.error ? reject(Object.assign(new Error(r.error), { code: 'denied' })) : resolve(r)),
        error_callback: e => reject(Object.assign(new Error(e && e.type || 'popup'), { code: 'popup' }))
      });
      client.requestAccessToken({ prompt: '' });
    });
    if (!google.accounts.oauth2.hasGrantedAllScopes(resp, 'https://www.googleapis.com/auth/drive.file')) {
      throw Object.assign(new Error('scope'), { code: 'scope' });
    }
    const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + resp.access_token } })
      .then(r => r.json()).catch(() => ({}));
    write({ token: resp.access_token, exp: Date.now() + (Number(resp.expires_in) || 3600) * 1000, email: info.email || '', name: info.name || '' });
    return resp.access_token;
  }

  window.Auth = { token, current, signIn, signOut, requireLogin, loginUrl, loadGsi };
})();
