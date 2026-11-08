/* =========================================================
   07-mail.js
   邮件中心 (完美适配拆礼包：积分、主题、兑换码)
   ========================================================= */

async function syncEmailsToCloud(u) {
  try {
    await sb.rpc('update_user_emails', { p_emails: u.emails });
  } catch (e) {
    console.error("云端邮件状态同步失败:", e);
  }
}

function renderMails() {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  if (!u.emails) u.emails = [];

  let hasChanged = false;
  u.emails.forEach(e => {
    if (!e.isRead) { e.isRead = true; hasChanged = true; }
  });
  
  if (hasChanged) {
    store.set('bb-users', users); 
    syncEmailsToCloud(u); 
  }
  updateUserUI();

  const list = $('#mailList'); list.innerHTML = '';
  if (u.emails.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">暂时没有邮件哦～</div>';
  } else {
    u.emails.sort((a, b) => b.date - a.date).forEach((e, idx) => {
      const item = document.createElement('div');
      item.className = 'mail-item';

      let attachHtml = '';
      
      if (e.type === 'friend_request') {
        attachHtml = `
          <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
            <button class="btn primary btn-accept-friend" data-name="${e.sender_name}" data-mailid="${e.id}" ${e.isUsed ? 'disabled style="opacity:0.5;"' : ''}>✅ 同意申请</button>
            <button class="btn ghost btn-reject-friend" data-mailid="${e.id}" ${e.isUsed ? 'disabled style="opacity:0.5;"' : ''}>❌ 拒绝</button>
          </div>
        `;
      } 
      else if (e.type === 'gift_package') {
        attachHtml = `
          <div style="background:linear-gradient(135deg, #ff9800, #e74c3c); padding:12px; border-radius:8px; font-size:16px; text-align:center; color:#fff; margin-top:10px; font-weight:bold;">
            🎁 神秘礼包
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary claim-gift-btn" data-idx="${idx}" ${e.isClaimed ? 'disabled style="opacity:0.5;"' : ''}>${e.isClaimed ? '✅ 已拆开' : '📦 立即拆开'}</button>
          </div>
        `;
      }
      else if (e.code) {
        attachHtml = `
          <div class="mail-code-box" style="background:var(--card); padding:8px; border-radius:6px; font-family:monospace; font-size:16px; text-align:center; letter-spacing:1px; color:var(--accent); margin-top:10px; border:1px dashed var(--card-border); cursor:pointer;">
            ${e.code}
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary use-btn" data-code="${e.code}" ${e.isUsed ? 'disabled style="opacity:0.5;"' : ''}>${e.isUsed ? (e.failReason || '❌ 已被使用') : '⚡ 立即使用'}</button>
          </div>
        `;
      } 
      else if (e.points) {
        attachHtml = `
          <div style="background:var(--card); padding:8px; border-radius:6px; font-size:16px; text-align:center; color:var(--accent); margin-top:10px; border:1px dashed var(--card-border);">
            🪙 +${e.points} 积分
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary claim-btn" data-idx="${idx}" ${e.isClaimed ? 'disabled style="opacity:0.5;"' : ''}>${e.isClaimed ? '✅ 已领取' : '📥 领取积分'}</button>
          </div>
        `;
      }

      let statusHtml = '';
      if (e.type === 'friend_request') {
        statusHtml = `<span style="color:${e.isUsed ? '#e74c3c' : '#27ae60'}">${e.isUsed ? '❌ 已处理' : '✅ 待处理'}</span>`;
      } else if (e.type === 'gift_package') {
        statusHtml = `<span style="color:${e.isClaimed ? '#e74c3c' : '#27ae60'}">${e.isClaimed ? '❌ 已拆开' : '✅ 待拆开'}</span>`;
      } else if (e.code) {
        statusHtml = `<span style="color:${e.isUsed ? '#e74c3c' : '#27ae60'}">${e.isUsed ? (e.failReason || '❌ 已使用') : '✅ 待领取'}</span>`;
      }

      item.innerHTML = `
        <div class="mail-title">
          <span>${e.title}</span>
          <span class="mail-date">${new Date(e.date).toLocaleDateString()}</span>
        </div>
        <div class="mail-content">
          <p>${e.content}</p>
          ${attachHtml}
          <div class="mail-btns">
            ${statusHtml ? `<span style="font-size:12px; flex:1; align-self:center;">${statusHtml}</span>` : ''}
            <button class="btn ghost del-btn" style="color:#e74c3c; border-color:#e74c3c; padding:4px 10px; font-size:12px;">🗑 删除</button>
          </div>
        </div>
      `;

      item.querySelector('.mail-title').onclick = () => { item.classList.toggle('open'); };
      item.querySelector('.del-btn').onclick = (ev) => {
        ev.stopPropagation();
        showConfirmModal('删除邮件', '确定删除这封邮件吗？删除后不可恢复。', async () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          upU.emails = upU.emails.filter(m => m.id !== e.id);
          store.set('bb-users', upUsers);
          await syncEmailsToCloud(upU);
          renderMails();
        });
      };

      // 同意好友
      const btnAccept = item.querySelector('.btn-accept-friend');
      if (btnAccept) {
        btnAccept.onclick = async (ev) => {
          ev.stopPropagation();
          btnAccept.disabled = true; btnAccept.textContent = '处理中...';
          if (typeof window.acceptFriendRequest === 'function') {
            await window.acceptFriendRequest(e.sender_name);
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id);
            if (tm) tm.isUsed = true;
            store.set('bb-users', upUsers); await syncEmailsToCloud(upU);
            renderMails();
          }
        };
      }

      // 拒绝好友
      const btnReject = item.querySelector('.btn-reject-friend');
      if (btnReject) {
        btnReject.onclick = async (ev) => {
          ev.stopPropagation();
          showToast('已拒绝申请', '👋');
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const tm = upU.emails.find(m => m.id === e.id);
          if (tm) tm.isUsed = true;
          store.set('bb-users', upUsers); await syncEmailsToCloud(upU);
          renderMails();
        };
      }

      // ★ 修复：调用全新专属接口拆礼包
      const giftBtn = item.querySelector('.claim-gift-btn');
      if (giftBtn && !e.isClaimed) {
        giftBtn.onclick = async (ev) => {
          ev.stopPropagation();
          giftBtn.disabled = true; giftBtn.textContent = '拆开中...';
          
          try {
            if (e.gift_type === 'code') {
               // 兑换码走核销接口
               const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: e.gift_value });
               if (error || !data.success) throw new Error(data?.msg || '兑换码无效');
               showToast(`成功领取兑换码！`, '🎫');
            } else {
               // 积分或主题，走刚刚建好的专属接口
               const { data, error } = await sb.rpc('claim_friend_gift', { 
                 p_mail_id: e.id,
                 p_username: currentUser 
               });
               if (error || data === false) throw new Error(error?.message || '拆开失败');
               
               if (e.gift_type === 'points') showToast(`成功领取 ${e.gift_value} 积分`, '🪙');
               if (e.gift_type === 'item') showToast(`成功解锁主题！`, '🎨');
            }

            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id); if (tm) tm.isClaimed = true;
            await store.set('bb-users', upUsers); 
            
            if (typeof syncFromCloud === 'function') await syncFromCloud();
            updateUserUI(); renderMails();
            
          } catch (err) {
            console.error(err);
            showToast(err.message || '拆开失败', '❌');
            giftBtn.disabled = false; giftBtn.textContent = '📦 立即拆开';
          }
        };
      }

      const claimBtn = item.querySelector('.claim-btn');
      if (claimBtn && !e.isClaimed) {
        claimBtn.onclick = async (ev) => {
          ev.stopPropagation(); claimBtn.disabled = true; claimBtn.textContent = '领取中...';
          const { data, error } = await sb.rpc('redeem_benefits', { p_type: 'points', p_amount: e.points, p_level: 0, p_theme: '', p_mail_id: e.id });
          if (error || data === false) { claimBtn.disabled = false; claimBtn.textContent = '📥 领取积分'; return showToast('领取失败', '❌'); }
          showToast(`成功领取 ${e.points} 积分`, '🪙');
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const tm = upU.emails.find(m => m.id === e.id); if (tm) tm.isClaimed = true;
          await store.set('bb-users', upUsers); updateUserUI(); renderMails();
        };
      }

      const useBtn = item.querySelector('.use-btn');
      if (useBtn && !e.isUsed) {
        useBtn.onclick = async (ev) => {
          ev.stopPropagation(); useBtn.disabled = true; useBtn.textContent = '处理中...';
          const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: e.code });
          if (error || !data.success) {
            const errMsg = data?.msg || '';
            let finalFailText = '❌ 已被使用';
            if (errMsg.includes('过期') || errMsg.includes('失效') || errMsg.includes('不存在')) finalFailText = '❌ 已失效';
            showToast(errMsg || '兑换失败', '❌');
            let upUsers = getUsersDB(); let upU = upUsers[currentUser];
            const tm = upU.emails.find(m => m.id === e.id); if (tm) { tm.isUsed = true; tm.failReason = finalFailText; }
            store.set('bb-users', upUsers); await syncEmailsToCloud(upU); renderMails();
            return;
          }
          showToast('🎉 领取成功！', '🪙');
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const tm = upU.emails.find(m => m.id === e.id); if (tm) { tm.isUsed = true; tm.isClaimed = true; }
          store.set('bb-users', upUsers); await syncEmailsToCloud(upU); renderMails();
        };
      }

      list.appendChild(item);
    });
  }
}

