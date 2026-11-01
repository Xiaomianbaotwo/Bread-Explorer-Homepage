/* =========================================================
   04-auth.js
   ========================================================= */

function hashPwd(pwd) { return btoa(encodeURIComponent(pwd)); }
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'bread-key-';
  for (let i = 0; i < 32; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
  return key;
}

function getUsersDB() {
  let db = store.get('bb-users', {});
  if (!db || typeof db !== 'object' || Array.isArray(db)) db = {};

  for (let name in db) {
    if (typeof db[name] === 'string') db[name] = { pwd: db[name], key: generateKey(), regTime: Date.now(), avatar: '', vipLevel: 0, vipExpire: 0, currentTheme: 'default', emails: [], lastPointDate: '' };
    if (typeof db[name].vipLevel !== 'number') db[name].vipLevel = 0;
    if (typeof db[name].vipExpire !== 'number') db[name].vipExpire = 0;
    if (typeof db[name].currentTheme !== 'string') db[name].currentTheme = 'default';
    if (!Array.isArray(db[name].emails)) db[name].emails = [];
    if (typeof db[name].regTime !== 'number' || !db[name].regTime) db[name].regTime = Date.now();
    if (typeof db[name].avatar !== 'string') db[name].avatar = '';
    if (typeof db[name].points !== 'number') db[name].points = 0;
    if (typeof db[name].lastResetMonth !== 'string') db[name].lastResetMonth = '';
    if (!Array.isArray(db[name].unlockedThemes)) db[name].unlockedThemes = [];
    
    // ★ 字体数据兼容：改为 customFonts 数组
    if (!Array.isArray(db[name].customFonts)) db[name].customFonts = [];
    if (typeof db[name].enFont !== 'string') db[name].enFont = 'default';
    if (typeof db[name].zhFont !== 'string') db[name].zhFont = 'default';
    
    if (typeof db[name].lastRpDate !== 'string') db[name].lastRpDate = '';
    if (typeof db[name].rpCount !== 'number') db[name].rpCount = 0;
    if (typeof db[name].day7Sent !== 'boolean') db[name].day7Sent = false;
    if (typeof db[name].day30Sent !== 'boolean') db[name].day30Sent = false;
    if (typeof db[name].screenShake !== 'boolean') db[name].screenShake = true;
    if (typeof db[name].springSent !== 'boolean') db[name].springSent = false;
  }
  return db;
}

function getSavedUsers() { return store.get('bb-saved-users', []); }
function saveUserToQuickList(name) {
  let list = getSavedUsers();
  if (!list.includes(name)) { list.unshift(name); store.set('bb-saved-users', list); }
}
function removeUserFromQuickList(name) {
  let list = getSavedUsers().filter(n => n !== name);
  store.set('bb-saved-users', list); renderQuickLogin();
}

function renderQuickLogin() {
  const area = $('#quickLoginArea');
  const listEl = $('#quickLoginList');
  if (!area || !listEl) return;
  const users = getUsersDB();
  const list = getSavedUsers().filter(name => users[name]);
  if (list.length === 0) { area.style.display = 'none'; return; }
  area.style.display = 'block';
  listEl.innerHTML = '';
  list.forEach(name => {
    const u = users[name];
    const btn = document.createElement('div');
    btn.style = "display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; border:1px solid var(--card-border); background:var(--card); cursor:pointer; font-size:13px; font-weight:bold; transition:0.2s; position:relative;";
    btn.onmouseover = () => btn.style.borderColor = 'var(--accent)';
    btn.onmouseout = () => btn.style.borderColor = 'var(--card-border)';
    if (u && u.avatar) {
      btn.innerHTML = `<img src="${u.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;"><span>${name}</span>`;
    } else {
      btn.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;">${name[0].toUpperCase()}</div><span>${name}</span>`;
    }
    const delBtn = document.createElement('span');
    delBtn.innerHTML = '✕';
    delBtn.style = "margin-left:4px; font-size:10px; color:#e74c3c; opacity:0.6; cursor:pointer;";
    delBtn.onclick = (e) => { e.stopPropagation(); removeUserFromQuickList(name); };
    btn.appendChild(delBtn);
    btn.onclick = () => {
      currentUser = name; store.set('bb-current-user', name);
      closeOverlay($('#loginOverlay')); loadUserData(); showToast('欢迎回来', '🍞');
      if (typeof checkRedPacketTime === 'function') checkRedPacketTime();
      $('#authName').value = ''; $('#authPwd').value = '';
    };
    listEl.appendChild(btn);
  });
}

