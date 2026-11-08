/* =========================================================
   03-ui.js
   通用弹窗控制、Toast 提示 (已加入防误触上锁与防拖拽滑出误关机制)
   ========================================================= */

// ========== 弹窗控制 ==========
function openOverlay(el) { 
  el.classList.add('show'); 
  document.body.classList.add('modal-open'); 
}

function closeOverlay(el) {
  el.classList.remove('show');
  if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  if (el.id === 'userOverlay' && window.vipTimer) clearInterval(window.vipTimer);
}

// ★ 核心白名单：在这里的弹窗，点击背景空白处【不会】关闭
const noOutsideCloseOverlays = [
  'registerSuccessOverlay', // 注册成功展示 Key（怕没截屏就关了）
  'inputOverlay',           // 通用输入框（输密钥、生成码，防误触清空）
  'confirmOverlay',         // 通用确认框（强制要求点击“确认”或“取消”）
  'runCodeOverlay',         // 执行自定义代码（代码输一半防丢失）
  'codeManageOverlay'       // 管理兑换码（输入长文本防丢失）
];

// 🚀 终极修复：防止拖拽选中文字滑出弹窗导致误关闭
document.querySelectorAll('.overlay').forEach(el => {
  let mousedownOnOverlay = false; // 记录鼠标按下的初始位置

  el.addEventListener('mousedown', (e) => {
    // 只有当鼠标直接在黑色遮罩上按下时，才记录为 true
    mousedownOnOverlay = (e.target === el);
  });

  el.addEventListener('mouseup', (e) => {
    // 只有当鼠标松开时也在遮罩上，且按下的起点也是遮罩，才算真正的“点击空白处”
    if (e.target === el && mousedownOnOverlay) {
      if (noOutsideCloseOverlays.includes(el.id)) return; 
      closeOverlay(el); 
    }
    // 重置状态
    mousedownOnOverlay = false;
  });

  // 兼容手机端的触摸滑动
  el.addEventListener('touchstart', (e) => {
    if (e.target === el) mousedownOnOverlay = true;
  }, { passive: true });

  el.addEventListener('touchend', (e) => {
    if (e.target === el && mousedownOnOverlay) {
      if (noOutsideCloseOverlays.includes(el.id)) return; 
      closeOverlay(el); 
    }
    mousedownOnOverlay = false;
  });
});

// ========== 通用输入与确认弹窗 ==========
let inputModalCallback = null;
let confirmModalCallback = null;

function showInputModal(title, desc, defaultValue, callback) {
  $('#inputTitle').textContent = title;
  $('#inputDesc').textContent = desc;
  $('#inputValue').value = defaultValue || '';
  inputModalCallback = callback;
  openOverlay($('#inputOverlay'));
  setTimeout(() => $('#inputValue').focus(), 100);
}

$('#btnInputCancel').onclick = () => closeOverlay($('#inputOverlay'));
$('#btnInputConfirm').onclick = () => {
  const val = $('#inputValue').value.trim();
  closeOverlay($('#inputOverlay'));
  if (inputModalCallback) inputModalCallback(val);
};
$('#inputValue').onkeydown = e => { if (e.key === 'Enter') $('#btnInputConfirm').click(); };

function showConfirmModal(title, desc, callback, isDanger = true) {
  $('#confirmTitle').textContent = title;
  $('#confirmDesc').innerHTML = desc;
  $('#btnGlobalConfirmOk').className = 'btn ' + (isDanger ? 'danger' : 'primary');
  confirmModalCallback = callback;
  openOverlay($('#confirmOverlay'));
}

$('#btnGlobalConfirmCancel').onclick = () => closeOverlay($('#confirmOverlay'));
$('#btnGlobalConfirmOk').onclick = () => {
  closeOverlay($('#confirmOverlay'));
  if (confirmModalCallback) confirmModalCallback();
};

// ========== Toast ==========
let toastTimer;
function showToast(msg, icon = '🍞') {
  const t = $('#toast'); 
  if (!t) return;
  t.innerHTML = `<span>${icon}</span> ${msg}`; 
  t.classList.add('show');
  clearTimeout(toastTimer); 
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}