/* =========================================================
   10-dev.js
   开发者模式：免密通行证、三端执行、云端数据强改
   ========================================================= */

window.isDevMode = false; 
window.isAutoRainEnabled = false; 
const DEV_UUID = 'b53b3bc6-6126-42a5-8f9c-c80f93196d58';

function closeDevPanel() {
  window.isDevMode = false;
  window.isAutoRainEnabled = false; 
  const btn = $('#btnDevAutoRain');
  if (btn) {
    btn.style.color = '#9b59b6'; btn.style.background = 'transparent';
    btn.textContent = '🤖 自动领取红包(0.7秒)';
  }
  $('#devPanel').classList.remove('show');
}

document.addEventListener('keydown', async (e) => {
  if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
  if (currentUser && e.key.toLowerCase() === 'k') {
    if (window.isDevMode) {
      window.isDevMode = false; $('#devPanel').classList.remove('show');
      return showToast('开发者模式已关闭', '🔒');
    }
    try {
      showToast('正在向云端验证身份...', '⏳');
      const { data: { user }, error } = await sb.auth.getUser();
      if (error || !user) return showToast('验证失败：未登录', '❌');
      if (user.id === DEV_UUID) {
        window.isDevMode = true; $('#devPanel').classList.add('show');
        showToast('身份验证通过，欢迎主理人！', '👑');
      } else { showToast('拒绝访问：无管理员权限', '🚫'); }
    } catch (err) { showToast('请求失败，检查网络', '❌'); }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = $('#searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val.startsWith('bread-key-') && val.length === 42) {
          e.preventDefault();
          try {
            const { data: { user }, error } = await sb.auth.getUser();
            if (!error && user && user.id === DEV_UUID) {
              const users = getUsersDB();
              if (users[currentUser] && users[currentUser].key === val) {
                window.isDevMode = true;
                $('#devPanel').classList.add('show');
                showToast('极客暗号验证通过，欢迎主理人！', '🕶️');
                searchInput.value = '';
                return;
              }
            }
            showToast('无效的暗号', '🚫');
            searchInput.value = '';
          } catch (err) {
            showToast('暗号验证失败', '❌');
          }
        }
      }
    });
  }
});

$('#btnDevClose').onclick = () => { closeDevPanel(); showToast('开发者模式已关闭', '🔒'); };

let currentRunMode = 'js';

function checkDevSecret(mode, callback) {
    const now = Date.now();
    const bypassDataStr = localStorage.getItem('bb-dev-bypass');
    if (bypassDataStr) {
        try {
            const bypass = JSON.parse(bypassDataStr);
            if (bypass[mode] && bypass[mode].count > 0 && bypass[mode].expire > now) {
                bypass[mode].count--;
                localStorage.setItem('bb-dev-bypass', JSON.stringify(bypass));
                showToast(`本机免密通过！剩余次数：${bypass[mode].count}`, '🔓');
                callback();
                return;
            }
        } catch(e) {}
    }
    
    const modeName = mode === 'js' ? '前端' : mode === 'sql' ? '后端' : '全栈';
    showInputModal('身份验证', `请输入开发者【${modeName}】专属密钥`, '', async (input) => {
        if (!input) return;
        showToast('正在向云端验证密钥...', '⏳');
        const { data, error } = await sb.rpc('verify_dev_secret', { p_mode: mode, p_input: input });
        
        if (error) return showToast('网络错误: ' + error.message, '❌');
        
        if (data === true) {
            showToast('密钥正确，欢迎主理人', '👑');
            setTimeout(() => {
                showInputModal('免密设置', '是否在当前电脑开启免密通行证？\n请输入免密次数 (输入0则本次单次生效)', '15', (countStr) => {
                    const count = parseInt(countStr, 10);
                    if (!isNaN(count) && count > 0) {
                        const bypassDataStr = localStorage.getItem('bb-dev-bypass');
                        let bypass = bypassDataStr ? JSON.parse(bypassDataStr) : {};
                        bypass[mode] = { count: count - 1, expire: now + 24 * 60 * 60 * 1000 };
                        localStorage.setItem('bb-dev-bypass', JSON.stringify(bypass));
                        showToast(`已开启本机免密，剩余 ${count - 1} 次`, '🔓');
                    }
                    callback();
                });
            }, 300);
        } else {
            showToast('密钥错误，拒绝访问！', '🚫');
        }
    });
}

function openDevRunner(mode) {
    currentRunMode = mode;
    const title = $('#runCodeTitle');
    const jsArea = $('#jsCodeArea');
    const sqlArea = $('#sqlCodeArea');
    
    if (!title || !jsArea || !sqlArea) return alert('页面缺少双端输入弹窗结构，请更新 index.html！');
    
    if (mode === 'js') title.textContent = '💻 执行自定义代码(前端)';
    else if (mode === 'sql') title.textContent = '📡 执行自定义代码(后端)';
    else title.textContent = '🚀 执行自定义代码(前端+后端)';

    jsArea.style.display = (mode === 'js' || mode === 'all') ? 'block' : 'none';
    sqlArea.style.display = (mode === 'sql' || mode === 'all') ? 'block' : 'none';
    
    $('#runJsInput').value = '';
    $('#runSqlInput').value = '';
    openOverlay($('#runCodeOverlay'));
}

