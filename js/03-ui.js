/* =========================================================
   03-ui.js
   通用弹窗控制、Toast 提示
   ========================================================= */

// ========== 弹窗控制 ==========
function openOverlay(el) { el.classList.add('show'); document.body.classList.add('modal-open'); }
function closeOverlay(el) {
  el.classList.remove('show');
  if (!document.querySelector('.overlay.show')) document.body.classList.remove('modal-open');
  if (el.id === 'userOverlay' && window.vipTimer) clearInterval(window.vipTimer);
}

document.querySelectorAll('.overlay').forEach(el => {
  el.onclick = e => { if (e.target === el) closeOverlay(el); };
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