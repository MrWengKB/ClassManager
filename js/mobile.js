/* Class Manager · 手机版：窄屏（手机竖屏，或触屏的小横屏）用简化界面；浏览器选“桌面版网站”时视口变宽，就显示完整版 */
(function () {
  const mq = window.matchMedia('(max-width: 600px), (pointer: coarse) and (max-width: 940px) and (max-height: 600px)');
  const subs = [];
  function set() { document.documentElement.classList.toggle('mobile', mq.matches); }
  set();
  const onChange = () => { set(); subs.forEach(f => f(mq.matches)); };
  if (mq.addEventListener) mq.addEventListener('change', onChange); else mq.addListener(onChange);
  window.Mobile = { get on() { return mq.matches; }, subscribe(f) { subs.push(f); } };
})();
