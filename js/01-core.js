/* =========================================================
   01-core.js
   官方 Auth 终极安全版 (自动同步带令牌)
   ========================================================= */

const $ = s => document.querySelector(s);

const SUPABASE_CONFIG = {
  URL: 'https://usvzxosmdtpsynteesls.supabase.co', 
  KEY: 'sb_publishable_jwTfelaxB_KG0auuUOaYnw_k6t1UaM0'
};

// 初始化官方客户端
const sb = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);

function showSyncError(msg) {
  const old = document.getElementById('syncErrorModal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'syncErrorModal';
  overlay.className = 'overlay show';
  overlay.style.zIndex = '10000';
  overlay.innerHTML = `
    <div class="modal" style="text-align: center; width: min(360px, 90vw);">
      <h3 style="color: #e74c3c; margin-bottom: 12px; font-size: 18px;">☁️ 云端同步失败</h3>
      <p style="font-size: 13px; color: var(--ink-soft); margin-bottom: 24px; line-height: 1.6; word-break: break-all;">${msg}</p>
      <div class="modal-actions" style="justify-content: center;">
        <button class="btn primary" onclick="document.getElementById('syncErrorModal').remove()" style="width: 100%;">我知道了</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

const store = {
  get(k, d) {
    try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      
      if (k === 'bb-users' && currentUser) {
        const u = v[currentUser];
        if (!u || !u.user_id) return Promise.resolve();

        // 返回 Promise，方便注册时等待
        return Promise.all([
          sb.from('bread_users').upsert({ 
            username: currentUser, user_id: u.user_id, email: u.email, 
            bread_key: u.key, avatar: u.avatar || '', reg_time: u.regTime || Date.now() 
          }),
          sb.from('bread_assets').upsert({ 
            username: currentUser, user_id: u.user_id, points: u.points || 0, 
            vip_type: u.vipType || 'none', vip_level: u.vipLevel || 0, 
            vip_expire: u.vipExpire || 0, unlocked_themes: u.unlockedThemes || [], 
            emails: u.emails || [] 
          }),
          sb.from('bread_preferences').upsert({ 
            username: currentUser, user_id: u.user_id, sites: u.sites || [], 
            history: u.history || [], current_theme: u.currentTheme || 'default', 
            settings: { 
              enFont: u.enFont, zhFont: u.zhFont, fwSpeed: u.fwSpeed, fwFreq: u.fwFreq, 
              screenShake: u.screenShake, customFonts: u.customFonts || [], 
              lastRpDate: u.lastRpDate || '', rpCount: u.rpCount || 0, 
              day7Sent: u.day7Sent || false, day30Sent: u.day30Sent || false, springSent: u.springSent || false 
            }
          })
        ]).catch(err => { 
          console.error('云端同步失败', err); 
          showSyncError(err.message); 
        });
      }
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  }
};

function hashCode(str) { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return hash.toString(16); }
function generateRandomStr(len) { const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let res = ''; for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length)); return res; }
function parseTimeStr(timeStr) { timeStr = (timeStr || '').toUpperCase(); if (timeStr === 'LIFE') return 0; const num = parseInt(timeStr, 10); const unit = timeStr.slice(-1); if (unit === 'D') return num; if (unit === 'M') return num * 30; if (unit === 'Q') return num * 90; if (unit === 'Y') return num * 365; return NaN; }

const REDEEM_DB = { [hashCode('VIP-7D-A1B2')]: { level: 1, days: 7 }, [hashCode('SVIP-30D-M3N4')]: { level: 2, days: 30 } };

function loadCustomCodes() { 
  const codesStr = store.get('bb-custom-codes-raw', ''); 
  if (!codesStr) return; 
  const lines = codesStr.split('\n'); 
  lines.forEach(line => { 
    const code = line.trim().toUpperCase(); 
    if (!code) return; 
    const ptsMatch = code.match(/^POINT-STRING-(\d+)-[A-Z0-9]{7}$/); 
    if (ptsMatch) { REDEEM_DB[hashCode(code)] = { level: 0, days: 0, points: parseInt(ptsMatch[1], 10) }; return; } 
    if (code.startsWith('POINT-STRING-')) return; 
    const match = code.match(/^(VIP|SVIP)-STRING-(\d+[DMQY]|LIFE)-[A-Z0-9]{7}$/); 
    if (match) { 
      const level = match[1] === 'SVIP' ? 2 : 1; 
      const days = parseTimeStr(match[2]); 
      if (!isNaN(days)) REDEEM_DB[hashCode(code)] = { level, days, points: 0 }; 
    } 
  }); 
}
loadCustomCodes();

function createRedeemCode(level, days, points) { 
  let code; 
  if (points) { code = `POINT-STRING-${points}-${generateRandomStr(7)}`.toUpperCase(); } 
  else { 
    const prefix = level === 2 ? 'SVIP' : 'VIP'; 
    let timeStr; 
    if (days === 0) timeStr = 'LIFE'; 
    else if (days % 365 === 0) timeStr = (days / 365) + 'Y'; 
    else if (days % 90 === 0) timeStr = (days / 90) + 'Q'; 
    else if (days % 30 === 0) timeStr = (days / 30) + 'M'; 
    else timeStr = days + 'D'; 
    code = `${prefix}-STRING-${timeStr}-${generateRandomStr(7)}`.toUpperCase(); 
  } 
  REDEEM_DB[hashCode(code)] = { level: level || 0, days: days || 0, points: points || 0 }; 
  const old = store.get('bb-custom-codes-raw', ''); 
  const exists = old.split('\n').map(s => s.trim().toUpperCase()).includes(code); 
  if (!exists) store.set('bb-custom-codes-raw', old ? old + '\n' + code : code); 
  return code; 
}