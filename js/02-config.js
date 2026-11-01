/* =========================================================
   02-config.js
   ========================================================= */

const THEMES = {
  default:         { name: '🍞 面包原野', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩'], level: 0 },
  'default-plus':  { name: '✨ 面包原野 Plus', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩'], level: 0 },
  gold:            { name: '🪙 黄金时代', emojis: ['🪙','💰','💴','🪙'], level: 1 },
  'gold-plus':     { name: '✨ 黄金时代 Plus', emojis: ['🪙','💰','💴','🪙'], level: 1 },
  cyber:           { name: '⚡ 赛博朋克', emojis: ['⚡','💻','🟢','⚡'], level: 1 },
  'cyber-plus':    { name: '✨ 赛博朋克 Plus', emojis: ['⚡','💻','🟢','⚡'], level: 1 },
  forest:          { name: '🌿 绿野仙踪', emojis: ['🌿','🍀','🌱','🦋'], level: 1 },
  'forest-plus':   { name: '✨ 绿野仙踪 Plus', emojis: ['🌿','🍀','🌱','🦋'], level: 1 },
  diamond:         { name: '💎 钻石星辰', emojis: ['💎','💠','✨'], level: 2, cost: 1500 },
  'diamond-plus':  { name: '✨ 钻石星辰 Plus', emojis: ['💎','💠','✨'], level: 2, cost: 1500 },
  sakura:          { name: '🌸 樱花漫舞', emojis: ['🌸','🌸','🦋'], level: 2, cost: 1500 },
  'sakura-plus':   { name: '✨ 樱花漫舞 Plus', emojis: ['🌸','🌸','🦋'], level: 2, cost: 1500 },
  aurora:          { name: '🌌 极光幻境', emojis: ['✨','🌌','🌟'], level: 2 },
  'aurora-plus':   { name: '✨ 极光幻境 Plus', emojis: ['✨','🌌','🌟'], level: 2 },
  ocean:           { name: '🌊 深海幽蓝', emojis: ['🌊','🐬','🫧','🔱'], level: 2, cost: 1500 },
  'ocean-plus':    { name: '✨ 深海幽蓝 Plus', emojis: ['🌊','🐬','🫧','🔱'], level: 2, cost: 1500 },
  blackgold:       { name: '👑 暗夜黑金', emojis: ['👑','♠️','🪙'], level: 2, cost: 1500 },
  'blackgold-plus':{ name: '✨ 暗夜黑金 Plus', emojis: ['👑','♠️','🪙'], level: 2, cost: 1500 },
  
  // 新春主题
  spring:          { name: '🧧 新春大吉', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊','💴','🎁'], level: 0, isSpring: true },
  'spring-plus':   { name: '✨ 新春大吉 Plus', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊','💴','🎁'], level: 0, isSpring: true }
};

const SHOP_THEMES = ['diamond', 'sakura', 'ocean', 'blackgold'];

const ENGINES = {
  quark:    { icon: '☁️', name: '夸克', url: 'https://quark.sm.cn/s?q=' },
  bing:     { icon: '🌏', name: '必应', url: 'https://www.bing.com/search?q=' },
  google:   { icon: '🎈', name: 'Google', url: 'https://www.google.com/search?q=' },
  deepseek: { icon: '🐋', name: 'DeepSeek (对话)', url: 'https://chat.deepseek.com/?autosend=1&q=' },
  bili:     { icon: '📺', name: 'B站', url: 'https://search.bilibili.com/all?keyword=' },
  github:   { icon: '🐙', name: 'GitHub', url: 'https://github.com/search?q=' }
};

const DEFAULT_SITES = [
  { name: '哔哩哔哩', url: 'https://www.bilibili.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'DeepSeek', url: 'https://www.deepseek.com' },
  { name: 'DeepSeek API', url: 'https://platform.deepseek.com' },
  { name: '豆包', url: 'https://www.doubao.com' },
  { name: 'Google', url: 'https://www.google.com' },
  { name: '微软账户', url: 'https://account.microsoft.com' },
  { name: '千问 API', url: 'https://dashscope.console.aliyun.com' }
];

const SHOP_ITEMS = [
  { label: '1 天', days: 1, base: 500 },
  { label: '7 天', days: 7, base: 3000 },
  { label: '1 个月', days: 30, base: 12000 },
  { label: '1 季度', days: 90, base: 34000 },
  { label: '1 年', days: 365, base: 120000 }
];

let currentHour = new Date().getHours();
let defaultTheme = (currentHour >= 7 && currentHour < 18) ? 'light' : 'dark';

let currentUser = store.get('bb-current-user', null);
let theme = store.get('bb-theme', defaultTheme);
let engineKey = store.get('bb-engine', 'quark');
if (!ENGINES[engineKey]) engineKey = 'quark';
let sites = [], history = [], currentTheme = 'default';