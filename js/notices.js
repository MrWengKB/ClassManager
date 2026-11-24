/* Class Manager · 通知 / 作业：数据工具和安全的 Markdown 显示
 * state.notices: [{ id, type: 'notice' | 'hw', title, body, from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' | '', at: ISO }]
 * (kept in shape by Store.normalize). A post is valid from `from` to `to` (both days included);
 * an empty `to` means it never ends.
 *
 * The body is plain text with simple Markdown:
 *   **bold**  *italic* / _italic_  ++underline++  ~~strike~~  `code`  [text](https://…)  bare https://… links
 *   # heading   - list / * list / 1. list   > quote   blank line = new paragraph
 * Everything is HTML-escaped first, so typed HTML is shown as text and never runs.
 * Links only open http(s) and mailto addresses.
 */
(function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const unesc = s => s.replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[k]));
  const SAFE_URL = /^(https?:\/\/|mailto:)[^\s]+$/i;

  function linkTag(url, text) {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
  }

  // one line of already-escaped text → HTML
  function inline(s) {
    const keep = [];
    const hold = html => '\u0000' + (keep.push(html) - 1) + '\u0000';
    s = s.replace(/\u0000/g, '');
    s = s.replace(/`([^`]+)`/g, (m, c) => hold(`<code>${c}</code>`));
    s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (m, text, url) => (SAFE_URL.test(unesc(url)) ? hold(linkTag(url, fmt(text))) : m));
    s = s.replace(/(^|[^\w@/.\-])((?:https?:\/\/|www\.)[\w\-.~:/?#@!$&*+,;=%\[\]]*[\w\-~/#=%&;])/gi, (m, pre, url) => {
      const href = /^www\./i.test(url) ? 'https://' + url : url;
      return pre + hold(linkTag(href, url));
    });
    s = fmt(s);
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
  }
  function fmt(s) {
    return s
      .replace(/\*\*(?=\S)([^*]*?\S)\*\*/g, '<strong>$1</strong>')
      .replace(/__(?=\S)([^_]*?\S)__/g, '<strong>$1</strong>')
      .replace(/\+\+(?=\S)(.*?\S)\+\+/g, '<u>$1</u>')
      .replace(/~~(?=\S)(.*?\S)~~/g, '<s>$1</s>')
      .replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^_\w])_(?=\S)([^_]*?\S)_(?![_\w])/g, '$1<em>$2</em>');
  }

  // Markdown text → safe HTML
  function render(text) {
    const lines = esc(String(text || '').replace(/\r\n?/g, '\n')).split('\n');
    const out = [];
    let para = [], list = null; // list: { tag, items }
    const flushPara = () => { if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; };
    const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map(x => `<li>${inline(x)}</li>`).join('')}</${list.tag}>`); list = null; };
    lines.forEach(raw => {
      const line = raw.replace(/\s+$/, '');
      let m;
      if (!line.trim()) { flushPara(); flushList(); return; }
      if ((m = line.match(/^\s{0,3}(#{1,3})\s+(.*)$/))) {
        flushPara(); flushList();
        out.push(`<h${m[1].length + 3}>${inline(m[2])}</h${m[1].length + 3}>`);
        return;
      }
      if ((m = line.match(/^\s*([-*+•]|\d{1,3}[.)、])\s+(.*)$/))) {
        flushPara();
        const tag = /\d/.test(m[1]) ? 'ol' : 'ul';
        if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
        list.items.push(m[2]);
        return;
      }
      if ((m = line.match(/^\s*&gt;\s?(.*)$/))) {
        flushPara(); flushList();
        const prev = out[out.length - 1];
        if (prev && prev.startsWith('<blockquote>')) out[out.length - 1] = prev.replace(/<\/blockquote>$/, '<br>' + inline(m[1]) + '</blockquote>');
        else out.push(`<blockquote>${inline(m[1])}</blockquote>`);
        return;
      }
      flushList();
      para.push(line);
    });
    flushPara(); flushList();
    return out.join('');
  }

  // markup removed, for one-line previews
  function plainText(text) {
    return String(text || '')
      .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1')
      .replace(/(\*\*|__|\+\+|~~|`)/g, '')
      .replace(/(^|\s)[*_](\S)/g, '$1$2').replace(/(\S)[*_](\s|$)/g, '$1$2')
      .replace(/^\s*(#{1,3}|[-*+•]|\d{1,3}[.)、]|>)\s+/gm, '')
      .replace(/\s+/g, ' ').trim();
  }

  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  // 'active' (valid on that day), 'upcoming' or 'ended'
  function status(n, day) {
    const d = day || today();
    if (n.from && n.from > d) return 'upcoming';
    if (n.to && n.to < d) return 'ended';
    return 'active';
  }
  const activeOn = (list, day) => (list || []).filter(n => status(n, day) === 'active');
  // newest first: latest start date, then latest posted
  const sorted = list => (list || []).slice().sort((a, b) => (b.from || '').localeCompare(a.from || '') || (b.at || '').localeCompare(a.at || ''));

  window.Notices = { render, plainText, status, activeOn, sorted, today, ymd };
})();
