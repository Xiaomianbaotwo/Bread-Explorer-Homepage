/* =========================================================
   js/friend-system/02-friends-chat.js (撤回+本地删除版)
   ========================================================= */

let currentChatFriendName = null;
let chatRealtimeChannel = null;

// ★ 需求3：本地彻底隐藏/删除当前对话
window.clearLocalChat = function() {
  if (!currentChatFriendName) return;
  showConfirmModal('清空聊天记录', '确定要清空该对话的本地聊天记录吗？对方不受影响。', () => {
    let deletedMsgs = JSON.parse(localStorage.getItem(`deleted_msgs_${currentUser}`) || '[]');
    // 把当前屏幕上的消息 ID 全塞进去
    document.querySelectorAll('.msg-row').forEach(row => {
      if (row.id && row.id.startsWith('msg-')) {
        const msgId = row.id.replace('msg-', '');
        if (!deletedMsgs.includes(msgId)) deletedMsgs.push(msgId);
      }
    });
    localStorage.setItem(`deleted_msgs_${currentUser}`, JSON.stringify(deletedMsgs));
    
    document.getElementById('chatMessages').innerHTML = '<div style="text-align:center; font-size:12px; color:var(--ink-soft); margin-top:20px;">聊天记录已清空</div>';
    showToast('已清空本地记录', '🧹');
  });
};

// ★ 需求4：关闭窗口时重置右侧 UI
window.resetChatUI = function() {
  currentChatFriendName = null;
  document.getElementById('chatEmptyState').style.display = 'flex';
  document.getElementById('chatHeader').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'none';
  document.getElementById('chatInputArea').style.display = 'none';
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('giftPanel').classList.remove('show');
};

window.switchChatWindow = async function(friend) {
  currentChatFriendName = friend.username;
  document.getElementById('chatEmptyState').style.display = 'none';
  document.getElementById('chatHeader').style.display = 'flex';
  document.getElementById('chatMessages').style.display = 'flex';
  document.getElementById('chatInputArea').style.display = 'flex';
  document.getElementById('chatFriendName').textContent = friend.username;
  document.getElementById('chatInput').value = '';

  await loadChatHistory();
  initChatRealtime();
};

