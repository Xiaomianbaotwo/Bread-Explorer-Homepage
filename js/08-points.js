/* =========================================================
   08-points.js
   积分中心、购买VIP、解锁主题 (多选批量购买版)
   ========================================================= */

// 全局记录当前选中的主题 Key
let selectedThemes = [];

function openPointsShop() {
  if (!currentUser) return showToast('请先登录', '🔒');
  const users = getUsersDB(); const u = users[currentUser];
  const status = checkVipStatus(u);

  $('#shopPoints').textContent = u.points;

  let discount = 1;
  if (status.type === 'vip') discount = 0.9;
  if (status.type === 'svip') discount = 0.7;

  const gridVip = $('#shopGridVip'); gridVip.innerHTML = '';
  const gridSvip = $('#shopGridSvip'); gridSvip.innerHTML = '';

  // 读取云端或本地的 VIP 档位
  const vipPrices = (window.cloudSettings && window.cloudSettings.vip_vip_prices) ? window.cloudSettings.vip_vip_prices : SHOP_ITEMS;
  const svipPrices = (window.cloudSettings && window.cloudSettings.vip_svip_prices) ? window.cloudSettings.vip_svip_prices : SHOP_ITEMS.map(i => ({...i, base: i.base * 3}));

  vipPrices.forEach(item => {
    const pVip = Math.floor(item.base * discount);
    const elVip = document.createElement('div');
    elVip.className = 'shop-item';
    elVip.innerHTML = `<div class="title">VIP ${item.label}</div><div class="price">🪙 ${pVip} 积分</div>`;
    elVip.onclick = () => buyVip(1, item.days, pVip, item.label);
    gridVip.appendChild(elVip);
  });

  svipPrices.forEach(item => {
    const pSvip = Math.floor(item.base * discount);
    const elSvip = document.createElement('div');
    elSvip.className = 'shop-item';
    elSvip.innerHTML = `<div class="title">SVIP ${item.label}</div><div class="price">🪙 ${pSvip} 积分</div>`;
    elSvip.onclick = () => buyVip(2, item.days, pSvip, item.label);
    gridSvip.appendChild(elSvip);
  });

  // 每次打开商城，先清空已选
  selectedThemes = [];
  renderThemeShop(u, status);
  openOverlay($('#pointsOverlay'));
}

// 将主题列表渲染独立出来，方便刷新状态
function renderThemeShop(u, status) {
  const themeGrid = $('#themeShopGrid'); themeGrid.innerHTML = '';
  
  // 顶部操作栏
  const actionBar = document.createElement('div');
  actionBar.style = "grid-column: 1 / -1; display: flex; gap: 10px; margin-bottom: 10px;";
  actionBar.innerHTML = `
    <button id="btnBuySelected" class="btn primary" style="flex:1; font-size:13px; padding:8px;">🛒 购买选中 (0)</button>
    <button id="btnBuyAll" class="btn ghost" style="flex:1; font-size:13px; padding:8px; border-color:var(--accent); color:var(--accent);">⚡ 一键购买所有可买</button>
  `;
  themeGrid.appendChild(actionBar);

  const allKeys = Object.keys(THEMES);
  const baseKeys = [], plusKeys = [], maxKeys = [];

  allKeys.forEach(key => {
    if (key.endsWith('-max')) maxKeys.push(key);
    else if (key.endsWith('-plus')) plusKeys.push(key);
    else baseKeys.push(key);
  });

  const sortedThemeKeys = [...baseKeys, ...plusKeys, ...maxKeys];
  let visibleThemes = []; // 记录当前可见且未拥有的主题

  sortedThemeKeys.forEach(key => {
    const t = THEMES[key];
    let baseKey = key.replace('-plus', '').replace('-max', '');
    let isBase = (key === baseKey);
    let isPlus = key.endsWith('-plus');
    let isMax = key.endsWith('-max');

    const baseConf = THEMES[baseKey];
    const baseCost = baseConf ? baseConf.cost : undefined;
    const baseIsFree = (baseCost === undefined || baseCost === 0);
    
    const hasBase = baseIsFree || u.unlockedThemes.includes(baseKey) || status.type === 'svip';

    if (isPlus && !hasBase) return;
    if (isMax) {
      const plusKey = `${baseKey}-plus`;
      const hasPlus = u.unlockedThemes.includes(plusKey) || status.type === 'svip';
      if (!hasPlus) return;
    }

    if (isBase && baseIsFree && !t.isSpring) return;

    const isOwned = (status.type === 'svip') || u.unlockedThemes.includes(key);
    const cloudThemeCost = (window.cloudSettings && window.cloudSettings.theme_prices) ? window.cloudSettings.theme_prices[key] : null;
    const finalCost = cloudThemeCost !== undefined && cloudThemeCost !== null ? cloudThemeCost : t.cost;

    if (!isOwned && (finalCost === undefined || finalCost === null)) return;
    if (!isOwned) visibleThemes.push({ key, cost: finalCost });

    const el = document.createElement('div');
    const isSelected = selectedThemes.includes(key);
    el.className = 'theme-shop-item' + (isOwned ? ' owned' : '') + (isSelected ? ' selected' : '');
    
    // 如果在选中状态，加个高亮边框
    if (isSelected) el.style.border = '2px solid var(--accent)';
    
    el.innerHTML = `
      <div class="title">${t.name}</div>
      <div class="price">${isOwned ? '✅ 已拥有' : (isSelected ? '☑️ 已选中' : '🪙 ' + finalCost + ' 积分')}</div>
    `;
    
    if (!isOwned) {
      el.onclick = () => {
        if (selectedThemes.includes(key)) {
          selectedThemes = selectedThemes.filter(k => k !== key);
        } else {
          selectedThemes.push(key);
        }
        renderThemeShop(u, status); // 重绘更新选中状态
      };
    }
    themeGrid.appendChild(el);
  });

  // 绑定顶部按钮事件
  const btnBuySelected = $('#btnBuySelected');
  const btnBuyAll = $('#btnBuyAll');
  
  if (btnBuySelected) {
    btnBuySelected.textContent = `🛒 购买选中 (${selectedThemes.length})`;
    if (selectedThemes.length === 0) {
      btnBuySelected.disabled = true;
      btnBuySelected.style.opacity = '0.5';
    } else {
      btnBuySelected.onclick = () => executeBatchPurchase(selectedThemes, u, status);
    }
  }

  if (btnBuyAll) {
    if (visibleThemes.length === 0) {
      btnBuyAll.disabled = true;
      btnBuyAll.style.opacity = '0.5';
    } else {
      btnBuyAll.onclick = () => {
        const allKeys = visibleThemes.map(v => v.key);
        showConfirmModal('一键购买', `确定要花费积分购买当前所有可见主题吗？（共 ${allKeys.length} 个）`, () => {
          executeBatchPurchase(allKeys, u, status);
        }, false);
      };
    }
  }
}

