/* =========================================================
   10-dev.js
   开发者模式：快捷键唤醒、修改数据、生成/管理兑换码、测试红包雨
   ========================================================= */

let devKeys = '';
window.isDevMode = false; 
window.isAutoRainEnabled = false; // ★ 自动领取开关状态

function closeDevPanel() {
  window.isDevMode = false;
  window.isAutoRainEnabled = false; // ★ 核心修复：关闭面板时强制关闭自动领取
  
  // 恢复按钮的默认样式和文字
  const btn = $('#btnDevAutoRain');
  if (btn) {
    btn.style.color = '#9b59b6';
    btn.style.background = 'transparent';
    btn.textContent = '🤖 自动领取红包(0.7秒)';
  }

  $('#devPanel').classList.remove('show');
}
document.addEventListener('keydown', (e) => {
  if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;

  if (currentUser === '小面包吖two' && e.key.toLowerCase() === 'k') {
    window.isDevMode = !window.isDevMode;
    $('#devPanel').classList.toggle('show', window.isDevMode);
    showToast(window.isDevMode ? '开发者模式已开启' : '开发者模式已关闭', '🛠️');
    return;
  }

  devKeys += e.key.toLowerCase();
  if (devKeys.length > 20) devKeys = devKeys.slice(-20);

  if (devKeys.endsWith('wwssaadd20121022')) {
    devKeys = '';
    if (!window.isDevMode) {
      window.isDevMode = true;
      $('#devPanel').classList.add('show');
      showToast('开发者模式已开启', '🛠️');
    }
  }
});

$('#btnDevClose').onclick = () => {
  closeDevPanel();
  showToast('开发者模式已关闭', '🔒');
};

$('#btnDevStartRain').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  closeOverlay($('#confirmOverlay')); 
  if (typeof startRedPacketRain === 'function') {
    startRedPacketRain();
    showToast('红包雨已启动', '🧧');
  } else {
    showToast('红包雨模块未加载', '❌');
  }
};

//自动领取红包开关
$('#btnDevAutoRain').onclick = () => {
  window.isAutoRainEnabled = !window.isAutoRainEnabled;
  const btn = $('#btnDevAutoRain');
  if (window.isAutoRainEnabled) {
    btn.style.color = '#fff';
    btn.style.background = '#9b59b6';
    btn.textContent = '🤖 自动领取：已开启(0.7秒)';
    showToast('已开启自动领取（红包出现0.7秒后自动点击）', '🤖');
  } else {
    btn.style.color = '#9b59b6';
    btn.style.background = 'transparent';
    btn.textContent = '🤖 自动领取红包(0.7秒)';
    showToast('已关闭自动领取', '🔒');
  }
};

$('#btnDevAddDay').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showInputModal('模拟增加注册时长', '请输入要增加的天数（如：10）', '10', (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return showToast('请输入有效的天数', '❌');
    let users = getUsersDB(); let u = users[currentUser];
    u.regTime -= days * 24 * 60 * 60 * 1000;
    store.set('bb-users', users);
    loadUserData();
    showToast(`已模拟增加 ${days} 天`, '🛠️');
  });
};

$('#btnDevSetDay').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showInputModal('模拟设置注册时长', '请输入要设置的天数（如：30）', '30', (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return showToast('请输入有效的天数', '❌');
    let users = getUsersDB(); let u = users[currentUser];
    u.regTime = Date.now() - days * 24 * 60 * 60 * 1000;
    store.set('bb-users', users);
    loadUserData();
    showToast(`注册时长设为 ${days} 天`, '🛠️');
  });
};

$('#btnDevSetPoints').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showInputModal('设置用户积分', '请输入要设置的积分数', '10000', (input) => {
    const pts = parseInt(input, 10);
    if (isNaN(pts) || pts < 0) return showToast('请输入有效数字', '❌');
    let users = getUsersDB(); let u = users[currentUser];
    u.points = pts;
    store.set('bb-users', users);
    loadUserData();
    showToast(`积分已设为 ${pts}`, '🪙');
  });
};

