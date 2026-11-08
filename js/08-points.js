/* =========================================================
   08-points.js
   积分中心、购买VIP、解锁主题 (剥离 vipLevel)
   ========================================================= */

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

  SHOP_ITEMS.forEach(item => {
    const pVip = Math.floor(item.base * discount);
    const elVip = document.createElement('div');
    elVip.className = 'shop-item';
    elVip.innerHTML = `<div class="title">VIP ${item.label}</div><div class="price">🪙 ${pVip} 积分</div>`;
    elVip.onclick = () => buyVip(1, item.days, pVip, item.label);
    gridVip.appendChild(elVip);

    const pSvip = Math.floor(item.base * 3 * discount);
    const elSvip = document.createElement('div');
    elSvip.className = 'shop-item';
    elSvip.innerHTML = `<div class="title">SVIP ${item.label}</div><div class="price">🪙 ${pSvip} 积分</div>`;
    elSvip.onclick = () => buyVip(2, item.days, pSvip, item.label);
    gridSvip.appendChild(elSvip);
  });

  const themeGrid = $('#themeShopGrid'); themeGrid.innerHTML = '';
  
  const themesToSell = [
    'default-plus', 'default-max',
    'spring-plus', 'spring-max',
    'sakura', 'sakura-plus', 'sakura-max',
    'food', 'food-plus', 'food-max',
    'fruit', 'fruit-plus', 'fruit-max',
    'flower', 'flower-plus', 'flower-max',
    ...SHOP_THEMES
  ];

  themesToSell.forEach(key => {
    const t = THEMES[key];
    const isOwned = (status.type === 'svip') || u.unlockedThemes.includes(key);
    
    const el = document.createElement('div');
    el.className = 'theme-shop-item' + (isOwned ? ' owned' : '');
    
    el.innerHTML = `
      <div class="title">${t.name}</div>
      <div class="price">${isOwned ? '✅ 已拥有' : '🪙 ' + t.cost + ' 积分'}</div>
    `;
    
    if (!isOwned) {
      el.onclick = () => {
        showConfirmModal('购买主题', `确认消耗 ${t.cost} 积分解锁【${t.name}】吗？`, async () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          if (upU.points >= t.cost) {
            showToast('正在处理支付...', '⏳');
            const { error } = await sb.rpc('purchase_theme', { p_theme: key, p_cost: t.cost });
            if (error) return showToast('云端扣款失败', '❌');
            
            showToast('购买成功！', '🎉');
            if (typeof syncFromCloud === 'function') await syncFromCloud();
            loadUserData(); openPointsShop();
          } else showToast('积分不足', '❌');
        }, false);
      };
    }
    themeGrid.appendChild(el);
  });

  openOverlay($('#pointsOverlay'));
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

    if (upU.points < totalCost) {
      return showToast(`积分不足！需要 ${totalCost} 积分`, '❌');
    }

    showToast('正在处理支付...', '⏳');
    const totalDays = days * count;
    
    const { data, error } = await sb.rpc('purchase_vip', { 
      p_level: level, 
      p_days: totalDays, 
      p_cost: totalCost 
    });

    if (error || data === false) {
      return showToast('购买失败，积分不足或网络错误', '❌');
    }

    showToast(`成功购买 ${count} 份 ${level === 1 ? 'VIP' : 'SVIP'} ${label}`, '🎉');
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData();
    openPointsShop();
  });
}