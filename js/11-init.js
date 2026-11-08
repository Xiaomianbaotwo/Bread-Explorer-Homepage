/* =========================================================
   11-init.js
   时钟、每日一句、启动连接遮罩、真实进度条、云端拉取
   ========================================================= */

function tick() {
  const now = new Date();
  $('#clock').innerHTML = pad(now.getHours()) + '<span class="colon">:</span>' + pad(now.getMinutes()) + '<span class="colon">:</span>' + pad(now.getSeconds());
  $('#dateLine').textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 星期' + '日一二三四五六'[now.getDay()];
  const h = now.getHours();
  let greet = '夜深了，面包房也打烊啦 🌙';
  if (h >= 5 && h < 9) greet = '早安！来一份刚出炉的早餐吧 🌅';
  else if (h < 12) greet = '上午好，吐司正在烤制中… 🍞';
  else if (h < 14) greet = '午好！法棍三明治时间 🥪';
  else if (h < 18) greet = '下午好，配一块可颂刚刚好 🥐';
  else if (h < 22) greet = '晚上好，牛角包配月光 🌆';
  $('#greeting').textContent = greet;
}
setInterval(tick, 1000); tick();

(function initQuote() {
  const QUOTES = [
    '面包会有的，牛奶也会有的。', '每一个不曾起舞的日子，都是对生命的辜负。', '生活明朗，万物可爱。', '慢一点也没关系，只要在往前走。', '今天也要好好吃饭呀 🍞', '愿你所求皆如愿，所行化坦途。', '心动不如行动，行动不如马上。', '别慌，月亮也正在大海某处迷茫。', '愿你眼里有光，心中有暖，脚下有路。', '把日子过成自己喜欢的样子。'
  ];
  const q = $('#quote');
  if (q) q.textContent = '—— ' + QUOTES[Math.floor(Math.random() * QUOTES.length)];
})();

function spawnBread() {
  const b = document.createElement('span'); b.className = 'bread';
  b.style.left = Math.random() * 96 + 'vw';
  b.style.fontSize = (18 + Math.random() * 32) + 'px';
  const dur = 24 + Math.random() * 26;
  b.style.animationDuration = dur + 's'; b.style.animationDelay = (-Math.random() * dur) + 's';
  b.style.setProperty('--op', (0.3 + Math.random() * 0.45).toFixed(2));
  const inner = document.createElement('i');
  const pool = THEMES[currentTheme] ? THEMES[currentTheme].emojis : ['🍞'];
  inner.textContent = pool[Math.floor(Math.random() * pool.length)];
  inner.style.animationDuration = (2.5 + Math.random() * 3) + 's'; inner.style.animationDelay = (-Math.random() * 3) + 's';
  b.appendChild(inner); b.onclick = e => popBread(b, e); $('#breadBg').appendChild(b);
}

