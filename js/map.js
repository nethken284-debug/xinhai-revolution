/* 方格示意地圖 */
(function () {
  const { h } = XH.U;
  const NS = 'http://www.w3.org/2000/svg';
  const CW = 110, CH = 84;
  const S = (tag, attrs, ...kids) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    kids.forEach((c) => c != null && e.append(c));
    return e;
  };
  const P = (pt) => {
    if (Array.isArray(pt) && typeof pt[0] === 'string') pt = XH.mapBase.cities[pt[0]];
    else if (typeof pt === 'string') pt = XH.mapBase.cities[pt];
    else if (Array.isArray(pt)) pt = { x: pt[0], y: pt[1] };
    return [pt.x * CW, pt.y * CH];
  };
  // 平滑曲線（Catmull-Rom 轉 Bézier）
  const smooth = (pts) => {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  };

  XH.MapView = {
    /* opts: compact, mode: 'view' | 'tiles' | 'find', onTile(name, g), onMarker(mk, g), hideOn */
    svg(m, opts) {
      opts = opts || {};
      const v = m.view || { x: -0.15, y: -0.15, w: 7.3, h: 7.75 };
      const svg = S('svg', { viewBox: `${v.x * CW} ${v.y * CH} ${v.w * CW} ${v.h * CH}`, role: 'img', 'aria-label': `${m.title}（${m.year}）方格示意圖` });
      svg.append(S('defs', {}, S('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, S('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#d9a514' }))));
      svg.append(S('rect', { x: v.x * CW, y: v.y * CH, width: v.w * CW, height: v.h * CH, fill: 'var(--sea)' }));

      const on = new Set(opts.hideOn ? [] : m.on || []);
      const tiles = S('g');
      XH.mapBase.tiles.forEach((t) => {
        const isOn = on.has(t.n);
        const g = S('g', { class: `tile ${isOn ? 'on' : ''} ${t.foreign ? 'foreign' : ''} ${opts.mode === 'tiles' && !t.foreign && !t.small ? 'click' : ''}`, 'data-n': t.n });
        g.append(S('rect', { x: t.x * CW + 3, y: t.y * CH + 3, width: t.w * CW - 6, height: t.h * CH - 6, rx: 9 }));
        const label = t.label || t.n;
        const fs = t.small || t.foreign ? 11 : label.length > 3 ? 14 : 15;
        g.append(S('text', { x: (t.x + t.w / 2) * CW, y: t.small || t.foreign ? (t.y + t.h / 2) * CH + 4 : t.y * CH + 27, 'text-anchor': 'middle', style: `font-size:${fs}px` }, label));
        if (opts.mode === 'tiles' && !t.foreign && !t.small) {
          g.setAttribute('tabindex', 0);
          g.setAttribute('role', 'button');
          g.setAttribute('aria-label', t.n);
          const act = () => opts.onTile && opts.onTile(t.n, g);
          g.addEventListener('click', act);
          g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
        }
        tiles.append(g);
      });
      svg.append(tiles);

      // 鐵路
      (m.rails || []).forEach((r) => {
        const d = smooth(r.pts.map(P));
        svg.append(S('path', { d, class: 'rail', stroke: r.color }), S('path', { d, class: 'rail-ties' }));
        const mid = P(r.pts[1]);
        svg.append(S('text', { x: mid[0] + 8, y: mid[1] - 10, style: `font-size:13px;font-weight:700;fill:${r.color};paint-order:stroke;stroke:var(--card);stroke-width:3px` }, r.name));
      });
      // 進攻路線
      (m.routes || []).forEach(([a, b]) => {
        const [x1, y1] = P(a), [x2, y2] = P(b);
        const mx = (x1 + x2) / 2 - (y2 - y1) * 0.12, my = (y1 + y2) / 2 + (x2 - x1) * 0.12;
        svg.append(S('path', { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, class: 'route' }));
      });
      // 城市
      const cityNames = new Set(m.cities || []);
      Object.entries(XH.mapBase.cities).forEach(([n, c]) => {
        if (!cityNames.has(n) && !c.foreign) return;
        const [x, y] = P(n);
        const g = S('g', { class: `city ${c.cap ? 'cap' : ''}` });
        if (c.foreign) {
          g.append(S('text', { x, y, 'text-anchor': c.anchor || 'middle', style: 'font-size:10.5px;fill:var(--muted)' }, `${n}（${c.foreign}）`));
        } else {
          g.append(S('circle', { cx: x, cy: y, r: c.cap ? 6 : 4.5 }));
          g.append(S('text', { x: x + 7, y: y + 4 }, n));
        }
        svg.append(g);
      });
      // 起義標記
      (m.markers || []).forEach((mk) => {
        const [x, y] = P([mk.at.x, mk.at.y]);
        const g = S('g', { class: `mk ${mk.who}`, tabindex: 0, role: 'button', 'aria-label': opts.mode === 'find' ? '起義地點' : XH.U.ev(mk.ev).t, 'data-n': mk.n });
        g.append(S('circle', { cx: x, cy: y, r: 11 }));
        if (opts.mode !== 'find') g.append(S('text', { x, y: y + 4, 'text-anchor': 'middle' }, mk.n));
        const act = () => (opts.onMarker ? opts.onMarker(mk, g) : XH.U.openPop(g.getBoundingClientRect(), XH.U.eventCard(XH.U.ev(mk.ev))));
        g.addEventListener('click', act);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter') act(); });
        svg.append(g);
      });
      // 圖上註記
      (m.notes || []).forEach((nt, i) => {
        if (opts.compact && opts.noNotes) return;
        const c = XH.mapBase.cities[nt.at];
        const t = c ? c : XH.mapBase.tiles.find((x) => x.n === nt.at);
        const [x, y] = c ? P(nt.at) : [(t.x + 0.82) * CW, (t.y + 0.2) * CH];
        const g = S('g', { class: 'mk', tabindex: 0, role: 'button', 'aria-label': nt.t });
        g.append(S('circle', { cx: x + 14, cy: y - 14, r: 10, fill: 'var(--indigo)' }), S('text', { x: x + 14, y: y - 10, 'text-anchor': 'middle' }, '！'));
        g.addEventListener('click', () => XH.U.openPop(g.getBoundingClientRect(), h('p', { style: { margin: 0 } }, nt.t)));
        svg.append(g);
      });
      return svg;
    },

    page(root, id) {
      const maps = XH.maps;
      let m = maps.find((x) => x.id === id) || maps[2];
      const idx = maps.indexOf(m);

      root.append(h('div.page-head', h('div.eyebrow', '疆域與形勢'), h('h1', '地圖'),
        h('p.lead', '課本五幅地圖，改繪成方格示意圖：每格代表一個省份，只表示大致方位，不代表實際面積和邊界。')));

      const tabs = h('div.chips', { style: { marginBottom: '12px' } }, maps.map((x) => h('a.chip', { href: `#/map/${x.id}`, class: `chip ${x === m ? 'on' : ''}` }, `${x.year}　${x.title}`)));
      root.append(tabs);

      const mapBox = h('div.map-box');
      const side = h('div.map-side');
      root.append(h('div.map-layout', h('div', h('h2', { style: { margin: '0 0 8px', fontSize: '21px' } }, `${m.title}（${m.year}）`), mapBox,
        h('div.small.muted', { style: { marginTop: '6px' } }, `方格示意圖：約略範圍，${m.basis}｜每格代表一省，只表示大致方位，不代表實際面積和邊界｜課本第${m.pg}頁`),
        h('div.row', { style: { marginTop: '10px' } },
        idx > 0 ? h('a.btn', { href: `#/map/${maps[idx - 1].id}` }, `← ${maps[idx - 1].year}`) : null,
        h('span.spacer'),
        idx < maps.length - 1 ? h('a.btn', { href: `#/map/${maps[idx + 1].id}` }, `${maps[idx + 1].year} →`) : null)), side));

      const draw = (opts) => {
        mapBox.innerHTML = '';
        mapBox.append(XH.MapView.svg(m, opts));
      };
      draw({});

      // 圖例
      const lg = h('div.card', h('h3', '圖例'));
      if (m.on) lg.append(h('div.legend-row', h('span.legend-sw.on'), '宣布獨立的省份'));
      lg.append(h('div.legend-row', h('span.legend-sw'), '其他省份'));
      lg.append(h('div.legend-row', h('span', { style: { width: '18px', textAlign: 'center', color: 'var(--gold)' } }, '●'), '國都（北京）'));
      (m.legend || []).forEach(([cls, t]) => lg.append(h('div.legend-row', h('span', { style: { width: '18px', height: '18px', borderRadius: '50%', background: cls === 'mk-xing' ? '#c0392b' : '#2f7a4f', display: 'inline-block' } }), t)));
      (m.rails || []).forEach((r) => lg.append(h('div.legend-row', h('span', { style: { width: '18px', height: '5px', background: r.color, display: 'inline-block' } }), r.name)));
      if (m.routes) lg.append(h('div.legend-row', h('span', { style: { color: '#d9a514', fontWeight: 700 } }, '➜'), '護國軍進攻路線'));
      if (m.notes) lg.append(h('div.legend-row', h('span', { style: { color: 'var(--indigo)', fontWeight: 700 } }, '！'), '點擊看圖上註記'));
      side.append(lg);

      // 讀圖重點
      side.append(h('div.card', h('h3', '讀圖重點'), h('ul', { style: { paddingLeft: '1.1em', margin: 0 } }, m.points.map((p) => h('li', p))),
        m.notes ? h('div', { style: { marginTop: '8px' } }, h('b.small', '圖上註記'), h('ul.small', { style: { paddingLeft: '1.1em', margin: '4px 0 0' } }, m.notes.map((n) => h('li', n.t)))) : null,
        h('p.small', { style: { marginTop: '8px' } }, h('a', { href: `#/unit/${m.unit}` }, `相關單元：${XH.U.unit(m.unit).title}${XH.U.unit(m.unit).ready ? '' : '（第二階段）'}`))));

      // 挑戰
      const ch = h('div.card', h('h3', '地圖挑戰'));
      const status = h('div', { style: { marginTop: '10px' } });
      (m.challenges || []).forEach((c) => ch.append(h('button.btn', { type: 'button', style: { width: '100%', marginTop: '6px', justifyContent: 'flex-start', textAlign: 'left' }, onclick: () => startChallenge(c) }, '▶ ' + c.q)));
      ch.append(status);
      side.append(ch);

      // 比較
      const indeps = maps.filter((x) => x.indep);
      if (m.indep) {
        side.append(h('div.card', h('h3', '比較三次宣布獨立'), h('p.small.muted', '把三幅「宣布獨立」地圖並排，看看範圍有何不同。'),
          h('button.btn', { type: 'button', onclick: () => compare() }, '並排比較')));
      }
      const cmpBox = h('div', { style: { marginTop: '18px' } });
      root.append(cmpBox);
      function compare() {
        cmpBox.innerHTML = '';
        cmpBox.append(h('h2', '並排比較：三次宣布獨立'), h('div.compare', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' } }, indeps.map((x) =>
          h('div.card', { style: { padding: '8px' } }, h('div', { style: { fontWeight: 700, fontFamily: 'var(--serif)' } }, `${x.year} ${x.title}`), XH.MapView.svg(x, { compact: true, noNotes: true }),
            h('div.small', `宣布獨立：${x.on.filter((n) => n !== '海南島').length} 省`)))));
        cmpBox.scrollIntoView({ behavior: 'smooth' });
      }

      function startChallenge(c) {
        status.innerHTML = '';
        if (c.type === 'tiles') {
          const picked = new Set();
          draw({ mode: 'tiles', hideOn: true, onTile: (n, g) => { if (done) return; picked.has(n) ? picked.delete(n) : picked.add(n); g.classList.toggle('pick'); cnt.textContent = `已選 ${picked.size} 個`; } });
          let done = false;
          const cnt = h('span.small.muted', '已選 0 個');
          const chk = h('button.btn.primary', { type: 'button', onclick: () => {
            done = true;
            const ans = new Set(c.answer);
            let right = 0, wrong = 0;
            mapBox.querySelectorAll('.tile').forEach((g) => {
              const n = g.dataset.n;
              g.classList.remove('pick');
              if (picked.has(n) && ans.has(n)) { g.classList.add('right'); right++; }
              else if (picked.has(n)) { g.classList.add('wrong'); wrong++; }
              else if (ans.has(n)) g.classList.add('miss');
            });
            const perfect = right === ans.size && wrong === 0;
            status.innerHTML = '';
            status.append(h('div', { class: 'fb ' + (perfect ? 'ok' : 'no') }, h('b.t', perfect ? '全對！' : `答對 ${right} / ${ans.size}，選錯 ${wrong} 個`),
              perfect ? '' : '綠色＝答對；紅色＝不應選；虛線紅框＝漏選。', h('div.small', `答案：${c.answer.join('、')}`)),
              h('div.row', { style: { marginTop: '8px' } }, h('button.btn', { type: 'button', onclick: () => startChallenge(c) }, '再試一次'), h('button.btn.ghost', { type: 'button', onclick: () => { draw({}); status.innerHTML = ''; } }, '返回原圖')));
            if (perfect) XH.U.cheer(status);
          } }, '檢查答案');
          status.append(h('div.note.blue', c.q), h('div.row', { style: { marginTop: '8px' } }, chk, cnt));
        } else if (c.type === 'order') {
          const seq = m.markers.slice().sort((a, b) => a.n - b.n);
          let i = 0, score = 0;
          const prompt = h('div.note.blue');
          const showPrompt = () => {
            if (i >= seq.length) {
              prompt.innerHTML = '';
              prompt.append(h('b', `完成！一次就找對 ${score} / ${seq.length} 個。`));
              draw({});
              status.append(h('button.btn', { type: 'button', style: { marginTop: '8px' }, onclick: () => startChallenge(c) }, '再玩一次'));
              if (score >= 10) XH.U.cheer(status);
              return;
            }
            const e = XH.U.ev(seq[i].ev);
            prompt.innerHTML = `第 ${i + 1} / ${seq.length} 次：<b>${e.t.replace(/^[①-⑫]\s*/, '')}</b>（${XH.U.fmtDate(e.d)}，${seq[i].who === 'xing' ? '興中會' : '同盟會'}發動）── 在地圖上點出它的位置`;
          };
          let tries = 0;
          draw({ mode: 'find', onMarker: (mk, g) => {
            if (i >= seq.length || g.classList.contains('done')) return;
            if (mk.n === seq[i].n) {
              if (tries === 0) score++;
              tries = 0;
              g.classList.add('done');
              g.append(S('text', { x: g.querySelector('circle').getAttribute('cx'), y: +g.querySelector('circle').getAttribute('cy') + 4, 'text-anchor': 'middle' }, mk.n));
              i++;
              showPrompt();
            } else {
              tries++;
              XH.U.toast('不是這裏，再找找看');
              const c0 = g.querySelector('circle');
              c0.style.fill = 'var(--bad)';
              setTimeout(() => (c0.style.fill = ''), 500);
            }
          } });
          status.append(prompt);
          showPrompt();
        }
      }
    },
  };
})();
