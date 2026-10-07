/* 自我測驗：選擇題、排序題、因果題；錯題記錄與重練 */
(function () {
  const { h, store } = XH.U;
  const TYPE = { mcq: '選擇題', order: '排序題', cause: '因果題' };
  const L = 'ABCDEF';

  const wrongSet = () => store.get('wrong', {});
  const record = (q, ok) => {
    const w = wrongSet();
    if (ok) delete w[q.id]; else w[q.id] = Date.now();
    store.set('wrong', w);
    const st = store.get('stats', {});
    st[q.id] = st[q.id] || { r: 0, w: 0 };
    st[q.id][ok ? 'r' : 'w']++;
    store.set('stats', st);
  };

  function refLink(ref) {
    if (!ref) return null;
    const [u, a] = ref.split('#');
    return h('a.btn.no-print', { href: `#/unit/${u}/${a || ''}`, style: { marginTop: '8px' } }, '回到課文相關段落 →');
  }
  function feedback(ok, q, extra) {
    return h('div', { class: 'fb ' + (ok ? 'ok' : 'no') }, h('b.t', ok ? '✓ 答對了' : '✗ 答錯了'), extra || null, q.ex ? h('div', q.ex) : null, ok ? null : refLink(q.ref));
  }

  XH.Quiz = {
    renderQ(q, opts) {
      opts = opts || {};
      const box = h('div.qbox');
      box.append(h('div.q-type', TYPE[q.type] + (opts.inline ? '・隨堂小測' : '')));
      box.append(h('div.q-stem', q.q));
      const done = (ok, extra) => {
        if (!opts.noRecord) record(q, ok);
        box.append(feedback(ok, q, extra));
        opts.onDone && opts.onDone(ok);
      };

      if (q.type === 'mcq' || q.type === 'cause') {
        if (q.type === 'cause') {
          const cc = h('div.cause-chain');
          q.chain.forEach((c, i) => {
            if (i) cc.append(h('span.ar', '→'));
            cc.append(c === '?' ? h('span.node.blank', '？') : h('span.node', c));
          });
          box.append(cc);
        }
        const order = XH.U.shuffle(q.opts.map((_, i) => i));
        const os = h('div.opts');
        order.forEach((oi, k) => {
          const b = h('button.opt', { type: 'button' }, h('span.l', L[k]), h('span', q.opts[oi]));
          b.addEventListener('click', () => {
            const ok = oi === q.a;
            os.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
            b.classList.add(ok ? 'ok' : 'no');
            if (!ok) os.children[order.indexOf(q.a)].classList.add('ok');
            if (q.type === 'cause') { const bl = box.querySelector('.blank'); bl.textContent = q.opts[q.a]; bl.style.borderStyle = 'solid'; }
            done(ok);
          });
          os.append(b);
        });
        box.append(os);
      } else if (q.type === 'order') {
        const n = q.items.length;
        const shown = XH.U.shuffleNew(q.items.map((_, i) => i));
        const picked = [];
        let locked = false;
        const list = h('div.order-list');
        const els = shown.map((ii) => {
          const b = h('button.order-item', { type: 'button' }, h('span.num', ''), h('span', q.items[ii].t));
          b.addEventListener('click', () => {
            if (locked) return;
            const at = picked.indexOf(ii);
            at >= 0 ? picked.splice(at, 1) : picked.push(ii);
            els.forEach((e, k) => { const p = picked.indexOf(shown[k]); e.classList.toggle('picked', p >= 0); e.querySelector('.num').textContent = p >= 0 ? p + 1 : ''; });
            if (picked.length === n) {
              locked = true;
              let right = 0;
              els.forEach((e, k) => {
                const ok = picked.indexOf(shown[k]) === shown[k];
                if (ok) right++;
                e.classList.add(ok ? 'ok' : 'no');
                e.append(h('span.ans', `${q.items[shown[k]].d}${ok ? '' : `（應排第${shown[k] + 1}）`}`));
              });
              const ok = right === n;
              done(ok, ok ? null : h('div', `排對 ${right} / ${n} 項。正確次序：`, h('ol', { style: { margin: '4px 0', paddingLeft: '1.4em' } }, q.items.map((it) => h('li', `${it.d}　${it.t}`)))));
            }
          });
          list.append(b);
          return b;
        });
        box.append(h('div.small.muted', { style: { marginBottom: '6px' } }, '由最早到最遲逐一點選；再點一次可取消。'), list);
      }
      return box;
    },

    hub(root) {
      const ready = XH.units.filter((u) => u.ready);
      const w = Object.keys(wrongSet()).filter((id) => XH.quiz.some((q) => q.id === id));
      const st = store.get('stats', {});
      root.append(h('div.page-head', h('div.eyebrow', '自我測驗'), h('h1', '測驗'),
        h('p.lead', '每個單元都有選擇題、排序題和因果題。答錯的題目會自動記錄，可以在「錯題重練」再做；答對後便會從錯題本移除。')));
      root.append(h('div.row', { style: { marginBottom: '16px' } },
        h('a.btn.primary', { href: '#/quiz/wrong', class: `btn primary ${w.length ? '' : 'disabled'}` }, `錯題重練（${w.length} 題）`),
        h('a.btn', { href: '#/quiz/all' }, `全部混合（${XH.quiz.length} 題）`),
        h('button.btn.ghost', { type: 'button', onclick: () => { if (confirm('確定清除所有作答記錄和錯題本？')) { store.set('wrong', {}); store.set('stats', {}); location.reload(); } } }, '清除記錄')));
      root.append(h('div.grid.c3', XH.units.map((u) => {
        const qs = XH.quiz.filter((q) => q.unit === u.id);
        const done = qs.filter((q) => st[q.id]).length;
        const wr = qs.filter((q) => w.includes(q.id)).length;
        return h(u.ready ? 'a.card.unit-card' : 'div.card.unit-card', { href: u.ready ? `#/quiz/${u.id}` : null, class: `card unit-card ${u.ready ? '' : 'locked'}` },
          h('span.no', u.no), h('h3', u.title),
          u.ready ? h('span.span', `${qs.length} 題｜做過 ${done} 題｜錯題 ${wr}`) : h('span.span', '第二階段加入題目'),
          u.ready ? h('div.progress', h('i', { style: { width: (qs.length ? (done / qs.length) * 100 : 0) + '%' } })) : null);
      })));
      if (!ready.length) root.append(h('p', '暫無題目。'));
    },

    session(root, key) {
      let qs, title;
      if (key === 'wrong') {
        const w = wrongSet();
        qs = XH.quiz.filter((q) => w[q.id]);
        title = '錯題重練';
      } else if (key === 'all') {
        qs = XH.quiz.slice();
        title = '全部混合';
      } else {
        qs = XH.quiz.filter((q) => q.unit === key);
        const u = XH.U.unit(key);
        title = u ? `單元測驗：${u.title}` : '測驗';
      }
      root.append(h('div.page-head', h('div.eyebrow', h('a', { href: '#/quiz', style: { color: 'inherit' } }, '測驗')), h('h1', title)));
      if (!qs.length) {
        root.append(h('div.card', key === 'wrong' ? '錯題本是空的，做得好！去做其他測驗吧。' : '這部分暫時沒有題目。', h('div', { style: { marginTop: '10px' } }, h('a.btn', { href: '#/quiz' }, '返回測驗'))));
        return;
      }
      qs = XH.U.shuffle(qs);
      let i = 0, score = 0;
      const missed = [];
      const bar = h('div.progress', h('i', { style: { width: '0%' } }));
      const count = h('div.small.muted');
      const stage = h('div', { style: { marginTop: '12px' } });
      root.append(count, bar, stage);
      const next = () => {
        stage.innerHTML = '';
        bar.firstChild.style.width = (i / qs.length) * 100 + '%';
        if (i >= qs.length) {
          count.textContent = '完成';
          stage.append(h('div.card', { style: { textAlign: 'center' } },
            h('div.score-big', `${score} / ${qs.length}`),
            h('p', score === qs.length ? '全對！' : `答錯 ${missed.length} 題，已加入錯題本。`),
            h('div.row', { style: { justifyContent: 'center' } },
              missed.length ? h('a.btn.primary', { href: '#/quiz/wrong' }, '立即重練錯題') : null,
              h('button.btn', { type: 'button', onclick: () => { root.innerHTML = ''; XH.Quiz.session(root, key); } }, '再做一次'),
              h('a.btn', { href: '#/quiz' }, '返回測驗'))));
          if (score === qs.length) XH.U.cheer(stage.firstChild);
          return;
        }
        count.textContent = `第 ${i + 1} / ${qs.length} 題　｜　答對 ${score}`;
        const q = qs[i];
        stage.append(XH.Quiz.renderQ(q, { onDone: (ok) => {
          if (ok) score++; else missed.push(q);
          stage.append(h('div.row', { style: { marginTop: '12px' } }, h('span.spacer'), h('button.btn.primary', { type: 'button', onclick: () => { i++; next(); scrollTo({ top: 0, behavior: 'smooth' }); } }, i + 1 < qs.length ? '下一題 →' : '看成績')));
        } }));
      };
      next();
    },

    // 首頁「每日一題」
    daily() {
      const pool = XH.quiz.filter((q) => q.type !== 'order');
      const d = new Date();
      const q = pool[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % pool.length];
      return XH.Quiz.renderQ(q, {});
    },
  };
})();