function popBread(b, e) {
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('span'); c.className = 'crumb';
    c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
    if (currentTheme === 'gold') c.style.background = '#f1c40f';
    else if (currentTheme === 'diamond') c.style.background = '#9b59b6';
    else if (currentTheme === 'sakura') c.style.background = '#ffb6c1';
    else if (currentTheme === 'cyber') c.style.background = '#00ff64';
    else if (currentTheme === 'flame') c.style.background = '#ff4500';
    else if (currentTheme === 'aurora') c.style.background = '#64ffda';
    else if (currentTheme === 'blackgold') c.style.background = '#e6c27a';
    else if (currentTheme === 'forest') c.style.background = '#00e676';
    else if (currentTheme === 'ocean') c.style.background = '#64ffda';
    else c.style.background = '#e8933a';
    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 25 + Math.random() * 55;
    const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist + 45;
    c.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(.4)`, opacity: 0 }], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => c.remove();
  }
  b.remove(); setTimeout(spawnBread, 2500);
}

// ================= 启动遮罩与云端拉取 =================

function updateProgress(percent, text) {
  const bar = document.getElementById('progressBar');
  const txt = document.getElementById('loadingText');
  if (bar) bar.style.width = percent + '%';
  if (txt) txt.textContent = `${text} (${percent}%)`;
}

function enterApp() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 500);
  }
  loadUserData();
}

function showConnectError(msg) {
  document.getElementById('loadingContent').style.display = 'none';
  document.getElementById('errorContent').style.display = 'block';
  document.getElementById('errorMsg').textContent = msg || '无法连接到云端，请检查网络。';
}

document.getElementById('btnLocalMode').onclick = () => { enterApp(); };
document.getElementById('btnRetryCloud').onclick = () => {
  document.getElementById('loadingContent').style.display = 'flex';
  document.getElementById('errorContent').style.display = 'none';
  syncFromCloud();
};

async function syncFromCloud() {
  const curUser = localStorage.getItem('bb-current-user') ? JSON.parse(localStorage.getItem('bb-current-user')) : null;
  
  if (!curUser) {
    updateProgress(100, '本地模式加载完毕');
    setTimeout(enterApp, 500);
    return;
  }

  try {
    updateProgress(15, '正在向云端强校验身份');
    const { data: { user }, error } = await sb.auth.getUser();

    if (error || !user) {
      localStorage.removeItem('bb-current-user');
      currentUser = null; 
      showConnectError('账号已失效或被管理员注销，请重新登录。');
      document.getElementById('btnLocalMode').style.display = 'none';
      return; 
    }

    const uid = user.id;

    updateProgress(35, '身份校验通过，正在读取资产');
    const resAssets = await sb.from('bread_assets').select('*').eq('user_id', uid).maybeSingle();

    updateProgress(60, '正在同步个性化设置');
    const resPrefs = await sb.from('bread_preferences').select('*').eq('user_id', uid).maybeSingle();
    
    updateProgress(80, '正在同步基础资料');
    const resUser = await sb.from('bread_users').select('*').eq('user_id', uid).maybeSingle();

    if (resUser.error) throw new Error(resUser.error.message);

    if (resUser.data) {
      const u = resUser.data;
      const a = resAssets.data || {};
      const p = resPrefs.data || {};
      const set = p.settings || {};

      const assembledUser = {
        email: u.email, user_id: u.user_id, key: u.bread_key, avatar: u.avatar || '', regTime: u.reg_time || Date.now(),
        points: a.points || 0, vipType: a.vip_type || 'none', vipLevel: a.vip_level || 0, vipExpire: a.vip_expire || 0, unlockedThemes: a.unlocked_themes || [], emails: a.emails || [],
        customSites: p.sites || [], customHistory: p.history || [], currentTheme: p.current_theme || 'default',
        enFont: set.enFont || 'default', zhFont: set.zhFont || 'default', fwSpeed: set.fwSpeed || 1.0, fwFreq: set.fwFreq || 1.0, screenShake: set.screenShake !== false,
        customFonts: set.customFonts || [], lastRpDate: set.lastRpDate || '', rpCount: set.rpCount || 0, day7Sent: set.day7Sent || false, day30Sent: set.day30Sent || false, springSent: set.springSent || false,
        lastPointDate: set.lastPointDate || ''
      };

      let localUsers = store.get('bb-users', {});
      localUsers[curUser] = { ...localUsers[curUser], ...assembledUser };
      localStorage.setItem('bb-users', JSON.stringify(localUsers));
    } else {
      throw new Error('云端数据异常，找不到您的档案');
    }

    updateProgress(100, '连接成功');
    setTimeout(enterApp, 800);

  } catch (e) {
    console.error('❌ 云端拉取失败', e);
    showConnectError(e.message);
  }
}

// ================= 启动应用 =================
syncFromCloud();

// ★ 1. 开启 Supabase 实时监听（WebSocket 长连接）
async function initRealtime() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  sb.channel('realtime_bread_assets')
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'bread_assets', 
        filter: `user_id=eq.${user.id}` // 只监听自己的数据
      },
      (payload) => {
        console.log('🔔 收到云端实时推送，正在更新数据...', payload);
        // 收到推送，立刻静默拉取最新数据（不弹加载进度条）
        syncFromCloud(); 
      }
    )
    .subscribe();
}

// 延迟 1 秒执行，确保登录状态已加载
setTimeout(initRealtime, 1000);

// ★ 2. 兜底方案：用户切回网页瞬间，立刻同步（防止手机息屏断连）
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentUser) {
    console.log('👀 用户切回网页，强制同步一次');
    if (typeof syncFromCloud === 'function') syncFromCloud();
  }
});

// ★ 3. 兜底方案：每 60 秒后台静默同步一次（防止某些网络下 WebSocket 断连）
setInterval(() => {
  if (currentUser && !document.hidden) {
    if (typeof syncFromCloud === 'function') syncFromCloud();
  }
}, 60000);

setTimeout(checkRedPacketTime, 2000);
setInterval(checkRedPacketTime, 60 * 1000);