$('#btnDevRunJs').onclick = () => checkDevSecret('js', () => openDevRunner('js'));
$('#btnDevRunSql').onclick = () => checkDevSecret('sql', () => openDevRunner('sql'));
$('#btnDevRunAll').onclick = () => checkDevSecret('all', () => openDevRunner('all'));
$('#btnRunCodeCancel').onclick = () => closeOverlay($('#runCodeOverlay'));

$('#btnRunCodeExecute').onclick = async () => {
    const jsCode = $('#runJsInput').value.trim();
    const sqlCode = $('#runSqlInput').value.trim();
    
    if (currentRunMode === 'js' || currentRunMode === 'all') {
        if (jsCode) {
            try {
                new Function(jsCode)();
                showToast('前端代码执行成功', '✅');
            } catch (e) {
                return showToast('前端代码错误: ' + e.message, '❌');
            }
        }
    }

    if (currentRunMode === 'sql' || currentRunMode === 'all') {
        if (sqlCode) {
            showToast('正在请求云端执行...', '⏳');
            const { data, error } = await sb.rpc('dev_execute_sql', { p_sql: sqlCode });
            if (error) return showToast('网络或 RPC 错误: ' + error.message, '❌');
            if (!data.success) return showToast('后端执行失败: ' + data.error, '❌');
            showToast('后端代码执行成功', '✅');
        }
    }

    closeOverlay($('#runCodeOverlay'));
    if (currentRunMode !== 'js' && sqlCode) {
        setTimeout(() => { if (typeof syncFromCloud === 'function') syncFromCloud(); }, 500);
    }
};

$('#btnDevStartRain').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  closeOverlay($('#confirmOverlay')); 
  if (typeof startRedPacketRain === 'function') { startRedPacketRain(); showToast('红包雨已启动', '🧧'); }
};

$('#btnDevAutoRain').onclick = () => {
  window.isAutoRainEnabled = !window.isAutoRainEnabled;
  const btn = $('#btnDevAutoRain');
  if (window.isAutoRainEnabled) {
    btn.style.color = '#fff'; btn.style.background = '#9b59b6';
    btn.textContent = '🤖 自动领取：已开启(0.7秒)';
    showToast('已开启自动领取', '🤖');
  } else {
    btn.style.color = '#9b59b6'; btn.style.background = 'transparent';
    btn.textContent = '🤖 自动领取红包(0.7秒)';
    showToast('已关闭自动领取', '🔒');
  }
};

$('#btnDevAddDay').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showInputModal('模拟增加注册时长', '请输入要增加的天数（如：10）', '10', async (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return showToast('请输入有效的天数', '❌');
    
    showToast('正在同步云端...', '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    u.regTime -= days * 24 * 60 * 60 * 1000;
    
    const { error } = await sb.from('bread_users').update({ reg_time: u.regTime }).eq('user_id', u.user_id);
    if (error) return showToast('同步失败', '❌');

    store.set('bb-users', users);
    loadUserData();
    showToast(`已模拟增加 ${days} 天`, '🛠️');
  });
};

$('#btnDevSetDay').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showInputModal('模拟设置注册时长', '请输入要设置的天数（如：30）', '30', async (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return showToast('请输入有效的天数', '❌');
    
    showToast('正在同步云端...', '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    u.regTime = Date.now() - days * 24 * 60 * 60 * 1000;
    
    const { error } = await sb.from('bread_users').update({ reg_time: u.regTime }).eq('user_id', u.user_id);
    if (error) return showToast('同步失败', '❌');

    store.set('bb-users', users);
    loadUserData();
    showToast(`注册时长设为 ${days} 天`, '🛠️');
  });
};

$('#btnDevSetPoints').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showInputModal('设置用户积分', '请输入要设置的积分数', '10000', async (input) => {
    const pts = parseInt(input, 10);
    if (isNaN(pts) || pts < 0) return showToast('请输入有效数字', '❌');
    
    showToast('正在同步云端...', '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    const vLevel = u.vipType === 'svip' ? 2 : (u.vipType === 'vip' ? 1 : 0);
    const vExpire = u.vipExpire || 0;

    const { error } = await sb.rpc('dev_update_assets', {
      p_points: pts, p_vip_level: vLevel, p_vip_expire: vExpire, p_admin_id: DEV_UUID
    });
    if (error) return showToast('云端修改失败: ' + error.message, '❌');

    u.points = pts;
    store.set('bb-users', users); 
    loadUserData();
    showToast(`积分已设为 ${pts} 并同步云端`, '🪙');
  });
};

