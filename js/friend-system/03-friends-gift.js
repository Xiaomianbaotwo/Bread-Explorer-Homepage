/* =========================================================
   js/friend-system/03-friends-gift.js (传递 MailID 版)
   ========================================================= */

window.initGiftSystem = function() {
  const btnGift = document.getElementById('btnOpenGift');
  if (!btnGift) return;

  if (!document.getElementById('giftPanel')) {
    const panel = document.createElement('div');
    panel.className = 'gift-panel';
    panel.id = 'giftPanel';
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0; font-size:15px; color:var(--accent);">🎁 赠送礼物</h4>
        <button id="btnCloseGift" style="background:transparent; border:none; color:var(--ink-soft); cursor:pointer; font-size:16px;">✕</button>
      </div>
      <div style="font-size:12px; color:var(--ink-soft); margin-bottom:4px;">赠送积分：</div>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button class="gift-pts-btn" data-val="100" style="flex:1; padding:6px; border-radius:6px; border:1px solid var(--card-border); background:var(--card); cursor:pointer; font-size:12px;">100</button>
        <button class="gift-pts-btn" data-val="500" style="flex:1; padding:6px; border-radius:6px; border:1px solid var(--card-border); background:var(--card); cursor:pointer; font-size:12px;">500</button>
        <button class="gift-pts-btn" data-val="1000" style="flex:1; padding:6px; border-radius:6px; border:1px solid var(--card-border); background:var(--card); cursor:pointer; font-size:12px;">1000</button>
      </div>
      <div style="font-size:12px; color:var(--ink-soft); margin-bottom:4px;">赠送主题（对方未拥有）：</div>
      <div id="giftThemeList" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; margin-bottom:12px;"></div>
      <div style="font-size:12px; color:var(--ink-soft); margin-bottom:4px;">赠送兑换码：</div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="giftCodeInput" placeholder="输入兑换码" style="flex:1; padding:6px 10px; border-radius:6px; border:1px solid var(--card-border); background:var(--card); color:var(--ink); font-size:12px; outline:none;">
        <button id="btnSendGiftCode" style="padding:0 12px; border-radius:6px; border:none; background:var(--accent); color:#fff; cursor:pointer; font-size:12px;">赠送</button>
      </div>
    `;
    document.getElementById('chatArea').appendChild(panel);
  }

  btnGift.onclick = () => {
    const panel = document.getElementById('giftPanel');
    panel.classList.toggle('show');
    if (panel.classList.contains('show')) renderGiftThemes();
  };
  document.getElementById('btnCloseGift').onclick = () => document.getElementById('giftPanel').classList.remove('show');

  document.querySelectorAll('.gift-pts-btn').forEach(btn => {
    btn.onclick = () => executeSendGift('points', '', parseInt(btn.dataset.val), `送给你 ${btn.dataset.val} 积分`);
  });

  document.getElementById('btnSendGiftCode').onclick = async () => {
    const code = document.getElementById('giftCodeInput').value.trim();
    if (!code) return showToast('请输入兑换码', '⚠️');
    
    showToast('正在校验兑换码...', '⏳');
    const { data: isValid, error } = await sb.rpc('check_code_valid', { p_code: code });
    
    if (error || !isValid) {
      showToast('该兑换码无效或已被使用，无法赠送！', '❌');
      return;
    }

    executeSendGift('code', code, 0, `送给你一个兑换码`);
    document.getElementById('giftCodeInput').value = '';
  };
};

async function renderGiftThemes() {
  const listEl = document.getElementById('giftThemeList');
  if (!listEl) return;
  listEl.innerHTML = '<div style="font-size:12px; color:var(--ink-soft);">加载中...</div>';

  try {
    if (!window.currentChatFriend) return;

    const { data: friendThemes, error } = await sb.rpc('get_user_themes', { p_username: window.currentChatFriend.username });
    if (error) throw error;

    const myThemes = getUsersDB()[currentUser].unlockedThemes || [];
    
    const giftableThemes = myThemes.filter(t => 
      !(friendThemes || []).includes(t) && THEMES[t] && THEMES[t].cost > 0
    );

    if (giftableThemes.length === 0) {
      listEl.innerHTML = '<div style="font-size:12px; color:var(--ink-soft);">没有可赠送的主题（对方已拥有）</div>';
      return;
    }

    listEl.innerHTML = '';
    giftableThemes.forEach(key => {
      const t = THEMES[key];
      const btn = document.createElement('div');
      btn.style = "min-width: 100px; padding:8px; border-radius:8px; border:1px solid var(--card-border); background:var(--card); text-align:center; cursor:pointer; font-size:12px;";
      btn.innerHTML = `<div style="font-weight:bold; color:var(--ink); margin-bottom:4px;">${t.name}</div><div style="color:var(--accent);">售 ${t.cost} 积分</div>`;
      btn.onclick = () => showConfirmModal('赠送主题', `确定要花费 ${t.cost} 积分购买【${t.name}】赠送给好友吗？`, () => {
        executeSendGift('item', key, t.cost, `送给你主题【${t.name}】`);
      }, false);
      listEl.appendChild(btn);
    });
  } catch (err) {
    console.error(err);
    listEl.innerHTML = '<div style="font-size:12px; color:#e74c3c;">加载失败</div>';
  }
}

async function executeSendGift(giftType, itemId, amount, displayText) {
  if (!window.currentChatFriend) return showToast('请先选择好友', '⚠️');
  document.getElementById('giftPanel').classList.remove('show');
  showToast('正在发送礼包...', '⏳');
  
  try {
    // ★ 接收返回的 mail_id
    const { data: mailId, error } = await sb.rpc('send_friend_gift', {
      p_receiver_name: window.currentChatFriend.username,
      p_gift_type: giftType,
      p_item_id: itemId,
      p_amount: amount,
      p_sender_name: currentUser
    });
    
    if (error) throw new Error(error.message);

    if (mailId) {
      // ★ 把 mailId 塞进 JSON 里发给对方
      const giftJson = JSON.stringify({ type: giftType, itemId: itemId, amount: amount, text: displayText, mailId: mailId });
      await sb.from('bread_messages').insert({
        sender_name: currentUser,
        receiver_name: window.currentChatFriend.username,
        content: `[GIFT]${giftJson}`
      });
      
      showToast('🎁 礼物已发送！等待对方拆开', '🎉');
      if (giftType === 'points' || giftType === 'item') {
        if (typeof syncFromCloud === 'function') await syncFromCloud();
      }
    }
  } catch (err) { 
    showToast(err.message || '赠送失败', '❌'); 
  }
}