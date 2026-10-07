/* 總覽資料：章節、單元、時間軸軌道
 * 全部內容只取自課本《單元1 中華民國・第1章 辛亥革命與民初政局》
 * 第5–14頁（第1節）及第20–24頁（第2節前半）。 */
window.XH = window.XH || {};

XH.meta = {
  title: '辛亥革命與民初政局',
  source: '課本第1章：第1節（第5–14頁）、第2節（第20–24頁）',
  // 時間軸範圍
  range: { start: '1893-07', end: '1917-06' },
};

XH.sections = [
  {
    id: 's1', no: '第1節', title: '清末革命與民國成立', pages: '第5–14頁',
    intro: '清末以來，洋務運動、維新運動相繼失敗，部分國人認為只有透過革命推翻清朝，才能挽救中國。孫中山是清末革命的先行者，他領導革命黨人推翻清朝，建立中華民國。',
    inquiry: '辛亥革命與民國成立有何歷史意義？',
  },
  {
    id: 's2', no: '第2節', title: '軍閥政治', pages: '第20–24頁',
    intro: '辛亥革命雖然推翻了清朝，但民國總統之位卻落入北洋軍領袖袁世凱手中。袁世凱死後，中央和地方政府分別由不同派系的軍閥掌控，形成「軍閥政治」。',
    inquiry: '民國初年出現「軍閥政治」的局面，與袁世凱有甚麼關係？',
    note: '「軍閥」是指以武力操控政府或割據一方的軍人或軍事集團。（第20頁註⑰）',
  },
];

// ready: 第一階段已完成的單元
XH.units = [
  { id: 'u1', sec: 's1', no: '一之①②', title: '革命先導孫中山與興中會', span: '約1890–1900', pages: '第5–6頁', ready: true },
  { id: 'u2', sec: 's1', no: '一之③', title: '同盟會的成立與三民主義', span: '1904–1906', pages: '第6–7頁', ready: true },
  { id: 'u3', sec: 's1', no: '一之④', title: '同盟會多次起事', span: '1906–1911', pages: '第8頁', ready: true },
  { id: 'u4', sec: 's1', no: '二', title: '辛亥革命', span: '1911–1912', pages: '第10–13頁', ready: true },
  { id: 'u5', sec: 's1', no: '三', title: '辛亥革命的歷史意義', span: '1912', pages: '第14頁', ready: true },
  { id: 'u6', sec: 's2', no: '一', title: '袁世凱成為總統', span: '1911–1912', pages: '第20頁', ready: true },
  { id: 'u7', sec: 's2', no: '二', title: '二次革命', span: '1912–1913', pages: '第21–22頁', ready: true },
  { id: 'u8', sec: 's2', no: '三', title: '袁世凱復辟帝制', span: '1913–1916', pages: '第22–24頁', ready: true },
];

XH.tracks = [
  { id: 'qing', name: '清廷', color: 'var(--tr-qing)' },
  { id: 'org', name: '革命團體', color: 'var(--tr-org)' },
  { id: 'war', name: '起義與戰事', color: 'var(--tr-war)' },
  { id: 'gov', name: '民國政府', color: 'var(--tr-gov)' },
  { id: 'world', name: '列強與外國', sub: '課文提及', color: 'var(--tr-world)' },
];

// 課本標注的年號對照（只列課本出現過的）
XH.reigns = [
  { label: '光緒二十年', year: 1894, page: 6 },
  { label: '光緒二十七年', year: 1901, page: 20 },
  { label: '光緒三十年', year: 1904, page: 6 },
  { label: '光緒三十一年', year: 1905, page: 6 },
  { label: '宣統三年', year: 1911, page: 8 },
  { label: '民國元年', year: 1912, page: 11 },
  { label: '民國二年', year: 1913, page: 22 },
  { label: '民國四年', year: 1915, page: 23 },
  { label: '民國五年', year: 1916, page: 23 },
];
