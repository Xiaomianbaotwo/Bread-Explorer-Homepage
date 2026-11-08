/* =========================================================
   01-core.js
   纯云端发码版 (彻底移除前端生成逻辑)
   ========================================================= */

const $ = s => document.querySelector(s);

const SUPABASE_CONFIG = {
  URL: 'https://usvzxosmdtpsynteesls.supabase.co', 
  KEY: 'sb_publishable_jwTfelaxB_KG0auuUOaYnw_k6t1UaM0'
};

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

        return Promise.all([
          sb.from('bread_users').upsert({ 
            username: currentUser, user_id: u.user_id, email: u.email, 
            bread_key: u.key, avatar: u.avatar || '', reg_time: u.regTime || Date.now() 
          }),
          sb.from('bread_preferences').upsert({ 
            username: currentUser, user_id: u.user_id, sites: u.sites || [], 
            history: u.history || [], current_theme: u.currentTheme || 'default', 
            settings: { 
              enFont: u.enFont, zhFont: u.zhFont, fwSpeed: u.fwSpeed, fwFreq: u.fwFreq, 
              screenShake: u.screenShake, customFonts: u.customFonts || [], 
              lastRpDate: u.lastRpDate || '', rpCount: u.rpCount || 0, 
              day7Sent: u.day7Sent || false, day30Sent: u.day30Sent || false, springSent: u.springSent || false,
              lastPointDate: u.lastPointDate || ''
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