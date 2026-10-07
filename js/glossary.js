/* 術語解釋＋閃卡 */
(function () {
  const { h } = XH.U;
  XH.GlossaryView = {
    render(root) {
      const cats = [...new Set(XH.glossary.map((g) => g.cat))];
      let cat = null, kw = '';
      root.append(h('div.page-head', h('div.eyebrow', '重要名詞'), h('h1', '術語'), h('p.lead', `共 ${XH.glossary.length} 個詞條，全部依課本解釋；附課本所注的讀音。`)));
      const search = h('input.search', { type: 'search', placeholder: '搜尋，例如：約法、都督、檀香山', 'aria-label': '搜尋術語' });
      const chips = h('div.chips', { style: { margin: '10px 0 14px' } });
      const grid = h('div.terms');
      const draw = () => {
        grid.innerHTML = '';
        const list = XH.glossary.filter((g) => (!cat || g.cat === cat) && (!kw || (g.term + g.def + (g.alias || []).join('')).includes(kw)));
        if (!list.length) grid.append(h('p.muted', '找不到相關詞條。'));
        list.forEach((g) => {
          const u = XH.U.unit(g.unit);
          grid.append(h('div.card.term-card', h('div.row', h('h4', g.term), h('span.tag', g.cat)), g.yin ? h('div.yin', g.yin) : null, h('p', g.def),
            h('div.row', h('span.pg', `課本第${g.pg}頁`), h('span.spacer'), u ? h('a.small', { href: `#/unit/${u.id}` }, u.title) : null)));
        });
      };
      chips.append(h('button.chip.on', { type: 'button', onclick: (e) => pick(null, e) }, '全部'));
      cats.forEach((c) => chips.append(h('button.chip', { type: 'button', onclick: (e) => pick(c, e) }, c)));
      function pick(c, e) { cat = c; chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); }
      search.addEventListener('input', () => { kw = search.value.trim(); draw(); });
      root.append(h('div.row', h('div', { style: { flex: 1, minWidth: '220px' } }, search), h('button.btn', { type: 'button', onclick: () => flash(root) }, '🃏 閃卡模式')), chips, grid);
      draw();
    },
  };

  // 閃卡：看詞條想解釋，或看解釋想詞條
  function flash(root) {
    const deck = XH.U.shuffle(XH.glossary);
    let i = 0, rev = false, known = 0;
    const box = h('div.card', { style: { marginBottom: '18px' } });
    root.querySelector('.page-head').after(box);
    const draw = () => {
      box.innerHTML = '';
      if (i >= deck.length) { box.append(h('b', `完成！認識 ${known} / ${deck.length} 個。`), ' ', h('button.btn', { type: 'button', onclick: () => box.remove() }, '關閉')); return; }
      const g = deck[i];
      const front = rev ? g.def : g.term;
      const back = rev ? g.term : g.def;
      const ans = h('div', { hidden: true, style: { fontSize: '17px', marginTop: '10px', borderTop: '1px dashed var(--line)', paddingTop: '10px' } }, back, h('div.pg', `課本第${g.pg}頁`));
      box.append(
        h('div.row', h('span.small.muted', `閃卡 ${i + 1} / ${deck.length}`), h('span.spacer'),
          h('label.small', h('input', { type: 'checkbox', checked: rev || null, onchange: (e) => { rev = e.target.checked; draw(); } }), ' 反轉（看解釋猜詞條）'),
          h('button.btn.ghost', { type: 'button', onclick: () => box.remove() }, '關閉')),
        h('div', { style: { fontFamily: rev ? 'var(--sans)' : 'var(--serif)', fontSize: rev ? '17px' : '30px', fontWeight: rev ? 400 : 700, margin: '10px 0' } }, front),
        ans,
        h('div.row', { style: { marginTop: '12px' } },
          h('button.btn', { type: 'button', onclick: () => (ans.hidden = false) }, '顯示答案'),
          h('button.btn', { type: 'button', onclick: () => { i++; draw(); } }, '未記得'),
          h('button.btn.primary', { type: 'button', onclick: () => { known++; i++; draw(); } }, '記得')));
    };
    draw();
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
})();
