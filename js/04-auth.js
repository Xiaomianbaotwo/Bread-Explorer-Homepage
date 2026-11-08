/* =========================================================
   04-auth.js
   官方 Auth 纯净版 (已接入面包 Key 终极验证)
   ========================================================= */

function getSafeEmailPrefix(name) {
    if (/^[a-zA-Z0-9]+$/.test(name)) return name.toLowerCase();
    return encodeURIComponent(name).replace(/%/g, '').toLowerCase();
}

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
    
    if (!Array.isArray(db[name].customFonts)) db[name].customFonts = [];
    if (typeof db[name].enFont !== 'string') db[name].enFont = 'default';
    if (typeof db[name].zhFont !== 'string') db[name].zhFont = 'default';
    
    if (typeof db[name].lastRpDate !== 'string') db[name].lastRpDate = '';
    if (typeof db[name].rpCount !== 'number') db[name].rpCount = 0;
    if (typeof db[name].day7Sent !== 'boolean') db[name].day7Sent = false;
    if (typeof db[name].day30Sent !== 'boolean') db[name].day30Sent = false;
    if (typeof db[name].screenShake !== 'boolean') db[name].screenShake = true;
    if (typeof db[name].springSent !== 'boolean') db[name].springSent = false;
    
    if (typeof db[name].fwSpeed !== 'number') db[name].fwSpeed = 1.0;
    if (typeof db[name].fwFreq !== 'number') db[name].fwFreq = 1.0;
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
      $('#authName').value = name;
      $('#authPwd').value = '';
      $('#authPwd').focus();
      showToast('请补充密码登录', '🔑');
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
  if (!userObj) return { level: 0, expire: 0, type: 'none' };
  let type = userObj.vipType || 'none';
  let level = userObj.vipLevel || 0;
  if (type === 'none' && level > 0) { type = level === 2 ? 'svip' : 'vip'; }
  if (userObj.vipExpire !== 0 && Date.now() > userObj.vipExpire) { return { level: 0, expire: 0, type: 'none' }; }
  return { level: level, expire: userObj.vipExpire, type: type };
}

