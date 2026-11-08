/* =========================================================
   02-config.js
   ========================================================= */

const THEMES = {
  // 面包原野系列 (纯正烘焙，无快餐)
  default:         { name: '🍞 面包原野', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩'], level: 0 },
  'default-plus':  { name: '✨ 面包原野 Plus', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩','🥞','🧈','🥛','🧁','🍰','🥧'], level: 0, cost: 15000 },
  'default-max':   { name: '👑 面包原野 Max', emojis: ['🍞','🥐','🥖','🥯','🥨','🧇','🥪','🍩','🥞','🧈','🥛','🧁','🍰','🥧','🍪','🍫','🍬','🍭','🍮','🍯','🍦','🍧','🍨'], level: 0, cost: 30000 },

  // 新春大吉系列 (加入了糖)
  spring:          { name: '🧧 新春大吉', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊'], level: 0, isSpring: true },
  'spring-plus':   { name: '✨ 新春大吉 Plus', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊','🍬','🍭'], level: 0, isSpring: true, cost: 15000 },
  'spring-max':    { name: '👑 新春大吉 Max', emojis: ['🧧','🏮','🧨','🐉','🥟','🍊','🍬','🍭','🍫','🧁','🍩','🍪'], level: 0, isSpring: true, cost: 30000 },

  // 美食天堂系列
  food:            { name: '🍔 美食天堂', emojis: ['🍔','🍕','🍟','🍗'], level: 0 },
  'food-plus':     { name: '✨ 美食天堂 Plus', emojis: ['🍔','🍕','🍟','🍗','🌭','🌮','🍣','🍜'], level: 0, cost: 15000 },
  'food-max':      { name: '👑 美食天堂 Max', emojis: ['🍔','🍕','🍟','🍗','🌭','🌮','🍣','🍜','🍝','🍤','🍩','🍦','🍰','🍫','🍬','🍿','🥟','🍱','🥗','🥪','🥙','🥘','🍲','🍛','🍚','🍙','🍘','🍥','🍡','🍧','🍨','🧁','🍮','🍭','🍪','🌰','🥜'], level: 0, cost: 30000 },

  // 水果圣地系列
  fruit:           { name: '🍎 水果圣地', emojis: ['🍎','🍌','🍇','🍉'], level: 0 },
  'fruit-plus':    { name: '✨ 水果圣地 Plus', emojis: ['🍎','🍌','🍇','🍉','🍓','🍒','🍑','🍍'], level: 0, cost: 15000 },
  'fruit-max':     { name: '👑 水果圣地 Max', emojis: ['🍎','🍌','🍇','🍉','🍓','🍒','🍑','🍍','🥭','🍊','🍋','🍐','🥝','🫐','🥥','🥑','🍅','🍆','🥕','🌽','🥦','🍄'], level: 0, cost: 30000 },

  // 樱花漫舞系列
  sakura:          { name: '🌸 樱花漫舞', emojis: ['🌸','🌸','🦋'], level: 2, cost: 1500 },
  'sakura-plus':   { name: '✨ 樱花漫舞 Plus', emojis: ['🌸','🌸','🦋','🍃','💮'], level: 2, cost: 15000 },
  'sakura-max':    { name: '👑 樱花漫舞 Max', emojis: ['🌸','🌸','🦋','🍃','💮','🌺','🌷','🌹','🏵️'], level: 2, cost: 30000 },

  // 花语秘境系列 (价格调整为 5000 / 15000 / 30000)
  flower:          { name: '🌺 花语秘境', emojis: ['🌹','🌷','🌻'], level: 0, cost: 5000 },
  'flower-plus':   { name: '✨ 花语秘境 Plus', emojis: ['🌹','🌷','🌻','🌼','🌺'], level: 0, cost: 15000 },
  'flower-max':    { name: '👑 花语秘境 Max', emojis: ['🌹','🌷','🌻','🌼','🌺','🌸','🪷','🏵️','🦋'], level: 0, cost: 30000 },

  // 其他原有主题
  gold:            { name: '🪙 黄金时代', emojis: ['🪙','💰','💴','🪙'], level: 1 },
  'gold-plus':     { name: '✨ 黄金时代 Plus', emojis: ['🪙','💰','💴','🪙'], level: 1, cost: 15000 },
  cyber:           { name: '⚡ 赛博朋克', emojis: ['⚡','💻','🟢','⚡'], level: 1 },
  'cyber-plus':    { name: '✨ 赛博朋克 Plus', emojis: ['⚡','💻','🟢','⚡'], level: 1, cost: 15000 },
  forest:          { name: '🌿 绿野仙踪', emojis: ['🌿','🍀','🌱','🦋'], level: 1 },
  'forest-plus':   { name: '✨ 绿野仙踪 Plus', emojis: ['🌿','🍀','🌱','🦋'], level: 1, cost: 15000 },
  diamond:         { name: '💎 钻石星辰', emojis: ['💎','💠','✨'], level: 2, cost: 1500 },
  'diamond-plus':  { name: '✨ 钻石星辰 Plus', emojis: ['💎','💠','✨'], level: 2, cost: 15000 },
  aurora:          { name: '🌌 极光幻境', emojis: ['✨','🌌','🌟'], level: 2 },
  'aurora-plus':   { name: '✨ 极光幻境 Plus', emojis: ['✨','🌌','🌟'], level: 2, cost: 15000 },
  ocean:           { name: '🌊 深海幽蓝', emojis: ['🌊','🐬','🫧','🔱'], level: 2, cost: 1500 },
  'ocean-plus':    { name: '✨ 深海幽蓝 Plus', emojis: ['🌊','🐬','🫧','🔱'], level: 2, cost: 15000 },
  blackgold:       { name: '👑 暗夜黑金', emojis: ['👑','♠️','🪙'], level: 2, cost: 1500 },
  'blackgold-plus':{ name: '✨ 暗夜黑金 Plus', emojis: ['👑','♠️','🪙'], level: 2, cost: 15000 }
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