/* =========================================================
   08-points.js
   积分中心、购买VIP、解锁主题（新春限时12月购买）
   ========================================================= */

function openPointsShop() {
  if (!currentUser) return showToast('请先登录', '🔒');
  const users = getUsersDB(); const u = users[currentUser];
  const status = checkVipStatus(u);

  $('#shopPoints').textContent = u.points;

  let discount = 1;
  if (status.level === 1) discount = 0.9;
  if (status.level === 2) discount = 0.7;

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

  // 渲染主题商店
  const themeGrid = $('#themeShopGrid'); themeGrid.innerHTML = '';
  
  // ★ 判断购买时间：只在 12 月份开放购买
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 获取当前月份（1-12）
  const isSpringTime = (currentMonth === 12); 
  
  const themesToSell = [...SHOP_THEMES, 'spring']; // 加入新春

  themesToSell.forEach(key => {
    const t = THEMES[key];
    const isOwned = (status.level >= 2) || u.unlockedThemes.includes(key) || u.unlockedThemes.includes(key + '-plus');
    
    const el = document.createElement('div');
    el.className = 'theme-shop-item' + (isOwned ? ' owned' : '');
    
    if (key === 'spring') {
      // 新春专属逻辑
      if (isOwned) {
        el.innerHTML = `<div class="title">${t.name}</div><div class="price">✅ 已拥有</div>`;
      } else if (isSpringTime) {
        el.innerHTML = `<div class="title">${t.name}</div><div class="price" style="color:#e74c3c">🪙 1500 积分 (限时)</div>`;
        el.onclick = () => {
          showConfirmModal('购买主题', `确认消耗 1500 积分解锁【新春主题】及【Plus版】吗？`, () => {
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            if (upU.points >= 1500) {
              upU.points -= 1500;
              upU.unlockedThemes.push('spring');
              upU.unlockedThemes.push('spring-plus');
              store.set('bb-users', upUsers);
              showToast('购买成功！', '🎉');
              loadUserData(); openPointsShop();
            } else showToast('积分不足', '❌');
          }, false);
        };
      } else {
        el.innerHTML = `<div class="title">${t.name}</div><div class="price" style="color:#999">仅限12月限时开启</div>`;
        el.style.opacity = '0.6';
        el.style.cursor = 'not-allowed';
      }
    } else {
      // 普通主题逻辑
      el.innerHTML = `
        <div class="title">${t.name}</div>
        <div class="price">${isOwned ? '✅ 已拥有' : '🪙 1500 积分'}</div>
      `;
      if (!isOwned) {
        el.onclick = () => {
          showConfirmModal('购买主题', `确认消耗 1500 积分解锁【${t.name}】吗？`, () => {
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            if (upU.points >= 1500) {
              upU.points -= 1500;
              upU.unlockedThemes.push(key);
              store.set('bb-users', upUsers);
              showToast('购买成功！', '🎉');
              loadUserData(); openPointsShop();
            } else showToast('积分不足', '❌');
          }, false);
        };
      }
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

  showInputModal('选择购买数量', `请输入要购买的数量（单份 ${singleCost} 积分）`, '1', (input) => {
    const count = parseInt(input, 10);
    if (isNaN(count) || count <= 0) return showToast('请输入有效的数量', '❌');

    const totalCost = singleCost * count;
    let upUsers = getUsersDB(); let upU = upUsers[currentUser];

    if (upU.points < totalCost) {
      return showToast(`积分不足！需要 ${totalCost} 积分`, '❌');
    }

    upUsers.points -= totalCost;

    const addMs = days * count * 24 * 60 * 60 * 1000;
    const active = upU.vipExpire > Date.now();
    const start = (active && upU.vipLevel === level) ? upU.vipExpire : Date.now();

    if (upU.vipLevel > level && active) {
      upU.vipExpire = upU.vipExpire + addMs;
    } else {
      upU.vipLevel = level;
      upU.vipExpire = (active && upU.vipLevel === level) ? start + addMs : Date.now() + addMs;
    }

    store.set('bb-users', upUsers);
    showToast(`成功购买 ${count} 份 ${level === 1 ? 'VIP' : 'SVIP'} ${label}`, '🎉');
    loadUserData();
    openPointsShop();
  });
}