function checkSystemEmails(u) {
  let changed = false;
  if (!u.emails) u.emails = [];
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  if (u.lastResetMonth !== monthStr) { u.points = 0; u.lastResetMonth = monthStr; changed = true; }
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
    if (u.vipType !== status.type || u.vipLevel !== status.level) {
        u.vipType = status.type;
        u.vipLevel = status.level;
        u.vipExpire = status.expire;
        store.set('bb-users', users);
    }

    let rawHistory = store.get(`bb-history_${currentUser}`, []);
    history = rawHistory.map(item => typeof item === 'string' ? { q: item, t: Date.now() - 100000000 } : item);

    currentTheme = u.currentTheme || 'default';
    if (!THEMES[currentTheme]) currentTheme = 'default';

    const tConf = THEMES[currentTheme];
    const isUnlocked = u.unlockedThemes.includes(currentTheme);
    let baseTheme = currentTheme.replace('-plus', '').replace('-max', '');
    if (THEMES[baseTheme] && THEMES[baseTheme].cost && !isUnlocked && status.type !== 'svip') {
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
    if (status.type === 'vip') btn.classList.add('is-vip');
    if (status.type === 'svip') btn.classList.add('is-svip');
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

async function doRedeem(code, fromMail = false) {
  if (!currentUser) { showToast('请先登录', '🔒'); return false; }
  if (!code) return false;
  code = code.trim().toUpperCase();

  let users = getUsersDB(); let u = users[currentUser];
  
  if (code === 'THEME-SPRING-UNLOCK') {
    showToast('正在向云端申请解锁...', '⏳');
    const { error } = await sb.rpc('redeem_benefits', { p_type: 'theme', p_amount: 0, p_level: 0, p_theme: 'spring', p_mail_id: '' });
    if (error) return showToast('网络错误，兑换失败', '❌');
    await sb.rpc('redeem_benefits', { p_type: 'theme', p_amount: 0, p_level: 0, p_theme: 'spring-plus', p_mail_id: '' });
    
    const mail = u.emails.find(e => e.code === code);
    if (mail) { mail.isUsed = true; store.set('bb-users', users); }
    showToast(`兑换成功！已解锁【新春主题】及【Plus版】`, '🧧');
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData(); if (!fromMail) $('#btnUser').click();
    return true;
  }

  let mailId = '';
  if (u.emails) {
    const mail = u.emails.find(e => (e.code || '').toUpperCase() === code);
    if (mail) {
      if (mail.isUsed) { showToast('此邮件兑换码已使用过', '❌'); return false; }
      mailId = mail.id;
      
      const ptsMail = code.match(/^POINT-STRING-(VIP|SVIP)-[A-Z0-9]{10}$/);
      if (ptsMail) {
        showToast('正在领取积分...', '⏳');
        const addPts = ptsMail[1] === 'SVIP' ? 150 : 100;
        const { data, error } = await sb.rpc('redeem_benefits', { p_type: 'points', p_amount: addPts, p_level: 0, p_theme: '', p_mail_id: mailId, p_code: code });
        if (error || data === false) return showToast('领取失败，可能已领过', '❌');
        
        mail.isUsed = true; store.set('bb-users', users); 
        showToast(`兑换成功！获得 ${addPts} 积分`, '🪙'); 
        if (typeof syncFromCloud === 'function') await syncFromCloud();
        loadUserData(); if (!fromMail) $('#btnUser').click();
        return true;
      }
    }
  }

  showToast('正在向云端核销...', '⏳');
  
  const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: code });

  if (error) {
    console.error(error);
    return showToast('网络错误，请稍后再试', '❌');
  }
  
  if (!data.success) {
    return showToast(data.msg || '兑换码无效或已被使用', '❌');
  }

  if (data.type === 'points') {
    showToast(`兑换成功！获得 ${data.value} 积分`, '🪙'); 
  } else {
    showToast(`兑换成功！已获得 ${data.type === 'svip' ? 'SVIP' : 'VIP'} ${data.value === 0 ? '永久' : data.value + '天'}`, '🎉');
  }

  if (typeof syncFromCloud === 'function') await syncFromCloud();
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
  $('#profileName').className = 'profile-name' + (status.type === 'vip' ? ' is-vip' : status.type === 'svip' ? ' is-svip' : '');
  
  if (status.type !== 'none') {
    const tag = document.createElement('span'); tag.className = 'vip-tag ' + (status.type === 'svip' ? 'svip' : 'vip');
    tag.textContent = status.type === 'svip' ? 'SVIP' : 'VIP'; $('#profileName').appendChild(tag);
    let expireText = (u.vipExpire === 0) ? '永久' : new Date(u.vipExpire).toLocaleDateString() + ' 到期';
    $('#vipStatusText').textContent = `特权状态：已激活（${expireText}）`; startVipCountdown(u.vipExpire);
  } else { $('#vipStatusText').textContent = ''; $('#vipCountdown').textContent = ''; if (window.vipTimer) clearInterval(window.vipTimer); }

  $('#profileDays').textContent = `面包浏览器陪伴了你 ${days} 天`;
  $('#avatarWrap').className = 'avatar-wrap' + (status.type === 'vip' ? ' is-vip' : status.type === 'svip' ? ' is-svip' : '');
  if (u.avatar) { $('#userAvatar').src = u.avatar; $('#userAvatar').style.display = 'block'; $('#userAvatarPlaceholder').style.display = 'none'; }
  else { $('#userAvatar').style.display = 'none'; $('#userAvatarPlaceholder').style.display = 'flex'; $('#userAvatarPlaceholder').textContent = currentUser[0].toUpperCase(); }

  $('#screenShakeToggle').checked = u.screenShake !== false;
  openOverlay($('#userOverlay'));
};

