/* Class Manager · 管理页：学生端（开启 / 关闭、每个学生的链接和二维码、打印卡片） */
(function () {
  const { t } = window.I18n;
  const Store = window.Store, SD = window.StudentData;
  const cloud = () => window.Cloud || { enabled: false }; // cloud.js is loaded after this file
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cfg = window.CM_CONFIG || {};
  let rerender = () => {};
  let msg = null, busy = false;

  const on = () => !!Store.state.studentView;
  const linkFor = sid => { const sv = Store.state.studentView; return sv && sv.keys[sid] ? SD.linkOf(sv.file, sv.keys[sid]) : ''; };

  // every student gets a key while the student view is on (also students added later, here or in Sheets)
  function ensureKeys() {
    const st = Store.state;
    if (!st.studentView || st.students.every(s => SD.validSecret(st.studentView.keys[s.id]))) return;
    Store.commit(s => { s.students.forEach(x => { if (!SD.validSecret(s.studentView.keys[x.id])) s.studentView.keys[x.id] = SD.newSecret(); }); });
  }
  Store.subscribe(() => setTimeout(ensureKeys, 0));
  document.addEventListener('DOMContentLoaded', () => { if (window.Cloud) window.Cloud.onPublish(() => rerender()); });

  function qrSvg(text, cell) {
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: cell || 4, margin: 2, scalable: true });
  }

  /* ---------- sidebar section (Class list tab) ---------- */
  function section(st) {
    let h = `<section class="svsec"><h3>🎒 ${esc(t('svTitle'))}</h3>`;
    if (!cloud().enabled || !window.Sync) return h + `<p class="hint small">${esc(t('svNeedDrive'))}</p></section>`;
    if (!st.studentView) {
      h += `<p class="hint small">${esc(t('svIntro'))}</p>
        <div class="btnrow"><button data-act="svOn" class="primary" ${busy ? 'disabled' : ''}>${esc(t('svTurnOn'))}</button></div>`;
    } else {
      h += `<p class="hint small">${esc(t('svOnHelp'))}</p>
        <div class="btnrow"><button data-act="svPrint" class="primary" ${st.students.length ? '' : 'disabled'}>🖨 ${esc(t('svPrint'))}</button>
        <button data-act="svOff" class="danger ghostbtn" ${busy ? 'disabled' : ''}>${esc(t('svTurnOff'))}</button></div>`;
      if (cloud().publishError) h += `<div class="msg warn">${esc(t('svPubError'))}</div>`;
    }
    if (!cfg.googleApiKey) h += `<div class="msg warn">${esc(t('svNoKey'))}</div>`;
    if (msg) h += `<div class="msg ${msg.kind}">${esc(msg.text)}</div>`;
    return h + '</section>';
  }
  const linkButton = sid => on() ? `<button class="icon" data-act="svLink" data-id="${esc(sid)}" title="${esc(t('svLinkTip'))}">🔗</button>` : '';

  /* ---------- actions ---------- */
  async function turnOn() {
    if (busy) return;
    busy = true; msg = { kind: 'info', text: t('svWorking') }; rerender();
    try {
      await window.Sync.flush();
      const { file } = await window.Cloud.api('studentsOn', { title: Store.state.title });
      Store.commit(st => {
        st.studentView = { file, keys: {} };
        st.students.forEach(s => { st.studentView.keys[s.id] = SD.newSecret(); });
      });
      msg = { kind: 'ok', text: t('svOnDone') };
    } catch (e) {
      msg = { kind: 'warn', text: t(e.code === 'shareBlocked' ? 'svShareBlocked' : 'svError') };
    }
    busy = false; rerender();
  }
  async function turnOff() {
    const sv = Store.state.studentView;
    if (!sv || busy || !confirm(t('svConfirmOff'))) return;
    busy = true; rerender();
    try {
      await window.Cloud.api('studentsOff', { file: sv.file });
      Store.commit(st => { delete st.studentView; });
      msg = { kind: 'ok', text: t('svOffDone') };
    } catch (e) { msg = { kind: 'warn', text: t('svError') }; }
    busy = false; rerender();
  }
  function resetOne(sid) {
    const s = Store.state.students.find(x => x.id === sid);
    if (!s || !on() || !confirm(t('svConfirmReset', { name: s.name }))) return false;
    Store.commit(st => { st.studentView.keys[sid] = SD.newSecret(); });
    return true;
  }

  // one student's link and QR code
  function showLink(sid) {
    const s = Store.state.students.find(x => x.id === sid);
    if (!s || !on()) return;
    const wrap = document.createElement('div');
    wrap.className = 'mdo svmodal';
    const draw = () => {
      const url = linkFor(sid);
      wrap.innerHTML = `<div class="mdc" role="dialog" aria-modal="true">
        <h3>${esc(s.name)}</h3><div class="svqr">${qrSvg(url, 6)}</div>
        <p class="hint small">${esc(t('svScanHint'))}</p>
        <input class="svurl" readonly value="${esc(url)}" aria-label="${esc(t('svLinkTip'))}">
        <div class="mdbtns"><button class="mdbtn primary" data-x="copy">📋 ${esc(t('svCopy'))}</button>
        <button class="mdbtn" data-x="reset">↻ ${esc(t('svReset'))}</button>
        <button class="mdbtn" data-x="close">${esc(t('close'))}</button></div>
        <p class="hint small">${esc(t('svResetHint'))}</p></div>`;
    };
    draw();
    const close = () => wrap.remove();
    wrap.addEventListener('click', async e => {
      if (e.target === wrap) return close();
      const b = e.target.closest('[data-x]');
      if (!b) return;
      if (b.dataset.x === 'close') close();
      else if (b.dataset.x === 'reset') { if (resetOne(sid)) draw(); }
      else if (b.dataset.x === 'copy') {
        const url = linkFor(sid), inp = wrap.querySelector('.svurl');
        try { await navigator.clipboard.writeText(url); } catch (err) { inp.select(); document.execCommand('copy'); }
        b.textContent = '✓ ' + t('svCopied');
      }
    });
    wrap.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.body.appendChild(wrap);
    wrap.querySelector('[data-x="copy"]').focus();
  }

  // printable cards: name, class and QR code for every student
  function printCards() {
    const st = Store.state;
    if (!st.studentView || !st.students.length) return;
    ensureKeys();
    const wrap = document.createElement('div');
    wrap.className = 'svprint';
    wrap.innerHTML = `<div class="svbar"><b>${esc(t('svPrint'))}</b><span class="hint small">${esc(t('svPrintHint'))}</span><span class="spacer"></span>
      <button class="primary" data-x="print">🖨 ${esc(t('print'))}</button><button data-x="close">${esc(t('close'))}</button></div>
      <div class="svcards">${Store.state.students.map(s => `<div class="svcard">
        <div class="svqr">${qrSvg(linkFor(s.id), 4)}</div>
        <div class="svinfo"><b>${esc(s.name)}</b><span>${esc(st.title || '')}</span><small>${esc(t('svCardHint'))}</small></div></div>`).join('')}</div>`;
    const close = () => { wrap.remove(); document.body.classList.remove('svprinting'); };
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-x]');
      if (b && b.dataset.x === 'print') window.print();
      if (b && b.dataset.x === 'close') close();
    });
    document.body.classList.add('svprinting');
    document.body.appendChild(wrap);
  }

  const actions = { svOn: turnOn, svOff: turnOff, svPrint: printCards, svLink: showLink };
  function init(fn) { rerender = fn || rerender; setTimeout(ensureKeys, 0); }

  window.StudentAdmin = { init, section, linkButton, actions };
})();
