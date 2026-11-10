/* =========================================================
   js/friend-system/01-friends-core.js (内测隐藏控制版)
   ========================================================= */

window.currentChatFriend = null;

function initFriendsUI() {
  const logoArea = document.querySelector('.logo');
  const showBeta = localStorage.getItem('bb-show-beta') === 'true';

  if (logoArea && !document.getElementById('btnFriendsEntry')) {
    // 1. 注入好友按钮（根据测试开关状态决定是否显示）
    const btn = document.createElement('div');
    btn.id = 'btnFriendsEntry';
    btn.style = `display: ${showBeta ? 'inline-flex' : 'none'}; align-items: center; gap: 6px; margin-top: 6px; padding: 4px 10px; border-radius: 10px; background: var(--card); border: 1px solid var(--card-border); color: var(--ink); font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; position: relative;`;
    btn.innerHTML = `👥 好友 <span id="friendRequestDot" class="friend-request-dot" style="position:absolute; top:-4px; right:-4px; width:8px; height:8px; background:#e74c3c; border-radius:50%; display:none;"></span>`;
    
    // 2. 注入建议箱按钮
    const btnSuggest = document.createElement('div');
    btnSuggest.id = 'btnSuggestEntry';
    btnSuggest.style = "display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; margin-left: 8px; padding: 4px 10px; border-radius: 10px; background: var(--card); border: 1px solid var(--card-border); color: var(--ink); font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s;";
    btnSuggest.innerHTML = `📮 建议箱`;
    
    const textContainer = logoArea.querySelector('div');
    if (textContainer) {
      textContainer.appendChild(btn);
      textContainer.appendChild(btnSuggest);
    } else {
      logoArea.appendChild(btn);
      logoArea.appendChild(btnSuggest);
    }
    
    btn.onclick = () => openFriendsModal();
    btnSuggest.onclick = () => {
      if (!currentUser) return showToast('请先登录', '🔒');
      showInputModal('📮 建议箱 / BUG反馈', '请描述您遇到的问题或建议，将直接发送给开发者：', '', async (input) => {
        if (!input.trim()) return;
        showToast('正在发送...', '⏳');
        const { error } = await sb.rpc('send_suggestion', { p_sender_name: currentUser, p_content: input });
        if (error) return showToast('发送失败', '❌');
        showToast('已成功发送给开发者，感谢您的反馈！', '🎉');
      });
    };
  }

  // 3. 注入好友大弹窗
  if (!document.getElementById('friendsOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'friendsOverlay';
    overlay.innerHTML = `
      <div class="friends-modal" style="position: relative;">
        <button id="btnCloseFriendsTop" style="position: absolute; top: 12px; right: 15px; background: transparent; border: none; font-size: 22px; color: var(--ink-soft); cursor: pointer; z-index: 100;">✕</button>
        
        <div class="friends-sidebar">
          <div class="friends-search-box">
            <input type="text" id="friendSearchInput" placeholder="搜索用户名..." autocomplete="off">
            <button id="btnSearchFriend" style="flex-shrink: 0; white-space: nowrap;">搜索</button>
          </div>
          <div id="friendSearchResult" class="search-result-box" style="display:none;"></div>
          <div class="friends-list" id="friendsList">
            <div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">加载中...</div>
          </div>
        </div>
        
        <div class="chat-area" id="chatArea">
          <div class="chat-empty" id="chatEmptyState">
            <div style="font-size:40px; margin-bottom:10px;">🍞</div>
            <div>选择一个好友开始聊天吧</div>
          </div>
          <div class="chat-header" id="chatHeader" style="display:none;">
            <span id="chatFriendName">好友名字</span>
            <button id="btnClearChat" title="清空本地聊天记录" style="margin-left:auto; background:transparent; border:none; color:#e74c3c; font-size:16px; cursor:pointer; margin-right: 15px; font-weight: bold;">🗑 清空</button>
            <button class="btn-close-chat" id="btnCloseFriends" style="background:transparent; border:none; color:var(--ink-soft); font-size:20px; cursor:pointer;">✕</button>
          </div>
          <div class="chat-messages" id="chatMessages" style="display:none;"></div>
          <div class="chat-input-area" id="chatInputArea" style="display:none;">
            <button class="btn-gift" id="btnOpenGift" title="赠送礼物">🎁</button>
            <input type="text" id="chatInput" placeholder="输入消息..." autocomplete="off">
            <button class="btn-send" id="btnSendMessage">发送</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const closeModal = () => {
    document.getElementById('friendsOverlay').classList.remove('show');
    window.currentChatFriend = null; 
    if (typeof window.resetChatUI === 'function') window.resetChatUI();
  };
  
  document.getElementById('btnCloseFriendsTop').onclick = closeModal;
  document.getElementById('btnCloseFriends').onclick = closeModal;
  
  document.getElementById('btnClearChat').onclick = () => {
    if (typeof window.clearLocalChat === 'function') window.clearLocalChat();
  };

  const searchInput = document.getElementById('friendSearchInput');
  const btnSearch = document.getElementById('btnSearchFriend');
  btnSearch.onclick = () => doSearchUser();
  searchInput.onkeydown = (e) => { if (e.key === 'Enter') doSearchUser(); };
  
  if (typeof window.initChatSystem === 'function') window.initChatSystem();
  if (typeof window.initGiftSystem === 'function') window.initGiftSystem();
}

async function openFriendsModal() {
  document.getElementById('friendsOverlay').classList.add('show');
  await loadFriendsList();
  updateFriendRequestDot();
}

async function loadFriendsList() {
  const listEl = document.getElementById('friendsList');
  listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">加载中...</div>';
  
  try {
    const { data: friendsData, error: err1 } = await sb
      .from('bread_friends')
      .select('friend_name, friend_avatar, is_starred')
      .eq('user_name', currentUser);

    if (err1) throw err1;

    if (!friendsData || friendsData.length === 0) {
      listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">还没有好友，快去搜索添加吧！</div>';
      return;
    }

    friendsData.sort((a, b) => (b.is_starred === true ? 1 : 0) - (a.is_starred === true ? 1 : 0));

    listEl.innerHTML = '';
    friendsData.forEach(uInfo => {
      const el = document.createElement('div');
      el.className = 'friend-item';
      el.style = "display:flex; align-items:center;";
      
      const starIcon = uInfo.is_starred ? '🩷' : '🤍';
      
      el.innerHTML = `
        <img src="${uInfo.friend_avatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23e8933a%22/><text x=%2250%22 y=%2255%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>${uInfo.friend_name[0].toUpperCase()}</text></svg>'}" alt="avatar">
        <div class="friend-info">
          <div class="friend-name">${uInfo.friend_name}</div>
        </div>
        <div class="star-btn" data-name="${uInfo.friend_name}" style="cursor:pointer; font-size:16px; padding:4px; margin-left:auto;">${starIcon}</div>
      `;
      
      el.querySelector('.friend-info').onclick = () => {
        document.querySelectorAll('.friend-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        window.currentChatFriend = { username: uInfo.friend_name, avatar: uInfo.friend_avatar };
        if (typeof window.switchChatWindow === 'function') {
          window.switchChatWindow(window.currentChatFriend);
        }
      };

      el.querySelector('.star-btn').onclick = async (e) => {
        e.stopPropagation();
        const isStarred = !uInfo.is_starred;
        await sb.from('bread_friends')
          .update({ is_starred: isStarred })
          .eq('user_name', currentUser)
          .eq('friend_name', uInfo.friend_name);
        await loadFriendsList();
      };

      listEl.appendChild(el);
    });

  } catch (err) {
    console.error('加载好友失败', err);
    listEl.innerHTML = `<div style="text-align:center; padding:20px; color:#e74c3c; font-size:13px; word-break:break-all;">加载失败: ${err.message}</div>`;
  }
}

async function doSearchUser() {
  const keyword = document.getElementById('friendSearchInput').value.trim();
  const resultBox = document.getElementById('friendSearchResult');
  
  if (!keyword) return;
  resultBox.style.display = 'block';
  resultBox.innerHTML = '<div style="font-size:12px; color:var(--ink-soft);">搜索中...</div>';

  try {
    const { data, error } = await sb.rpc('search_user_v1', { p_keyword: keyword });
    if (error) throw error;

    if (!data || data.length === 0) {
      resultBox.innerHTML = '<div style="font-size:12px; color:#e74c3c;">未找到该用户</div>';
      return;
    }

    resultBox.innerHTML = '';
    data.forEach(userInfo => {
      if (userInfo.username === currentUser) return;

      const el = document.createElement('div');
      el.className = 'search-result-item';
      el.innerHTML = `
        <img src="${userInfo.avatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%238e44ad%22/><text x=%2250%22 y=%2255%22 font-size=%2250%22 text-anchor=%22middle%22 fill=%22white%22>${userInfo.username[0].toUpperCase()}</text></svg>'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
        <div style="font-size:13px; font-weight:600;">${userInfo.username}</div>
        <button class="btn-send-req" data-name="${userInfo.username}">加好友</button>
      `;
      resultBox.appendChild(el);
    });

    resultBox.querySelectorAll('.btn-send-req').forEach(btn => {
      btn.onclick = async () => {
        const targetName = btn.dataset.name;
        btn.disabled = true; btn.textContent = '发送中...';

        try {
          const { error } = await sb.rpc('send_friend_request', { p_receiver_name: targetName, p_sender_name: currentUser });
          if (error) throw error;
          showToast('好友申请已发送！', '📧');
          btn.textContent = '已发送';
          resultBox.style.display = 'none';
          document.getElementById('friendSearchInput').value = '';
        } catch (err) { showToast('发送失败', '❌'); btn.disabled = false; btn.textContent = '加好友'; }
      };
    });
  } catch (err) { resultBox.innerHTML = '<div style="font-size:12px; color:#e74c3c;">搜索失败</div>'; }
}

window.acceptFriendRequest = async function(senderName) {
  try {
    const { error } = await sb.rpc('accept_friend_request', { p_my_name: currentUser, p_friend_name: senderName });
    if (error) throw error;
    showToast(`你和 ${senderName} 已经成为好友啦！`, '🎉');
    if (document.getElementById('friendsOverlay').classList.contains('show')) await loadFriendsList();
  } catch (err) { showToast('操作失败', '❌'); }
};

async function updateFriendRequestDot() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const { data, error } = await sb.from('bread_assets').select('emails').eq('user_id', user.id).maybeSingle();
  if (!error && data && data.emails) {
    const hasPending = data.emails.some(e => e.type === 'friend_request' && !e.isUsed);
    const dot = document.getElementById('friendRequestDot');
    if (dot) dot.style.display = hasPending ? 'block' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initFriendsUI();
  setTimeout(updateFriendRequestDot, 3000);

  // ★ 核心：监听用户中心里的“内测开关”
  const betaToggle = document.getElementById('showBetaToggle');
  if (betaToggle) {
    betaToggle.checked = localStorage.getItem('bb-show-beta') === 'true';
    betaToggle.onchange = (e) => {
      const isChecked = e.target.checked;
      localStorage.setItem('bb-show-beta', isChecked);
      
      const btn = document.getElementById('btnFriendsEntry');
      if (btn) btn.style.display = isChecked ? 'inline-flex' : 'none';
      
      if (!isChecked) {
        const overlay = document.getElementById('friendsOverlay');
        if (overlay && overlay.classList.contains('show')) {
          overlay.classList.remove('show');
        }
      }
    };
  }
});