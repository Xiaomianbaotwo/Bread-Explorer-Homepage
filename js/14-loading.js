/* =========================================================
   14-loading.js
   独立启动引擎 (精准阶段百分比 + 绝对匀速)
   ========================================================= */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isBooting = false; 
let isEntered = false;

let totalDuration = 18000; // 总时长
let startTime = 0;
let animationFrameId = null;
let countdownInterval = null;
let requestDone = false; 
let currentPhaseText = ""; // ★ 新增：保存当前阶段的纯文本

// 100ms 极速倒计时刷新
function startCountdown() {
  const timeLeftEl = document.getElementById('loadingTimeLeft');
  if (!timeLeftEl) return;
  
  if (countdownInterval) clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
    if (isEntered) return;
    let elapsed = performance.now() - startTime;
    let leftMs = Math.max(0, totalDuration - elapsed);
    let leftSec = (leftMs / 1000).toFixed(1);
    
    if (leftMs <= 0) {
      timeLeftEl.textContent = `正在进入... 加载完成`;
    } else {
      timeLeftEl.textContent = `剩余 ${leftSec} 秒 加载完成`;
    }
  }, 100);
}

// 总时间轴动画引擎
function startTimelineAnimation() {
  const globalBar = document.getElementById('globalProgressBar');
  const progressBar = document.getElementById('progressBar');
  const percentText = document.getElementById('loadingPercent');
  const textEl = document.getElementById('loadingText');
  
  if (globalBar) { globalBar.style.transition = 'none'; globalBar.style.width = '0%'; }
  if (progressBar) { progressBar.style.transition = 'none'; progressBar.style.width = '0%'; }
  if (percentText) percentText.textContent = '已加载 0%';

  startTime = performance.now();

  function frame(currentTime) {
    if (isEntered) return;
    
    let elapsed = currentTime - startTime;
    let globalPercent = (elapsed / totalDuration) * 100;
    if (globalPercent > 100) globalPercent = 100;
    
    // 1. 下进度条（粗条）：按总时间绝对匀速
    if (globalBar) globalBar.style.width = globalPercent + '%';

    // 2. 大字百分比：绑定总进度
    if (percentText) percentText.textContent = `已加载 ${Math.floor(globalPercent)}%`;

    // 3. 上进度条（细条）：当前阶段进度
    let upperPercent = 0;
    if (elapsed < 5000) {
      upperPercent = (elapsed / 5000) * 100;
    } else {
      let phase2Duration = totalDuration - 5000;
      upperPercent = ((elapsed - 5000) / phase2Duration) * 100;
    }
    if (upperPercent > 100) upperPercent = 100;
    
    if (progressBar) progressBar.style.width = upperPercent + '%';

    // ★ 4. 核心修改：在阶段文字前面拼接当前阶段百分比
    if (textEl && currentPhaseText) {
        let htmlStr = currentPhaseText.replace(
            /(\[\d+\/\d+\])/, 
            '<span style="font-size: 16px; font-weight: 900; color: var(--accent); margin-right: 6px; vertical-align: text-bottom;">$1</span>'
        );
        // 在最前面加上 阶段百分比
        textEl.innerHTML = `<span style="color: var(--ink-soft); font-weight: bold; margin-right: 6px;">${Math.floor(upperPercent)}%</span>` + htmlStr;
    }

    if (elapsed < totalDuration) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      if (requestDone) {
        enterApp();
      }
    }
  }
  
  animationFrameId = requestAnimationFrame(frame);
  startCountdown();
}

// 智能文字切换时间轴 (不再直接操作DOM，只更新纯文本变量)
function updateTextByTimeline(isVip, isSvip) {
  const modeName = isSvip ? 'SVIP 极速配置' : (isVip ? 'VIP 极速配置' : '配置环境');
  
  setTimeout(() => { if(!isEntered) updateMajorStage('1/2 - 连接云端金库'); }, 0);
  
  setTimeout(() => { if(!isEntered) currentPhaseText = '[1/7] 正在与云端金库建立加密连接...'; }, 100);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[2/7] 正在强校验身份凭证...'; }, 800);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[3/7] 身份校验通过，读取云端资产...'; }, 1500);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[4/7] 正在同步个性化偏好设置...'; }, 2300);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[5/7] 正在同步基础身份资料...'; }, 3100);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[6/7] 正在核对最后的数据指纹...'; }, 3900);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[7/7] 正在等待云端最终握手协议...'; }, 4700);
  
  // 5秒后切阶段二
  setTimeout(() => {
    if(!isEntered) {
      updateMajorStage(`2/2 - ${modeName}`);
      if (!isVip && !isSvip) {
        const hint = document.getElementById('vipSpeedupHint');
        if (hint) hint.style.display = 'block';
      }
      currentPhaseText = '[1/6] 正在配置专属主页环境...';
    }
  }, 5000);

  let p2Duration = totalDuration - 5000;
  setTimeout(() => { if(!isEntered) currentPhaseText = '[2/6] 正在加载主题与色彩方案...'; }, 5000 + p2Duration * 0.15);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[3/6] 正在挂载字体与特效引擎...'; }, 5000 + p2Duration * 0.3);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[4/6] 正在注入烟花粒子与面包篮...'; }, 5000 + p2Duration * 0.5);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[5/6] 正在唤醒面包房...'; }, 5000 + p2Duration * 0.7);
  setTimeout(() => { if(!isEntered) currentPhaseText = '[6/6] 主页配置完成，即将进入！'; }, 5000 + p2Duration * 0.85);
}

