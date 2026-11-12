/* =========================================================
   weather/js/03-ui.js
   天气 UI 渲染引擎 (负责悬浮卡片、长图弹窗、城市切换)
   ========================================================= */

let currentWeatherData = null;

// 初始化天气 UI
function initWeatherUI() {
  // 1. 注入左侧悬浮小卡片
  if (!document.getElementById('weatherWidget')) {
    const widget = document.createElement('div');
    widget.id = 'weatherWidget';
    widget.innerHTML = '<div style="font-size:12px; color:var(--ink-soft);">加载天气中...</div>';
    widget.onclick = () => showWeatherDetail();
    document.body.appendChild(widget);
  }

  // 2. 注入长图详情弹窗
  if (!document.getElementById('weatherDetailOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'weatherDetailOverlay';
    overlay.innerHTML = `
      <div class="weather-detail-modal">
        <div class="w-detail-header">
          <h3 id="wModalTitle">📍 天气详情</h3>
          <button id="btnCloseWeather">✕</button>
        </div>
        <!-- 这个盒子用来装 AI 生成的长篇排版文字 -->
        <div id="weatherTextContent" style="line-height: 1.8; font-size: 14px; color: var(--ink);"></div>
        
        <!-- 底部切换城市按钮 -->
        <div style="text-align:center; margin-top:20px; padding-top: 15px; border-top: 1px dashed var(--card-border);">
          <button class="btn primary" id="btnChangeWeatherCity" style="width:100%; border-radius: 12px;">🔄 切换地区</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // 绑定关闭弹窗事件
    document.getElementById('btnCloseWeather').onclick = () => {
      document.getElementById('weatherDetailOverlay').classList.remove('show');
    };
    
    // 绑定切换城市事件
    document.getElementById('btnChangeWeatherCity').onclick = openCitySelect;
  }

  // 3. 注入城市选择弹窗
  if (!document.getElementById('citySelectOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'citySelectOverlay';
    overlay.innerHTML = `
      <div class="city-select-modal">
        <h3 style="margin-bottom:16px; color:var(--ink);">📍 选择地区</h3>
        <select id="cityDropdown">
          ${CITY_OPTIONS.map(c => `<option value="${c.id}|${c.name}">${c.name}</option>`).join('')}
        </select>
        <div style="display:flex; gap:10px;">
          <button class="btn ghost" id="btnCancelCity" style="flex:1; border-radius: 12px;">取消</button>
          <button class="btn primary" id="btnSaveCity" style="flex:1; border-radius: 12px;">保存并刷新</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btnCancelCity').onclick = () => {
      document.getElementById('citySelectOverlay').classList.remove('show');
    };
    
    // 保存城市并重新请求天气
    document.getElementById('btnSaveCity').onclick = async () => {
      const val = document.getElementById('cityDropdown').value;
      const [id, name] = val.split('|');
      
      // 更新全局变量和本地缓存
      currentWeatherCity = name;
      currentWeatherCityId = id;
      localStorage.setItem('bb-weather-city', name);
      localStorage.setItem('bb-weather-id', id);

      document.getElementById('citySelectOverlay').classList.remove('show');
      document.getElementById('weatherDetailOverlay').classList.remove('show');
      
      // 重新请求该城市的天气
      await loadAndRenderWeather(id, name);
    };
  }

  // 4. 页面加载时，自动请求默认或缓存的城市天气
  loadAndRenderWeather(currentWeatherCityId, currentWeatherCity);
}

// 获取并渲染天气
async function loadAndRenderWeather(cityId, cityName) {
  const widget = document.getElementById('weatherWidget');
  if (widget) widget.innerHTML = '<div style="font-size:12px; color:var(--ink-soft);">同步云端...</div>';
  
  try {
    // 调用 02-api.js 中的请求函数
    const data = await getWeatherReport(cityId, cityName);
    currentWeatherData = data; 
    
    // 更新左侧悬浮小卡片的内容（提取城市名，去掉国旗emoji以便紧凑显示）
    const cleanCityName = cityName.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
    if (widget) {
      widget.innerHTML = `
        <div class="w-city">📍 ${cleanCityName}</div>
        <div class="w-icon" style="font-size: 42px; margin: 10px 0;">🌤️</div>
        <div class="w-text" style="font-size: 12px; color: var(--ink-soft); background: var(--card-border); padding: 4px 8px; border-radius: 12px;">点击查看详情</div>
      `;
    }
  } catch (err) {
    console.error('天气加载失败', err);
    if (widget) widget.innerHTML = '<div style="font-size:12px; color:#e74c3c;">获取失败<br>请点击刷新</div>';
    widget.onclick = () => loadAndRenderWeather(cityId, cityName);
  }
}

// 展示长图详情弹窗
function showWeatherDetail() {
  if (!currentWeatherData || !currentWeatherData.ai_text) {
    return showToast('天气数据加载中，请稍候...', '⏳');
  }

  // 设置标题
  const cleanCityName = currentWeatherData.cityName.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
  document.getElementById('wModalTitle').textContent = `📍 ${cleanCityName} 天气详情`;

  // ★ 核心：处理 AI 返回的长文本，让它变成漂亮的 HTML
  let htmlText = currentWeatherData.ai_text;
  
  // 1. 把换行符换成 <br>，让文字能正确换行
  htmlText = htmlText.replace(/\n/g, '<br>');
  
  // 2. 把 Markdown 的 `**加粗文字**` 替换成带样式（主题色+字号加大）的 HTML
  htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<span style="font-size: 15px; font-weight: bold; color: var(--accent); display: inline-block; margin-top: 10px; margin-bottom: 4px;">$1</span>');
  
  // 3. 把折线图占位符稍微美化成一个小标签
  htmlText = htmlText.replace(/\[\s*📈\s*折线图略：(.*?)\s*\]/g, '<div style="margin: 6px 0; padding: 6px 10px; background: var(--card-border); border-radius: 8px; font-size: 12px; color: var(--ink-soft); border-left: 3px solid var(--accent);">📈 图表预留区：$1</div>');

  // 4. 把 ① ② ③ ④ 缩进美化
  htmlText = htmlText.replace(/①/g, '<span style="display:inline-block; margin-left:10px; color:var(--accent);">①</span>');

  // 渲染到页面
  document.getElementById('weatherTextContent').innerHTML = htmlText;
  
  // 显示弹窗
  document.getElementById('weatherDetailOverlay').classList.add('show');
}

// 打开城市切换弹窗
function openCitySelect() {
  const dropdown = document.getElementById('cityDropdown');
  // 将下拉框默认选中当前城市
  dropdown.value = `${currentWeatherCityId}|${currentWeatherCity}`;
  document.getElementById('citySelectOverlay').classList.add('show');
}

// 延迟启动，确保其他环境初始化完成
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initWeatherUI, 1500);
});