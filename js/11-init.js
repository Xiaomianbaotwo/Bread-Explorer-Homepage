/* =========================================================
   11-init.js
   时钟、每日一句、漂浮面包、启动应用
   ========================================================= */

function tick() {
  const now = new Date();
  $('#clock').innerHTML = pad(now.getHours()) + '<span class="colon">:</span>' + pad(now.getMinutes()) + '<span class="colon">:</span>' + pad(now.getSeconds());
  $('#dateLine').textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 星期' + '日一二三四五六'[now.getDay()];
  const h = now.getHours();
  let greet = '夜深了，面包房也打烊啦 🌙';
  if (h >= 5 && h < 9) greet = '早安！来一份刚出炉的早餐吧 🌅';
  else if (h < 12) greet = '上午好，吐司正在烤制中… 🍞';
  else if (h < 14) greet = '午好！法棍三明治时间 🥪';
  else if (h < 18) greet = '下午好，配一块可颂刚刚好 🥐';
  else if (h < 22) greet = '晚上好，牛角包配月光 🌆';
  $('#greeting').textContent = greet;
}
setInterval(tick, 1000); tick();

(function initQuote() {
  const QUOTES = [
    '面包会有的，牛奶也会有的。',
    '每一个不曾起舞的日子，都是对生命的辜负。',
    '生活明朗，万物可爱。',
    '慢一点也没关系，只要在往前走。',
    '今天也要好好吃饭呀 🍞',
    '愿你所求皆如愿，所行化坦途。',
    '心动不如行动，行动不如马上。',
    '别慌，月亮也正在大海某处迷茫。',
    '愿你眼里有光，心中有暖，脚下有路。',
    '把日子过成自己喜欢的样子。'
  ];
  const q = $('#quote');
  if (q) q.textContent = '—— ' + QUOTES[Math.floor(Math.random() * QUOTES.length)];
})();

function spawnBread() {
  const b = document.createElement('span'); b.className = 'bread';
  b.style.left = Math.random() * 96 + 'vw';
  b.style.fontSize = (18 + Math.random() * 32) + 'px';
  const dur = 24 + Math.random() * 26;
  b.style.animationDuration = dur + 's'; b.style.animationDelay = (-Math.random() * dur) + 's';
  b.style.setProperty('--op', (0.3 + Math.random() * 0.45).toFixed(2));
  const inner = document.createElement('i');
  const pool = THEMES[currentTheme] ? THEMES[currentTheme].emojis : ['🍞'];
  inner.textContent = pool[Math.floor(Math.random() * pool.length)];
  inner.style.animationDuration = (2.5 + Math.random() * 3) + 's'; inner.style.animationDelay = (-Math.random() * 3) + 's';
  b.appendChild(inner); b.onclick = e => popBread(b, e); $('#breadBg').appendChild(b);
}

function popBread(b, e) {
  for (let i = 0; i < 8; i++) {
    const c = document.createElement('span'); c.className = 'crumb';
    c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
    if (currentTheme === 'gold') c.style.background = '#f1c40f';
    else if (currentTheme === 'diamond') c.style.background = '#9b59b6';
    else if (currentTheme === 'sakura') c.style.background = '#ffb6c1';
    else if (currentTheme === 'cyber') c.style.background = '#00ff64';
    else if (currentTheme === 'flame') c.style.background = '#ff4500';
    else if (currentTheme === 'aurora') c.style.background = '#64ffda';
    else if (currentTheme === 'blackgold') c.style.background = '#e6c27a';
    else if (currentTheme === 'forest') c.style.background = '#00e676';
    else if (currentTheme === 'ocean') c.style.background = '#64ffda';
    else c.style.background = '#e8933a';

    document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, dist = 25 + Math.random() * 55;
    const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist + 45;
    c.animate([{ transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(.4)`, opacity: 0 }], { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => c.remove();
  }
  b.remove(); setTimeout(spawnBread, 2500);
}

// ================= 初始化 =================
loadUserData();

setTimeout(checkRedPacketTime, 2000);
setInterval(checkRedPacketTime, 60 * 1000);