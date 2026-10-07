/* 互動練習 */
(function () {
  const { h } = XH.U;

  const LIST = [
    { id: 'sanmin', icon: '🧩', title: '三民主義分類', d: '把九句主張放進民族、民權、民生三個籃子。', unit: 'u2' },
    { id: 'groups', icon: '🔗', title: '革命團體配對', d: '綱領、地點、會長……配對到正確的團體。', unit: 'u2' },
    { id: 'comic', icon: '🎞️', title: '六格漫畫排序', d: '把課本第13頁的六格圖解排回正確次序。', unit: 'u4' },
    { id: 'flag', icon: '🚩', title: '拆解十八星旗', d: '紅、黑、黃各代表甚麼？', unit: 'u4' },
    { id: 'stairs', icon: '🪜', title: '袁世凱稱帝階梯', d: '把每一步放回1912–1916年的正確位置。', unit: 'u8' },
    { id: 'who', icon: '🎭', title: '人物配對', d: '誰做了甚麼？配對人物與事跡。' },
    { id: 'quick', icon: '⏱️', title: '時間快排', d: '隨機抽四件事，按先後排列。越快越好！' },
    { id: 'reign', icon: '📅', title: '年號換算', d: '光緒、宣統、民國紀年與公元對照（只用課本標注的年份）。' },
    { id: 'map', icon: '🗺️', title: '地圖挑戰', d: '點出宣布獨立的省份、找出起義地點。', href: '#/map/m1911' },
  ];

  XH.Games = {
    hub(root) {
      root.append(h('div.page-head', h('div.eyebrow', '邊玩邊記'), h('h1', '互動練習'), h('p.lead', '每個練習都只用課本內容。答錯沒關係，多玩幾次就記得。')));
      root.append(h('div.grid.c2', LIST.map((g) => h('a.card.game-card', { href: g.href || `#/play/${g.id}` },
        h('span.ico', g.icon), h('div', h('h3', { style: { margin: 0 } }, g.title), h('p.small.muted', { style: { margin: '4px 0 0' } }, g.d))))));
    },

    play(root, id) {
      const g = LIST.find((x) => x.id === id);
      if (!g) { root.append(h('p', '找不到此練習。')); return; }
      root.append(h('div.page-head', h('div.eyebrow', h('a', { href: '#/play', style: { color: 'inherit' } }, '互動練習'), ' › ', g.icon), h('h1', g.title), h('p.lead', g.d)));
      const box = h('div.card');
      root.append(box);
      const W = XH.UnitView.Widgets;
      ({
        sanmin: () => box.append(sortGame(XH.games.sanmin.map((s) => ({ id: s.id, name: s.name })), XH.games.sanminSort)),
        groups: () => box.append(groupMatch()),
        comic: () => box.append(W.comic6()),
        flag: () => box.append(W.flag18()),
        stairs: () => box.append(XH.Games.stairsWidget()),
        who: () => box.append(matchGame(XH.games.whoDid.map((x) => ({ l: x.p, r: x.t })), 5, '人物', '事跡')),
        quick: () => box.append(quickOrder()),
        reign: () => box.append(reignGame()),
      })[id]();
      if (g.unit) root.append(h('p', { style: { marginTop: '16px' } }, h('a', { href: `#/unit/${g.unit}` }, `溫習相關單元：${XH.U.unit(g.unit).title} →`)));
    },

    // 第24頁：袁世凱稱帝的歷程
    stairsWidget() {
      const wrap = h('div');
      const run = () => {
        wrap.innerHTML = '';
        const all = [];
        XH.games.stairs.forEach((s) => s.items.forEach((t) => all.push({ t, y: s.y })));
        let sel = null, miss = 0, left = all.length;
        const pool = h('div.pool');
        const slots = {};
        const stairs = h('div.stairs', XH.games.stairs.map((s, i) => {
          const slot = h('div.slot', { role: 'button', tabindex: 0, style: { marginLeft: i * 4 + '%' } }, h('div.small.muted', `（${s.items.length} 項）`));
          slots[s.y] = slot;
          const drop = () => {
            if (!sel) { XH.U.toast('先點選下面一張卡'); return; }
            if (sel.d.y === s.y) {
              slot.querySelector('.small') && slot.querySelector('.small').remove();
              sel.el.classList.remove('sel');
              sel.el.classList.add('ok');
              sel.el.disabled = true;
              slot.append(sel.el);
              slot.classList.add('filled');
              sel = null;
              left--;
              if (!left) {
                fb.innerHTML = '';
                fb.append(h('div', { class: 'fb ' + (miss ? 'no' : 'ok') }, miss ? `完成！途中放錯了 ${miss} 次。` : '全對，一次都沒有放錯！'), h('button.btn', { type: 'button', style: { marginTop: '8px' }, onclick: run }, '再玩一次'));
                XH.U.cheer(fb);
              }
            } else {
              miss++;
              const el = sel.el;
              el.classList.add('shake');
              setTimeout(() => el.classList.remove('shake'), 450);
              XH.U.toast('年份不對，再想想');
            }
            slots[s.y].classList.remove('ready');
            Object.values(slots).forEach((x) => x.classList.remove('ready'));
          };
          slot.addEventListener('click', drop);
          slot.addEventListener('keydown', (e) => { if (e.key === 'Enter') drop(); });
          return h('div.stair', h('div.yr', s.y), slot);
        }));
        XH.U.shuffle(all).forEach((d) => {
          const el = h('button.tok', { type: 'button' }, d.t);
          el.addEventListener('click', () => {
            if (el.disabled) return;
            pool.querySelectorAll('.tok').forEach((t) => t.classList.remove('sel'));
            sel = { el, d };
            el.classList.add('sel');
            Object.values(slots).forEach((x) => x.classList.add('ready'));
          });
          pool.append(el);
        });
        const fb = h('div', { style: { marginTop: '10px' } });
        wrap.append(stairs, h('div.small.muted', { style: { marginTop: '12px' } }, '卡片（點一張，再點年份）：'), pool, fb);
      };
      run();
      return wrap;
    },
  };

  // 分類遊戲：先點卡，再點籃子
  function sortGame(bins, items) {
    const wrap = h('div');
    const run = () => {
      wrap.innerHTML = '';
      let sel = null, miss = 0, left = items.length;
      const binEls = {};
      const binsEl = h('div.bins', bins.map((b) => {
        const got = h('div.got');
        const el = h('div.bin', { role: 'button', tabindex: 0 }, h('h4', b.name), got);
        binEls[b.id] = el;
        el.addEventListener('click', () => {
          if (!sel) { XH.U.toast('先點選一張卡'); return; }
          if (sel.d.a === b.id) {
            sel.el.classList.remove('sel'); sel.el.classList.add('ok'); sel.el.disabled = true; got.append(sel.el); sel = null; left--;
            if (!left) { fb.append(h('div', { class: 'fb ' + (miss ? 'no' : 'ok') }, miss ? `完成！放錯了 ${miss} 次。` : '全對！'), h('button.btn', { type: 'button', style: { marginTop: '8px' }, onclick: run }, '再玩一次')); XH.U.cheer(fb); }
          } else {
            miss++;
            const e = sel.el; e.classList.add('shake'); setTimeout(() => e.classList.remove('shake'), 450);
            XH.U.toast('放錯籃子了');
          }
          Object.values(binEls).forEach((x) => x.classList.remove('ready'));
        });
        return el;
      }));
      const pool = h('div.pool');
      XH.U.shuffle(items).forEach((d) => {
        const el = h('button.tok', { type: 'button' }, d.t);
        el.addEventListener('click', () => {
          if (el.disabled) return;
          pool.querySelectorAll('.tok').forEach((t) => t.classList.remove('sel'));
          sel = { el, d }; el.classList.add('sel');
          Object.values(binEls).forEach((x) => x.classList.add('ready'));
        });
        pool.append(el);
      });
      const fb = h('div');
      wrap.append(h('div.small.muted', '先點一張卡，再點它所屬的籃子。'), pool, binsEl, fb);
    };
    run();
    return wrap;
  }

  // 配對遊戲：左右兩欄
  function matchGame(pairs, n, lt, rt) {
    const wrap = h('div');
    const run = () => {
      wrap.innerHTML = '';
      const set = XH.U.shuffle(pairs).slice(0, n);
      let selL = null, miss = 0, left = set.length;
      const L = h('div.col', h('div.small.muted', lt)), R = h('div.col', h('div.small.muted', rt));
      const lEls = XH.U.shuffle(set).map((p) => {
        const b = h('button.tok', { type: 'button' }, p.l);
        b.addEventListener('click', () => { if (b.disabled) return; L.querySelectorAll('.tok').forEach((x) => x.classList.remove('sel')); selL = { b, p }; b.classList.add('sel'); });
        L.append(b); return b;
      });
      XH.U.shuffle(set).forEach((p) => {
        const b = h('button.tok', { type: 'button' }, p.r);
        b.addEventListener('click', () => {
          if (b.disabled) return;
          if (!selL) { XH.U.toast(`先點左邊的${lt}`); return; }
          if (selL.p === p) {
            [selL.b, b].forEach((x) => { x.classList.remove('sel'); x.classList.add('ok'); x.disabled = true; });
            selL = null; left--;
            if (!left) { fb.append(h('div', { class: 'fb ' + (miss ? 'no' : 'ok') }, miss ? `完成！配錯了 ${miss} 次。` : '全對！'), h('button.btn', { type: 'button', style: { marginTop: '8px' }, onclick: run }, '下一輪')); XH.U.cheer(fb); }
          } else {
            miss++;
            b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450);
          }
        });
        R.append(b);
      });
      const fb = h('div', { style: { marginTop: '10px' } });
      wrap.append(h('div.small.muted', { style: { marginBottom: '8px' } }, `先點左邊的${lt}，再點右邊相配的${rt}。`), h('div.match', L, R), fb);
    };
    run();
    return wrap;
  }

  function groupMatch() {
    const G = XH.games.groups;
    const fields = [['slogan', '綱領'], ['place', '創立地點'], ['head', '會長'], ['members', '主要成員']];
    const wrap = h('div');
    const chips = h('div.chips', { style: { marginBottom: '12px' } });
    const area = h('div');
    const go = (k, l) => {
      chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.k === k));
      area.innerHTML = '';
      area.append(matchGame(G.map((g) => ({ l: g.name, r: g[k] })), 4, '團體', l));
    };
    fields.forEach(([k, l]) => chips.append(h('button.chip', { type: 'button', 'data-k': k, onclick: () => go(k, l) }, l)));
    wrap.append(chips, area);
    go('slogan', '綱領');
    return wrap;
  }

  // 時間快排：隨機抽四件事
  function quickOrder() {
    const wrap = h('div');
    const pool = XH.events.filter((e) => !e.bar && !e.dl);
    const run = () => {
      wrap.innerHTML = '';
      let pick;
      do {
        pick = XH.U.shuffle(pool).slice(0, 4);
        const ts = pick.map((e) => XH.U.parseDate(e.d)).sort((a, b) => a - b);
        // 日期精確度不同時，要求相隔超過一年，避免同年事件無法分先後
        if (ts.every((t, i) => !i || t - ts[i - 1] > 400 * 86400000)) break;
      } while (true);
      const q = { id: 'quick', type: 'order', q: '把這四件事按先後排列。', items: pick.sort((a, b) => XH.U.parseDate(a.d) - XH.U.parseDate(b.d)).map((e) => ({ t: e.t.replace(/^[①-⑫]\s*/, ''), d: XH.U.fmtDate(e.d) })), ex: '' };
      const t0 = Date.now();
      wrap.append(XH.Quiz.renderQ(q, { noRecord: true, onDone: (ok) => {
        const s = Math.round((Date.now() - t0) / 1000);
        wrap.append(h('div.row', { style: { marginTop: '10px' } }, h('span', ok ? `用了 ${s} 秒，全對！` : `用了 ${s} 秒。`), h('button.btn.primary', { type: 'button', onclick: run }, '下一題')));
        if (ok) XH.U.cheer(wrap);
      } }));
    };
    run();
    return wrap;
  }

  // 年號換算（只用課本標注）
  function reignGame() {
    const wrap = h('div');
    const R = XH.reigns;
    let n = 0, score = 0;
    const ask = () => {
      wrap.innerHTML = '';
      if (n >= 8) {
        wrap.append(h('div.score-big', `${score} / 8`), h('button.btn.primary', { type: 'button', onclick: () => { n = 0; score = 0; ask(); } }, '再玩一次'));
        if (score === 8) XH.U.cheer(wrap);
        return;
      }
      const r = R[Math.floor(Math.random() * R.length)];
      const rev = Math.random() < 0.5;
      const opts = XH.U.shuffle([r].concat(XH.U.shuffle(R.filter((x) => x !== r && x.year !== r.year)).slice(0, 3)));
      wrap.append(h('div.small.muted', `第 ${n + 1} / 8 題`), h('div.q-stem', rev ? `公元 ${r.year} 年是哪一年？` : `「${r.label}」是公元哪一年？`));
      const box = h('div.opts');
      opts.forEach((o) => box.append(h('button.opt', { type: 'button', onclick: (e) => {
        n++;
        const ok = o === r;
        if (ok) score++;
        e.currentTarget.classList.add(ok ? 'ok' : 'no');
        box.querySelectorAll('.opt').forEach((b) => (b.disabled = true));
        if (!ok) XH.U.toast(`答案：${r.label}＝${r.year}年`);
        setTimeout(ask, ok ? 600 : 1500);
      } }, rev ? o.label : `${o.year}年`)));
      wrap.append(box, h('div.pg', { style: { marginTop: '8px' } }, `課本第${r.page}頁有此標注`));
    };
    ask();
    return wrap;
  }
})();
