/* 路由與首頁 */
(function () {
  const { h } = XH.U;
  const main = document.getElementById('main');
  let cleanup = [];

  function home(root) {
    const ready = XH.units.filter((u) => u.ready).length;
    root.append(h('section.hero',
      h('div',
        h('div.small', { style: { color: 'var(--accent)', fontWeight: 600, letterSpacing: '.08em' } }, '中國歷史・課本第1章'),
        h('h1', '辛亥革命與', h('em', '民初政局')),
        h('p.lead', '由1894年興中會成立，到1916年袁世凱病逝：二十二年間，中國由帝制走向共和，又險些回到帝制。這個網頁只整理課本第5–14頁和第20–24頁的內容，用來預習、複習和自我測驗。'),
        h('div.row', h('a.btn.primary', { href: '#/timeline' }, '從時間軸開始'), h('a.btn', { href: '#/units' }, '看單元'), h('a.btn', { href: '#/play' }, '玩互動練習'))),
      h('div.hero-stats',
        h('div.stat', h('b', '22'), h('span', '年（1894–1916）')),
        h('div.stat', h('b', XH.events.length), h('span', '個時間軸事件')),
        h('div.stat', h('b', XH.quiz.length), h('span', '道測驗題')),
        h('div.stat', h('b', '5'), h('span', '幅示意地圖')),
        h('div.stat', h('b', XH.glossary.length), h('span', '個術語')),
        h('div.stat', h('b', `${ready}/8`), h('span', '單元已完成')))));

    XH.sections.forEach((s) => {
      root.append(h('div.sec-title', h('h2', `${s.no}　${s.title}`), h('span.pg', s.pages)));
      root.append(h('div.inquiry', h('b', '探究問題'), h('span', s.inquiry)));
      root.append(h('div.grid.c3', XH.units.filter((u) => u.sec === s.id).map(XH.UnitView.card)));
    });

    root.append(h('div.sec-title', h('h2', '每日一題')));
    root.append(h('div.daily', XH.Quiz.daily()));

    const w = Object.keys(XH.U.store.get('wrong', {})).length;
    if (w) root.append(h('div.note', { style: { marginTop: '16px' } }, `你的錯題本有 ${w} 題。 `, h('a', { href: '#/quiz/wrong' }, '去重練 →')));
  }

  const routes = {
    '': (r) => home(r),
    timeline: (r, a, b) => {
      r.append(h('div.page-head', h('div.eyebrow', '1894–1916'), h('h1', '時間軸'),
        h('p.lead', '五條軌道並排：清廷、革命團體、起義與戰事、民國政府，以及課文提及的列強與外國事件。')));
      const box = h('div');
      r.append(box);
      const t = XH.Timeline.render(box, a === 'topic' ? { topic: b } : { focus: a });
      cleanup.push(t.destroy);
    },
    units: (r) => XH.UnitView.list(r),
    unit: (r, id, anchor) => XH.UnitView.detail(r, id, anchor),
    map: (r, id) => XH.MapView.page(r, id),
    topics: (r) => XH.TopicView.list(r),
    topic: (r, id) => XH.TopicView.detail(r, id),
    play: (r, id) => (id ? XH.Games.play(r, id) : XH.Games.hub(r)),
    quiz: (r, id) => (id ? XH.Quiz.session(r, id) : XH.Quiz.hub(r)),
    terms: (r) => XH.GlossaryView.render(r),
  };
  const WIDE = new Set(['timeline', 'map', 'topic', 'unit']);

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const [name, a, b] = parts;
    // 同一單元內跳段落：不重繪
    if (name === 'unit' && main.dataset.unit === a && document.getElementById('s-basics')) {
      if (b) XH.UnitView.jump(b);
      return;
    }
    cleanup.forEach((f) => f && f());
    cleanup = [];
    main.innerHTML = '';
    main.dataset.unit = name === 'unit' ? a : '';
    const fn = routes[name] || routes[''];
    const root = name === 'unit' ? main : h('div.wrap');
    if (root !== main) main.append(root);
    if (root !== main) { root.classList.add('wrap'); if (WIDE.has(name)) root.style.maxWidth = '1320px'; }
    fn(root, a, b);
    main.append(h('footer.foot', `內容只取自課本《辛亥革命與民初政局》第5–14頁、第20–24頁｜地圖為方格示意圖，約略範圍｜作答記錄只存在本機瀏覽器`));
    document.querySelectorAll('#nav a').forEach((x) => x.classList.toggle('on', x.dataset.nav === name || (name === 'unit' && x.dataset.nav === 'units') || (name === 'topic' && x.dataset.nav === 'topics')));
    if (!(name === 'unit' && b)) scrollTo(0, 0);
    const h1 = main.querySelector('h1');
    document.title = (name ? (h1 ? h1.textContent + '｜' : '') : '') + XH.meta.title;
  }

  // 深淺色
  const btn = document.getElementById('themeBtn');
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nx);
    try { localStorage.setItem('xh.theme', nx); } catch (e) {}
  });

  // 檢查資料：[[詞條]] 必須存在
  const missing = [];
  const walk = (v) => {
    if (typeof v === 'string') v.replace(/\[\[(.+?)\]\]/g, (_, t) => { if (!XH.U.term(t.split('|')[0])) missing.push(t); });
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(XH.unitData);
  if (missing.length) console.warn('術語未收錄：', missing);

  addEventListener('hashchange', route);
  route();
})();
