/**
 * store.js — Seedboard 统一数据层
 * 主存储：Supabase（跨设备同步）
 * 本地缓存：localStorage（页面快速渲染 + 离线保底）
 *
 * 调用方式（全部异步）：
 *   await Store.getDrafts()
 *   await Store.createDraft({...})
 *   await Store.updateDraft(id, {...})
 *   await Store.deleteDraft(id)
 *   ... 其余同理
 *
 * 兼容旧同步调用：
 *   Store.getDraftsSync()  — 直接读缓存，无需 await（用于渲染占位）
 */

const Store = (() => {

  /* ══════════════ Supabase 配置 ══════════════ */
  const SB_URL = 'https://zjmzxgvlpimtuelgdotz.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbXp4Z3ZscGltdHVlbGdkb3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDI4OTYsImV4cCI6MjA5NjQ3ODg5Nn0.Q1DDTcGa2Q90jbjeZPVewhwhczmkLmCbhAgThYixLOg';

  const SB_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SB_KEY,
    'Authorization': `Bearer ${SB_KEY}`,
    'Prefer': 'return=representation',
  };

  /* ══════════════ localStorage 缓存键 ══════════════ */
  const CACHE = {
    drafts:      'sb_drafts',
    suzai:       'sb_suzai',
    breakdowns:  'sb_breakdowns',
    settings:    'sb_settings',
    cats:        'sb_cats',
  };

  /* ══════════════ 种子草稿（首次初始化用） ══════════════ */
  const SEED_DRAFTS = [
    {id:1001,title:'🧴 The Ordinary 果酸水保姆级使用指南',body:'第一次用TO果酸水？别急！新手必须先建立耐受...\n\n【第一步：低频开始】\n一周2-3次，从最低浓度开始\n皮肤不适立刻停用',hashtags:['TO果酸水','护肤','功效成分','新手必看'],cats:['skincare'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-06-04',completeness:85,fromAI:false},
    {id:1002,title:'越懒的人皮肤越好？反直觉护肤法',body:'你有没有发现，身边那些皮肤超好的人，反而不怎么护肤？',hashtags:['懒人护肤','极简护肤','护肤心得'],cats:['skincare'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-06-03',completeness:60,fromAI:false},
    {id:1003,title:'🌞 防晒误区大盘点！你每天都做错的那件事',body:'99%的人用防晒的姿势是错的！\n\n❌ 误区一：SPF越高越好\n✅ 正解：日常通勤SPF30 PA++足够...',hashtags:['防晒','护肤误区','成分党'],cats:['skincare'],platform:'xhs',status:'scheduled',schedDate:'2026-06-07',schedTime:'10:00',img:'',created:'2026-06-02',completeness:100,fromAI:false},
    {id:1004,title:'新加坡超平价好物分享 🛒',body:'在新加坡生活N年，这些平价好物真的回购无数次...',hashtags:['新加坡','好物分享','平价推荐'],cats:['lifestyle'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-06-01',completeness:40,fromAI:false},
    {id:1005,title:'28天皮肤蜕变计划：油痘肌到哑光肌全过程',body:'28天前，我的脸是这样的...\n（对比图）\n\n28天后，真的变了！',hashtags:['护肤','28天挑战','油痘肌'],cats:['skincare'],platform:'xhs',status:'published',schedDate:'2026-06-01',schedTime:'09:00',img:'',created:'2026-05-28',completeness:100,fromAI:false},
    {id:1006,title:'敏感肌选防晒指南：4个关键指标',body:'敏感肌选防晒最怕踩雷，今天教你4个选品指标...',hashtags:['敏感肌','防晒选择','护肤'],cats:['skincare'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-05-30',completeness:70,fromAI:false},
    {id:1007,title:'📱 我的桌面收纳好物清单（附购买链接）',body:'工作台乱成一团？来看看我的收纳方案！',hashtags:['桌面收纳','好物推荐','居家'],cats:['lifestyle'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-05-27',completeness:55,fromAI:false},
    {id:1008,title:'新加坡周末去哪里？5个适合拍照的打卡地',body:'住新加坡这么久，发现这5个地方特别适合周末打卡...',hashtags:['新加坡','周末打卡','拍照地'],cats:['travel'],platform:'xhs',status:'scheduled',schedDate:'2026-06-10',schedTime:'14:00',img:'',created:'2026-05-25',completeness:90,fromAI:false},
  ];

  const DEFAULT_CATS = [
    {id:'xhs',      label:'小红书', color:'#F5E4D5', text:'#864C24'},
    {id:'lifestyle', label:'生活方式',color:'#E6EEE0', text:'#3E5432'},
    {id:'skincare',  label:'护肤',   color:'#ECE8F5', text:'#5340A0'},
    {id:'food',      label:'美食',   color:'#F2E8D0', text:'#7A5518'},
    {id:'travel',    label:'旅行',   color:'#E8EEF5', text:'#2A5080'},
    {id:'fashion',   label:'穿搭',   color:'#F5EBF0', text:'#803060'},
  ];

  /* ══════════════ 内部工具 ══════════════ */

  function _cacheGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function _cacheSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  /* Supabase REST 请求 */
  async function _sb(method, table, body = null, query = '') {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/${table}${query}`, {
        method,
        headers: SB_HEADERS,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const err = await res.text();
        console.warn(`Supabase ${method} ${table} error:`, err);
        return null;
      }
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch (e) {
      console.warn('Supabase fetch failed (offline?):', e.message);
      return null;
    }
  }

  /* 草稿：JS 对象 ↔ DB 行 互转 */
  function _draftToRow(d) {
    return {
      id:           d.id,
      title:        d.title        || '',
      body:         d.body         || '',
      hashtags:     d.hashtags     || [],
      cats:         d.cats         || [],
      platform:     d.platform     || 'xhs',
      status:       d.status       || 'draft',
      sched_date:   d.schedDate    || '',
      sched_time:   d.schedTime    || '',
      img:          d.img          || '',
      created:      d.created      || new Date().toISOString().slice(0,10),
      completeness: d.completeness || 0,
      from_ai:      d.fromAI       || false,
    };
  }
  function _rowToDraft(r) {
    return {
      id:           r.id,
      title:        r.title,
      body:         r.body,
      hashtags:     r.hashtags     || [],
      cats:         r.cats         || [],
      platform:     r.platform,
      status:       r.status,
      schedDate:    r.sched_date,
      schedTime:    r.sched_time,
      img:          r.img,
      created:      r.created,
      completeness: r.completeness,
      fromAI:       r.from_ai,
    };
  }

  /* 素材：JS ↔ DB */
  function _suzaiToRow(s) {
    return {
      id:     s.id,
      type:   s.type   || 'inspire',
      status: s.status || 'unused',
      title:  s.title  || '',
      body:   s.body   || '',
      source: s.source || [],
      date:   s.date   || new Date().toISOString().slice(0,10),
    };
  }
  function _rowToSuzai(r) { return { ...r }; }

  /* 爆款拆解：JS ↔ DB */
  function _bdToRow(b) {
    return {
      id:              b.id,
      title:           b.title           || '',
      url:             b.url             || '',
      date:            b.date            || '',
      likes:           b.likes           || 0,
      saves:           b.saves           || 0,
      summary:         b.summary         || '',
      hook:            b.hook            || '',
      hook_type:       b.hookType        || '',
      hook_trigger:    b.hookTrigger     || '',
      formula:         b.formula         || '',
      formula_example: b.formulaExample  || '',
      cta:             b.cta             || '',
      cta_target:      b.ctaTarget       || '',
      tips:            b.tips            || [],
      xtags:           b.xtags           || [],
    };
  }
  function _rowToBd(r) {
    return {
      id:            r.id,
      title:         r.title,
      url:           r.url,
      date:          r.date,
      likes:         r.likes,
      saves:         r.saves,
      summary:       r.summary,
      hook:          r.hook,
      hookType:      r.hook_type,
      hookTrigger:   r.hook_trigger,
      formula:       r.formula,
      formulaExample:r.formula_example,
      cta:           r.cta,
      ctaTarget:     r.cta_target,
      tips:          Array.isArray(r.tips)  ? r.tips  : (typeof r.tips  === 'string' ? JSON.parse(r.tips||'[]')  : []),
      xtags:         Array.isArray(r.xtags) ? r.xtags : (typeof r.xtags === 'string' ? JSON.parse(r.xtags||'[]') : []),
    };
  }

  /* ══════════════ 初始化 ══════════════ */

  async function init() {
    const rows = await _sb('GET', 'drafts', null, '?order=id.desc');
    if (rows && rows.length > 0) {
      // 有云端数据 → 更新缓存
      _cacheSet(CACHE.drafts, rows.map(_rowToDraft));
    } else if (rows !== null && rows.length === 0) {
      // 云端是空的（首次使用）→ 植入种子数据
      const existing = _cacheGet(CACHE.drafts);
      const seeds = existing && existing.length > 0 ? existing : SEED_DRAFTS;
      _cacheSet(CACHE.drafts, seeds);
      // 逐条 upsert 写入 Supabase（避免批量 POST 被拦截）
      for (const d of seeds) {
        await _sbUpsert('drafts', _draftToRow(d));
      }
    }
    // 拉素材和拆解
    const [suzaiRows, bdRows] = await Promise.all([
      _sb('GET', 'suzai',      null, '?order=id.desc'),
      _sb('GET', 'breakdowns', null, '?order=id.desc'),
    ]);
    if (suzaiRows)  _cacheSet(CACHE.suzai,      suzaiRows.map(_rowToSuzai));
    if (bdRows)     _cacheSet(CACHE.breakdowns, bdRows.map(_rowToBd));

    // 拉用户设置
    const settingRows = await _sb('GET', 'user_settings', null, '');
    if (settingRows) {
      const obj = {};
      settingRows.forEach(r => { obj[r.key] = r.value; });
      _cacheSet(CACHE.settings, obj);
      if (obj.cats) {
        // 云端有分类数据 → 以云端为准写入缓存
        try { _cacheSet(CACHE.cats, JSON.parse(obj.cats)); } catch {}
      } else {
        // 云端没有分类记录（首次使用）→ 把 DEFAULT_CATS 写入 Supabase 持久化
        // 这样后续的增删操作才能真正保存
        const initCats = _cacheGet(CACHE.cats) || DEFAULT_CATS;
        _cacheSet(CACHE.cats, initCats);
        await _sbSetting('cats', JSON.stringify(initCats));
      }
    }

    _dispatch('store-ready');
  }

  /* Supabase upsert 单条（on_conflict=id） */
  async function _sbUpsert(table, row) {
    return _sb('POST', table, [row], '?on_conflict=id');
  }

  /* ══════════════ 草稿 CRUD ══════════════ */

  function getDraftsSync() {
    return _cacheGet(CACHE.drafts) || [];
  }

  async function getDrafts() {
    return getDraftsSync();
  }

  async function saveDrafts(drafts) {
    _cacheSet(CACHE.drafts, drafts);
    _dispatch('drafts-updated');
    // 逐条 upsert（比全量删除+插入更可靠）
    for (const d of drafts) {
      await _sbUpsert('drafts', _draftToRow(d));
    }
  }

  async function createDraft(partial = {}) {
    const drafts = getDraftsSync();
    const newDraft = {
      id: Date.now(),
      title: '', body: '', hashtags: [], cats: [],
      platform: 'xhs', status: 'draft',
      schedDate: '', schedTime: '', img: '',
      created: new Date().toISOString().slice(0,10),
      completeness: 0, fromAI: false,
      ...partial,
    };
    drafts.unshift(newDraft);
    _cacheSet(CACHE.drafts, drafts);
    _dispatch('drafts-updated');
    await _sbUpsert('drafts', _draftToRow(newDraft));
    return newDraft;
  }

  async function updateDraft(id, changes) {
    const drafts = getDraftsSync();
    const idx = drafts.findIndex(d => d.id === id);
    if (idx === -1) return null;
    drafts[idx] = { ...drafts[idx], ...changes };
    _cacheSet(CACHE.drafts, drafts);
    _dispatch('drafts-updated');
    await _sbUpsert('drafts', _draftToRow(drafts[idx]));
    return drafts[idx];
  }

  async function deleteDraft(id) {
    const drafts = getDraftsSync().filter(d => d.id !== id);
    _cacheSet(CACHE.drafts, drafts);
    _dispatch('drafts-updated');
    await _sb('DELETE', 'drafts', null, `?id=eq.${id}`);
  }

  async function saveAIDraft({ headline, body, hashtags }) {
    return createDraft({
      title: headline || '',
      body: body || '',
      hashtags: hashtags || [],
      fromAI: true,
      completeness: calcCompleteness({
        title: headline, body, hashtags, cats: [], schedDate: '', img: ''
      }),
    });
  }

  function calcCompleteness({ title, body, hashtags, cats, schedDate, img }) {
    const checks = [
      !!title && title.trim().length > 0,
      !!body  && body.trim().length  > 50,
      hashtags && hashtags.length > 0,
      cats     && cats.length     > 0,
      !!schedDate, !!img,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }

  /* ══════════════ 统计（同步，基于缓存） ══════════════ */

  function getStats() {
    const drafts   = getDraftsSync();
    const now      = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const monthStr  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    const draftCount  = drafts.filter(d => d.status === 'draft').length;
    const scheduled   = drafts.filter(d => d.status === 'scheduled');
    const published   = drafts.filter(d => d.status === 'published');

    const weekSched = scheduled.filter(d => {
      if (!d.schedDate) return false;
      const dt = new Date(d.schedDate);
      return dt >= weekStart && dt <= weekEnd;
    }).length;

    const monthPub = published.filter(d =>
      d.schedDate && d.schedDate.startsWith(monthStr)
    ).length;

    const priorityDrafts = drafts
      .filter(d => d.status === 'draft' && d.completeness >= 40)
      .sort((a, b) => b.completeness - a.completeness)
      .slice(0, 3);

    return {
      total: drafts.length, draftCount,
      scheduledCount: scheduled.length, publishedCount: published.length,
      weekSched, monthPub, priorityDrafts,
    };
  }

  /* ══════════════ 素材库 ══════════════ */

  function getSuzai()           { return _cacheGet(CACHE.suzai) || []; }
  function getSuzaiSync()       { return getSuzai(); }

  async function saveSuzai(items) {
    _cacheSet(CACHE.suzai, items);
    _dispatch('suzai-updated');
    for (const s of items) await _sbUpsert('suzai', _suzaiToRow(s));
  }

  async function addSuzaiItem(item) {
    const items = getSuzai();
    const newItem = { id: Date.now(), ...item };
    items.unshift(newItem);
    _cacheSet(CACHE.suzai, items);
    _dispatch('suzai-updated');
    await _sbUpsert('suzai', _suzaiToRow(newItem));
    return newItem;
  }

  /* ══════════════ 爆款拆解 ══════════════ */

  function getBreakdowns()      { return _cacheGet(CACHE.breakdowns) || []; }
  function getBreakdownsSync()  { return getBreakdowns(); }

  async function saveBreakdowns(items) {
    _cacheSet(CACHE.breakdowns, items);
    _dispatch('breakdown-updated');
    for (const b of items) await _sbUpsert('breakdowns', _bdToRow(b));
  }

  /* ══════════════ 爆款导入 ══════════════ */

  async function importBreakdown(raw) {
    const list = Array.isArray(raw) ? raw : [raw];
    const newItems = [];
    const newBDs   = [];

    list.forEach(bd => {
      if (!bd.title) return;
      const id      = Date.now() + Math.floor(Math.random()*10000);
      const dateStr = bd.date || new Date().toISOString().slice(0,10);
      const src     = [`爆款拆解·${bd.title.slice(0,10)}`];

      newBDs.push({
        id, title: bd.title, url: bd.url||'', date: dateStr,
        likes: bd.likes||0, saves: bd.saves||0, summary: bd.summary||'',
        hook: bd.hook||'', hookType: bd.hookType||'', hookTrigger: bd.hookTrigger||'',
        formula: bd.titleFormula||'', formulaExample: bd.titleExample||'',
        cta: bd.cta||'', ctaTarget: bd.ctaTarget||'',
        tips: bd.tips||[], xtags: bd.xtags||bd.keywords||[],
      });

      const push = (type, title, body) => newItems.push({
        id: Date.now() + Math.floor(Math.random()*10000),
        type, status:'unused', title, body, source: src, date: dateStr,
      });

      if (bd.hook)         push('hook',    bd.hook,         bd.hookTrigger?`触发原因：${bd.hookTrigger}`:'');
      if (bd.titleFormula) push('title',   bd.titleFormula, bd.titleExample||'');
      if (bd.cta)          push('cta',     bd.cta,          bd.ctaTarget?`目标：${bd.ctaTarget}`:'');
      if (bd.summary)      push('inspire', bd.title,        bd.summary);
    });

    const allBDs   = [...getBreakdowns(), ...newBDs];
    const allItems = [...getSuzai(),      ...newItems];

    _cacheSet(CACHE.breakdowns, allBDs);
    _cacheSet(CACHE.suzai, allItems);
    _dispatch('breakdown-updated');
    _dispatch('suzai-updated');

    // 写 Supabase（逐条 upsert）
    for (const b of newBDs)   await _sbUpsert('breakdowns', _bdToRow(b));
    for (const s of newItems) await _sbUpsert('suzai',      _suzaiToRow(s));

    return { bdCount: newBDs.length, itemCount: newItems.length };
  }

  /* ══════════════ 分类 ══════════════ */

  function getCats() {
    return _cacheGet(CACHE.cats) || DEFAULT_CATS;
  }

  async function saveCats(cats) {
    _cacheSet(CACHE.cats, cats);
    _dispatch('cats-updated');
    await _sbSetting('cats', JSON.stringify(cats));
  }

  async function addCat({ label, color, text }) {
    const cats = getCats();
    const id   = 'cat_' + Date.now();
    const r    = parseInt(color.slice(1,3),16),
          g    = parseInt(color.slice(3,5),16),
          b    = parseInt(color.slice(5,7),16);
    const lum  = (0.299*r + 0.587*g + 0.114*b) / 255;
    cats.push({ id, label, color: color||'#E8EEF5', text: text||(lum>0.6?'#3a3a4a':'#ffffff') });
    await saveCats(cats);
    return id;
  }

  async function deleteCat(id) {
    const cats   = getCats().filter(c => c.id !== id);
    await saveCats(cats);
    // 从草稿中移除
    const drafts = getDraftsSync().map(d => ({
      ...d, cats: (d.cats||[]).filter(c => c !== id),
    }));
    await saveDrafts(drafts);
  }

  /* ══════════════ 用户设置 ══════════════ */

  async function _sbSetting(key, value) {
    await _sb('POST', 'user_settings', [{ key, value }], '?on_conflict=key');
    const cache = _cacheGet(CACHE.settings) || {};
    cache[key] = value;
    _cacheSet(CACHE.settings, cache);
  }
  function _settingGet(key, fallback = '') {
    const cache = _cacheGet(CACHE.settings) || {};
    return cache[key] !== undefined ? cache[key] : (localStorage.getItem(key) || fallback);
  }

  function getUserName()       { return _settingGet('userName', '访客'); }
  async function setUserName(name) {
    await _sbSetting('userName', name);
    _dispatch('user-updated');
  }

  function getBrandContext()   { return _settingGet('brandContext', ''); }
  async function setBrandContext(ctx) { await _sbSetting('brandContext', ctx); }

  function getBrandTones() {
    const v = _settingGet('brandTones', '[]');
    try { return JSON.parse(v); } catch { return []; }
  }
  async function setBrandTones(tones) { await _sbSetting('brandTones', JSON.stringify(tones)); }

  function getGenHistory() {
    const v = _settingGet('genHistory', '[]');
    try { return JSON.parse(v); } catch { return []; }
  }
  async function addGenHistory(entry) {
    const hist = getGenHistory();
    hist.unshift({ ...entry, ts: Date.now() });
    await _sbSetting('genHistory', JSON.stringify(hist.slice(0, 20)));
  }

  /* ══════════════ 跨页通知 ══════════════ */

  const _channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('cp_store') : null;

  function _dispatch(event) {
    if (_channel) _channel.postMessage({ event });
  }
  function onChange(fn) {
    if (_channel) _channel.onmessage = e => fn(e.data.event);
  }

  /* ── 公开 API ── */
  return {
    init,
    // 内部缓存直写（auto-save 专用，不触发 Supabase）
    _cacheSetDrafts: (drafts) => _cacheSet(CACHE.drafts, drafts),
    // 草稿（异步）
    getDrafts, getDraftsSync, saveDrafts, createDraft,
    updateDraft, deleteDraft, saveAIDraft, calcCompleteness,
    // 统计（同步）
    getStats,
    // 素材（混合）
    getSuzai, getSuzaiSync, saveSuzai, addSuzaiItem,
    // 拆解
    getBreakdowns, getBreakdownsSync, saveBreakdowns,
    // 导入
    importBreakdown,
    // 分类
    getCats, saveCats, addCat, deleteCat,
    // 用户
    getUserName, setUserName,
    getBrandContext, setBrandContext,
    getBrandTones, setBrandTones,
    getGenHistory, addGenHistory,
    // 跨页
    onChange,
  };
})();

// 页面加载时初始化（异步，不阻塞渲染）
Store.init().then(() => {
  // 初始化完成后通知页面刷新数据
  if (typeof onStoreReady === 'function') onStoreReady();
});
