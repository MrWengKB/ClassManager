/* Class Manager · 账号（目前只保存在本浏览器里；密码用 PBKDF2 加盐哈希，不保存明文） */
(function () {
  const USERS_KEY = 'classmanager:accounts';
  const SESSION_KEY = 'classmanager:session';
  const ITER = 150000;

  function readUsers() {
    try { const u = JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); return u && typeof u === 'object' ? u : {}; } catch (e) { return {}; }
  }
  function writeUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  const hex = buf => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));
  const norm = name => String(name || '').trim();
  const keyOf = name => norm(name).toLowerCase();

  function cryptoOk() { return !!(window.crypto && crypto.subtle && crypto.getRandomValues); }

  async function hash(password, saltHex, iter) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: iter }, base, 256);
    return hex(bits);
  }

  // Returns null on success, or an error code: 'nameEmpty' | 'nameTaken' | 'pwShort' | 'pwMismatch' | 'noCrypto'
  async function createAccount(name, password, confirmPw) {
    const n = norm(name);
    if (!n) return 'nameEmpty';
    if (!password || password.length < 6) return 'pwShort';
    if (password !== confirmPw) return 'pwMismatch';
    if (!cryptoOk()) return 'noCrypto';
    const users = readUsers();
    if (users[keyOf(n)]) return 'nameTaken';
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    users[keyOf(n)] = { name: n, salt, iter: ITER, hash: await hash(password, salt, ITER), created: new Date().toISOString() };
    writeUsers(users);
    setSession(n);
    return null;
  }

  // Returns null on success, or 'badLogin' | 'noCrypto'
  async function signIn(name, password) {
    if (!cryptoOk()) return 'noCrypto';
    const u = readUsers()[keyOf(name)];
    if (!u || !password) return 'badLogin';
    if ((await hash(password, u.salt, u.iter)) !== u.hash) return 'badLogin';
    setSession(u.name);
    return null;
  }

  function setSession(name) { try { localStorage.setItem(SESSION_KEY, name); } catch (e) { /* ignore */ } }
  function current() {
    try {
      const n = localStorage.getItem(SESSION_KEY);
      return n && readUsers()[keyOf(n)] ? n : null;
    } catch (e) { return null; }
  }
  function signOut() { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ } }
  function hasAccounts() { return Object.keys(readUsers()).length > 0; }

  // Send the visitor to the sign-in page unless someone is signed in.
  function requireLogin() {
    if (current()) return true;
    const page = location.pathname.split('/').pop() || 'admin.html';
    location.replace('login.html?next=' + encodeURIComponent(page));
    return false;
  }

  window.Auth = { createAccount, signIn, signOut, current, hasAccounts, requireLogin, cryptoOk };
})();
