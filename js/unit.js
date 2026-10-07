/* 單元列表與單元詳情頁 */
(function () {
  const { h, md } = XH.U;

  XH.UnitView = {
    list(root) {
      root.append(h('div.page-head', h('div.eyebrow', '課本第1章'), h('h1', '單元'), h('p.lead', '按課本次序分為八個單元，每個單元都有基本資料、因果鏈、人物、事件、互動練習和隨堂小測。')));
      XH.sections.forEach((s) => {
        root.append(h('div.sec-title', h('h2', `${s.no}　${s.title}`), h('span.pg', s.pages)));
        root.append(h('p.muted', s.intro));
        root.append(h('div.inquiry', h('b', '探究問題'), h('span', s.inquiry)));
        const g = h('div.grid.c3');
        XH.units.filter((u) => u.sec === s.id).forEach((u) => g.append(unitCard(u)));
        root.append(g);
      });
    },

    detail(root, id, anchor) {
      const u = XH.U.unit(id);
      if (!u) { root.append(h('p', '找不到此單元。')); return; }
      const d = XH.unitData[id];
      const sec = XH.sections.find((s) => s.id === u.sec);
      const evs = (d && d.events ? d.events.map(XH.U.ev) : XH.events.filter((e) => e.unit === id)).sort((a, b) => XH.U.parseDate(a.d) - XH.U.parseDate(b.d));
      const idx = XH.units.indexOf(u);
      const prev = XH.units[idx - 1], next = XH.units[idx + 1];

      const head = h('header.u-head',
        h('div.crumb', h('a', { href: '#/units' }, '單元'), ` › ${sec.no} ${sec.title} › ${u.no}`),
        h('h1', u.title),
        h('div.row', h('span.tag.red', u.span), h('span.tag', `課本${u.pages}`), u.ready ? h('span.tag.blue', '已完成') : h('span.tag.gold', '第二階段補齊'),
          h('span.spacer'),
          h('a.btn.no-print', { href: `#/quiz/${id}` }, '測驗本單元'),
          h('button.btn.no-print', { type: 'button', onclick: () => print() }, '列印')),
      );

      const body = h('div.prose');
      body.append(h('div.inquiry', h('b', sec.no + '探究問題'), h('span', sec.inquiry)));

      if (!d) {
        body.append(h('p.lead', '這個單元會在第二階段補齊。以下先列出時間軸上屬於本單元的事件（全部取自課本）。'));
        body.append(section('events', '重要事件', eventsList(evs)));
        root.append(h('div.wrap.narrow', head, body, navPrevNext(prev, next)));
        return;
      }

      body.append(h('p.lead', d.lead));
      const toc = [];
      const add = (sid, title, ...content) => { toc.push([sid, title]); body.append(section(sid, title, ...content)); };

      add('basics', '基本資料', h('table.basics', h('tbody', d.basics.map(([k, v]) => h('tr', h('th', k), h('td', v))))));
      add('chain', '起因、經過與結果', chainView(d.chain));
      d.sections.forEach((s) => {
        const box = h('div', { html: md(s.html) });
        if (s.widget && Widgets[s.widget]) box.append(Widgets[s.widget]());
        if (s.map) box.append(mapEmbed(s.map));
        toc.push([s.id, s.h]);
        body.append(h(`section.u-sec#s-${s.id}`, h('h2', s.h, h('span.pg', { style: { fontFamily: 'var(--sans)', fontWeight: 400 } }, `第${s.pg}頁`)), box));
      });
      if (d.quotes && d.quotes.length) add('quotes', '課文引文', d.quotes.map((q) => [h('blockquote.quote', q.text), h('div.quote-src', `── ${q.src}（課本第${q.pg}頁）`, q.note ? h('div', q.note) : null)]));
      add('people', '關鍵人物', h('p.small.muted.no-print', '點卡片翻面，看人物在本單元的歷史重要性。'), peopleView(d.people));
      add('events', '重要事件（按年份）', eventsList(evs));
      add('bridge', '承上啟下', bridgeView(d.bridge));
      if (d.check && d.check.length) {
        const qs = d.check.map((qid) => XH.quiz.find((q) => q.id === qid)).filter(Boolean);
        add('check', '隨堂小測', h('div.u-quiz', qs.map((q) => XH.Quiz.renderQ(q, { inline: true }))), h('p', h('a.btn.no-print', { href: `#/quiz/${id}` }, '做完整的單元測驗 →')));
      }

      const tocEl = h('nav.toc', h('div.toc-title', '本單元'), toc.map(([sid, t]) => h('a', { href: `#/unit/${id}/${sid}`, 'data-s': sid }, t)));
      root.append(h('div.wrap', h('div.unit-layout', tocEl, h('div', head, body, navPrevNext(prev, next)))));
      if (anchor) XH.UnitView.jump(anchor, true);
    },

    jump(anchor, first) {
      setTimeout(() => {
        const el = document.getElementById('s-' + anchor) || document.getElementById('e-' + anchor);
        if (!el) return;
        el.scrollIntoView({ behavior: first ? 'auto' : 'smooth', block: 'start' });
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      }, first ? 200 : 60);
    },
  };

  function unitCard(u) {
    return h('a.card.unit-card', { href: `#/unit/${u.id}`, class: `card unit-card ${u.ready ? '' : 'locked'}` },
      h('span.no', u.no),
      h('h3', u.title),
      h('span.span', `${u.span}｜課本${u.pages}`),
      u.ready ? null : h('span.tag.gold.soon', '第二階段'));
  }
  XH.UnitView.card = unitCard;

  function section(sid, title, ...content) {
    return h(`section.u-sec#s-${sid}`, h('h2', title), ...content);
  }

  function navPrevNext(prev, next) {
    return h('div.row.no-print', { style: { marginTop: '30px' } },
      prev ? h('a.btn', { href: `#/unit/${prev.id}` }, `← ${prev.title}`) : null,
      h('span.spacer'),
      next ? h('a.btn', { href: `#/unit/${next.id}` }, `${next.title} →`) : null);
  }

  function eventsList(evs) {
    return h('ul.events', evs.map((e) => h(`li#e-${e.id}`, h('span.d', XH.U.evDate(e)),
      h('div', h('b', e.t), h('div', e.x), h('div.row', { style: { gap: '12px' } }, h('span.pg', `課本第${e.pg}頁`), h('a.small.no-print', { href: `#/timeline/${e.id}` }, '在時間軸上看'))))));
  }

  // 因果鏈：可逐步揭示，用作自我測試
  function chainView(chain) {
    const ol = h('ol.chain');
    const lis = chain.map((c) => {
      const li = h('li', { class: { cause: 'cause', proc: 'proc', result: 'result' }[c.k] },
        h('span.kk', { cause: '起因', proc: '經過', result: '結果' }[c.k]),
        h('span.body', { html: md(c.t) }),
        h('span.why', `課本第${c.pg}頁`));
      li.addEventListener('click', (e) => { if (li.classList.contains('hidden-step')) { e.preventDefault(); li.classList.remove('hidden-step'); } });
      ol.append(li);
      return li;
    });
    const btnHide = h('button.btn', { type: 'button', onclick: () => lis.forEach((li, i) => li.classList.toggle('hidden-step', i > 0)) }, '遮住，自己推想下一步');
    const btnShow = h('button.btn.ghost', { type: 'button', onclick: () => lis.forEach((li) => li.classList.remove('hidden-step')) }, '全部顯示');
    return [h('p.small.muted.no-print', '先想一想「為甚麼會發生下一步」，再點模糊的一步揭曉。'), ol, h('div.row.chain-ctl', btnHide, btnShow)];
  }

  function peopleView(ids) {
    return h('div.people', ids.map((pid) => {
      const p = XH.people[pid];
      if (!p) return null;
      const card = h('button.pcard', { type: 'button', 'aria-label': `${p.name}：翻面` },
        h('div.in',
          h('div.f', h('div.row', h('div.avatar', { style: { '--av': p.color } }, p.name[0]), h('div', h('div.nm', p.name), p.yin ? h('div.small.muted', p.yin) : null)), h('div.rl', p.role), h('div.hint', '點擊翻面 ↻')),
          h('div.b', h('b', p.name), h('ul', { style: { paddingLeft: '1.1em', margin: '6px 0 0' } }, p.facts.map(([t, pg]) => h('li', t, h('span.pg', ` 〔第${pg}頁〕`)))))));
      card.addEventListener('click', () => card.classList.toggle('flip'));
      return card;
    }));
  }

  function bridgeView(b) {
    const box = (x) => h('div.card', h('h4', x.h), h('div', { html: md(x.html) }), x.unit ? h('a.small.no-print', { href: `#/unit/${x.unit}` }, `前往：${XH.U.unit(x.unit).title} →`) : null);
    return h('div.bridge', box(b.from), h('div.arrow', '→'), box(b.to));
  }

  function mapEmbed(mid) {
    const m = XH.maps.find((x) => x.id === mid);
    const box = h('div.card', { style: { padding: '10px', margin: '10px 0 0' } });
    box.append(XH.MapView.svg(m, { compact: true }));
    box.append(h('div.row', { style: { marginTop: '6px' } }, h('span.small.muted', `${m.title}（${m.year}）── 方格示意，${m.basis}，約略範圍`), h('span.spacer'), h('a.btn.no-print', { href: `#/map/${m.id}` }, '打開地圖練習 →')));
    return box;
  }

  /* ========== 互動小部件 ========== */
  const Widgets = {
    // 革命團體比較＋快問快答
    groupCompare() {
      const G = XH.games.groups;
      const fields = [['year', '創立年份'], ['place', '創立地點'], ['head', '會長'], ['members', '主要成員'], ['slogan', '綱領']];
      let focus = null;
      const grid = h('div.grid.c2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' } });
      const draw = () => {
        grid.innerHTML = '';
        G.slice(0, 3).concat(G[3]).forEach((g, i) => {
          grid.append(h('div.card', { style: { borderTop: `5px solid ${g.color}`, gridColumn: i === 3 ? '1 / -1' : null, padding: '14px 16px' } },
            h('h4', { style: { fontSize: '19px', margin: '0 0 6px' } }, i === 3 ? '↓ 1905年部分成員聯合 → ' + g.name : g.name),
            fields.map(([k, l]) => h('div', { style: { padding: '3px 6px', borderRadius: '6px', background: focus === k ? 'var(--gold-soft)' : null, opacity: focus && focus !== k ? 0.35 : 1, fontSize: '15px' } }, h('span.muted', l + '：'), g[k]))));
        });
      };
      const chips = h('div.chips', { style: { margin: '6px 0 12px' } }, h('span.small.muted', '只看：'), fields.map(([k, l]) => h('button.chip', { type: 'button', onclick: (e) => { focus = focus === k ? null : k; chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on')); if (focus) e.currentTarget.classList.add('on'); draw(); } }, l)));
      draw();

      // 快問快答
      const qa = h('div.card', { style: { marginTop: '14px', background: 'var(--bg-2)' } });
      let score = 0, n = 0;
      const ask = () => {
        qa.innerHTML = '';
        if (n >= 6) {
          qa.append(h('b', `快問快答完成：${score} / 6`), ' ', h('button.btn', { type: 'button', onclick: () => { score = 0; n = 0; ask(); } }, '再玩一次'));
          if (score === 6) XH.U.cheer(qa);
          return;
        }
        const g = G[Math.floor(Math.random() * 4)];
        const [k, l] = fields[Math.floor(Math.random() * fields.length)];
        const clash = G.filter((x) => x[k] === g[k]).length > 1;
        if (clash) return ask();
        qa.append(h('div.small.muted', `快問快答 ${n + 1} / 6`), h('div', { style: { fontWeight: 600, margin: '4px 0 10px' } }, `${l}是「${g[k]}」的是哪一個團體？`));
        const row = h('div.row');
        G.forEach((x) => row.append(h('button.btn', { type: 'button', onclick: (e) => {
          n++;
          if (x === g) { score++; e.currentTarget.style.background = 'var(--green-soft)'; XH.U.toast('答對了！'); }
          else { e.currentTarget.style.background = 'var(--bad-soft)'; XH.U.toast(`答案是${g.name}`); }
          row.querySelectorAll('button').forEach((b) => (b.disabled = true));
          setTimeout(ask, 900);
        } }, x.name)));
        qa.append(row);
      };
      ask();
      return h('div', chips, grid, qa);
    },

    // 興中會與同盟會綱領比較
    sloganDiff() {
      const box = h('div.card', { style: { marginTop: '10px' } });
      const a = ['驅除韃虜', '恢復中華', '創立合眾政府'], b = ['驅除韃虜', '恢復中華', '創立民國', '平均地權'];
      const line = (arr, other, tag) => h('div', { style: { margin: '6px 0', fontSize: '18px', fontFamily: 'var(--serif)' } }, h('span.tag', { style: { marginRight: '8px' } }, tag),
        arr.map((w, i) => h('span', { 'data-w': other.includes(w) ? 'same' : 'diff', style: { padding: '1px 4px', borderRadius: '5px', transition: '.3s' } }, w, i < arr.length - 1 ? '，' : '')));
      const l1 = line(a, b, '興中會 1894'), l2 = line(b, a, '同盟會 1905');
      const btn = h('button.btn', { type: 'button', onclick: () => {
        l1.querySelectorAll('[data-w=diff]').forEach((s) => { s.style.textDecoration = 'line-through'; s.style.background = 'var(--bad-soft)'; });
        l2.querySelectorAll('[data-w=diff]').forEach((s) => { s.style.background = 'var(--green-soft)'; s.style.fontWeight = 700; });
        msg.hidden = false;
      } }, '比較兩個綱領有甚麼不同');
      const msg = h('p.small', { hidden: true, style: { marginTop: '8px' } }, '保留「驅除韃虜，恢復中華」；「創立合眾政府」變成「創立民國」；新增「平均地權」。（韃音撻）');
      box.append(h('div.small.muted', '想一想：同盟會的綱領由興中會發展而來，改了甚麼？'), l1, l2, btn, msg);
      return box;
    },

    // 三民主義
    sanmin() {
      const wrap = h('div');
      const cols = h('div.grid.c3', { style: { margin: '10px 0' } });
      XH.games.sanmin.forEach((s, i) => {
        const body = h('p', { hidden: true, style: { margin: '8px 0 0', fontSize: '15.5px' } }, s.body);
        const c = h('button.card', { type: 'button', style: { textAlign: 'left', cursor: 'pointer', borderTop: `5px solid ${['#b23a2a', '#2e4b7d', '#2f7a4f'][i]}` }, onclick: () => { body.hidden = !body.hidden; } },
          h('div', { style: { fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700 } }, s.name), h('div.small.muted', '點擊展開'), body);
        cols.append(c);
      });
      wrap.append(cols, h('div.note.blue', h('b', '實現途徑：'), XH.games.sanminWay),
        h('p', { style: { marginTop: '10px' } }, h('a.btn', { href: '#/play/sanmin' }, '玩「三民主義分類」→')));
      return wrap;
    },

    // 十八星旗
    flag18() {
      const ns = 'http://www.w3.org/2000/svg';
      const S = (tag, attrs) => { const e = document.createElementNS(ns, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      const svg = S('svg', { viewBox: '0 0 300 200', role: 'img', 'aria-label': '十八星旗示意圖' });
      const bg = S('rect', { x: 0, y: 0, width: 300, height: 200, fill: '#c8102e', class: 'flag-part' });
      const cx = 150, cy = 100, R = 82, r = 24;
      let d = '';
      for (let i = 0; i < 18; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 9;
        const rad = i % 2 === 0 ? R : r;
        d += (i ? 'L' : 'M') + (cx + rad * Math.cos(ang)).toFixed(1) + ',' + (cy + rad * Math.sin(ang)).toFixed(1);
      }
      const star = S('path', { d: d + 'Z', fill: '#111', class: 'flag-part' });
      const dots = S('g', { class: 'flag-part' });
      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 9;
        dots.append(S('circle', { cx: cx + (R - 6) * Math.cos(ang), cy: cy + (R - 6) * Math.sin(ang), r: 6.5, fill: '#f5c400' }));
        dots.append(S('circle', { cx: cx + 13 * Math.cos(ang + Math.PI / 9), cy: cy + 13 * Math.sin(ang + Math.PI / 9), r: 4, fill: '#f5c400' }));
      }
      svg.append(bg, star, dots);
      const info = h('div', h('div.small.muted', '點旗上不同部分：紅色底、黑色錐角、黃星'), h('p#flag-msg', { style: { fontSize: '17px', minHeight: '3.4em', margin: '8px 0' } }, XH.games.flag.origin));
      const counter = h('div.small');
      const say = (part, t) => {
        [bg, star, dots].forEach((p) => p.classList.toggle('glow', p === part));
        info.querySelector('#flag-msg').textContent = t;
      };
      bg.addEventListener('click', () => say(bg, XH.games.flag.red));
      star.addEventListener('click', (e) => { e.stopPropagation(); say(star, XH.games.flag.black); });
      dots.addEventListener('click', (e) => {
        e.stopPropagation();
        say(dots, XH.games.flag.stars);
        const cs = [...dots.children];
        cs.forEach((c) => c.setAttribute('opacity', 0.15));
        cs.forEach((c, i) => setTimeout(() => { c.setAttribute('opacity', 1); counter.textContent = `數一數：${i + 1} 顆`; }, 90 * (i + 1)));
      });
      return h('div.flagbox', { style: { margin: '12px 0' } }, svg, h('div', info, counter));
    },

    // 六格漫畫排序
    comic6() {
      const C = XH.games.comic;
      const wrap = h('div');
      const run = () => {
        wrap.innerHTML = '';
        const order = XH.U.shuffleNew(C.map((_, i) => i));
        const picked = [];
        const list = h('div.order-list');
        const items = order.map((ci) => {
          const b = h('button.order-item', { type: 'button' }, h('span.num', ''), h('span', { style: { fontSize: '22px' } }, C[ci].icon), h('span', C[ci].t));
          b.addEventListener('click', () => {
            if (b.classList.contains('ok')) return;
            const at = picked.indexOf(ci);
            if (at >= 0) { picked.splice(at, 1); } else picked.push(ci);
            items.forEach((it, k) => { const p = picked.indexOf(order[k]); it.classList.toggle('picked', p >= 0); it.querySelector('.num').textContent = p >= 0 ? p + 1 : ''; });
            if (picked.length === C.length) check();
          });
          list.append(b);
          return b;
        });
        const check = () => {
          let ok = 0;
          items.forEach((it, k) => { const right = picked.indexOf(order[k]) === order[k]; it.classList.add(right ? 'ok' : 'no'); if (right) ok++; else it.append(h('span.ans', `應為第${order[k] + 1}格`)); });
          fb.innerHTML = '';
          fb.append(h('div', { class: 'fb ' + (ok === C.length ? 'ok' : 'no') }, ok === C.length ? '全對！六格的次序就是辛亥革命的經過。' : `排對了 ${ok} 格。看看提示，再試一次。`), h('button.btn', { type: 'button', style: { marginTop: '8px' }, onclick: run }, '再玩一次'));
          if (ok === C.length) XH.U.cheer(fb);
        };
        const fb = h('div', { style: { marginTop: '10px' } });
        wrap.append(h('div.small.muted', { style: { marginBottom: '8px' } }, '再點一次可取消選擇。'), list, fb);
      };
      run();
      return wrap;
    },

    // 袁世凱稱帝的歷程（第24頁）
    stairs() {
      return XH.Games.stairsWidget();
    },
  };
  XH.UnitView.Widgets = Widgets;
})();
