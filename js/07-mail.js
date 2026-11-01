/* =========================================================
   07-mail.js
   邮件中心渲染、一键领取附件、批量删除
   ========================================================= */

function renderMails() {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  if (!u.emails) u.emails = [];

  u.emails.forEach(e => e.isRead = true);
  store.set('bb-users', users);
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
        attachHtml = `
          <div style="background:var(--card); padding:8px; border-radius:6px; font-family:monospace; font-size:16px; text-align:center; letter-spacing:1px; color:var(--accent); margin-top:10px; user-select:all; border:1px dashed var(--card-border);">
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
      if (e.code) statusHtml = `<span style="color:${e.isUsed ? '#e74c3c' : '#27ae60'}">${e.isUsed ? '❌ 已使用' : '✅ 未使用'}</span>`;
      if (e.points) statusHtml = `<span style="color:${e.isClaimed ? '#e74c3c' : '#27ae60'}">${e.isClaimed ? '❌ 已领取' : '✅ 待领取'}</span>`;

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
        showConfirmModal('删除邮件', '确定删除这封邮件吗？删除后不可恢复。', () => {
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          upU.emails = upU.emails.filter(m => m.id !== e.id);
          store.set('bb-users', upUsers);
          renderMails();
          showToast('邮件已删除', '🧹');
        });
      };

      const claimBtn = item.querySelector('.claim-btn');
      if (claimBtn && !e.isClaimed) {
        claimBtn.onclick = (ev) => {
          ev.stopPropagation();
          let upUsers = getUsersDB(); let upU = upUsers[currentUser];
          const targetMail = upU.emails.find(m => m.id === e.id);
          if (targetMail && !targetMail.isClaimed) {
            targetMail.isClaimed = true;
            upU.points += targetMail.points;
            store.set('bb-users', upUsers);
            showToast(`成功领取 ${targetMail.points} 积分`, '🪙');
            loadUserData();
            renderMails();
          }
        };
      }

      const useBtn = item.querySelector('.use-btn');
      if (useBtn && !e.isUsed) {
        useBtn.onclick = (ev) => {
          ev.stopPropagation();
          if (doRedeem(e.code, true)) {
            renderMails();
          }
        };
      }

      list.appendChild(item);
    });
  }
}

$('#btnMail').onclick = () => {
  if (!currentUser) return;
  renderMails();
  openOverlay($('#mailOverlay'));
};
$('#btnMailClose').onclick = () => closeOverlay($('#mailOverlay'));

$('#btnClaimAll').onclick = () => {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  let total = 0;
  u.emails.forEach(e => {
    if (e.points && !e.isClaimed) {
      e.isClaimed = true;
      total += e.points;
    }
  });
  if (total > 0) {
    u.points += total;
    store.set('bb-users', users);
    showToast(`一键领取成功！共获得 ${total} 积分`, '🪙');
    loadUserData();
    renderMails();
  } else {
    showToast('没有可领取的积分附件', '📭');
  }
};

$('#btnDeleteAllMails').onclick = () => {
  if (!currentUser) return;
  let users = getUsersDB(); let u = users[currentUser];
  if (!u.emails || u.emails.length === 0) {
    return showToast('当前没有邮件可删除', '📭');
  }
  showConfirmModal('清空邮件', '确定要删除所有邮件吗？此操作不可恢复！', () => {
    let upUsers = getUsersDB();
    upUsers[currentUser].emails = [];
    store.set('bb-users', upUsers);
    loadUserData();
    renderMails();
    showToast('所有邮件已删除', '🧹');
  });
};