/* Class Manager · 班级一览的讲台两侧：左边幸运抽选（全班 / 男生 / 女生），右边倒计时 */
(function () {
  const { t } = window.I18n;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let ui = null, rerender = () => {};

  // one modal shared by both tools
  const wrap = document.createElement('div');
  wrap.className = 'mdo ctool';
  wrap.hidden = true;
  document.body.appendChild(wrap);
  let mode = null; // 'draw' | 'timer'
  function close() { wrap.hidden = true; mode = null; clearInterval(D.anim); D.anim = null; }
  // the drawn student's desk stays highlighted after closing, until the next click on the classroom
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-cclose]')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !wrap.hidden) close(); });

  /* ---------- lucky draw ---------- */
  // Each pool goes through everyone once before anyone is picked again.
  const D = { pool: 'all', picked: { all: [], M: [], F: [] }, result: null, anim: null, classKey: '' };
  const POOLS = [['all', '🎲', 'drawAll'], ['M', '👦', 'drawBoys'], ['F', '👧', 'drawGirls']];
  function candidates(pool) {
    const sts = window.Store.state.students;
    return pool === 'all' ? sts : sts.filter(s => s.gender === pool);
  }
  function syncClass() {
    const st = window.Store.state, key = (st.title || '') + '|' + st.students.length;
    if (key !== D.classKey) { D.classKey = key; D.picked = { all: [], M: [], F: [] }; }
  }
  function draw(pool) {
    syncClass();
    D.pool = pool;
    const all = candidates(pool);
    mode = 'draw';
    if (!all.length) { D.result = null; paintDraw(); wrap.hidden = false; return; }
    let left = all.filter(s => !D.picked[pool].includes(s.id));
    if (!left.length) { D.picked[pool] = []; left = all; }
    const winner = left[Math.floor(Math.random() * left.length)];
    D.picked[pool].push(winner.id);
    D.result = null;
    wrap.hidden = false;
    paintDraw(true);
    // shuffle names for a moment, slowing down, then land on the winner
    clearInterval(D.anim);
    let n = 0;
    const steps = Math.min(18, 8 + all.length);
    const spin = () => {
      const el = wrap.querySelector('.dname-big');
      if (!el) return;
      if (n >= steps) {
        D.anim = null; D.result = winner.id; paintDraw();
        if (ui) { ui.picked = winner.id; rerender(); }
        return;
      }
      el.textContent = all[(Math.random() * all.length) | 0].name;
      n++;
      D.anim = setTimeout(spin, 50 + n * n * 1.2);
    };
    spin();
  }
  function paintDraw(rolling) {
    const all = candidates(D.pool);
    const p = POOLS.find(x => x[0] === D.pool);
    const st = window.Store.state;
    const w = D.result && st.students.find(s => s.id === D.result);
    const left = all.filter(s => !D.picked[D.pool].includes(s.id)).length;
    const body = !all.length ? `<p class="dnote">${t('drawNone')}</p>` : `
      <div class="dshow${rolling ? ' rolling' : ''}${w ? ' done g' + (w.gender || '') : ''}"><div class="dname-big">${w ? esc(w.name) : '…'}</div></div>
      <p class="dnote">${w ? (left ? esc(t('drawLeft', { n: left, t: all.length })) : esc(t('drawNewRound'))) : '&nbsp;'}</p>
      <div class="mdbtns">${POOLS.map(([k, ic, lab]) => `<button class="mdbtn${k === D.pool ? ' primary' : ''}" data-draw="${k}"${rolling ? ' disabled' : ''}>${ic} ${k === D.pool && w ? t('drawAgain') : t(lab)}</button>`).join('')}</div>
      ${D.picked[D.pool].length > 1 && !rolling ? `<p class="dnote"><button class="linkbtn" data-dreset="1">↺ ${t('drawRestart')}</button></p>` : ''}`;
    wrap.innerHTML = `<div class="mdc ctcard dcard"><div class="cthead"><h3>${p[1]} ${t('drawTitle')} · ${t(p[2])}</h3><button class="icon" data-cclose="1" aria-label="${esc(t('close'))}">✕</button></div>${body}</div>`;
  }
  wrap.addEventListener('click', e => {
    const b = e.target.closest('[data-draw]');
    if (b && !b.disabled) draw(b.dataset.draw);
    if (e.target.closest('[data-dreset]')) { D.picked[D.pool] = []; paintDraw(); }
  });

  /* ---------- countdown (as in ClassHero) ---------- */
  const C = { total: 300, remain: 300, running: false, endAt: 0, done: false, tick: null };
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const cLeft = () => C.running ? Math.max(0, (C.endAt - Date.now()) / 1000) : C.remain;
  function timerLabel() {
    if (C.done) return '⏰ ' + t('timeUp');
    return C.running || C.remain < C.total ? `⏱ ${fmt(cLeft())}` : '⏱ ' + t('timer');
  }
  function paintTimer() {
    const m = Math.floor(C.total / 60), s = C.total % 60, editable = !C.running && C.remain === C.total;
    wrap.innerHTML = `<div class="mdc ctcard tcard"><div class="cthead"><h3>⏱ ${t('timer')}</h3><button class="icon" data-cclose="1" aria-label="${esc(t('close'))}">✕</button></div>
      <div class="cring" id="cRing"><div class="cdisp${C.done ? ' cdone' : ''}" id="cDisp">${C.done ? t('timeUp') : fmt(cLeft())}</div></div>
      ${editable ? `<div class="crow"><input class="cnum" id="cMin" type="number" min="0" max="99" value="${m}"><b>${t('minU')}</b>
        <input class="cnum" id="cSec" type="number" min="0" max="59" value="${s}"><b>${t('secU')}</b></div>
        <div class="crow">${[30, 60, 180, 300, 600].map(v => `<button class="cpre${C.total === v ? ' on' : ''}" data-cp="${v}">${v < 60 ? t('secsN', { n: v }) : t('minsN', { n: v / 60 })}</button>`).join('')}</div>` : ''}
      <div class="mdbtns">
        ${C.running ? `<button class="mdbtn" data-ct="pause">⏸ ${t('tPause')}</button>` : `<button class="mdbtn primary" data-ct="start"${C.total ? '' : ' disabled'}>▶ ${C.remain < C.total && !C.done ? t('tResume') : t('tStart')}</button>`}
        ${C.running || C.remain < C.total || C.done ? `<button class="mdbtn" data-ct="add">${t('tAddMin')}</button><button class="mdbtn" data-ct="reset">↺ ${t('tReset')}</button>` : ''}
      </div></div>`;
    cPaint();
  }
  function openTimer() {
    if (C.done) { C.done = false; C.remain = C.total; }
    mode = 'timer'; paintTimer(); wrap.hidden = false; paintButton();
  }
  function paintButton() {
    const b = $('#cOpen');
    if (b) { b.textContent = timerLabel(); b.classList.toggle('cdone', C.done); b.classList.toggle('crun', C.running); }
  }
  function cPaint() {
    const left = cLeft(), d = $('#cDisp'), r = $('#cRing');
    if (d && !C.done) d.textContent = fmt(left);
    if (r) r.style.setProperty('--p', C.total ? (left / C.total * 360) + 'deg' : '0deg');
    paintButton();
  }
  function beep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, .35, .7].forEach(tt => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(.3, ac.currentTime + tt); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + tt + .3);
        o.start(ac.currentTime + tt); o.stop(ac.currentTime + tt + .3);
      });
    } catch (e) { /* no audio */ }
  }
  function cTick() {
    if (!C.running) return;
    if (cLeft() <= 0) {
      clearInterval(C.tick); C.running = false; C.remain = 0; C.done = true;
      beep(); mode = 'timer'; paintTimer(); wrap.hidden = false; paintButton(); return;
    }
    cPaint();
  }
  function cStart() {
    if (C.done || C.remain <= 0) { C.remain = C.total; C.done = false; }
    if (!C.remain) return;
    C.endAt = Date.now() + C.remain * 1000; C.running = true;
    clearInterval(C.tick); C.tick = setInterval(cTick, 200);
    paintTimer();
  }
  function cSetTotal(sec) { C.total = Math.max(0, Math.min(99 * 60 + 59, sec)); C.remain = C.total; C.done = false; }
  const readInputs = () => cSetTotal((parseInt($('#cMin').value) || 0) * 60 + (parseInt($('#cSec').value) || 0));
  wrap.addEventListener('input', e => {
    if (!e.target.matches('.cnum')) return;
    // only update the display, so the box keeps focus while typing
    readInputs();
    $('#cDisp').textContent = fmt(C.total);
    wrap.querySelectorAll('[data-cp]').forEach(x => x.classList.toggle('on', +x.dataset.cp === C.total));
    const st = wrap.querySelector('[data-ct="start"]'); if (st) st.disabled = !C.total;
  });
  wrap.addEventListener('click', e => {
    const cp = e.target.closest('[data-cp]');
    if (cp) { cSetTotal(+cp.dataset.cp); paintTimer(); return; }
    const b = e.target.closest('[data-ct]');
    if (!b) return;
    const a = b.dataset.ct;
    if (a === 'start') { if ($('#cMin')) readInputs(); cStart(); }
    else if (a === 'pause') { C.remain = cLeft(); C.running = false; clearInterval(C.tick); paintTimer(); }
    else if (a === 'add') {
      if (C.done) { C.done = false; C.remain = 60; }
      else if (C.running) C.endAt += 60000; else C.remain += 60;
      C.total = Math.max(C.total, Math.ceil(cLeft())); paintTimer();
    }
    else if (a === 'reset') { clearInterval(C.tick); C.running = false; C.done = false; C.remain = C.total; paintTimer(); }
  });

  /* ---------- the buttons beside the front of the class ---------- */
  function sides() {
    return {
      left: `${POOLS.map(([k, ic, lab]) => `<button class="fsbtn" data-fdraw="${k}">${ic} ${esc(t(lab))}</button>`).join('')}`,
      right: `<button class="fsbtn ctimer${C.done ? ' cdone' : ''}${C.running ? ' crun' : ''}" id="cOpen">${esc(timerLabel())}</button>`
    };
  }
  function init(opts) {
    ui = opts.ui; rerender = opts.rerender || rerender;
    ui.frontSides = sides;
    opts.board.addEventListener('click', e => {
      const d = e.target.closest('[data-fdraw]');
      if (d) { e.stopPropagation(); draw(d.dataset.fdraw); return; }
      if (e.target.closest('#cOpen')) { e.stopPropagation(); openTimer(); return; }
      if (ui.picked) setTimeout(() => { ui.picked = null; rerender(); });
    }, true);
  }
  // re-translate an open modal when the language changes
  function relang() { if (wrap.hidden) return; if (mode === 'timer') paintTimer(); else if (mode === 'draw' && !D.anim) paintDraw(); }

  window.ClassTools = { init, relang };
})();
