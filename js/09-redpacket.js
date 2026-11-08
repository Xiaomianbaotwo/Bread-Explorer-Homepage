/* =========================================================
   09-redpacket.js
   ========================================================= */

let rpTimer = null;
let rpInterval = null;
let rpTimeLeft = 10.0;
let rpClickCount = 0; 
window.isRpPlaying = false;

function checkRedPacketTime() {
  if (!currentUser) return;
  let users = getUsersDB();
  const u = users[currentUser];
  if (!u) return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const h = now.getHours();
  const m = now.getMinutes();
  
  const timeNum = h * 60 + m;

  let inTime = false;
  let sessionTag = '';

  if (timeNum >= 450 && timeNum <= 540) { inTime = true; sessionTag = 'morning'; }
  else if (timeNum >= 780 && timeNum <= 930) { inTime = true; sessionTag = 'afternoon'; }
  else if (timeNum >= 990 && timeNum <= 1020) { inTime = true; sessionTag = 'dusk'; }
  else if (timeNum >= 1080 && timeNum <= 1200) { inTime = true; sessionTag = 'evening'; }

  const sessionStr = `${todayStr}-${sessionTag}`;

  if (inTime && u.lastRpDate !== sessionStr) {
    u.lastRpDate = sessionStr; 
    store.set('bb-users', users);
    
    showConfirmModal('🧧 金币红包雨！', '现在开启限时 10 秒的红包雨！普通红包+1，金色礼盒+3，星星+5，钻石+10！', () => {
      startRedPacketRain();
    }, false);
  }
}