function enterApp() {
  if (isEntered) return;
  isEntered = true;
  window.isLoadedOnce = true;
  
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (countdownInterval) clearInterval(countdownInterval);
  
  const globalBar = document.getElementById('globalProgressBar');
  if (globalBar) globalBar.style.width = '100%';
  
  if (typeof loadUserData === 'function') loadUserData(); 

  setTimeout(() => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.style.display = 'none'; }, 500); 
    }
  }, 300); 
}

function showConnectError(msg) {
  isBooting = false;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (countdownInterval) clearInterval(countdownInterval);
  
  document.getElementById('loadingContent').style.display = 'none';
  document.getElementById('errorContent').style.display = 'block';
  document.getElementById('errorMsg').textContent = msg || '无法连接到云端，请检查网络。';
}

document.getElementById('btnLocalMode').onclick = () => { enterApp(); };
document.getElementById('btnRetryCloud').onclick = () => {
  document.getElementById('loadingContent').style.display = 'flex';
  document.getElementById('errorContent').style.display = 'none';
  startCloudSync();
};

async function startCloudSync() {
  if (isEntered || isBooting) return;
  isBooting = true;

  try {
    const { data: authData, error } = await sb.auth.getUser();
    
    if (error || !authData.user) {
      updateMajorStage('本地模式');
      currentPhaseText = '[1/1] 云端无登录状态，正在进入本地模式';
      totalDuration = 1500; 
      startTimelineAnimation();
      requestDone = true;
      return;
    }

    let curUser = localStorage.getItem('bb-current-user') ? JSON.parse(localStorage.getItem('bb-current-user')) : null;
    if (!curUser || curUser === 'null') {
      const { data: dbUser } = await sb.from('bread_users').select('username').eq('user_id', authData.user.id).maybeSingle();
      if (dbUser && dbUser.username) {
        curUser = dbUser.username;
        localStorage.setItem('bb-current-user', JSON.stringify(curUser));
        if (typeof currentUser !== 'undefined') currentUser = curUser;
      }
    }

    const resAssetsPre = await sb.from('bread_assets').select('vip_type, vip_expire').eq('user_id', authData.user.id).maybeSingle();
    
    let isVip = false;
    let isSvip = false;
    
    if (resAssetsPre.data) {
      let type = resAssetsPre.data.vip_type || 'none';
      let expire = resAssetsPre.data.vip_expire || 0;
      if (expire !== 0 && Date.now() > expire) type = 'none'; 

      if (type === 'svip') { isSvip = true; totalDuration = 6000; }
      else if (type === 'vip') { isVip = true; totalDuration = 8000; }
    }

    // ★ 核心：获取到身份后，立刻开启时间轴和文字变化（纯动画先跑起来）
    updateTextByTimeline(isVip, isSvip);
    startTimelineAnimation();

    // 后台静默请求其他数据
    const uid = authData.user.id;
    const resPrefs = await sb.from('bread_preferences').select('*').eq('user_id', uid).maybeSingle();
    const resUser = await sb.from('bread_users').select('*').eq('user_id', uid).maybeSingle();

    if (resUser.error) throw new Error(resUser.error.message);

    if (resUser.data) {
      const u = resUser.data;
      const a = resAssetsPre.data || {};
      const p = resPrefs.data || {};
      const set = p.settings || {};

      const assembledUser = {
        email: u.email, user_id: u.user_id, key: u.bread_key, avatar: u.avatar || '', regTime: u.reg_time || Date.now(),
        points: a.points || 0, vipType: a.vip_type || 'none', vipExpire: a.vip_expire || 0, unlockedThemes: a.unlocked_themes || [], emails: a.emails || [],
        customSites: p.sites || [], customHistory: p.history || [], currentTheme: p.current_theme || 'default',
        enFont: set.enFont || 'default', zhFont: set.zhFont || 'default', fwSpeed: set.fwSpeed || 1.0, fwFreq: set.fwFreq || 1.0, fwThemeColor: set.fwThemeColor !== false,
        screenShake: set.screenShake !== false, customFonts: set.customFonts || [], lastRpDate: set.lastRpDate || '', rpCount: set.rpCount || 0, 
        day7Sent: set.day7Sent || false, day30Sent: set.day30Sent || false, springSent: set.springSent || false, lastPointDate: set.lastPointDate || ''
      };

      let localUsers = store.get('bb-users', {});
      localUsers[curUser] = { ...localUsers[curUser], ...assembledUser };
      localStorage.setItem('bb-users', JSON.stringify(localUsers));
    }

    requestDone = true;
    
    // 如果动画提前跑完，立刻进
    let elapsed = performance.now() - startTime;
    if (elapsed >= totalDuration) {
      enterApp();
    }

  } catch (e) {
    console.error('❌ 云端拉取失败', e);
    showConnectError(e.message);
  }
}

function updateMajorStage(stageText) {
  const majorTxt = document.getElementById('majorStageText');
  if (majorTxt) {
    majorTxt.innerHTML = `当前阶段：${stageText}`;
  }
}

// 启动！
startCloudSync();