$('#btnThemeSelect').onclick = () => {
  if (!currentUser) return showToast('请先登录', '🔒');
  const users = getUsersDB(); const u = users[currentUser]; const status = checkVipStatus(u);
  const grid = $('#themeGrid'); grid.innerHTML = '';
  
  Object.entries(THEMES).forEach(([key, t]) => {
    let baseTheme = key.replace('-plus', '').replace('-max', '');
    let baseConf = THEMES[baseTheme];
    let isUnlocked = false;
    if (key === 'flower-plus') isUnlocked = (status.type === 'svip') || u.unlockedThemes.includes('flower-plus') || u.unlockedThemes.includes('flower-max');
    else if (key === 'flower-max') isUnlocked = (status.type === 'svip') || u.unlockedThemes.includes('flower-max');
    else isUnlocked = (status.type === 'svip') || (!t.cost && !t.isSpring) || u.unlockedThemes.includes(key) || u.unlockedThemes.includes(baseTheme);

    if (baseConf.level <= status.level || t.cost || t.isSpring) {
      const b = document.createElement('button');
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

  const isFwTheme = currentTheme.includes('plus') || currentTheme.includes('max') || currentTheme === 'spring';
  const configArea = $('#fwConfigArea');
  if (isFwTheme && u.unlockedThemes.length >= 0) {
    configArea.style.display = 'block';
    if ($('#fwSpeedInput')) $('#fwSpeedInput').value = u.fwSpeed.toFixed(1);
    if ($('#fwFreqInput')) $('#fwFreqInput').value = u.fwFreq.toFixed(1);
  } else {
    configArea.style.display = 'none';
  }
  openOverlay($('#themeOverlay'));
};

document.addEventListener('change', (e) => {
  if (!currentUser) return;
  if (e.target.id === 'fwSpeedInput' || e.target.id === 'fwFreqInput') {
    let users = getUsersDB();
    let u = users[currentUser];
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 1.0;
    val = Math.max(0.1, Math.min(5.0, val));
    e.target.value = val.toFixed(1);
    if (e.target.id === 'fwSpeedInput') u.fwSpeed = val;
    else u.fwFreq = val;
    store.set('bb-users', users);
    showToast('烟花参数已更新', '⚙️');
  }
});

$('#btnThemeClose').onclick = () => closeOverlay($('#themeOverlay'));

$('#btnFontSelect').onclick = () => {
  if (!currentUser) return showToast('请先登录', '🔒');
  $('#enFontSearch').value = '';
  $('#zhFontSearch').value = '';
  renderFontLists();
  if ($('#enFontPreview')) updatePreviewBoxes(); 
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

let isReg = false;

$('#btnAuthCancel').onclick = () => closeOverlay($('#loginOverlay'));

$('#tabLogin').onclick = () => { 
  isReg = false;
  $('#tabLogin').classList.add('active'); 
  $('#tabRegister').classList.remove('active'); 
  $('#normalInputArea').style.display = 'block';
  $('#quickLoginArea').style.display = getSavedUsers().length > 0 ? 'block' : 'none';
  $('#btnAuthSubmit').textContent = '登录'; 
  $('#pwdLabel').childNodes[0].textContent = '密码'; 
  $('#authPwd').placeholder = '请输入登录密码'; 
};

$('#tabRegister').onclick = () => { 
  isReg = true;
  $('#tabRegister').classList.add('active'); 
  $('#tabLogin').classList.remove('active'); 
  $('#normalInputArea').style.display = 'block';
  $('#quickLoginArea').style.display = 'none';
  $('#btnAuthSubmit').textContent = '注册'; 
  $('#pwdLabel').childNodes[0].textContent = '设置密码'; 
  $('#authPwd').placeholder = '请设置一个新密码'; 
};

$('#btnAuthSubmit').onclick = async () => {
  const name = $('#authName').value.trim(); 
  const pwd = $('#authPwd').value.trim();
  if (!name || !pwd) return showToast('账号或密码不能为空', '⚠️');
  
  let users = getUsersDB();
  const fakeEmail = `${getSafeEmailPrefix(name)}@bread.com`;

    if (isReg) {
    if (users[name]) return showToast('该用户名已存在', '❌');
    showToast('正在向官方金库注册...', '⏳');

    const { data, error } = await sb.auth.signUp({ email: fakeEmail, password: pwd });
    if (error) return showToast('注册失败: ' + error.message, '❌');

    const uid = data.user.id;
    const key = generateKey();

    users[name] = { 
      email: fakeEmail, user_id: uid, key: key, regTime: Date.now(), 
      vipType: 'none', vipLevel: 0, currentTheme: 'default', emails: [] 
    };
    
    currentUser = name; 
    store.set('bb-current-user', name);
    
    showToast('正在同步您的专属档案...', '⏳');
    await store.set('bb-users', users); 
    
    await sb.rpc('init_user_assets', { p_username: name });
    
    saveUserToQuickList(name); 
    closeOverlay($('#loginOverlay')); 
    loadUserData();
    
    // ★ 核心修改：同时塞入 Key 和 UUID
    $('#regSuccessKey').textContent = key; 
    $('#regSuccessUid').textContent = uid; 
    openOverlay($('#registerSuccessOverlay'));

  } else {
    // 登录逻辑保持不变...
    showToast('正在通过官方金库验证...', '⏳');
    const { data, error } = await sb.auth.signInWithPassword({ email: fakeEmail, password: pwd });
    if (error) return showToast('账号或密码错误', '❌');

    currentUser = name; 
    store.set('bb-current-user', name); 
    saveUserToQuickList(name); 
    closeOverlay($('#loginOverlay')); 
    
    showToast('欢迎回来', '🍞');
    if (typeof checkRedPacketTime === 'function') checkRedPacketTime();
    if (typeof syncFromCloud === 'function') syncFromCloud();
  }
};

$('#regSuccessKey').onclick = () => {
  const keyText = $('#regSuccessKey').textContent;
  navigator.clipboard.writeText(keyText).then(() => { showToast('面包 Key 已复制', '📋'); }).catch(() => { showToast('复制失败，请手动选择', '⚠️'); });
};

// ★ 新增 UUID 点击复制
$('#regSuccessUid').onclick = () => {
  const uidText = $('#regSuccessUid').textContent;
  navigator.clipboard.writeText(uidText).then(() => { showToast('UUID 已复制', '📋'); }).catch(() => { showToast('复制失败，请手动选择', '⚠️'); });
};
$('#btnRegSuccessClose').onclick = () => closeOverlay($('#registerSuccessOverlay'));

$('#btnUserClose').onclick = () => closeOverlay($('#userOverlay'));
$('#btnLogout').onclick = async () => {
  await sb.auth.signOut();
  currentUser = null; store.set('bb-current-user', null);
  if (typeof closeDevPanel === 'function') closeDevPanel();
  window.isDevMode = false;
  window.isAutoRainEnabled = false;
  closeOverlay($('#userOverlay')); loadUserData();
};
$('#btnChangePwd').onclick = () => { $('#oldPwd').value = ''; $('#newPwd').value = ''; openOverlay($('#pwdOverlay')); };
$('#btnRedeemCode').onclick = () => { $('#redeemInput').value = ''; openOverlay($('#redeemOverlay')); };

$('#btnDeleteAccount').onclick = () => { openOverlay($('#deleteConfirmOverlay')); };
$('#btnDeleteCancel').onclick = () => closeOverlay($('#deleteConfirmOverlay'));

// ★ 新增：注销账号时，必须输入面包 Key 才能核销
$('#btnDeleteConfirm').onclick = () => {
  let users = getUsersDB(); let u = users[currentUser];
  showInputModal('核销账号', '此操作不可恢复！请输入您的面包 Key 以确认注销', '', (inputKey) => {
    if (inputKey !== u.key) return showToast('面包 Key 错误，已取消注销', '❌');
    
    // 验证通过，开始删除
    delete users[currentUser]; store.set('bb-users', users);
    localStorage.removeItem(`bb-sites_${currentUser}`); localStorage.removeItem(`bb-history_${currentUser}`);
    removeUserFromQuickList(currentUser); currentUser = null; store.set('bb-current-user', null);
    if (typeof closeDevPanel === 'function') closeDevPanel();
    closeOverlay($('#deleteConfirmOverlay')); closeOverlay($('#userOverlay'));
    showToast('账号已注销，数据正在从云端抹除...', '🧹');
    setTimeout(() => { loadUserData(); showToast('云端同步完成', '☁️'); }, 1500);
  });
};

$('#btnPwdCancel').onclick = () => closeOverlay($('#pwdOverlay'));

// ★ 新增：修改密码时，原密码必须等于 面包 Key（忘密特赦令）
$('#btnPwdSave').onclick = async () => {
  const oldV = $('#oldPwd').value.trim(); 
  const newV = $('#newPwd').value.trim();
  
  if (!oldV || !newV) return showToast('请填完整', '⚠️');
  if (newV.length < 8) return showToast('密码长度至少8位', '⚠️');
  
  let users = getUsersDB(); 
  let u = users[currentUser];

  if (u.key !== oldV) {
    return showToast('原密码错误！忘记密码请输入面包 Key', '❌');
  }

  showToast('面包 Key 验证通过，正在更新...', '⏳');
  const { data, error } = await sb.auth.updateUser({ password: newV });
  
  if (error) {
    showToast('密码修改失败: ' + error.message, '❌');
  } else {
    closeOverlay($('#pwdOverlay')); 
    showToast('密码修改成功', '🔐');
  }
};

$('#btnRedeemCancel').onclick = () => closeOverlay($('#redeemOverlay'));
$('#btnRedeemSubmit').onclick = async () => {
  const code = $('#redeemInput').value.trim();
  if (await doRedeem(code, false)) closeOverlay($('#redeemOverlay'));
};

$('#avatarWrap').onclick = () => { $('#avatarUpload').click(); };
$('#avatarUpload').onchange = (e) => {
  const f = e.target.files[0]; 
  if (!f) return;
  
  if (f.size > 2 * 1024 * 1024) {
    showToast('图片太大，请不要超过 2MB', '⚠️');
    e.target.value = ''; 
    return;
  }
  
  showToast('正在处理图片...', '⏳');
  const reader = new FileReader();
  
  reader.onload = ev => {
    const img = new Image();
    img.onload = async () => {
      const c = document.createElement('canvas'); 
      const MAX = 512; 
      let w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
      c.width = w; c.height = h; 
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      
      c.toBlob(async (blob) => {
        if (!blob) return showToast('图片处理失败', '❌');
        
        const userData = getUsersDB()[currentUser];
        const safePrefix = userData && userData.user_id ? userData.user_id : 'user_' + Date.now();
        const fileName = `${safePrefix}.jpg`; 
        
        try {
          const { data, error } = await sb.storage.from('avatars').upload(fileName, blob, {
            upsert: true,
            contentType: 'image/jpeg'
          });
          if (error) throw error;
          
          const { data: urlData } = sb.storage.from('avatars').getPublicUrl(fileName);
          const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
          
          let users = getUsersDB(); 
          users[currentUser].avatar = publicUrl; 
          
          await store.set('bb-users', users); 
          
          updateUserUI();
          $('#userAvatar').src = publicUrl; 
          $('#userAvatar').style.display = 'block'; 
          $('#userAvatarPlaceholder').style.display = 'none';
          showToast('高清头像更新成功', '🖼️');
          
        } catch (err) {
          console.error(err);
          showToast('头像上传失败: ' + err.message, '❌');
        }
      }, 'image/jpeg', 0.85); 
    }; 
    img.src = ev.target.result;
  }; 
  
  reader.readAsDataURL(f); 
  e.target.value = '';
};