async function loadChatHistory() {
  if (!currentChatFriendName) return;
  const chatBox = document.getElementById('chatMessages');
  chatBox.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--ink-soft); margin-top:10px;">正在加载...</div>';
  
  try {
    const { data, error } = await sb
      .from('bread_messages')
      .select('*')
      .or(`and(sender_name.eq.${currentUser},receiver_name.eq.${currentChatFriendName}),and(sender_name.eq.${currentChatFriendName},receiver_name.eq.${currentUser})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    chatBox.innerHTML = '';
    if (!data || data.length === 0) {
      chatBox.innerHTML = '<div style="text-align:center; font-size:12px; color:var(--ink-soft); margin-top:20px;">还没有聊天记录，打个招呼吧~</div>';
      return;
    }

    let deletedMsgs = JSON.parse(localStorage.getItem(`deleted_msgs_${currentUser}`) || '[]');

    data.forEach(msg => {
      // 如果消息被我在本地删除了，就不显示
      if (deletedMsgs.includes(String(msg.id))) return;
      renderMessageBubble(msg, currentUser);
    });
    
    scrollToBottom();
  } catch (err) {
    chatBox.innerHTML = '<div style="text-align:center; font-size:12px; color:#e74c3c;">加载失败</div>';
  }
}

function renderMessageBubble(msg, myName) {
  const chatBox = document.getElementById('chatMessages');
  if (document.getElementById(`msg-${msg.id}`)) return;

  const isSelf = msg.sender_name === myName;
  const row = document.createElement('div');
  row.id = `msg-${msg.id}`;
  row.className = `msg-row ${isSelf ? 'self' : 'other'}`;
  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ★ 需求1：系统通知（拆礼物提示）
  if (msg.content.startsWith('[SYSTEM]')) {
    row.style = "justify-content: center; width: 100%;";
    row.innerHTML = `<div style="font-size:12px; color:var(--ink-soft); background:rgba(150,150,150,0.1); padding:4px 12px; border-radius:20px; text-align:center;">${msg.content.replace('[SYSTEM] ', '')}</div>`;
    chatBox.appendChild(row);
    return;
  }

  // 撤回消息展示
  if (msg.is_recalled) {
    row.style = "justify-content: center; width: 100%;";
    row.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${isSelf ? '你' : '对方'} 撤回了一条消息</div>`;
    chatBox.appendChild(row);
    return;
  }

  if (msg.content.startsWith('[GIFT]')) {
    let giftData = { type: 'points', amount: 0, text: '神秘礼物', mailId: '' };
    try { giftData = JSON.parse(msg.content.replace('[GIFT]', '')); } catch(e) {}
    
    const isInvalid = !giftData.mailId;
    const btnText = isSelf ? '等待对方拆开' : (isInvalid ? '❌ 数据已失效' : '拆开礼物');
    const bubbleBg = isInvalid ? 'linear-gradient(135deg, #7f8c8d, #95a5a6)' : 'linear-gradient(135deg, #ff9800, #e74c3c)';

    row.innerHTML = `
      <div class="msg-bubble" style="background: ${bubbleBg}; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; cursor: ${isSelf || isInvalid ? 'default' : 'pointer'};">
        <div style="font-size: 40px; margin-bottom: 8px;">${isInvalid ? '📦' : '🎁'}</div>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">${giftData.text || '无效礼物'}</div>
        <div class="gift-open-btn" style="font-size: 12px; background: rgba(255,255,255,0.3); padding: 4px 12px; border-radius: 20px;">${btnText}</div>
        <div class="msg-time" style="color: rgba(255,255,255,0.8); margin-top: 8px;">${timeStr}</div>
      </div>
    `;
    
    if (!isSelf && !isInvalid) {
      const bubble = row.querySelector('.msg-bubble');
      bubble.onclick = () => showGiftPopup(giftData, bubble);
    }
  } else {
    // ★ 需求2：普通文本消息增加撤回按钮
    let recallBtnHtml = '';
    if (isSelf) {
      const msgTime = new Date(msg.created_at).getTime();
      // 15分钟内才能撤回
      if (Date.now() - msgTime < 15 * 60 * 1000) {
        recallBtnHtml = `<span class="recall-btn" data-id="${msg.id}" style="font-size:10px; color:var(--ink-soft); cursor:pointer; margin-left:8px; text-decoration:underline;">撤回</span>`;
      }
    }

    row.innerHTML = `
      <div class="msg-bubble" style="position:relative;">
        ${msg.content}
        <div class="msg-time">${timeStr} ${recallBtnHtml}</div>
      </div>
    `;

    // 绑定撤回事件
    const recallBtn = row.querySelector('.recall-btn');
    if (recallBtn) {
      recallBtn.onclick = async (e) => {
        e.stopPropagation();
        showConfirmModal('撤回消息', '确定要撤回这条消息吗？', async () => {
          await sb.from('bread_messages').update({ is_recalled: true }).eq('id', msg.id);
          showToast('已撤回', '↩️');
        });
      };
    }
  }
  
  if (chatBox.innerHTML.includes('还没有聊天记录')) chatBox.innerHTML = '';
  chatBox.appendChild(row);
}

function scrollToBottom() {
  const chatBox = document.getElementById('chatMessages');
  chatBox.scrollTop = chatBox.scrollHeight;
}

function lockGiftBubble(bubbleEl, text) {
  if (!bubbleEl) return;
  bubbleEl.style.background = 'linear-gradient(135deg, #7f8c8d, #95a5a6)';
  const btn = bubbleEl.querySelector('.gift-open-btn');
  if (btn) btn.textContent = text;
  bubbleEl.onclick = null;
}

