/* =========================================================
   13-updater.js
   独立版本更新检测引擎
   ========================================================= */

// ★ 1. 当前版本号（每次发版只改这里，纯数字，千万别带 v）
const CURRENT_VERSION = "1.5.0"; 

// 2. 安全比较版本号大小的函数
function isNewerVersion(cloudVer, localVer) {
  const c = cloudVer.split('.').map(Number);
  const l = localVer.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cNum = c[i] || 0;
    const lNum = l[i] || 0;
    if (cNum > lNum) return true;  // 云端大，说明有新版本
    if (cNum < lNum) return false; // 本地大，坚决不乱弹窗
  }
  return false; // 一样大
}

// 3. 弹窗 UI 渲染
function showUpdateModal(data) {
  const hasLink = data.download_url && data.download_url.trim() !== '' && data.download_url !== '#';
  
  const buttonHtml = hasLink 
    ? `<a href="${data.download_url}" target="_blank" class="btn primary" style="text-decoration: none; width: 100%;">立即去下载</a>`
    : `<button class="btn primary" disabled style="width: 100%; opacity: 0.5;">新版本准备中，暂无法下载</button>`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay show';
  overlay.style.zIndex = '10000';
  overlay.innerHTML = `
    <div class="modal" style="text-align: center; width: min(400px, 90vw);">
      <h3 style="color: var(--accent); margin-bottom: 12px;">🚀 发现新版本 ${data.version}</h3>
      <div style="margin: 15px 0; text-align: left; white-space: pre-wrap; font-size: 14px; color: var(--ink-soft); background: rgba(150,150,150,0.1); padding: 10px; border-radius: 8px;">${data.update_log}</div>
      <div class="modal-actions" style="justify-content: center; margin-top: 20px;">
        ${buttonHtml}
        <button class="btn ghost" onclick="this.closest('.overlay').remove()" style="width: 100%;">稍后再说</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// 4. 核心检测逻辑（去云端拿 version.json）
async function checkForUpdates() {
  try {
    // 相对路径：找同级目录下的 version.json
    const res = await fetch(`./version.json?t=${Date.now()}`);
    if (!res.ok) return; 

    const latestData = await res.json();

    // 如果云端版本比本地新，就弹窗
    if (isNewerVersion(latestData.version, CURRENT_VERSION)) {
      showUpdateModal(latestData);
    }
  } catch (e) {
    console.log("网络错误或未找到版本文件，跳过更新检测。");
  }
}

// ================= 启动应用 =================
// 延迟 3 秒检查更新，不阻碍主页面加载
setTimeout(checkForUpdates, 3000);