function setDevVip(level) {
  if (!currentUser) return showToast('请先登录', '⚠️');
  
  if (level === 0) {
    showInputModal('设为普通用户', '确认清空所有 VIP 特权？输入任意字符确认', '确认', async (input) => {
      showToast('正在同步云端...', '⏳');
      let users = getUsersDB(); let u = users[currentUser];
      
      const { error } = await sb.rpc('dev_update_assets', {
        p_points: u.points || 0, p_vip_level: 0, p_vip_expire: 0, p_admin_id: DEV_UUID
      });
      if (error) return showToast('云端修改失败: ' + error.message, '❌');

      u.vipType = 'none'; u.vipExpire = 0;
      store.set('bb-users', users); 
      loadUserData();
      showToast('已设为普通用户并同步云端', '🔧');
    });
    return;
  }
  
  showInputModal(`设为 ${level === 1 ? 'VIP' : 'SVIP'}`, '输入时长（天，0为永久）', level === 1 ? '30' : '365', async (input) => {
    const days = parseInt(input, 10);
    if (isNaN(days) || days < 0) return showToast('请输入有效的天数', '❌');
    
    showToast('正在同步云端...', '⏳');
    let users = getUsersDB(); let u = users[currentUser];
    const expireTime = days === 0 ? 0 : Date.now() + days * 24 * 60 * 60 * 1000;

    const { error } = await sb.rpc('dev_update_assets', {
      p_points: u.points || 0, p_vip_level: level, p_vip_expire: expireTime, p_admin_id: DEV_UUID
    });
    if (error) return showToast('云端修改失败: ' + error.message, '❌');

    u.vipType = level === 2 ? 'svip' : 'vip';
    u.vipExpire = expireTime;
    store.set('bb-users', users); 
    loadUserData();
    showToast(`已设为 ${level === 1 ? 'VIP' : 'SVIP'} 并同步云端`, '🔧');
  });
}

$('#btnDevSetNone').onclick = () => setDevVip(0);
$('#btnDevSetVip').onclick = () => setDevVip(1);
$('#btnDevSetSvip').onclick = () => setDevVip(2);

$('#btnDevSetForever').onclick = () => {
  if (!currentUser) return showToast('请先登录', '⚠️');
  showToast('正在同步云端...', '⏳');
  let users = getUsersDB(); let u = users[currentUser];

  sb.rpc('dev_update_assets', {
    p_points: u.points || 0, p_vip_level: 2, p_vip_expire: 0, p_admin_id: DEV_UUID
  }).then(({ error }) => {
    if (error) return showToast('云端修改失败: ' + error.message, '❌');
    u.vipType = 'svip'; u.vipExpire = 0;
    store.set('bb-users', users); 
    loadUserData();
    showToast('已设为永久 SVIP 并同步云端', '🔧');
  });
};

$('#btnDevManageCodes').onclick = () => { $('#codeManageInput').value = ''; openOverlay($('#codeManageOverlay')); };

$('#btnDevGenCode').onclick = () => {
  showInputModal('批量生成兑换码', '格式：类型,数值,数量。\n例如：SVIP,30,10', 'SVIP,30,10', async (input) => {
      const parts = input.split(',').map(s => s.trim());
      const type = (parts[0] || '').toLowerCase(); 
      const val = parseInt(parts[1], 10);
      const count = parseInt(parts[2], 10) || 1;

      if (type !== 'vip' && type !== 'svip' && type !== 'points') {
        return showToast('类型只能是 VIP / SVIP / POINT', '❌');
      }
      if (isNaN(val) || val < 0) return showToast('天数或积分数无效', '❌');

      showToast(`正在向云端申请生成 ${count} 个码...`, '⏳');
      
      const { data, error } = await sb.rpc('generate_redeem_code_v3', {
        p_type: type, p_value: val, p_count: count, p_admin_id: DEV_UUID
      });

      if (error) return showToast('生成失败：' + error.message, '❌');

      const codeListText = data.join('\n');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(codeListText).then(() => {
          showToast(`成功生成 ${count} 个码，已复制到剪贴板`, '📋');
        }).catch(() => {
          showToast(`成功生成 ${count} 个码`, '🎉');
        });
      }
      showInputModal(`成功生成 ${count} 个（已复制全部）`, '10位乱序，有效期7天。', data[0], () => {});
    }
  );
};
$('#btnCodeManageCancel').onclick = () => closeOverlay($('#codeManageOverlay'));
$('#btnCodeManageSave').onclick = () => {
  let oldRaw = store.get('bb-custom-codes-raw', '');
  if (oldRaw && !oldRaw.endsWith('\n')) oldRaw += '\n';
  store.set('bb-custom-codes-raw', oldRaw + $('#codeManageInput').value.trim());
  closeOverlay($('#codeManageOverlay')); showToast(`添加成功`, '🎫');
};