// 执行批量购买
async function executeBatchPurchase(keys, u, status) {
  if (!keys || keys.length === 0) return;
  
  let totalCost = 0;
  const itemsToBuy = [];
  
  keys.forEach(k => {
    const t = THEMES[k];
    const cloudThemeCost = (window.cloudSettings && window.cloudSettings.theme_prices) ? window.cloudSettings.theme_prices[k] : null;
    const finalCost = cloudThemeCost !== undefined && cloudThemeCost !== null ? cloudThemeCost : t.cost;
    totalCost += finalCost;
    itemsToBuy.push({ key: k, cost: finalCost });
  });

  if (u.points < totalCost) {
    return showToast(`积分不足！共需 ${totalCost} 积分，您当前只有 ${u.points}`, '❌');
  }

  showToast(`正在处理批量支付 (共 ${keys.length} 个)...`, '⏳');
  
  // 循环调用现有的单次购买 RPC
  let successCount = 0;
  for (let item of itemsToBuy) {
    const { error } = await sb.rpc('purchase_theme', { p_theme: item.key, p_cost: item.cost });
    if (!error) successCount++;
  }

  if (successCount > 0) {
    showToast(`成功购买并解锁 ${successCount} 个主题！`, '🎉');
    selectedThemes = [];
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData();
    
    // 重新获取最新的用户数据和状态，刷新面板
    const upUsers = getUsersDB();
    const upU = upUsers[currentUser];
    const upStatus = checkVipStatus(upU);
    $('#shopPoints').textContent = upU.points;
    renderThemeShop(upU, upStatus);
  } else {
    showToast('批量购买失败，请检查网络', '❌');
  }
}

$('#btnPoints').onclick = openPointsShop;
$('#btnPointsClose').onclick = () => closeOverlay($('#pointsOverlay'));

function buyVip(level, days, singleCost, label) {
  let users = getUsersDB(); let u = users[currentUser];
  if (u.points < singleCost) return showToast('积分不足', '❌');

  showInputModal('选择购买数量', `请输入要购买的数量（单份 ${singleCost} 积分）`, '1', async (input) => {
    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) return showToast('请输入有效的数量', '❌');

    const totalCost = singleCost * count;
    let upUsers = getUsersDB(); let upU = upUsers[currentUser];

    if (upU.points < totalCost) return showToast(`积分不足！需要 ${totalCost} 积分`, '❌');

    showToast('正在处理支付...', '⏳');
    const totalDays = days * count;
    
    const { data, error } = await sb.rpc('purchase_vip', { 
      p_level: level, p_days: totalDays, p_cost: totalCost 
    });

    if (error || data === false) return showToast('购买失败，积分不足或网络错误', '❌');

    showToast(`成功购买 ${count} 份 ${level === 1 ? 'VIP' : 'SVIP'} ${label}`, '🎉');
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData();
    openPointsShop();
  });
}