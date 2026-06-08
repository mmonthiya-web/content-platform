/**
 * store.js — 内容平台统一数据层
 * 所有页面通过 Store.xxx 读写，数据持久化到 localStorage
 * 
 * 数据结构：
 *   drafts   — 草稿（草稿库 / 创作页 / 首页 / 日历 共用）
 *   suzai    — 素材库条目
 *   breakdown— 爆款拆解
 *   userName — 用户名
 *   brandContext — AI品牌设定
 *   brandTones   — 语气偏好
 *   genHistory   — AI生成历史
 */

const Store = (() => {

  /* ─── 草稿字段说明 ───
    id          : number  (Date.now())
    title       : string
    body        : string
    hashtags    : string[]
    cats        : string[]   ('skincare'|'lifestyle'|'food'|'travel'|'fashion')
    platform    : string     ('xhs')
    status      : string     ('draft'|'scheduled'|'published')
    schedDate   : string     ('YYYY-MM-DD')
    schedTime   : string     ('HH:MM')
    img         : string     (base64 or '')
    created     : string     ('YYYY-MM-DD')
    completeness: number     (0-100)
    fromAI      : boolean    (是否由AI生成)
  ─────────────────────── */

  const KEYS = {
    drafts:       'cp_drafts',
    suzai:        'cp_suzai',
    breakdown:    'cp_breakdown',
    userName:     'userName',
    brandContext: 'brandContext',
    brandTones:   'brandTones',
    genHistory:   'genHistory',
  };

  /* ── 初始草稿（首次运行时写入，之后以 localStorage 为准） ── */
  const SEED_DRAFTS = [
    {id:1001,title:'🧴 The Ordinary 果酸水保姆级使用指南',body:'第一次用TO果酸水？别急！新手必须先建立耐受...\n\n【第一步：低频开始】\n一周2-3次，从最低浓度开始\n皮肤不适立刻停用\n\n【第二步：观察皮肤】\n正常反应：轻微刺痛感（1-2分钟内消退）\n异常反应：持续灼热、大面积红肿',hashtags:['TO果酸水','护肤','功效成分','新手必看'],cats:['skincare'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-06-04',completeness:85,fromAI:false},
    {id:1002,title:'越懒的人皮肤越好？反直觉护肤法',body:'你有没有发现，身边那些皮肤超好的人，反而不怎么护肤？\n\n今天来聊聊「懒人护肤法」——为什么少折腾皮肤反而更好...',hashtags:['懒人护肤','极简护肤','护肤心得'],cats:['skincare'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-06-03',completeness:60,fromAI:false},
    {id:1003,title:'🌞 防晒误区大盘点！你每天都做错的那件事',body:'99%的人用防晒的姿势是错的！\n\n❌ 误区一：SPF越高越好\n✅ 正解：日常通勤SPF30 PA++足够...',hashtags:['防晒','护肤误区','成分党'],cats:['skincare'],platform:'xhs',status:'scheduled',schedDate:'2026-06-07',schedTime:'10:00',img:'',created:'2026-06-02',completeness:100,fromAI:false},
    {id:1004,title:'新加坡超平价好物分享 🛒',body:'在新加坡生活N年，这些平价好物真的回购无数次...',hashtags:['新加坡','好物分享','平价推荐'],cats:['lifestyle'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-06-01',completeness:40,fromAI:false},
    {id:1005,title:'28天皮肤蜕变计划：油痘肌到哑光肌全过程',body:'28天前，我的脸是这样的...\n（对比图）\n\n28天后，真的变了！来分享一下我的全过程...',hashtags:['护肤','28天挑战','油痘肌'],cats:['skincare'],platform:'xhs',status:'published',schedDate:'2026-06-01',schedTime:'09:00',img:'',created:'2026-05-28',completeness:100,fromAI:false},
    {id:1006,title:'敏感肌选防晒指南：4个关键指标',body:'敏感肌选防晒最怕踩雷，今天教你4个选品指标...',hashtags:['敏感肌','防晒选择','护肤'],cats:['skincare'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-05-30',completeness:70,fromAI:false},
    {id:1007,title:'📱 我的桌面收纳好物清单（附购买链接）',body:'工作台乱成一团？来看看我的收纳方案！\n\n1. 桌面收纳盒：宜家TJENA系列\n2. 显示器支架：乐歌E1...',hashtags:['桌面收纳','好物推荐','居家'],cats:['lifestyle'],platform:'xhs',status:'draft',schedDate:'',schedTime:'',img:'',created:'2026-05-27',completeness:55,fromAI:false},
    {id:1008,title:'新加坡周末去哪里？5个适合拍照的打卡地',body:'住新加坡这么久，发现这5个地方特别适合周末打卡...',hashtags:['新加坡','周末打卡','拍照地'],cats:['travel'],platform:'xhs',status:'scheduled',schedDate:'2026-06-10',schedTime:'14:00',img:'',created:'2026-05-25',completeness:90,fromAI:false},
  ];

  /* ── 内部读写 ── */
  function _get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function _set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('Store._set failed:', e); }
  }

  /* ── 初始化：首次访问时植入种子数据 ── */
  function init() {
    if (_get(KEYS.drafts) === null) {
      _set(KEYS.drafts, SEED_DRAFTS);
    }
  }

  /* ══════════════ 草稿 CRUD ══════════════ */

  function getDrafts() {
    return _get(KEYS.drafts) || [];
  }

  function saveDrafts(drafts) {
    _set(KEYS.drafts, drafts);
    _dispatch('drafts-updated');
  }

  /** 新建草稿，返回新草稿对象 */
  function createDraft(partial = {}) {
    const drafts = getDrafts();
    const newDraft = {
      id: Date.now(),
      title: '',
      body: '',
      hashtags: [],
      cats: [],
      platform: 'xhs',
      status: 'draft',
      schedDate: '',
      schedTime: '',
      img: '',
      created: new Date().toISOString().slice(0, 10),
      completeness: 0,
      fromAI: false,
      ...partial,
    };
    drafts.unshift(newDraft);
    saveDrafts(drafts);
    return newDraft;
  }

  /** 更新草稿（按 id） */
  function updateDraft(id, changes) {
    const drafts = getDrafts();
    const idx = drafts.findIndex(d => d.id === id);
    if (idx === -1) return null;
    drafts[idx] = { ...drafts[idx], ...changes };
    saveDrafts(drafts);
    return drafts[idx];
  }

  /** 删除草稿 */
  function deleteDraft(id) {
    const drafts = getDrafts().filter(d => d.id !== id);
    saveDrafts(drafts);
  }

  /** 将 AI 生成结果存为草稿，返回新草稿 */
  function saveAIDraft({ headline, body, hashtags, tone, topic }) {
    return createDraft({
      title: headline || topic || '',
      body: body || '',
      hashtags: hashtags || [],
      fromAI: true,
      completeness: calcCompleteness({ title: headline, body, hashtags, cats: [], schedDate: '', img: '' }),
    });
  }

  /** 计算完成度 */
  function calcCompleteness({ title, body, hashtags, cats, schedDate, img }) {
    const checks = [
      !!title && title.trim().length > 0,
      !!body && body.trim().length > 50,
      hashtags && hashtags.length > 0,
      cats && cats.length > 0,
      !!schedDate,
      !!img,
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }

  /* ══════════════ 统计快照（首页流水线用） ══════════════ */

  function getStats() {
    const drafts = getDrafts();
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const monthStr  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    const total       = drafts.length;
    const draftCount  = drafts.filter(d => d.status === 'draft').length;
    const scheduled   = drafts.filter(d => d.status === 'scheduled');
    const published   = drafts.filter(d => d.status === 'published');

    // 本周排期
    const weekSched = scheduled.filter(d => {
      if (!d.schedDate) return false;
      const dt = new Date(d.schedDate);
      return dt >= weekStart && dt <= weekEnd;
    }).length;

    // 本月发布
    const monthPub = published.filter(d =>
      d.schedDate && d.schedDate.startsWith(monthStr)
    ).length;

    // 完成度最高的草稿（首页优先展示）
    const priorityDrafts = drafts
      .filter(d => d.status === 'draft' && d.completeness >= 40)
      .sort((a, b) => b.completeness - a.completeness)
      .slice(0, 3);

    return {
      total,
      draftCount,
      scheduledCount: scheduled.length,
      publishedCount: published.length,
      weekSched,
      monthPub,
      priorityDrafts,
    };
  }

  /* ══════════════ 素材库 ══════════════ */

  function getSuzai() {
    return _get(KEYS.suzai) || [];
  }
  function saveSuzai(items) {
    _set(KEYS.suzai, items);
    _dispatch('suzai-updated');
  }
  function addSuzaiItem(item) {
    const items = getSuzai();
    const newItem = { id: Date.now(), ...item };
    items.unshift(newItem);
    saveSuzai(items);
    return newItem;
  }

  /* ══════════════ 爆款拆解 ══════════════ */

  function getBreakdowns() {
    return _get(KEYS.breakdown) || [];
  }
  function saveBreakdowns(items) {
    _set(KEYS.breakdown, items);
    _dispatch('breakdown-updated');
  }

  /* ══════════════ 用户设置 ══════════════ */

  function getUserName() {
    return localStorage.getItem(KEYS.userName) || '访客';
  }
  function setUserName(name) {
    localStorage.setItem(KEYS.userName, name);
    _dispatch('user-updated');
  }

  function getBrandContext() {
    return localStorage.getItem(KEYS.brandContext) || '';
  }
  function setBrandContext(ctx) {
    localStorage.setItem(KEYS.brandContext, ctx);
  }

  function getBrandTones() {
    return _get(KEYS.brandTones) || [];
  }
  function setBrandTones(tones) {
    _set(KEYS.brandTones, tones);
  }

  function getGenHistory() {
    return _get(KEYS.genHistory) || [];
  }
  function addGenHistory(entry) {
    const hist = getGenHistory();
    hist.unshift({ ...entry, ts: Date.now() });
    _set(KEYS.genHistory, hist.slice(0, 20));
  }

  /* ══════════════ 跨页通知（BroadcastChannel） ══════════════ */
  // 同一浏览器内多个标签打开时，数据变更会自动通知其他页面

  const _channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('cp_store')
    : null;

  function _dispatch(event) {
    if (_channel) _channel.postMessage({ event });
  }

  /** 监听其他页面的数据变更，回调 fn(event) */
  function onChange(fn) {
    if (_channel) _channel.onmessage = e => fn(e.data.event);
  }

  /* ══════════════ 草稿分类 CRUD ══════════════ */

  const DEFAULT_CATS = [
    {id:'xhs',      label:'小红书', color:'#F5E4D5', text:'#864C24'},
    {id:'lifestyle', label:'生活方式',color:'#E6EEE0', text:'#3E5432'},
    {id:'skincare',  label:'护肤',   color:'#ECE8F5', text:'#5340A0'},
    {id:'food',      label:'美食',   color:'#F2E8D0', text:'#7A5518'},
    {id:'travel',    label:'旅行',   color:'#E8EEF5', text:'#2A5080'},
    {id:'fashion',   label:'穿搭',   color:'#F5EBF0', text:'#803060'},
  ];

  const CATS_KEY = 'cp_cats';

  function getCats() {
    return _get(CATS_KEY) || DEFAULT_CATS;
  }

  function saveCats(cats) {
    _set(CATS_KEY, cats);
    _dispatch('cats-updated');
  }

  function addCat({ label, color, text }) {
    const cats = getCats();
    // id = 小写拼音/英文，去重
    const id = 'cat_' + Date.now();
    cats.push({ id, label, color: color || '#E8EEF5', text: text || '#2A5080' });
    saveCats(cats);
    return id;
  }

  function deleteCat(id) {
    const cats = getCats().filter(c => c.id !== id);
    saveCats(cats);
    // 同时把草稿里用到这个分类的条目移除该分类
    const drafts = getDrafts().map(d => ({
      ...d,
      cats: (d.cats || []).filter(c => c !== id),
    }));
    saveDrafts(drafts);
  }

  /* ══════════════ 爆款拆解导入 ══════════════ */

  /**
   * 导入一条爆款拆解 JSON，同时提取素材入库
   * JSON 格式（来自 Claude 分析）：
   * {
   *   title, url?, date?, summary?,
   *   hook, hookType?, hookTrigger?,
   *   titleFormula?, titleExample?,
   *   cta?, ctaTarget?,
   *   keywords?: [],
   *   tips?: [],
   *   xtags?: [],
   * }
   */
  function importBreakdown(raw) {
    // 支持数组或单对象
    const list = Array.isArray(raw) ? raw : [raw];
    const newItems = [];
    const newBDs = [];

    list.forEach(bd => {
      if (!bd.title) return;

      const bdId = Date.now() + Math.random();
      const dateStr = bd.date || new Date().toISOString().slice(0, 10);

      // 存入爆款拆解库
      const bdEntry = {
        id: bdId,
        title: bd.title,
        url: bd.url || '',
        date: dateStr,
        likes: bd.likes || 0,
        saves: bd.saves || 0,
        summary: bd.summary || '',
        hook: bd.hook || '',
        hookType: bd.hookType || '',
        hookTrigger: bd.hookTrigger || '',
        formula: bd.titleFormula || '',
        formulaExample: bd.titleExample || '',
        cta: bd.cta || '',
        ctaTarget: bd.ctaTarget || '',
        tips: bd.tips || [],
        xtags: bd.xtags || bd.keywords || [],
      };
      newBDs.push(bdEntry);

      const src = [`爆款拆解·${bd.title.slice(0, 10)}`];

      // 提取 Hook → 素材库
      if (bd.hook) newItems.push({
        id: Date.now() + Math.random(),
        type: 'hook', status: 'unused',
        title: bd.hook,
        body: bd.hookTrigger ? `触发原因：${bd.hookTrigger}` : '',
        source: src, date: dateStr,
      });

      // 提取标题公式 → 素材库
      if (bd.titleFormula) newItems.push({
        id: Date.now() + Math.random(),
        type: 'title', status: 'unused',
        title: bd.titleFormula,
        body: bd.titleExample || '',
        source: src, date: dateStr,
      });

      // 提取 CTA → 素材库
      if (bd.cta) newItems.push({
        id: Date.now() + Math.random(),
        type: 'cta', status: 'unused',
        title: bd.cta,
        body: bd.ctaTarget ? `目标：${bd.ctaTarget}` : '',
        source: src, date: dateStr,
      });

      // 提取 summary → 灵感
      if (bd.summary) newItems.push({
        id: Date.now() + Math.random(),
        type: 'inspire', status: 'unused',
        title: bd.title,
        body: bd.summary,
        source: src, date: dateStr,
      });
    });

    // 合并存入
    const allBDs = [...getBreakdowns(), ...newBDs];
    saveBreakdowns(allBDs);

    const allItems = [...getSuzai(), ...newItems];
    saveSuzai(allItems);

    _dispatch('breakdown-updated');
    _dispatch('suzai-updated');

    return { bdCount: newBDs.length, itemCount: newItems.length };
  }

  /* ── 公开 API ── */
  return {
    init,
    // 草稿
    getDrafts, saveDrafts, createDraft, updateDraft, deleteDraft,
    saveAIDraft, calcCompleteness,
    // 统计
    getStats,
    // 素材
    getSuzai, saveSuzai, addSuzaiItem,
    // 爆款拆解
    getBreakdowns, saveBreakdowns,
    // 导入
    importBreakdown,
    // 分类
    getCats, saveCats, addCat, deleteCat,
    // 用户
    getUserName, setUserName,
    getBrandContext, setBrandContext,
    getBrandTones, setBrandTones,
    getGenHistory, addGenHistory,
    // 跨页监听
    onChange,
  };
})();

// 页面加载时自动初始化
Store.init();