function showGiftPopup(giftData, bubbleEl) {
  const overlay = document.createElement('div');
  overlay.style = "position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; animation: rise 0.3s;";
  
  const box = document.createElement('div');
  box.innerHTML = '🎁';
  box.style = "font-size: 120px; cursor: pointer; transition: transform 0.3s;";
  
  const text = document.createElement('div');
  text.textContent = "点击礼盒拆开！";
  text.style = "color:#fff; font-size:18px; font-weight:bold; margin-top:20px; text-shadow:0 2px 10px rgba(255,255,255,0.5);";
  
  overlay.appendChild(box);
  overlay.appendChild(text);
  document.body.appendChild(overlay);

  box.onclick = async () => {
    if (!giftData.mailId) {
      showToast('礼物凭证丢失，该礼盒已永久失效', '❌');
      lockGiftBubble(bubbleEl, '❌ 已失效');
      overlay.remove();
      return;
    }

    box.style.transform = 'scale(1.5)';
    box.innerHTML = '💥';
    box.style.pointerEvents = 'none';
    text.textContent = '正在拆开...';

    try {
      if (giftData.type === 'code') {
         const { data, error } = await sb.rpc('redeem_external_code_v3', { p_code: giftData.itemId });
         if (error || !data.success) throw new Error(data?.msg || '兑换失败');
      } else {
         const { data, error } = await sb.rpc('claim_friend_gift', { p_mail_id: giftData.mailId, p_username: currentUser });
         if (error || data === false) throw new Error(error?.message || '拆开失败');
      }

      setTimeout(async () => {
        box.innerHTML = '✨';
        text.textContent = `获得了 ${giftData.text}！`;
        text.style.color = '#f1c40f';
        
        lockGiftBubble(bubbleEl, '✅ 已拆开');
        if (typeof syncFromCloud === 'function') await syncFromCloud();
        updateUserUI();

        setTimeout(() => overlay.remove(), 2000);
      }, 300);

    } catch (err) {
      text.textContent = `拆开失败: ${err.message}`;
      text.style.color = '#e74c3c';
      box.innerHTML = '❌';
      lockGiftBubble(bubbleEl, '❌ 已失效/已拆');
      setTimeout(() => overlay.remove(), 2000);
    }
  };
}

window.initChatSystem = function() {
  document.getElementById('btnSendMessage').onclick = async () => {
    const input = document.getElementById('chatInput');
    const content = input.value.trim();
    if (!content || !currentChatFriendName) return;

    input.value = '';
    try {
      const tempId = 'temp_' + Date.now();
      const now = new Date().toISOString();
      renderMessageBubble({ id: tempId, sender_name: currentUser, receiver_name: currentChatFriendName, content: content, created_at: now, is_recalled: false }, currentUser);
      scrollToBottom();
      await sb.from('bread_messages').insert({ sender_name: currentUser, receiver_name: currentChatFriendName, content: content });
    } catch (err) { showToast('发送失败', '❌'); }
  };
  document.getElementById('chatInput').onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('btnSendMessage').click(); };
};

function initChatRealtime() {
  if (chatRealtimeChannel) return;
  chatRealtimeChannel = sb.channel('custom_all_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bread_messages' }, async (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMsg = payload.new;
        const isForMe = newMsg.receiver_name === currentUser;
        const isFromMe = newMsg.sender_name === currentUser;
        if (!isForMe && !isFromMe) return;
        if (isFromMe && !newMsg.content.startsWith('[GIFT]')) return;

        if ((isForMe && newMsg.sender_name === currentChatFriendName) || (isFromMe && newMsg.receiver_name === currentChatFriendName)) {
          renderMessageBubble(newMsg, currentUser);
          scrollToBottom();
        } else if (isForMe) {
          showToast('收到一条新消息！', '💬');
        }
      } else if (payload.eventType === 'UPDATE') {
        // ★ 处理撤回状态同步
        const updMsg = payload.new;
        if (updMsg.is_recalled) {
          const el = document.getElementById(`msg-${updMsg.id}`);
          if (el) {
            el.style = "justify-content: center; width: 100%;";
            const isSelf = updMsg.sender_name === currentUser;
            el.innerHTML = `<div style="font-size:12px; color:var(--ink-soft);">${isSelf ? '你' : '对方'} 撤回了一条消息</div>`;
          }
        }
      }
    }).subscribe();
}