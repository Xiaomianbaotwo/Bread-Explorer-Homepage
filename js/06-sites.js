/* =========================================================
   06-sites.js
   时间/补零函数、站点渲染、拖拽、搜索引擎、历史记录
   ========================================================= */

// 补零函数（其他文件也会用到，所以提在这里定义）
const pad = n => String(n).padStart(2, '0');

// ========== 站点渲染 ==========
function renderSites() {
  const grid = $('#sitesGrid'); grid.innerHTML = '';
  sites.forEach((s, i) => {
    const a = document.createElement('a');
    a.className = 'tile fade-in'; a.style.animationDelay = (i * 0.04) + 's';
    a.href = s.url; a.target = '_blank'; a.draggable = true;
    a.innerHTML = `<span class="name"></span><button class="del">✕</button>`;
    a.querySelector('.name').textContent = s.name;

    a.querySelector('.del').onclick = e => {
      e.preventDefault(); e.stopPropagation();
      if (!currentUser) return showToast('请先登录', '🔒');
      sites.splice(i, 1); store.set(`bb-sites_${currentUser}`, sites); renderSites();
    };
    a.ondragstart = e => { if (!currentUser) { e.preventDefault(); return; } e.dataTransfer.setData('text', i); a.classList.add('dragging'); };
    a.ondragend = () => a.classList.remove('dragging');
    a.ondragover = e => { e.preventDefault(); a.classList.add('drag-over'); };
    a.ondragleave = () => a.classList.remove('drag-over');
    a.ondrop = e => {
      e.preventDefault(); a.classList.remove('drag-over');
      const from = parseInt(e.dataTransfer.getData('text'));
      if (isNaN(from) || from === i) return;
      const [moved] = sites.splice(from, 1); sites.splice(i, 0, moved);
      store.set(`bb-sites_${currentUser}`, sites); renderSites();
    };
    grid.appendChild(a);
  });
  const add = document.createElement('div');
  add.className = 'tile add fade-in'; add.style.animationDelay = (sites.length * 0.04) + 's';
  add.innerHTML = '<span class="plus">＋</span><span class="name">添加</span>';
  add.onclick = () => { if (!currentUser) return showToast('请先登录', '🔒'); openOverlay($('#siteOverlay')); };
  grid.appendChild(add);
}

// 添加站点事件
$('#btnSiteCancel').onclick = () => closeOverlay($('#siteOverlay'));
$('#btnSiteSave').onclick = () => {
  const name = $('#fName').value.trim(); let url = $('#fUrl').value.trim();
  if (!name || !url) return showToast('名称和网址不能为空', '🥯');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  sites.push({ name, url }); store.set(`bb-sites_${currentUser}`, sites);
  renderSites(); closeOverlay($('#siteOverlay'));
  $('#fName').value = ''; $('#fUrl').value = '';
};

// ========== 搜索引擎与历史记录 ==========
function renderHistoryList() {
  const list = $('#historyList');
  list.innerHTML = '';
  if (!history || history.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--ink-soft); font-size:13px;">暂无搜索历史</div>';
    return;
  }
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const groups = { today: [], yesterday: [], older: [] };

  history.forEach(item => {
    const t = item.t || 0;
    if (t >= todayStart) groups.today.push(item);
    else if (t >= yesterdayStart) groups.yesterday.push(item);
    else groups.older.push(item);
  });

  const addGroup = (title, items) => {
    if (items.length === 0) return;
    const titleEl = document.createElement('div');
    titleEl.className = 'history-group-title';
    titleEl.textContent = title;
    list.appendChild(titleEl);

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      const qText = document.createElement('span');
      qText.textContent = item.q;
      qText.style.wordBreak = 'break-all';
      el.appendChild(qText);
      el.onclick = () => {
        closeOverlay($('#historyOverlay'));
        $('#searchInput').value = item.q;
        doSearch();
      };
      list.appendChild(el);
    });
  };
  addGroup('今天', groups.today);
  addGroup('昨天', groups.yesterday);
  addGroup('更早', groups.older);
}

function doSearch() {
  const q = $('#searchInput').value.trim();
  if (!q) return;
  let url = /^https?:\/\//i.test(q) ? q : ENGINES[engineKey].url + encodeURIComponent(q);
  if (currentUser) {
    history = [{ q: q, t: Date.now() }, ...history.filter(h => h.q !== q)];
    store.set(`bb-history_${currentUser}`, history);
  }
  window.open(url, '_blank'); $('#searchInput').select();
}

$('#btnHistory').onclick = () => {
  if (!currentUser) return showToast('登录后可查看搜索历史', '🔒');
  renderHistoryList();
  openOverlay($('#historyOverlay'));
};
$('#btnHistoryClose').onclick = () => closeOverlay($('#historyOverlay'));
$('#btnClearHistory').onclick = () => {
  history = [];
  store.set(`bb-history_${currentUser}`, history);
  renderHistoryList();
  showToast('历史记录已清空', '🧹');
};

// 搜索引擎下拉菜单
$('#engineBtn').onclick = e => { e.stopPropagation(); if (!currentUser) return showToast('请先登录', '🔒'); $('#engineMenu').classList.toggle('show'); };
$('#engineMenu').onclick = e => {
  const item = e.target.closest('.engine-item');
  if (!item) return;
  engineKey = item.dataset.k;
  store.set('bb-engine', engineKey);
  $('#engineIcon').textContent = ENGINES[engineKey].icon;
  $('#searchInput').placeholder = `用 ${ENGINES[engineKey].name} 搜索…`;
  $('#engineMenu').classList.remove('show');
};
document.onclick = e => { if (!$('#searchWrap').contains(e.target)) { $('#engineMenu').classList.remove('show'); } };
$('#btnGo').onclick = doSearch;
$('#searchInput').onkeydown = e => { if (e.key === 'Enter') doSearch(); };

Object.entries(ENGINES).forEach(([k, v]) => {
  const d = document.createElement('div'); d.className = 'engine-item'; d.dataset.k = k;
  d.innerHTML = `<span>${v.icon}</span>${v.name}`;
  $('#engineMenu').appendChild(d);
});
$('#engineIcon').textContent = ENGINES[engineKey].icon;
$('#searchInput').placeholder = `用 ${ENGINES[engineKey].name} 搜索…`;