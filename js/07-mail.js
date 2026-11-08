/* =========================================================
   07-mail.js
   邮件中心渲染、一键领取附件、批量删除、点击复制码
   ========================================================= */

// 辅助函数：同步当前邮件状态到云端
async function syncEmailsToCloud(u) {
  await sb.rpc('update_user_emails', { p_emails: u.emails });
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
    store.set('bb-users', users); // 仅更新本地缓存
    syncEmailsToCloud(u); // 异步同步到云端
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
      if (e.code) {
        // ★ 核心修改：加上 mail-code-box 类名，允许点击复制
        attachHtml = `
          <div class="mail-code-box" title="点击复制兑换码" style="background:var(--card); padding:8px; border-radius:6px; font-family:monospace; font-size:16px; text-align:center; letter-spacing:1px; color:var(--accent); margin-top:10px; user-select:all; border:1px dashed var(--card-border); cursor:pointer; transition:0.2s;">
            ${e.code}
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary use-btn" data-code="${e.code}" ${e.isUsed ? 'disabled style="opacity:0.5; cursor:not-allowed; padding:4px 12px; font-size:12px; border-radius:8px;"' : 'style="padding:4px 12px; font-size:12px; border-radius:8px;"'}>⚡ 立即使用</button>
          </div>
        `;
      } else if (e.points) {
        attachHtml = `
          <div style="background:var(--card); padding:8px; border-radius:6px; font-size:16px; text-align:center; color:var(--accent); margin-top:10px; border:1px dashed var(--card-border);">
            🪙 +${e.points} 积分
          </div>
          <div style="display:flex; justify-content:center; margin-top:8px;">
            <button class="btn primary claim-btn" data-idx="${idx}" ${e.isClaimed ? 'disabled style="opacity:0.5; cursor:not-allowed; padding:4px 12px; font-size:12px; border-radius:8px;"' : 'style="padding:4px 12px; font-size:12px; border-radius:8px;"'}>📥 领取积分</button>
          </div>
        `;
      }

      let statusHtml = '';
      if (e.code) statusHtml = `<span style="color:${e.isUsed ? '#e74c3c' : '#27ae60'}">${e.isUsed ? '❌ 已使用' : '✅ 待领取'}</span>`;
      if (e.points && !e.code) statusHtml = `<span style="color:${e.isClaimed ? '#e74c3c' : '#27ae60'}">${e.isClaimed ? '❌ 已领取' : '✅ 待领取'}</span>`;

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

      // ★ 绑定兑换码点击复制事件
      const codeBox = item.querySelector('.mail-code-box');
      if (codeBox) {
        codeBox.onclick = (ev) => {
          ev.stopPropagation();
          navigator.clipboard.writeText(e.code).then(() => {
            showToast('兑换码已复制', '📋');
            // 加个小动画反馈
            codeBox.style.transform = 'scale(0.95)';
            setTimeout(() => codeBox.style.transform = 'scale(1)', 150);
          }).catch(() => {
            showToast('复制失败，请长按手动选择', '⚠️');
          });
        };
      }

      item.querySelector('.mail-title').onclick = () => { item.classList.toggle('open'); };

      item.querySelector('.del-btn').onclick = (ev) => {
        ev.stopPropagation();
        showConfirmModal('删除邮件', '确定删除这封邮件吗？删除后不可恢复。', async () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          upU.emails = upU.emails.filter(m => m.id !== e.id);
          store.set('bb-users', upUsers);
          await syncEmailsToCloud(upU);
          renderMails();
          showToast('邮件已删除', '🧹');
        });
      };

      const claimBtn = item.querySelector('.claim-btn');
      if (claimBtn && !e.isClaimed) {
        claimBtn.onclick = async (ev) => {
          ev.stopPropagation();
          claimBtn.disabled = true; claimBtn.textContent = '领取中...';
          
          // ★ 调用安全 RPC 领取
          const { data, error } = await sb.rpc('redeem_benefits', { 
            p_type: 'points', p_amount: e.points, p_level: 0, p_theme: '', p_mail_id: e.id 
          });
          
          if (error || data === false) {
            showToast('领取失败，可能已领取过', '❌');
            claimBtn.disabled = false; claimBtn.textContent = '📥 领取积分';
            return;
          }

          showToast(`成功领取 ${e.points} 积分`, '🪙');
          if (typeof syncFromCloud === 'function') await syncFromCloud();
          loadUserData();
          renderMails();
        };
      }

      const useBtn = item.querySelector('.use-btn');
      if (useBtn && !e.isUsed) {
        useBtn.onclick = async (ev) => {
          ev.stopPropagation();
          useBtn.disabled = true; useBtn.textContent = '处理中...';
          
          showToast('正在向云端自动核销...', '⏳');
          const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: e.code });
          
          if (error || !data.success) {
            showToast(data?.msg || '领取失败', '❌');
            useBtn.disabled = false; useBtn.textContent = '⚡ 立即使用';
            return;
          }
          
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const targetMail = upU.emails.find(m => m.id === e.id);
          if (targetMail) { targetMail.isUsed = true; targetMail.isClaimed = true; }
          store.set('bb-users', upUsers);

          showToast('🎉 领取成功！', '🪙');
          if (typeof syncFromCloud === 'function') await syncFromCloud();
          loadUserData();
          renderMails();
        };
      }

      list.appendChild(item);
    });
  }
}

$('#btnMail').onclick = async () => {
  if (!currentUser) return;
  
  // 点开邮件时，强制向云端请求一次最新数据
  if (typeof syncFromCloud === 'function') {
    await syncFromCloud(); 
  }
  
  renderMails();
  openOverlay($('#mailOverlay'));
};
$('#btnMailClose').onclick = () => closeOverlay($('#mailOverlay'));

$('#btnClaimAll').onclick = async () => {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  let successCount = 0;
  
  showToast('正在自动核销所有兑换码...', '⏳');

  // 遍历所有带 code 且没用过的邮件
  for (let e of u.emails) {
    if (e.code && !e.isUsed) {
      // 自动请求云端核销
      const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: e.code });
      
      if (!error && data && data.success) {
        e.isUsed = true;
        e.isClaimed = true;
        successCount++;
      }
    }
  }

  if (successCount > 0) {
    store.set('bb-users', users);
    showToast(`一键领取成功！共自动核销 ${successCount} 个福利`, '🎁');
    if (typeof syncFromCloud === 'function') await syncFromCloud();
    loadUserData();
    renderMails();
  } else {
    showToast('没有可领取的附件', '📭');
  }
};

$('#btnDeleteAllMails').onclick = () => {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  if (!u.emails || u.emails.length === 0) {
    return showToast('当前没有邮件可删除', '📭');
  }
  showConfirmModal('清空邮件', '确定要删除所有邮件吗？此操作不可恢复！', async () => {
    let upUsers = getUsersDB();
    upUsers[currentUser].emails = [];
    store.set('bb-users', upUsers);
    await syncEmailsToCloud(upUsers[currentUser]);
    loadUserData();
    renderMails();
    showToast('所有邮件已删除', '🧹');
  });
};