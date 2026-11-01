/* =========================================================
   01-core.js
   全局工具、哈希、兑换码核心引擎
   ========================================================= */

const $ = s => document.querySelector(s);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function generateRandomStr(len) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

function parseTimeStr(timeStr) {
  timeStr = (timeStr || '').toUpperCase();
  if (timeStr === 'LIFE') return 0;
  const num = parseInt(timeStr, 10);
  const unit = timeStr.slice(-1);
  if (unit === 'D') return num;
  if (unit === 'M') return num * 30;
  if (unit === 'Q') return num * 90;
  if (unit === 'Y') return num * 365;
  return NaN;
}

// 基础预设兑换码
const REDEEM_DB = {
  [hashCode('VIP-7D-A1B2')]: { level: 1, days: 7 },
  [hashCode('SVIP-30D-M3N4')]: { level: 2, days: 30 }
};

// 加载自定义兑换码
function loadCustomCodes() {
  const codesStr = store.get('bb-custom-codes-raw', '');
  if (!codesStr) return;

  const lines = codesStr.split('\n');
  lines.forEach(line => {
    const code = line.trim().toUpperCase();
    if (!code) return;

    // 自定义积分码：POINT-STRING-数量-7位随机串
    const ptsMatch = code.match(/^POINT-STRING-(\d+)-[A-Z0-9]{7}$/);
    if (ptsMatch) {
      REDEEM_DB[hashCode(code)] = { level: 0, days: 0, points: parseInt(ptsMatch[1], 10) };
      return;
    }

    // 邮件内部积分码跳过
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

// 生成兑换码
function createRedeemCode(level, days, points) {
  let code;

  if (points) {
    code = `POINT-STRING-${points}-${generateRandomStr(7)}`.toUpperCase();
  } else {
    const prefix = level === 2 ? 'SVIP' : 'VIP';
    let timeStr;
    if (days === 0)            timeStr = 'LIFE';
    else if (days % 365 === 0) timeStr = (days / 365) + 'Y';
    else if (days % 90  === 0) timeStr = (days / 90)  + 'Q';
    else if (days % 30  === 0) timeStr = (days / 30)  + 'M';
    else                       timeStr = days + 'D';
    code = `${prefix}-STRING-${timeStr}-${generateRandomStr(7)}`.toUpperCase();
  }

  REDEEM_DB[hashCode(code)] = { level: level || 0, days: days || 0, points: points || 0 };

  const old = store.get('bb-custom-codes-raw', '');
  const exists = old.split('\n').map(s => s.trim().toUpperCase()).includes(code);
  if (!exists) store.set('bb-custom-codes-raw', old ? old + '\n' + code : code);

  return code;
}