$('#btnMail').onclick = () => { if (!currentUser) return; renderMails(); openOverlay($('#mailOverlay')); };
$('#btnMailClose').onclick = () => closeOverlay($('#mailOverlay'));

$('#btnClaimAll').onclick = async () => {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  let successCount = 0;
  showToast('正在自动核销...', '⏳');
  for (let e of u.emails) {
    if (e.code && !e.isUsed) {
      const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: e.code });
      if (!error && data && data.success) { e.isUsed = true; e.isClaimed = true; successCount++; }
      else {
        e.isUsed = true; const m = data?.msg || '';
        e.failReason = (m.includes('过期') || m.includes('不存在')) ? '❌ 已失效' : '❌ 已被使用';
      }
    }
  }
  store.set('bb-users', users); await syncEmailsToCloud(u);
  showToast(successCount > 0 ? `共核销 ${successCount} 个福利` : '无可用附件', '🎁');
  updateUserUI(); renderMails();
};

$('#btnDeleteAllMails').onclick = () => {
  if (!currentUser) return;
  let u = getUsersDB()[currentUser];
  if (!u.emails || u.emails.length === 0) return showToast('没有邮件', '📭');
  showConfirmModal('清空邮件', '确定要删除所有邮件吗？', async () => {
    let upUsers = getUsersDB(); upUsers[currentUser].emails = [];
    store.set('bb-users', upUsers); await syncEmailsToCloud(upUsers[currentUser]);
    updateUserUI(); renderMails();
  });
};