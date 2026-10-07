/* 第二階段單元的互動小部件 */
(function () {
  const { h } = XH.U;
  const W = XH.UnitView.Widgets;

  // 孫中山的名字（第5頁）
  W.names = () => {
    const items = [['原名', '孫文'], ['字', '載之'], ['號', '逸仙'], ['在日本的化名', '中山樵（樵音潮）'], ['籍貫', '廣東香山縣翠亨村（今屬中山市）']];
    return h('div.grid.c3', { style: { margin: '10px 0' } }, items.map(([k, v]) => {
      const ans = h('div', { style: { fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 700, filter: 'blur(7px)', transition: '.3s' } }, v);
      return h('button.card', { type: 'button', style: { textAlign: 'left', cursor: 'pointer' }, onclick: () => (ans.style.filter = 'none') }, h('div.small.muted', k + '（點擊揭曉）'), ans);
    }));
  };

  // 十二次起義（第8頁）
  W.uprisings = () => {
    const evs = ['up1', 'up2', 'up3', 'up4', 'up5', 'up6', 'up7', 'up8', 'up9', 'up10', 'up11', 'up12'].map(XH.U.ev);
    let shown = 0;
    const count = h('span.small.muted', '已揭曉 0 / 12');
    const list = h('div', { style: { display: 'grid', gap: '6px', margin: '10px 0' } }, evs.map((e) => {
      const who = h('span.tag', { style: { visibility: 'hidden' } }, e.who);
      const row = h('button.order-item', { type: 'button' }, h('span', { style: { minWidth: '4.5em', color: 'var(--accent)', fontWeight: 600 } }, XH.U.fmtDate(e.d)), h('span', e.t), h('span.spacer'), who);
      row.addEventListener('click', () => {
        if (who.style.visibility === 'visible') return;
        who.style.visibility = 'visible';
        who.className = 'tag ' + (e.who === '興中會' ? 'red' : 'blue');
        row.style.marginLeft = 0;
        count.textContent = `已揭曉 ${++shown} / 12`;
      });
      return row;
    }));
    return h('div', h('div.small.muted', '先猜猜每次起義由興中會還是同盟會發動，再點擊揭曉。'), list, count);
  };

  // 四方面的歷史意義（第14頁）
  W.meaning4 = () => {
    const M = [
      ['推翻清朝政權', '結束清朝二百六十多年的統治，完成「驅除韃虜、恢復中華」的目標；提倡「五族共和」，主張全國各民族一律平等。', '#b23a2a'],
      ['結束君主專制', '推翻二千多年君主專制制度，建立民主共和政體，為中國政治現代化和民主化邁出重要一步。', '#2e4b7d'],
      ['推動民族工業', '民初政府制定不少有利民族工商實業發展的措施，新的工廠、銀行相繼成立，民族工業顯著發展。', '#2f7a4f'],
      ['促進思想解放', '中國進入新時代，社會、文化出現變革（例如女性地位提升），推動更多新思潮的出現。', '#a87a1c'],
    ];
    return h('div.grid.c2', { style: { gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', margin: '10px 0' } }, M.map(([t, b, c], i) => {
      const body = h('p', { hidden: true, style: { margin: '8px 0 0', fontSize: '15.5px' } }, b);
      return h('button.card', { type: 'button', style: { textAlign: 'left', cursor: 'pointer', borderTop: `5px solid ${c}` }, onclick: () => (body.hidden = !body.hidden) },
        h('div.small.muted', `意義 ${i + 1}`), h('div', { style: { fontFamily: 'var(--serif)', fontSize: '21px', fontWeight: 700 } }, t), body);
    }));
  };

  // 晚清革命運動的歷程（第14頁）
  W.p14order = () => {
    const box = h('div');
    const run = () => {
      box.innerHTML = '';
      box.append(XH.Quiz.renderQ({ id: 'p14', type: 'order', q: '晚清革命運動的歷程（1894–1912年）',
        items: [{ t: '興中會成立', d: '1894年' }, { t: '興中會於廣州發動首次起義', d: '1895年' }, { t: '興中會發動惠州起義', d: '1900年' }, { t: '華興會、光復會成立', d: '1904年' }, { t: '同盟會成立', d: '1905年' }, { t: '黃花崗之役爆發', d: '1911年4月' }, { t: '武昌起義成功', d: '1911年10月' }, { t: '中華民國成立，清帝退位', d: '1912年' }],
        ex: '課本第14頁時間線。' }, { noRecord: true, onDone: (ok) => { box.append(h('button.btn', { type: 'button', style: { marginTop: '8px' }, onclick: run }, '再玩一次')); if (ok) XH.U.cheer(box); } }));
    };
    run();
    return box;
  };

  // 孫中山與袁世凱的協議（第20頁）
  W.deal = () => {
    const steps = [
      ['袁世凱要做到', '促成清帝退位，並擁護《臨時約法》'],
      ['孫中山便會', '辭去臨時大總統一職，推薦袁世凱為臨時大總統'],
      ['結果（1912年2月）', '袁世凱迫清帝溥儀退位，孫中山履行承諾辭職'],
      ['結果（1912年3月）', '袁世凱在北京就任臨時大總統'],
    ];
    let i = 0;
    const list = h('div', { style: { display: 'grid', gap: '8px', margin: '10px 0' } });
    const btn = h('button.btn.primary', { type: 'button', onclick: () => {
      const [k, v] = steps[i++];
      list.append(h('div.card', { style: { padding: '10px 14px' } }, h('div.small.muted', k), h('div', { style: { fontWeight: 600 } }, v)));
      if (i >= steps.length) { btn.disabled = true; btn.textContent = '完'; }
      else btn.textContent = '下一步 →';
    } }, '看協議內容 →');
    return h('div', list, btn);
  };

  // 1913年國會選舉議席（第21頁）
  W.seats = () => {
    const D = {
      參議院: { total: 274, rows: [['國民黨', 123, 45], ['其他政黨', 107, 39], ['無黨派', 44, 16]] },
      眾議院: { total: 596, rows: [['國民黨', 269, 45], ['其他政黨', 180, 30], ['無黨派', 147, 25]] },
    };
    const colors = ['var(--accent)', 'var(--indigo)', 'var(--muted)'];
    const chart = h('div.seats');
    const chips = h('div.chips');
    const draw = (k) => {
      chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.k === k));
      chart.innerHTML = '';
      chart.append(h('div.small.muted', `${k}（共 ${D[k].total} 席）`));
      D[k].rows.forEach(([n, s, p], i) => {
        const bar = h('i', { style: { display: 'block', height: '100%', width: '0%', background: colors[i], borderRadius: '6px', transition: 'width .6s' } });
        chart.append(h('div', { style: { display: 'grid', gridTemplateColumns: '5.5em 1fr 7.5em', gap: '10px', alignItems: 'center' } },
          h('b', n), h('div', { style: { height: '22px', background: 'var(--bg-2)', borderRadius: '6px' } }, bar), h('span', `${s} 席（${p}%）`)));
        requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = p + '%')));
      });
    };
    Object.keys(D).forEach((k) => chips.append(h('button.chip', { type: 'button', 'data-k': k, onclick: () => draw(k) }, k)));
    const box = h('div.card', { style: { margin: '10px 0' } }, chips, h('div', { style: { marginTop: '10px' } }, chart), h('div.small.muted', { style: { marginTop: '8px' } }, '國民黨在兩院都得到約45%議席，成為國會第一大黨。'));
    draw('參議院');
    return box;
  };
})();