function setDevVip(level) {
  if (!currentUser) return showToast('请先登录', '⚠️');
  if (level === 0) {
    let users = getUsersDB(); let u = users[currentUser];
    u.vipLevel = 0; u.vipExpire = 0;
    store.set('bb-users', users);
    loadUserData();
    return showToast('已设为普通用户', '🔧');
  }
  showInputModal(`设为 ${level === 1 ? 'VIP' : 'SVIP'}`, '输入时长（天，0为永久）', level === 1 ? '30' : '365', (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days < 0) return showToast('请输入有效的天数', '❌');
    let users = getUsersDB(); let u = users[currentUser];
    u.vipLevel = level;
    u.vipExpire = days === 0 ? 0 : Date.now() + days * 24 * 60 * 60 * 1000;
    store.set('bb-users', users);
    loadUserData();
    showToast(`已设为 ${level === 1 ? 'VIP' : 'SVIP'}`, '🔧');
  });
}

$('#btnDevSetNone').onclick = () => setDevVip(0);
$('#btnDevSetVip').onclick = () => setDevVip(1);
$('#btnDevSetSvip').onclick = () => setDevVip(2);
$('#btnDevSetForever').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  let users = getUsersDB(); let u = users[currentUser];
  u.vipLevel = 2; u.vipExpire = 0;
  store.set('bb-users', users);
  loadUserData();
  showToast('已设为永久 SVIP', '🔧');
};

$('#btnDevManageCodes').onclick = () => {
  $('#codeManageInput').value = '';
  openOverlay($('#codeManageOverlay'));
};

$('#btnDevGenCode').onclick = () => {
  showInputModal(
    '生成兑换码',
    '格式：类型,数值。例：SVIP,365 ｜ VIP,30 ｜ SVIP,0（永久）｜ POINT,500',
    'SVIP,365',
    (input) => {
      const parts = input.split(',').map(s => s.trim());
      const type = (parts[0] || '').toUpperCase();
      const val = parseInt(parts[1], 10);
      let code;

      if (type === 'POINT') {
        if (isNaN(val) || val <= 0) return showToast('积分数无效', '❌');
        code = createRedeemCode(0, 0, val);
      } else if (type === 'VIP' || type === 'SVIP') {
        if (isNaN(val) || val < 0) return showToast('天数无效', '❌');
        code = createRedeemCode(type === 'SVIP' ? 2 : 1, val, 0);
      } else {
        return showToast('类型只能是 VIP / SVIP / POINT', '❌');
      }

      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
      showInputModal('兑换码已生成（已尝试复制）', '可全选复制发给用户', code, () => {});
    }
  );
};

$('#btnCodeManageCancel').onclick = () => closeOverlay($('#codeManageOverlay'));
$('#btnCodeManageSave').onclick = () => {
  const newRaw = $('#codeManageInput').value.trim();
  if (!newRaw) { closeOverlay($('#codeManageOverlay')); return; }

  let oldRaw = store.get('bb-custom-codes-raw', '');
  if (oldRaw && !oldRaw.endsWith('\n')) oldRaw += '\n';
  store.set('bb-custom-codes-raw', oldRaw + newRaw);

  const lines = newRaw.split('\n');
  let successCount = 0;
  lines.forEach(line => {
    const code = line.trim().toUpperCase();
    if (!code) return;

    const ptsMatch = code.match(/^POINT-STRING-(\d+)-[A-Z0-9]{7}$/);
    if (ptsMatch) {
      REDEEM_DB[hashCode(code)] = { level: 0, days: 0, points: parseInt(ptsMatch[1], 10) };
      successCount++;
      return;
    }

    if (code.startsWith('POINT-STRING-')) return;

    const match = code.match(/^(VIP|SVIP)-STRING-(\d+[DMQY]|LIFE)-[A-Z0-9]{7}$/);
    if (match) {
      const level = match[1] === 'SVIP' ? 2 : 1;
      const days = parseTimeStr(match[2]);
      if (!isNaN(days)) {
        REDEEM_DB[hashCode(code)] = { level, days, points: 0 };
        successCount++;
      }
    }
  });

  closeOverlay($('#codeManageOverlay'));
  showToast(`已成功添加 ${successCount} 个兑换码`, '🎫');
};

$('#btnDevRunCode').onclick = () => {
  $('#runCodeInput').value = '';
  openOverlay($('#runCodeOverlay'));
};

$('#btnRunCodeCancel').onclick = () => closeOverlay($('#runCodeOverlay'));
$('#btnRunCodeExecute').onclick = () => {
  const code = $('#runCodeInput').value;
  if (!code.trim()) return;
  try {
    new Function(code)();
    showToast('代码执行成功', '✅');
    closeOverlay($('#runCodeOverlay'));
  } catch (e) {
    showToast('代码错误: ' + e.message, '❌');
  }
};