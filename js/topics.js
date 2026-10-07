/* 專題線索 */
(function () {
  const { h } = XH.U;
  XH.TopicView = {
    list(root) {
      root.append(h('div.page-head', h('div.eyebrow', '跨單元'), h('h1', '專題線索'),
        h('p.lead', '選一條線索，追蹤同一主題怎樣隨時間演變；時間軸上相關的事件會被高亮。')));
      root.append(h('div.grid.c2', XH.topics.map((t) => h('a.card.game-card', { href: `#/topic/${t.id}` },
        h('span.ico', t.icon), h('div', h('h3', { style: { margin: 0 } }, t.title), h('p.small.muted', { style: { margin: '4px 0 0' } }, t.q), h('span.small', `${t.steps.length} 個節點`))))));
    },
    detail(root, id) {
      const t = XH.topics.find((x) => x.id === id);
      if (!t) { root.append(h('p', '找不到此專題。')); return; }
      root.append(h('div.page-head', h('div.eyebrow', h('a', { href: '#/topics', style: { color: 'inherit' } }, '專題線索'), ' › ', t.icon),
        h('h1', t.title), h('div.inquiry', h('b', '思考'), h('span', t.q))));
      const ol = h('ol.topic-steps');
      t.steps.forEach((s, i) => {
        const e = s.ev && XH.U.ev(s.ev);
        const li = h('li', h('div.d', s.d), h('div', s.t),
          h('div.row', { style: { gap: '12px', marginTop: '2px' } },
            e ? h('span.pg', `課本第${e.pg}頁`) : null,
            e ? h('button.btn.ghost', { type: 'button', style: { minHeight: '30px', padding: '2px 10px', fontSize: '13px' }, onclick: (ev) => XH.U.openPop(ev.currentTarget, XH.U.eventCard(e)) }, '詳情') : null,
            s.map ? h('a.small', { href: `#/map/${s.map}` }, '看地圖') : null));
        ol.append(li);
      });
      root.append(h('div.card', ol));
      root.append(h('h2', { style: { marginTop: '28px' } }, '在時間軸上看這條線索'));
      const tl = h('div');
      root.append(tl);
      XH.Timeline.render(tl, { topic: id });
    },
  };
})();