function getUsedCodes() { return store.get('bb-used-codes', []); }
function markCodeUsed(code) {
  let used = getUsedCodes();
  if (!used.includes(hashCode(code))) { used.push(hashCode(code)); store.set('bb-used-codes', used); }
}

function checkVipStatus(userObj) {
  if (!userObj) return { level: 0, expire: 0 };
  if (userObj.vipExpire === 0 && userObj.vipLevel > 0) return { level: userObj.vipLevel, expire: 0 };
  if (Date.now() > userObj.vipExpire && userObj.vipExpire !== 0) return { level: 0, expire: 0 };
  return { level: userObj.vipLevel, expire: userObj.vipExpire };
}

function checkSystemEmails(u) {
  let changed = false;
  if (!u.emails) u.emails = [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  if (!u.day7Sent && u.emails.some(e => e.type === 'day7')) u.day7Sent = true;
  if (!u.day30Sent && u.emails.some(e => e.type === 'day30')) u.day30Sent = true;

  if (u.lastResetMonth !== monthStr) { u.points = 0; u.lastResetMonth = monthStr; changed = true; }

  const days = Math.floor((Date.now() - u.regTime) / (1000 * 60 * 60 * 24));
  const status = checkVipStatus(u);

  if (status.level > 0 && u.lastPointDate !== todayStr) {
    let needSend = false;
    if (!u.lastPointDate) needSend = true;
    else {
      const lastDate = new Date(u.lastPointDate);
      const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
      if (diffDays >= 3) needSend = true;
    }
    if (needSend) {
      const suffix = generateRandomStr(7);
      const pType = status.level === 2 ? 'SVIP' : 'VIP';
      const pts = status.level === 2 ? 150 : 100;
      u.emails.push({
        id: 'pts_' + Date.now(), type: 'points',
        title: `🪙 专属积分发放 (${pType})`,
        content: `感谢支持面包浏览器！这是属于 ${pType} 用户的 ${pts} 积分专属兑换码，有效期不限，请尽快兑换（仅限本账号使用一次）：`,
        code: `POINT-STRING-${pType}-${suffix}`, points: pts, isRead: false, isClaimed: false, isUsed: false, date: Date.now()
      });
      u.lastPointDate = todayStr; changed = true;
    }
  }

  if (now.getMonth() === 1 && !u.springSent) {
    u.emails.push({
      id: 'spring_' + Date.now(), type: 'spring',
      title: '🧧 新春快乐！专属主题已送达',
      content: '祝您新春大吉，万事如意！系统为您准备了专属的“新春主题”与“新春 Plus”主题，请点击下方附件一键解锁：',
      code: 'THEME-SPRING-UNLOCK', isRead: false, isUsed: false, date: Date.now()
    });
    u.springSent = true; changed = true;
  }

  if (days >= 7 && !u.day7Sent) {
    u.emails.push({ id: 'day7_' + Date.now(), type: 'day7', title: '🎉 欢迎陪伴面包浏览器 7 天！', content: '感谢你的支持！送你一张 7 天 VIP 兑换码，请在“兑换码”页面使用（仅限本账号一次性使用）：', code: 'VIP-STRING-7D-' + generateRandomStr(7), isRead: false, isUsed: false, date: Date.now() });
    u.day7Sent = true; changed = true;
  }
  if (days >= 30 && !u.day30Sent) {
    u.emails.push({ id: 'day30_' + Date.now(), type: 'day30', title: '👑 陪伴 30 天，送你 SVIP 特权！', content: '一个月啦！送你一张 15 天 SVIP 兑换码，请珍惜使用（仅限本账号一次性使用）：', code: 'SVIP-STRING-15D-' + generateRandomStr(7), isRead: false, isUsed: false, date: Date.now() });
    u.day30Sent = true; changed = true;
  }
  return changed;
}

function loadUserData() {
  const sitesKey = currentUser ? `bb-sites_${currentUser}` : 'bb-sites-guest';
  sites = store.get(sitesKey, null) || JSON.parse(JSON.stringify(DEFAULT_SITES));

  let users = null;
  if (currentUser) {
    users = getUsersDB();
    if (!users[currentUser]) { currentUser = null; store.set('bb-current-user', null); users = null; }
  }

  if (currentUser && users) {
    const u = users[currentUser];
    if (checkSystemEmails(u)) store.set('bb-users', users);
    const status = checkVipStatus(u);
    if (u.vipLevel !== status.level) { u.vipLevel = status.level; u.vipExpire = 0; store.set('bb-users', users); }

    let rawHistory = store.get(`bb-history_${currentUser}`, []);
    history = rawHistory.map(item => typeof item === 'string' ? { q: item, t: Date.now() - 100000000 } : item);

    currentTheme = u.currentTheme || 'default';
    if (!THEMES[currentTheme]) currentTheme = 'default';

    const tConf = THEMES[currentTheme];
    const isUnlocked = u.unlockedThemes.includes(currentTheme);
    let baseTheme = currentTheme.replace('-plus', '');
    if (THEMES[baseTheme] && THEMES[baseTheme].cost && !isUnlocked && status.level < 2) {
      currentTheme = 'default';
    } else if (THEMES[baseTheme] && THEMES[baseTheme].level > status.level && !isUnlocked) {
      currentTheme = 'default';
    }
    applyFont(u.enFont, u.zhFont, u);
  } else {
    history = []; currentTheme = 'default'; applyFont('default', 'default', null);
  }

  applyTheme();
  if (typeof renderSites === 'function') renderSites();
  updateUserUI();
  $('#pointsDisplay').textContent = currentUser ? (users[currentUser].points || 0) : '0';
}

function updateUserUI() {
  const btn = $('#btnUser');
  const nameDisp = $('#userNameDisplay');
  const avatarImg = $('#topAvatar');
  const btnMail = $('#btnMail');
  const mailDot = $('#mailDot');

  btn.classList.remove('is-vip', 'is-svip');
  if (currentUser) {
    const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
    nameDisp.textContent = currentUser;
    btn.style.color = ''; btn.style.borderColor = '';
    if (status.level === 1) btn.classList.add('is-vip');
    if (status.level === 2) btn.classList.add('is-svip');
    if (u.avatar) { avatarImg.src = u.avatar; btn.classList.add('has-avatar'); }
    else btn.classList.remove('has-avatar');
    btnMail.style.display = 'flex';
    const unread = u.emails && u.emails.some(e => !e.isRead);
    mailDot.style.display = unread ? 'block' : 'none';
    $('#pointsDisplay').textContent = u.points || 0;
  } else {
    nameDisp.textContent = '登录'; btn.style.color = ''; btn.style.borderColor = '';
    btn.classList.remove('has-avatar'); btnMail.style.display = 'none'; $('#pointsDisplay').textContent = '0';
  }
}

function doRedeem(code, fromMail = false) {
  if (!currentUser) { showToast('请先登录', '🔒'); return false; }
  if (!code) return false;
  code = code.trim().toUpperCase();

  let users = getUsersDB(); let u = users[currentUser];
  let info = null; let isMailCode = false; let mailIndex = -1;

  if (code === 'THEME-SPRING-UNLOCK') {
    if (!u.unlockedThemes.includes('spring')) u.unlockedThemes.push('spring');
    if (!u.unlockedThemes.includes('spring-plus')) u.unlockedThemes.push('spring-plus');
    const mail = u.emails.find(e => e.code === code);
    if (mail) mail.isUsed = true;
    store.set('bb-users', users);
    showToast(`兑换成功！已解锁【新春主题】及【Plus版】`, '🧧');
    loadUserData(); if (!fromMail) $('#btnUser').click();
    return true;
  }

  if (u.emails) {
    const mail = u.emails.find(e => (e.code || '').toUpperCase() === code);
    if (mail) {
      if (mail.isUsed) { showToast('此邮件兑换码已使用过', '❌'); return false; }
      isMailCode = true; mailIndex = u.emails.indexOf(mail);
      const ptsMail = code.match(/^POINT-STRING-(VIP|SVIP)-[A-Z0-9]{7}$/);
      if (ptsMail) {
        const addPts = ptsMail[1] === 'SVIP' ? 150 : 100;
        u.points += addPts; u.emails[mailIndex].isUsed = true; store.set('bb-users', users);
        showToast(`兑换成功！获得 ${addPts} 积分`, '🪙'); loadUserData(); if (!fromMail) $('#btnUser').click();
        return true;
      }
      info = (mail.type === 'day30' || code.startsWith('SVIP')) ? { level: 2, days: 15 } : { level: 1, days: 7 };
    }
  }

  if (!info) {
    const hashed = hashCode(code);
    if (getUsedCodes().includes(hashed)) { showToast('该兑换码已被使用过', '❌'); return false; }
    info = REDEEM_DB[hashed];
  }

  if (!info) { showToast('兑换码无效', '❌'); return false; }

  if (info.points && info.points > 0) {
    u.points += info.points; if (isMailCode) u.emails[mailIndex].isUsed = true; else markCodeUsed(code);
    store.set('bb-users', users); showToast(`兑换成功！获得 ${info.points} 积分`, '🪙'); loadUserData(); if (!fromMail) $('#btnUser').click();
    return true;
  }

  const isLifetime = u.vipExpire === 0 && u.vipLevel > 0;
  if (isLifetime) { showToast(info.days > 0 ? '你已是终身会员，无需兑换' : '你已是终身 SVIP', '👑'); return false; }
  if (u.vipLevel === 2 && info.level === 1 && u.vipExpire > Date.now()) { showToast('你是 SVIP，无需兑换 VIP', '👑'); return false; }

  let newExpire = 0;
  if (info.days > 0) {
    const addMs = info.days * 24 * 60 * 60 * 1000;
    const active = u.vipExpire > Date.now();
    const start = (active && u.vipLevel <= info.level) ? u.vipExpire : Date.now();
    newExpire = start + addMs;
  }
  u.vipLevel = Math.max(u.vipLevel, info.level); u.vipExpire = newExpire;
  if (info.days === 0) { u.vipLevel = 2; u.vipExpire = 0; }
  if (isMailCode) u.emails[mailIndex].isUsed = true; else markCodeUsed(code);

  store.set('bb-users', users); showToast(`兑换成功！已获得 ${info.level === 2 ? 'SVIP' : 'VIP'}`, '🎉');
  loadUserData(); if (!fromMail) $('#btnUser').click();
  return true;
}

function startVipCountdown(expireTime) {
  if (window.vipTimer) clearInterval(window.vipTimer);
  const el = $('#vipCountdown');
  if (expireTime === 0) { el.textContent = '♾️ 永久有效'; return; }
  function update() {
    const diff = expireTime - Date.now();
    if (diff <= 0) { el.textContent = '❌ 特权已过期'; el.style.color = '#e74c3c'; clearInterval(window.vipTimer); return; }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    el.textContent = `⏳ 剩余：${d > 0 ? d + '天 ' : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
    el.style.color = 'var(--accent)';
  }
  update(); window.vipTimer = setInterval(update, 1000);
}

$('#btnUser').onclick = () => {
  if (!currentUser) { renderQuickLogin(); return openOverlay($('#loginOverlay')); }
  const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
  const days = Math.max(1, Math.ceil((Date.now() - u.regTime) / (1000 * 60 * 60 * 24)));
  $('#profileName').textContent = currentUser;
  $('#profileName').className = 'profile-name' + (status.level === 1 ? ' is-vip' : status.level === 2 ? ' is-svip' : '');
  
  if (status.level > 0) {
    const tag = document.createElement('span'); tag.className = 'vip-tag ' + (status.level === 2 ? 'svip' : 'vip');
    tag.textContent = status.level === 2 ? 'SVIP' : 'VIP'; $('#profileName').appendChild(tag);
    let expireText = (u.vipExpire === 0) ? '永久' : new Date(u.vipExpire).toLocaleDateString() + ' 到期';
    $('#vipStatusText').textContent = `特权状态：已激活（${expireText}）`; startVipCountdown(u.vipExpire);
  } else { $('#vipStatusText').textContent = ''; $('#vipCountdown').textContent = ''; if (window.vipTimer) clearInterval(window.vipTimer); }

  $('#profileDays').textContent = `面包浏览器陪伴了你 ${days} 天`;
  $('#avatarWrap').className = 'avatar-wrap' + (status.level === 1 ? ' is-vip' : status.level === 2 ? ' is-svip' : '');
  if (u.avatar) { $('#userAvatar').src = u.avatar; $('#userAvatar').style.display = 'block'; $('#userAvatarPlaceholder').style.display = 'none'; }
  else { $('#userAvatar').style.display = 'none'; $('#userAvatarPlaceholder').style.display = 'flex'; $('#userAvatarPlaceholder').textContent = currentUser[0].toUpperCase(); }

  $('#screenShakeToggle').checked = u.screenShake !== false;
  openOverlay($('#userOverlay'));
};

// ★ 打开主题中心
$('#btnThemeSelect').onclick = () => {
  if (!currentUser) return showToast('请先登录', '🔒');
  const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
  
  const grid = $('#themeGrid'); grid.innerHTML = '';
  Object.entries(THEMES).forEach(([key, t]) => {
    let baseTheme = key.replace('-plus', '');
    let baseConf = THEMES[baseTheme];
    if (baseConf.level <= status.level || baseConf.cost || t.isSpring) {
      const b = document.createElement('button');
      const isUnlocked = (status.level >= 2) || (!baseConf.cost && !t.isSpring) || u.unlockedThemes.includes(key) || u.unlockedThemes.includes(baseTheme);
      b.className = 'theme-btn' + (currentTheme === key ? ' active' : '') + (isUnlocked ? '' : ' locked');
      b.textContent = t.name;
      b.onclick = () => {
        if (!isUnlocked) {
          closeOverlay($('#themeOverlay')); if (typeof openPointsShop === 'function') openPointsShop();
          showToast('请在积分中心或邮件中解锁该主题', '🛒'); return;
        }
        currentTheme = key; u.currentTheme = key; store.set('bb-users', users);
        loadUserData(); closeOverlay($('#themeOverlay')); showToast('主题已切换', '🎨');
      };
      grid.appendChild(b);
    }
  });
  openOverlay($('#themeOverlay'));
};
$('#btnThemeClose').onclick = () => closeOverlay($('#themeOverlay'));

// ★ 打开字体中心
$('#btnFontSelect').onclick = () => {
  if (!currentUser) return showToast('请先登录', '🔒');
  $('#enFontSearch').value = '';
  $('#zhFontSearch').value = '';
  renderFontLists();
  if ($('#enFontPreview')) updatePreviewBoxes(); // 加个安全判断
  openOverlay($('#fontOverlay'));
};
$('#btnFontClose').onclick = () => closeOverlay($('#fontOverlay'));

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'screenShakeToggle') {
    if (!currentUser) return;
    let users = getUsersDB(); users[currentUser].screenShake = e.target.checked; store.set('bb-users', users);
    showToast(e.target.checked ? '已开启屏幕抖动' : '已关闭屏幕抖动', '📳');
  }
});

$('#btnAuthCancel').onclick = () => closeOverlay($('#loginOverlay'));
let isReg = false;
$('#tabLogin').onclick = () => { isReg = false; $('#tabLogin').classList.add('active'); $('#tabRegister').classList.remove('active'); $('#btnAuthSubmit').textContent = '登录'; $('#pwdLabel').childNodes[0].textContent = '密码 / 面包 Key'; };
$('#tabRegister').onclick = () => { isReg = true; $('#tabRegister').classList.add('active'); $('#tabLogin').classList.remove('active'); $('#btnAuthSubmit').textContent = '注册'; $('#pwdLabel').childNodes[0].textContent = '设置密码'; };

$('#btnAuthSubmit').onclick = () => {
  const name = $('#authName').value.trim(); const pwd = $('#authPwd').value.trim();
  if (!name || !pwd) return showToast('不能为空', '⚠️');
  let users = getUsersDB();
  if (isReg) {
    if (users[name]) return showToast('用户名已存在', '❌');
    const key = generateKey();
    users[name] = { pwd: hashPwd(pwd), key, regTime: Date.now(), avatar: '', vipLevel: 0, vipExpire: 0, currentTheme: 'default', emails: [], screenShake: true, customFonts: [] };
    store.set('bb-users', users); currentUser = name; store.set('bb-current-user', name);
    saveUserToQuickList(name); closeOverlay($('#loginOverlay')); loadUserData();
    $('#regSuccessKey').textContent = key; openOverlay($('#registerSuccessOverlay'));
  } else {
    if (users[name] && (users[name].pwd === hashPwd(pwd) || users[name].key === pwd)) {
      currentUser = name; store.set('bb-current-user', name); saveUserToQuickList(name); 
      closeOverlay($('#loginOverlay')); loadUserData(); showToast('欢迎回来', '🍞');
      if (typeof checkRedPacketTime === 'function') checkRedPacketTime();
    } else showToast('账号或密码错误', '❌');
  }
};

$('#regSuccessKey').onclick = () => {
  const keyText = $('#regSuccessKey').textContent;
  navigator.clipboard.writeText(keyText).then(() => { showToast('已复制到剪贴板', '📋'); }).catch(() => { showToast('复制失败，请手动选择复制', '⚠️'); });
};
$('#btnRegSuccessClose').onclick = () => closeOverlay($('#registerSuccessOverlay'));

$('#btnUserClose').onclick = () => closeOverlay($('#userOverlay'));
$('#btnLogout').onclick = () => {
  currentUser = null; store.set('bb-current-user', null);
  if (typeof closeDevPanel === 'function') closeDevPanel();
  closeOverlay($('#userOverlay')); loadUserData();
};
$('#btnChangePwd').onclick = () => { $('#oldPwd').value = ''; $('#newPwd').value = ''; openOverlay($('#pwdOverlay')); };
$('#btnRedeemCode').onclick = () => { $('#redeemInput').value = ''; openOverlay($('#redeemOverlay')); };

$('#btnDeleteAccount').onclick = () => { openOverlay($('#deleteConfirmOverlay')); };
$('#btnDeleteCancel').onclick = () => closeOverlay($('#deleteConfirmOverlay'));
$('#btnDeleteConfirm').onclick = () => {
  let users = getUsersDB(); delete users[currentUser]; store.set('bb-users', users);
  localStorage.removeItem(`bb-sites_${currentUser}`); localStorage.removeItem(`bb-history_${currentUser}`);
  removeUserFromQuickList(currentUser); currentUser = null; store.set('bb-current-user', null);
  if (typeof closeDevPanel === 'function') closeDevPanel();
  closeOverlay($('#deleteConfirmOverlay')); closeOverlay($('#userOverlay')); loadUserData();
  showToast('账号已注销', '🧹');
};

$('#btnPwdCancel').onclick = () => closeOverlay($('#pwdOverlay'));
$('#btnPwdSave').onclick = () => {
  const oldV = $('#oldPwd').value.trim(); const newV = $('#newPwd').value.trim();
  if (!oldV || !newV) return showToast('请填完整', '⚠️');
  let users = getUsersDB(); let u = users[currentUser];
  if (u.pwd === hashPwd(oldV) || u.key === oldV) {
    u.pwd = hashPwd(newV); store.set('bb-users', users);
    closeOverlay($('#pwdOverlay')); showToast('密码修改成功', '🔐');
  } else showToast('原密码错误', '❌');
};

$('#btnRedeemCancel').onclick = () => closeOverlay($('#redeemOverlay'));
$('#btnRedeemSubmit').onclick = () => {
  const code = $('#redeemInput').value.trim();
  if (doRedeem(code, false)) closeOverlay($('#redeemOverlay'));
};

$('#avatarWrap').onclick = () => { $('#avatarUpload').click(); };
$('#avatarUpload').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); const MAX = 128;
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
      c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      let users = getUsersDB(); users[currentUser].avatar = c.toDataURL('image/png');
      store.set('bb-users', users); updateUserUI();
      $('#userAvatar').src = c.toDataURL('image/png'); $('#userAvatar').style.display = 'block'; $('#userAvatarPlaceholder').style.display = 'none';
      showToast('头像更新', '🖼️');
    }; img.src = ev.target.result;
  }; reader.readAsDataURL(f); e.target.value = '';
};