function startRedPacketRain() {
  if (window.isRpPlaying) return;
  window.isRpPlaying = true;
  rpTimeLeft = 10.0;
  rpClickCount = 0;
  
  if (typeof window.setFireworkLayer === 'function') window.setFireworkLayer(true);

  $('#rpScore').textContent = `已收集：0 金币`;
  $('#rpTimer').textContent = `10.0s`;
  $('#redPacketRain').classList.add('show');
  document.body.classList.add('modal-open');

  const rainLayer = $('#redPacketRain');

  rpTimer = setInterval(() => {
    if (rpTimeLeft <= 0) return;
    const packet = document.createElement('div');
    
    const randType = Math.random();
    let typeClass = '';
    let value = 1;
    let color = '#e74c3c';

    if (randType < 0.60) { typeClass = 'pkt-normal'; value = 1; color = '#e74c3c'; }
    else if (randType < 0.85) { typeClass = 'pkt-gold'; value = 3; color = '#f1c40f'; }
    else if (randType < 0.93) { typeClass = 'pkt-star'; value = 5; color = '#f39c12'; }
    else { typeClass = 'pkt-diamond'; value = 10; color = '#00bcd4'; }

    packet.className = 'falling-packet ' + typeClass;
    packet.style.left = Math.random() * 80 + 10 + 'vw';
    const duration = 5 + Math.random() * 4;
    packet.style.animationDuration = duration + 's';

    const handleClick = (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!window.isRpPlaying || packet.dataset.clicked) return;
      packet.dataset.clicked = '1';
      
      rpClickCount += value;
      $('#rpScore').textContent = `已收集：${rpClickCount} 金币`;
      
      let clientX = e ? e.clientX : 0;
      let clientY = e ? e.clientY : 0;
      if (!clientX) {
        const rect = packet.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top + rect.height / 2;
      }

      packet.remove();

      if (Math.random() < 0.5) {
        if (typeof window.launchFirework === 'function') window.launchFirework(clientX, clientY);
      }

      if (currentUser) {
        const u = getUsersDB()[currentUser];
        if (!u || u.screenShake !== false) { 
          document.body.classList.add('shake-screen');
          setTimeout(() => document.body.classList.remove('shake-screen'), 300);
        }
      }

      const floatText = document.createElement('div');
      floatText.textContent = `+${value} 🪙`;
      floatText.style.position = 'fixed';
      floatText.style.left = clientX + 'px';
      floatText.style.top = clientY + 'px';
      floatText.style.color = color;
      floatText.style.fontWeight = 'bold';
      floatText.style.fontSize = '30px';
      floatText.style.textShadow = '0 2px 5px rgba(0,0,0,0.8)';
      floatText.style.pointerEvents = 'none';
      floatText.style.zIndex = '99999';
      floatText.style.transform = 'translate(-50%, -50%)';
      document.body.appendChild(floatText);

      floatText.animate([
        { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 1 },
        { transform: 'translate(-50%, -120px) scale(1.2)', opacity: 0 }
      ], { duration: 900, easing: 'ease-out' }).onfinish = () => floatText.remove();
      
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.style.position = 'fixed';
        p.style.left = clientX + 'px';
        p.style.top = clientY + 'px';
        const isRect = Math.random() > 0.5;
        const size = 4 + Math.random() * 10;
        p.style.width = (isRect ? size * 0.5 : size) + 'px';
        p.style.height = size + 'px';
        p.style.borderRadius = isRect ? '2px' : '50%';
        p.style.background = ['#f1c40f', color, '#ffffff'][Math.floor(Math.random() * 3)];
        p.style.pointerEvents = 'none';
        p.style.zIndex = '99999';
        document.body.appendChild(p);
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 150;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist + 80; 

        p.animate([
          { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.5) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }).onfinish = () => p.remove();
      }

      for (let i = 0; i < 3; i++) {
        const coin = document.createElement('div');
        coin.textContent = '🪙';
        coin.style.position = 'fixed';
        coin.style.left = clientX + 'px';
        coin.style.top = clientY + 'px';
        coin.style.fontSize = '24px';
        coin.style.pointerEvents = 'none';
        coin.style.zIndex = '99999';
        coin.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(coin);
        
        const tx = (Math.random() - 0.5) * 150;
        const ty = -80 - Math.random() * 80; 
        
        coin.animate([
          { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.5) rotate(${(Math.random()-0.5)*360}deg)`, opacity: 0 }
        ], { duration: 1000, easing: 'ease-out' }).onfinish = () => coin.remove();
      }
    };

    packet.onclick = handleClick;

    if (window.isAutoRainEnabled) {
      setTimeout(() => {
        if (packet.parentNode && window.isRpPlaying) {
          handleClick(null); 
        }
      }, 700); 
    }

    rainLayer.appendChild(packet);
    setTimeout(() => { if (packet.parentNode) packet.remove(); }, duration * 1000);
  }, 130);

  rpInterval = setInterval(() => {
    rpTimeLeft -= 0.1;
    if (rpTimeLeft <= 0) {
      rpTimeLeft = 0;
      endRedPacketRain();
    }
    $('#rpTimer').textContent = rpTimeLeft.toFixed(1) + 's';
  }, 100);
}

function endRedPacketRain() {
  window.isRpPlaying = false;
  
  if (typeof window.setFireworkLayer === 'function') window.setFireworkLayer(false);

  clearInterval(rpTimer);
  clearInterval(rpInterval);
  $('#redPacketRain').classList.remove('show');
  document.body.classList.remove('modal-open');
  $('#redPacketRain').querySelectorAll('.falling-packet').forEach(p => p.remove());

  let users = getUsersDB();
  let u = users[currentUser];

  let rewardType = 'points';
  let vLevel = 0;
  let vDays = 0;
  let pts = 0;
  
  const rand = Math.random() * 100;

  if (rpClickCount >= 40) {
    rewardType = 'vip'; vLevel = 2;
    if (rand < 15) vDays = 90;
    else if (rand < 50) vDays = 30;
    else vDays = 7;
  } else if (rpClickCount >= 25) {
    if (rand < 10) { rewardType = 'vip'; vLevel = 2; vDays = 7; }
    else if (rand < 40) { rewardType = 'vip'; vLevel = 1; vDays = 30; }
    else { rewardType = 'vip'; vLevel = 1; vDays = 7; }
  } else if (rpClickCount >= 12) {
    if (rand < 10) { rewardType = 'vip'; vLevel = 1; vDays = 7; }
    else { rewardType = 'points'; pts = Math.floor(Math.random() * 200) + 200; }
  } else {
    if (rand < 1) { rewardType = 'vip'; vLevel = 1; vDays = 1; }
    else { rewardType = 'points'; pts = Math.floor(Math.random() * 100) + 50; }
  }

  if (rewardType === 'points') {
    u.points += pts;
    store.set('bb-users', users);
    loadUserData();
    showConfirmModal('🎉 红包雨结算', `你一共收集了 <strong>${rpClickCount}</strong> 个金币！<br><br>恭喜抽中：🪙 <strong>${pts}</strong> 积分！`, () => {}, false);
  } else {
    const active = u.vipExpire > Date.now();
    const start = (active && u.vipType === (vLevel === 2 ? 'svip' : 'vip')) ? u.vipExpire : Date.now();
    
    u.vipType = vLevel === 2 ? 'svip' : 'vip'; // ★ 直接改 type
    u.vipExpire = start + (vDays * 86400000);
    
    store.set('bb-users', users);
    loadUserData();

    showConfirmModal('🎉 红包雨结算', `你一共收集了 <strong>${rpClickCount}</strong> 个金币！<br><br>恭喜抽中：${vLevel === 2 ? '👑 SVIP' : '💎 VIP'} <strong>${vDays} 天</strong>！`, () => {}, false);
  }
}