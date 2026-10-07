/* 共用工具 */
(function () {
  const U = (XH.U = {});

  // 建立元素：h('div.cls#id', {attr}, ...children)
  U.h = function (sel, attrs, ...kids) {
    const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
    const el = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) m[2].replace(/([.#])([\w-]+)/g, (_, t, v) => (t === '.' ? el.classList.add(v) : (el.id = v)));
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const p in v) if (v[p] != null) (p.startsWith('--') ? el.style.setProperty(p, v[p]) : (el.style[p] = v[p]));
      }
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) return c.forEach(add);
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return el;
  };

  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // 文字標記：[[詞條]] 與 ==重點==（輸入為受信任的本地資料）
  U.md = function (s) {
    return String(s)
      .replace(/\[\[(.+?)\]\]/g, (_, t) => { const [k, show] = t.split('|'); return `<button type="button" class="term" data-term="${U.esc(k)}">${show || k}</button>`; })
      .replace(/==(.+?)==/g, '<mark class="k">$1</mark>');
  };

  // 本機儲存（失敗時改用記憶體）
  const mem = {};
  U.store = {
    get(k, d) { try { const v = localStorage.getItem('xh.' + k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem('xh.' + k, JSON.stringify(v)); } catch (e) {} },
  };

  U.shuffle = function (a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  // 打亂但保證不等於原次序
  U.shuffleNew = function (a) {
    if (a.length < 2) return a.slice();
    let s;
    do { s = U.shuffle(a); } while (s.every((x, i) => x === a[i]));
    return s;
  };

  // 日期
  U.parseDate = function (d) {
    const p = String(d).split('-').map(Number);
    if (p.length === 1) return Date.UTC(p[0], 6, 1);           // 只有年份：放在年中
    if (p.length === 2) return Date.UTC(p[0], p[1] - 1, 15);   // 只有月份：放在月中
    return Date.UTC(p[0], p[1] - 1, p[2]);
  };
  U.fmtDate = function (d) {
    const p = String(d).split('-').map(Number);
    if (p.length === 1) return p[0] + '年';
    if (p.length === 2) return `${p[0]}年${p[1]}月`;
    if (p[1] === 1 && p[2] === 1) return `${p[0]}年元旦`;
    return `${p[0]}年${p[1]}月${p[2]}日`;
  };
  U.evDate = (e) => e.dl || (e.end && e.bar ? `${U.fmtDate(e.d)}－${U.fmtDate(e.end)}` : U.fmtDate(e.d));

  U.unit = (id) => XH.units.find((u) => u.id === id);
  U.ev = (id) => XH.events.find((e) => e.id === id);
  U.term = (t) => XH.glossary.find((g) => g.term === t || (g.alias || []).includes(t));

  // 彈出卡
  const pop = () => document.getElementById('pop');
  U.closePop = function () { const p = pop(); p.hidden = true; p.innerHTML = ''; };
  U.openPop = function (anchor, content) {
    const p = pop();
    p.innerHTML = '';
    p.append(U.h('button.x', { type: 'button', 'aria-label': '關閉', onclick: U.closePop }, '×'), content);
    p.hidden = false;
    const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
    const pw = p.offsetWidth, ph = p.offsetHeight, vw = innerWidth, vh = innerHeight;
    let x = Math.min(Math.max(12, r.left + (r.width || 0) / 2 - pw / 2), vw - pw - 12);
    let y = r.bottom + 10;
    if (y + ph > vh - 12) y = Math.max(12, r.top - ph - 10);
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.querySelector('.x').focus({ preventScroll: true });
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') U.closePop(); });
  document.addEventListener('pointerdown', (e) => {
    const p = pop();
    if (!p.hidden && !p.contains(e.target) && !e.target.closest('.term,.tl-item,.tl-bar,.mk,.tile.info')) U.closePop();
  });
  addEventListener('hashchange', U.closePop);

  // 術語彈出（全站委派）
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.term');
    if (!b) return;
    const g = U.term(b.dataset.term);
    if (!g) return;
    U.openPop(b, U.h('div', U.h('h4', g.term), g.yin ? U.h('div.small.muted', g.yin) : null, U.h('p', { style: { margin: '4px 0' } }, g.def),
      U.h('div.pg', `課本第${g.pg}頁`)));
  });

  // 事件卡內容
  U.eventCard = function (e) {
    const u = e.unit && U.unit(e.unit);
    return U.h('div',
      U.h('div.date', U.evDate(e)),
      U.h('h4', e.t),
      U.h('p', { style: { margin: '4px 0' } }, e.x),
      U.h('div.pg', `課本第${e.pg}頁`),
      u ? U.h('div.acts', U.h('a.btn', { href: `#/unit/${u.id}/${e.id}` }, `看單元：${u.title}${u.ready ? '' : '（第二階段）'}`)) : null);
  };

  let tt;
  U.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('show'), 2200);
  };

  // 小型彩紙效果（尊重減少動態設定）
  U.cheer = function (el) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !el) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const s = U.h('span', { style: { position: 'fixed', left: r.left + r.width / 2 + 'px', top: r.top + 20 + 'px', width: '8px', height: '8px', borderRadius: '2px', background: ['#b23a2a', '#d9a514', '#2e4b7d', '#2f7a4f'][i % 4], zIndex: 70, pointerEvents: 'none', transition: 'transform .9s cubic-bezier(.2,.7,.3,1), opacity .9s' } });
      document.body.append(s);
      requestAnimationFrame(() => {
        s.style.transform = `translate(${(Math.random() - 0.5) * 260}px, ${-60 - Math.random() * 120}px) rotate(${Math.random() * 360}deg)`;
        s.style.opacity = '0';
      });
      setTimeout(() => s.remove(), 1000);
    }
  };
})();
