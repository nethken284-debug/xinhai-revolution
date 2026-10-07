/* 時間軸：按真實日期比例、可縮放拖動、分軌顯示 */
(function () {
  const { h } = XH.U;
  const DAY = 86400000;
  const LABEL_W = 92, AXIS_H = 40, BAR_H = 30, PT_H = 26, PAD = 8;

  const PRESETS = [
    { t: '全覽', a: null },
    { t: '革命團體（1894–1906）', a: '1893-10', b: '1907-03' },
    { t: '辛亥革命（1911–1912）', a: '1911-03', b: '1912-05' },
    { t: '袁世凱掌權（1912–1916）', a: '1911-12', b: '1916-09' },
  ];

  XH.Timeline = {
    render(root, opts) {
      opts = opts || {};
      const T0 = XH.U.parseDate(XH.meta.range.start), T1 = XH.U.parseDate(XH.meta.range.end);
      const spanDays = (T1 - T0) / DAY;
      let viewW = 800, z = 1, sx = 0, topic = opts.topic || null;

      const topicIds = (id) => {
        const tp = XH.topics.find((t) => t.id === id);
        const s = new Set(XH.events.filter((e) => (e.topics || []).includes(id)).map((e) => e.id));
        (tp ? tp.steps : []).forEach((st) => st.ev && s.add(st.ev));
        return s;
      };

      // ---- 工具列 ----
      const chips = h('div.chips', { role: 'group', 'aria-label': '專題高亮' });
      const setTopic = (id) => {
        topic = id;
        chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', (c.dataset.id || null) === id));
        layout();
        const tp = XH.topics.find((t) => t.id === id);
        topicNote.innerHTML = tp ? `<b>${tp.icon} ${tp.title}</b>：${tp.q}　<a href="#/topic/${tp.id}">看專題說明 →</a>` : '';
      };
      chips.append(h('button.chip', { type: 'button', onclick: () => setTopic(null) }, '不高亮'));
      XH.topics.forEach((t) => chips.append(h('button.chip', { type: 'button', 'data-id': t.id, onclick: () => setTopic(t.id) }, `${t.icon} ${t.title}`)));
      const topicNote = h('div.small', { style: { minHeight: '1.6em', margin: '6px 0 2px' } });

      const presetRow = h('div.chips');
      PRESETS.forEach((p) => presetRow.append(h('button.chip', { type: 'button', onclick: () => (p.a ? fitRange(XH.U.parseDate(p.a), XH.U.parseDate(p.b)) : fitRange(T0, T1)) }, p.t)));

      const zoomBox = h('div.tl-zoom',
        h('button', { type: 'button', 'aria-label': '縮小', onclick: () => zoomAt(z / 1.6, viewW / 2) }, '−'),
        h('button', { type: 'button', 'aria-label': '放大', onclick: () => zoomAt(z * 1.6, viewW / 2) }, '+'));

      const labels = h('div.tl-labels');
      const canvas = h('div.tl-canvas');
      const view = h('div.tl-view', { tabindex: 0, 'aria-label': '時間軸，可用左右方向鍵移動、加減號縮放' }, canvas);
      const miniWin = h('div.win');
      const mini = h('div.tl-mini', { 'aria-hidden': 'true' }, miniWin);
      const frame = h('div.tl-frame', labels, view, mini);

      root.append(
        h('div.tl-tools', presetRow, h('div.spacer'), zoomBox),
        h('div.small.muted', '專題高亮：'), chips, topicNote,
        frame,
        h('div.tl-hint', '拖動可左右移動；按＋／−、雙指開合或 Ctrl＋滾輪可縮放。點事件看詳情。長度按真實年份比例繪畫；只有年份的事件放在該年年中。'),
        h('div.tl-legend', XH.tracks.map((t) => h('span', h('i', { style: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: t.color, marginRight: '5px' } }), t.name + (t.sub ? `（${t.sub}）` : ''))))
      );

      // 小地圖年份
      for (let y = 1894; y <= 1916; y += 2) {
        const f = (Date.UTC(y, 0, 1) - T0) / (T1 - T0);
        mini.append(h('span.yr', { style: { left: f * 100 + '%' } }, y));
      }

      const k = () => (viewW / spanDays) * z; // 每日像素
      const xOf = (t) => ((t - T0) / DAY) * k();
      const totalW = () => xOf(T1);
      const clampSx = () => { sx = Math.max(0, Math.min(sx, totalW() - viewW)); };

      function applyPan() {
        clampSx();
        canvas.style.transform = `translateX(${-sx}px)`;
        const tw = totalW();
        miniWin.style.left = (sx / tw) * 100 + '%';
        miniWin.style.width = Math.max(2, (viewW / tw) * 100) + '%';
        // 橫條標籤跟隨可見範圍左緣
        barEls.forEach((b) => {
          const lw = b.lbl.offsetWidth;
          const off = Math.max(0, Math.min(sx - b.x0 + 6, b.x1 - b.x0 - lw - 14));
          b.lbl.style.transform = off ? `translateX(${off}px)` : '';
        });
      }

      function zoomAt(nz, px) {
        nz = Math.max(1, Math.min(nz, 60));
        const t = T0 + ((sx + px) / k()) * DAY;
        z = nz;
        layout();
        sx = xOf(t) - px;
        applyPan();
      }
      function fitRange(a, b) {
        z = Math.max(1, Math.min(60, spanDays / ((b - a) / DAY)));
        layout();
        sx = xOf(a);
        applyPan();
      }
      function centerOn(t) { sx = xOf(t) - viewW / 2; applyPan(); }

      // ---- 版面 ----
      let selId = null;
      let barEls = [];
      function layout() {
        canvas.innerHTML = '';
        labels.innerHTML = '';
        barEls = [];
        const tw = totalW();
        const hi = topic ? topicIds(topic) : null;

        // 時間刻度
        const axis = h('div.tl-axis', { style: { width: tw + 'px' } });
        const pxYear = k() * 365.25;
        const reign = Object.fromEntries(XH.reigns.map((r) => [r.year, r.label]));
        let maxY = 0;
        for (let y = 1894; y <= 1917; y++) {
          const x = xOf(Date.UTC(y, 0, 1));
          if (x > tw) break;
          const step = pxYear < 34 ? 2 : 1;
          if (y % step) continue;
          axis.append(h('div.tl-tick', { style: { left: x + 'px' } }, h('b', y), pxYear > 90 && reign[y] ? h('div', reign[y]) : null));
          canvas.append(h('div.tl-grid', { style: { left: x + 'px' } }));
          if (pxYear > 150) {
            for (let m = 1; m < 12; m++) {
              const mx = xOf(Date.UTC(y, m, 1));
              axis.append(h('div.tl-tick.minor', { style: { left: mx + 'px' } }, pxYear > 520 ? h('span', { style: { position: 'relative', top: '-14px', fontSize: '10px' } }, m + 1 + '月') : null));
            }
          }
        }
        canvas.append(axis);

        // 各軌
        let top = AXIS_H;
        XH.tracks.forEach((tr) => {
          const evs = XH.events.filter((e) => e.track === tr.id);
          const bars = evs.filter((e) => e.bar).sort((a, b) => XH.U.parseDate(a.d) - XH.U.parseDate(b.d));
          const pts = evs.filter((e) => !e.bar).sort((a, b) => XH.U.parseDate(a.d) - XH.U.parseDate(b.d));
          const barRows = [], ptRows = [];
          const place = (rows, x0, x1) => {
            let r = rows.findIndex((end) => end + 6 <= x0);
            if (r < 0) { rows.push(x1); r = rows.length - 1; } else rows[r] = x1;
            return r;
          };
          const items = [];
          bars.forEach((e) => {
            const x0 = xOf(XH.U.parseDate(e.d)), x1 = xOf(XH.U.parseDate(e.end));
            const lw = 18 + e.t.length * 12.5;
            const narrow = x1 - x0 < lw;
            items.push({ e, bar: true, x0, x1, narrow, row: place(barRows, x0, narrow ? x1 + lw : x1) });
          });
          pts.forEach((e) => {
            const x = xOf(XH.U.parseDate(e.d)) - 6;
            const w = 26 + e.t.length * 13.2;
            items.push({ e, bar: false, x0: x, row: place(ptRows, x, x + w) });
          });
          const laneH = PAD * 2 + barRows.length * BAR_H + ptRows.length * PT_H;
          const lane = h('div.tl-lane', { style: { top: top + 'px', height: laneH + 'px', width: tw + 'px' } });
          canvas.append(lane);
          labels.append(h('div', { style: { top: top + 'px', height: laneH + 'px', color: tr.color } }, h('i', { style: { background: tr.color } }), h('span', tr.name, tr.sub ? h('div.small.muted', { style: { fontWeight: 400, fontSize: '11px' } }, tr.sub) : null)));

          items.forEach((it) => {
            const e = it.e;
            const cls = [hi ? (hi.has(e.id) ? 'hi' : 'dim') : '', selId === e.id ? 'sel' : ''].join(' ');
            let el;
            if (it.bar) {
              const y = top + PAD + it.row * BAR_H;
              el = h('button.tl-bar', { type: 'button', 'data-t': e.t, class: `tl-bar ${cls} ${e.fade && !it.narrow ? 'fade' : ''} ${e.openLeft ? 'open-left' : ''} ${it.narrow ? 'narrow' : ''}`, style: { left: it.x0 + 'px', top: y + 'px', width: Math.max(8, it.x1 - it.x0) + 'px', '--c': tr.color }, title: `${e.t}（${XH.U.evDate(e)}）` }, h('span.bl', e.t));
              if (!it.narrow) barEls.push({ lbl: el.firstChild, x0: it.x0, x1: it.x1 });
            } else {
              const y = top + PAD + barRows.length * BAR_H + it.row * PT_H;
              el = h('button.tl-item', { type: 'button', class: `tl-item ${cls}`, style: { left: it.x0 + 'px', top: y + 'px', '--c': tr.color } }, h('span.dot'), h('span.lbl', e.t));
            }
            el.dataset.id = e.id;
            el.addEventListener('click', (ev) => {
              if (moved) return;
              selId = e.id;
              canvas.querySelectorAll('.sel').forEach((n) => n.classList.remove('sel'));
              el.classList.add('sel');
              XH.U.openPop(el, XH.U.eventCard(e));
              ev.stopPropagation();
            });
            canvas.append(el);
          });
          top += laneH;
        });
        canvas.style.height = top + 'px';
        canvas.style.width = tw + 'px';
        view.style.height = top + 'px';
        frame.style.height = top + 22 + 'px';
      }

      // ---- 拖動與縮放 ----
      const ptrs = new Map();
      let moved = false, start = null, pinch = null;
      view.addEventListener('pointerdown', (e) => {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptrs.size === 1) { start = { x: e.clientX, sx }; moved = false; }
        if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z, mid: (a.x + b.x) / 2 - view.getBoundingClientRect().left };
        }
      });
      view.addEventListener('pointermove', (e) => {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          zoomAt(pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d), pinch.mid);
          moved = true;
          return;
        }
        if (start && Math.abs(e.clientX - start.x) > 5) {
          if (!moved) { moved = true; view.classList.add('drag'); try { view.setPointerCapture(e.pointerId); } catch (_) {} }
          sx = start.sx - (e.clientX - start.x);
          applyPan();
        }
      });
      const end = (e) => {
        ptrs.delete(e.pointerId);
        if (ptrs.size < 2) pinch = null;
        if (ptrs.size === 0) { start = null; view.classList.remove('drag'); setTimeout(() => (moved = false), 0); }
      };
      view.addEventListener('pointerup', end);
      view.addEventListener('pointercancel', end);
      view.addEventListener('wheel', (e) => {
        const px = e.clientX - view.getBoundingClientRect().left;
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(z * Math.exp(-e.deltaY * 0.01), px); }
        else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) { e.preventDefault(); sx += e.deltaX || e.deltaY; applyPan(); }
      }, { passive: false });
      view.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { sx += viewW * 0.2; applyPan(); }
        else if (e.key === 'ArrowLeft') { sx -= viewW * 0.2; applyPan(); }
        else if (e.key === '+' || e.key === '=') zoomAt(z * 1.4, viewW / 2);
        else if (e.key === '-') zoomAt(z / 1.4, viewW / 2);
        else return;
        e.preventDefault();
      });
      // 小地圖
      const miniGo = (e) => {
        const r = mini.getBoundingClientRect();
        sx = ((e.clientX - r.left) / r.width) * totalW() - viewW / 2;
        applyPan();
      };
      let miniDown = false;
      mini.addEventListener('pointerdown', (e) => { miniDown = true; mini.setPointerCapture(e.pointerId); miniGo(e); });
      mini.addEventListener('pointermove', (e) => miniDown && miniGo(e));
      mini.addEventListener('pointerup', () => (miniDown = false));

      // ---- 初始化 ----
      const measure = () => { viewW = view.clientWidth || frame.clientWidth - LABEL_W; };
      measure();
      setTopic(topic);
      if (opts.focus && XH.U.ev(opts.focus)) {
        const e = XH.U.ev(opts.focus);
        const t = XH.U.parseDate(e.d);
        fitRange(t - 400 * DAY, t + 400 * DAY);
        centerOn(t);
        selId = e.id;
        layout();
        applyPan();
        setTimeout(() => { const el = canvas.querySelector(`[data-id="${e.id}"]`); if (el) XH.U.openPop(el, XH.U.eventCard(e)); }, 60);
      } else if (viewW < 700) {
        fitRange(XH.U.parseDate('1910-06'), XH.U.parseDate('1913-06'));
      } else applyPan();

      const ro = new ResizeObserver(() => {
        const old = viewW;
        measure();
        if (Math.abs(old - viewW) > 2) { const c = (sx + old / 2) / (old * z); layout(); sx = c * viewW * z - viewW / 2; applyPan(); }
      });
      ro.observe(view);
      return { destroy: () => ro.disconnect() };
    },
  };
})();
