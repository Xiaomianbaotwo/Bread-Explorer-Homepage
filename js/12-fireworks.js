/* =========================================================
   12-fireworks.js
   新春无敌版 + 花语秘境专属色系（支持速度/频率调节）
   ========================================================= */

const fwCanvas = document.createElement('canvas');
fwCanvas.id = 'fireworks-canvas';
fwCanvas.style.position = 'fixed';
fwCanvas.style.inset = '0';
fwCanvas.style.zIndex = '0'; 
fwCanvas.style.pointerEvents = 'none'; 
document.body.appendChild(fwCanvas);

const fwCtx = fwCanvas.getContext('2d');

function resizeFwCanvas() {
  fwCanvas.width = window.innerWidth;
  fwCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFwCanvas);
resizeFwCanvas();

const fireworks = [];
const particles = [];
const glows = []; 

window.setFireworkLayer = function(isHigh) {
  fwCanvas.style.zIndex = isHigh ? '99999' : '0';
};

// ================= 烟花升空逻辑 =================
class Firework {
  constructor(sx, sy, tx, ty, hue, isBg = false, type = 'normal') {
    this.x = sx; this.y = sy;
    this.sx = sx; this.sy = sy;
    this.tx = tx; this.ty = ty;
    this.distanceToTarget = Math.hypot(tx - sx, ty - sy);
    this.distanceTraveled = 0;
    this.coordinates = [];
    this.coordinateCount = 8;
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.atan2(ty - sy, tx - sx);
    
    // ★ 核心修改 1：读取用户设置的升空速度倍率
    let currentUsersDB = getUsersDB();
    let speedMult = (currentUser && currentUsersDB[currentUser] && currentUsersDB[currentUser].fwSpeed) ? currentUsersDB[currentUser].fwSpeed : 1.0;
    
    let baseSpeed = (3 + Math.random() * 2) * speedMult; 
    this.speed = isBg ? baseSpeed * 0.7 : baseSpeed;
    this.acceleration = isBg ? 1.02 : 1.03; 
    this.brightness = Math.random() * 20 + 70;
    this.hue = hue;
    this.type = type; 
    this.hasSplit = false; 
  }
  
  update(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.acceleration;
    let vx = Math.cos(this.angle) * this.speed;
    let vy = Math.sin(this.angle) * this.speed;
    this.distanceTraveled = Math.hypot(this.x - this.sx, this.y - this.sy);
    
    if (this.type === 'two-stage' && !this.hasSplit && this.distanceTraveled >= this.distanceToTarget * 0.5) {
      this.hasSplit = true;
      createExplosion(this.x, this.y, this.hue, 'small-burst');
    } else if (this.type === 'twin-spark' && !this.hasSplit && this.distanceTraveled >= this.distanceToTarget * 0.5) {
      this.hasSplit = true;
      createExplosion(this.x, this.y, this.hue, 'gold-spark');
    }

    if (this.distanceTraveled >= this.distanceToTarget) {
      if (this.type === 'willow') createExplosion(this.tx, this.ty, this.hue, 'willow');
      else if (this.type === 'double') {
        createExplosion(this.tx, this.ty, this.hue, 'double-outer');
        setTimeout(() => createExplosion(this.tx, this.ty, this.hue, 'double-inner'), 300);
      } 
      else if (this.type === 'koi') createExplosion(this.tx, this.ty, this.hue, 'koi');
      else if (this.type === 'text') createTextFirework(this.tx, this.ty);
      else if (this.type === 'sakura-rain') createExplosion(this.tx, this.ty, 0, 'sakura-rain');
      else if (this.type === 'bloom-burst') {
        createExplosion(this.tx, this.ty, 0, 'bloom-burst-outer');
        setTimeout(() => createExplosion(this.tx, this.ty, 0, 'bloom-burst-inner'), 300);
      }
      else if (this.type === 'twin-spark') {
        createExplosion(this.tx, this.ty, this.hue, 'normal');
        createTwinStream(this.tx, this.ty);
      }
      else {
        createExplosion(this.tx, this.ty, this.hue, 'normal');
      }
      
      if (currentTheme && currentTheme.includes('spring') && Math.random() < 0.5) {
        glows.push({ x: this.tx, y: this.ty, radius: 10, maxRadius: 300 + Math.random() * 150, alpha: 0.6, color: '255, 50, 50' });
      }
      
      fireworks.splice(index, 1);
    } else {
      this.x += vx; this.y += vy;
    }
  }
  
  draw() {
    fwCtx.beginPath();
    fwCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    fwCtx.lineTo(this.x, this.y);
    fwCtx.strokeStyle = `hsl(${this.hue}, 100%, ${this.brightness}%)`;
    fwCtx.lineWidth = 2.5;
    fwCtx.stroke();
  }
}

// ================= 爆炸粒子逻辑 =================
class Particle {
  constructor(x, y, hue, type = 'normal') {
    this.x = x; this.y = y;
    this.coordinates = [];
    this.type = type;
    
    let coordinateCount = 6;
    let speed = 0, friction = 1, gravity = 0, decay = 0.01, angle = 0;

    if (type === 'willow') {
      coordinateCount = 15;
      speed = Math.random() * 4 + 2;
      friction = 0.98; 
      gravity = 0.12; 
      decay = Math.random() * 0.005 + 0.005;
      angle = Math.random() * Math.PI * 2;
      this.hue = 325 + Math.random() * 15; // 偏向玫红色
    } else if (type === 'firecracker') {
      coordinateCount = 3;
      speed = Math.random() * 20 + 10;
      gravity = 0.5;
      friction = 0.85;
      decay = 0.06;
      angle = -Math.PI/2 + (Math.random() - 0.5) * 2.5; 
    } else if (type === 'koi') {
      coordinateCount = 3;
      speed = 2 + Math.random() * 2;
      friction = 1;
      gravity = 0;
      decay = Math.random() * 0.01 + 0.01;
      angle = Math.random() * Math.PI * 2;
      this.wave = Math.random() * Math.PI * 2; 
    } 
    else if (type === 'sakura-rain') {
      coordinateCount = 12;
      speed = Math.random() * 4 + 2;
      friction = 0.96; 
      gravity = 0.03;
      decay = Math.random() * 0.003 + 0.003;
      angle = Math.random() * Math.PI * 2;
      this.hue = 335 + Math.random() * 15; // 固定深粉/品红交织
      this.brightness = 85 + Math.random() * 15;
    }
    else if (type === 'bloom-burst-outer') {
      coordinateCount = 4;
      speed = Math.random() * 8 + 6;
      friction = 0.92;
      gravity = 0.08;
      decay = 0.02;
      angle = Math.random() * Math.PI * 2;
      this.hue = 320 + Math.random() * 15; // 玫红/品红
    }
    else if (type === 'bloom-burst-inner') {
      coordinateCount = 2;
      speed = Math.random() * 15 + 15;
      friction = 0.94;
      gravity = 0.02;
      decay = 0.015;
      angle = Math.random() * Math.PI * 2;
      this.hue = 340 + Math.random() * 15; // 亮粉红
    }
    else if (type === 'gold-spark') {
      coordinateCount = 3;
      speed = Math.random() * 4 + 2;
      friction = 0.9;
      gravity = 0.1;
      decay = 0.04;
      angle = Math.random() * Math.PI * 2;
      this.hue = 320 + Math.random() * 20; // 偏玫红
    }
    else if (type === 'twin-stream') {
      coordinateCount = 8;
      speed = Math.random() * 12 + 10;
      friction = 0.97;
      gravity = 0.25;
      decay = 0.01;
    }
    else {
      speed = Math.random() * 12 + 3;
      friction = 0.94;
      gravity = 0.15;
      decay = Math.random() * 0.015 + 0.015;
      angle = Math.random() * Math.PI * 2;
    }

    this.coordinateCount = coordinateCount;
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    
    this.speed = speed;
    this.friction = friction;
    this.gravity = gravity;
    this.decay = decay;
    this.angle = angle;

    if (type !== 'sakura-rain' && type !== 'bloom-burst-outer' && type !== 'bloom-burst-inner' && type !== 'willow' && type !== 'gold-spark') {
      this.hue = hue + (Math.random() * 30 - 15); 
      this.brightness = Math.random() * 30 + 70;
    }
    
    this.alpha = 1;
    this.isSpark = Math.random() > 0.8;
  }
  
  update(index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.friction;
    
    if (this.type === 'koi') {
      this.wave += 0.1;
      this.x += Math.cos(this.angle) * this.speed + Math.cos(this.wave) * 2;
      this.y += Math.sin(this.angle) * this.speed + Math.sin(this.wave) * 2 + this.gravity;
    } else {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed + this.gravity;
    }
    
    this.alpha -= this.decay;
    if (this.alpha <= this.decay) {
      particles.splice(index, 1);
    }
  }
  
  draw() {
    fwCtx.beginPath();
    fwCtx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    fwCtx.lineTo(this.x, this.y);
    
    if (this.isSpark && Math.random() > 0.6) {
      fwCtx.strokeStyle = `rgba(255, 210, 230, ${this.alpha})`; // 粉白高光
    } else {
      fwCtx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
      if (this.type === 'bloom-burst-inner') {
        fwCtx.lineWidth = 0.8;
      } else if (this.type === 'sakura-rain' || this.type === 'twin-stream') {
        fwCtx.lineWidth = 2.5;
      } else {
        fwCtx.lineWidth = (this.type === 'firecracker' || this.type === 'willow') ? 2 : 1.5;
      }
    }
    fwCtx.stroke();
  }
}

// ================= 文字烟花粒子 =================
class TextParticle {
  constructor(x, y, tx, ty) {
    this.x = x; this.y = y; this.tx = tx; this.ty = ty;
    this.alpha = 1; this.state = 'fly'; this.hue = 45; this.brightness = 100; 
    this.speed = 0.06 + Math.random() * 0.04; this.holdTime = 0; this.size = 3 + Math.random() * 2; 
  }
  update(index) {
    if (this.state === 'fly') {
      this.x += (this.tx - this.x) * this.speed; this.y += (this.ty - this.y) * this.speed;
      if (Math.abs(this.x - this.tx) < 1 && Math.abs(this.y - this.ty) < 1) {
        this.x = this.tx; this.y = this.ty; this.state = 'hold'; this.holdTime = Date.now();
      }
    } else if (this.state === 'hold') {
      if (Date.now() - this.holdTime > 200) this.state = 'fall';
    } else if (this.state === 'fall') {
      this.y += 0.5 + Math.random() * 0.5; this.x += (Math.random() - 0.5) * 1; this.alpha -= 0.02;
      if (this.alpha <= 0) particles.splice(index, 1);
    }
  }
  draw() {
    fwCtx.fillStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
    fwCtx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// ================= 具象化孔明灯 =================
class Lantern {
  constructor(x, y) {
    this.x = x; this.y = y; this.size = 12 + Math.random() * 8;
    this.speed = 0.6 + Math.random() * 0.8; this.sway = Math.random() * Math.PI * 2;
    this.alpha = 1; this.decay = 0.001;
  }
  update(index) {
    this.sway += 0.02; this.y -= this.speed; this.x += Math.sin(this.sway) * 1.5; this.alpha -= this.decay;
    if (this.y < -50 || this.alpha <= 0) particles.splice(index, 1);
  }
  draw() {
    const w = this.size; const h = this.size * 1.2;
    fwCtx.beginPath();
    fwCtx.moveTo(this.x - w/2, this.y - h/2); fwCtx.lineTo(this.x + w/2, this.y - h/2);
    fwCtx.lineTo(this.x + w*0.35, this.y + h/2); fwCtx.lineTo(this.x - w*0.35, this.y + h/2);
    fwCtx.closePath();
    let grad = fwCtx.createLinearGradient(this.x, this.y - h/2, this.x, this.y + h/2);
    grad.addColorStop(0, `rgba(255, 100, 0, ${this.alpha * 0.8})`);
    grad.addColorStop(0.5, `rgba(255, 200, 50, ${this.alpha})`);
    grad.addColorStop(1, `rgba(255, 150, 0, ${this.alpha * 0.8})`);
    fwCtx.fillStyle = grad; fwCtx.fill();
    fwCtx.strokeStyle = `rgba(150, 50, 0, ${this.alpha})`; fwCtx.lineWidth = 2; fwCtx.stroke();
    fwCtx.beginPath(); fwCtx.arc(this.x, this.y + h/2, w * 0.2, 0, Math.PI * 2);
    fwCtx.fillStyle = `rgba(255, 255, 200, ${this.alpha})`; fwCtx.fill();
  }
}

// ================= 生成器 =================
function createExplosion(x, y, hue, mode) {
  let count = 150;
  if (mode === 'willow') { count = 100; } 
  else if (mode === 'small-burst') { count = 20; } 
  else if (mode === 'sakura-rain') { count = 120; }
  else if (mode === 'bloom-burst-outer') { count = 180; }
  else if (mode === 'bloom-burst-inner') { count = 100; }
  else if (mode === 'gold-spark') { count = 15; }
  else if (mode === 'koi') { count = 80; }

  while (count--) {
    if (mode === 'willow') particles.push(new Particle(x, y, 0, 'willow'));
    else if (mode === 'koi') particles.push(new Particle(x, y, hue, 'koi'));
    else if (mode === 'sakura-rain') particles.push(new Particle(x, y, 0, 'sakura-rain'));
    else if (mode === 'bloom-burst-outer') particles.push(new Particle(x, y, 0, 'bloom-burst-outer'));
    else if (mode === 'bloom-burst-inner') particles.push(new Particle(x, y, 0, 'bloom-burst-inner'));
    else if (mode === 'gold-spark') particles.push(new Particle(x, y, 0, 'gold-spark'));
    else particles.push(new Particle(x, y, hue, 'normal'));
  }
}

// ★ 专属生成器：并蒂双生
function createTwinStream(x, y) {
  for (let i = 0; i < 40; i++) {
    let pLeft = new Particle(x, y, 0, 'twin-stream');
    pLeft.angle = Math.PI * 0.75 + (Math.random() - 0.5) * 0.15; 
    pLeft.hue = 315 + Math.random() * 15; // 玫红/品红
    pLeft.brightness = 90;
    particles.push(pLeft);

    let pRight = new Particle(x, y, 0, 'twin-stream');
    pRight.angle = Math.PI * 0.25 + (Math.random() - 0.5) * 0.15;
    pRight.hue = 340 + Math.random() * 15; // 亮玫瑰红
    pRight.brightness = 90;
    particles.push(pRight);
  }
}

function createTextFirework(cx, cy) {
  const text = (new Date().getFullYear()) + ' 快乐!';
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');
  offCtx.font = 'bold 80px sans-serif'; 
  const textWidth = offCtx.measureText(text).width;
  offCanvas.width = textWidth + 40; offCanvas.height = 160;
  offCtx.font = 'bold 80px sans-serif'; offCtx.fillStyle = '#fff'; offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle';
  offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);
  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
  for (let y = 0; y < offCanvas.height; y += 4) {
    for (let x = 0; x < offCanvas.width; x += 4) {
      if (imgData[(y * offCanvas.width + x) * 4 + 3] > 128) {
        particles.push(new TextParticle(cx, cy, cx + (x - offCanvas.width / 2) * 2.5, cy + (y - offCanvas.height / 2) * 2.5));
      }
    }
  }
  glows.push({ x: cx, y: cy, radius: 10, maxRadius: 400, alpha: 1, color: '255, 255, 255' });
}

function launchGatling() {
  const x = Math.random() * (fwCanvas.width * 0.6) + fwCanvas.width * 0.2; const y = fwCanvas.height - 10;
  let burst = 0;
  const timer = setInterval(() => {
    if (window.isRpPlaying || document.hidden) { clearInterval(timer); return; }
    for(let i=0; i<8; i++) particles.push(new Particle(x, y, 45, 'firecracker'));
    if (++burst > 20) clearInterval(timer);
  }, 50);
}

function launchGroundFirecracker() {
  const x = Math.random() * fwCanvas.width; const y = fwCanvas.height - 10;
  for(let i=0; i<20; i++) {
    setTimeout(() => {
      if (!window.isRpPlaying && !document.hidden) particles.push(new Particle(x + (Math.random()-0.5)*30, y, 0, 'firecracker'));
    }, i * 25);
  }
}

function launchKongmingLanterns() {
  const count = Math.floor(Math.random() * 4) + 5;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      if (!window.isRpPlaying && !document.hidden) particles.push(new Lantern(Math.random() * fwCanvas.width * 0.8 + fwCanvas.width * 0.1, fwCanvas.height + Math.random() * 50));
    }, i * 200); 
  }
}

// ================= 渲染主循环 =================
function loop() {
  requestAnimationFrame(loop);
  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
  fwCtx.globalCompositeOperation = 'lighter';
  
  let g = glows.length;
  while (g--) {
    let glow = glows[g];
    glow.radius += (glow.maxRadius - glow.radius) * 0.05;
    glow.alpha -= 0.015;
    if (glow.alpha <= 0) { glows.splice(g, 1); continue; }
    let grad = fwCtx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius);
    grad.addColorStop(0, `rgba(${glow.color}, ${glow.alpha})`);
    grad.addColorStop(1, `rgba(${glow.color}, 0)`);
    fwCtx.fillStyle = grad; fwCtx.beginPath(); fwCtx.arc(glow.x, glow.y, glow.radius, 0, Math.PI*2); fwCtx.fill();
  }

  let j = particles.length;
  while (j--) { particles[j].draw(); particles[j].update(j); }
  
  let i = fireworks.length;
  while (i--) { fireworks[i].draw(); fireworks[i].update(i); }
}
loop();

// ================= 触发逻辑 =================
window.launchFirework = function(startX, startY, forcedType = null) {
  if (document.hidden) return; 
  
  let sx, sy, tx, ty, isBg = false;
  if (startX !== undefined) {
     sx = startX; sy = fwCanvas.height; tx = startX; ty = startY; 
  } else {
     isBg = true; tx = Math.random() * fwCanvas.width;
     const leftBound = fwCanvas.width * 0.25; const rightBound = fwCanvas.width * 0.75;
     if (tx > leftBound && tx < rightBound) ty = fwCanvas.height * 0.10 + Math.random() * (fwCanvas.height * 0.15);
     else ty = fwCanvas.height * 0.10 + Math.random() * (fwCanvas.height * 0.60);
     sx = tx; sy = fwCanvas.height;
  }
  
  let hue = Math.floor(Math.random() * 360);
  let type = forcedType || 'normal';
  
  if (currentTheme && currentTheme.includes('flower') && !forcedType) {
      // 花语秘境专属色系：品红、玫红、亮玫瑰红、深粉
      const flowerHues = [320, 325, 330, 335, 340, 350, 355, 360]; 
      hue = flowerHues[Math.floor(Math.random() * flowerHues.length)];
      
      if (currentTheme === 'flower-max') {
          const r = Math.random();
          if (r < 0.15) type = 'sakura-rain';
          else if (r < 0.30) type = 'bloom-burst';
          else if (r < 0.45) type = 'twin-spark';
          else if (r < 0.60) type = 'koi';          // 锦鲤游鱼
          else if (r < 0.75) type = 'double';       // 双层炸裂
          else if (r < 0.90) type = 'two-stage';    // 二踢脚
          else type = 'normal';
      } else if (currentTheme === 'flower-plus') {
          const r = Math.random();
          if (r < 0.4) type = 'willow';
          else type = 'normal';
      }
  } else if (currentTheme && currentTheme.includes('spring') && !forcedType) {
      const springHues = [0, 45, 330, 300, 15]; 
      hue = springHues[Math.floor(Math.random() * springHues.length)];
      if (currentTheme.includes('plus')) {
          const r = Math.random();
          if (r < 0.25) type = 'willow';
          else if (r < 0.45) type = 'double';
          else if (r < 0.65) type = 'two-stage';
          else if (r < 0.85) type = 'koi';
      }
  }
  
  fireworks.push(new Firework(sx, sy, tx, ty, hue, isBg, type));
};

setTimeout(() => {
    if (currentTheme && currentTheme.includes('spring') && !document.hidden) {
        fireworks.push(new Firework(fwCanvas.width * 0.5, fwCanvas.height, fwCanvas.width * 0.5, fwCanvas.height * 0.2, 45, false, 'text'));
    }
}, 2000);

setInterval(() => {
  if (document.hidden || window.isRpPlaying) return;
  
  // ★ 核心修改 2：读取用户设置的发射频率倍率
  let currentUsersDB = getUsersDB();
  let freqMult = (currentUser && currentUsersDB[currentUser] && currentUsersDB[currentUser].fwFreq) ? currentUsersDB[currentUser].fwFreq : 1.0;

  const isSpring = currentTheme && currentTheme.includes('spring');
  const isFlower = currentTheme === 'flower';
  const isFlowerPlus = currentTheme === 'flower-plus';
  const isFlowerMax = currentTheme === 'flower-max';
  const isOtherPlus = currentTheme && currentTheme.includes('-plus') && !isFlowerPlus;

  if (isFlower) return;

  if (isSpring || isOtherPlus || isFlowerPlus || isFlowerMax) {
    let baseFreq = 1;
    if (isOtherPlus || isFlowerPlus) baseFreq = 3;
    if (isFlowerMax) baseFreq = 5;

    // 计算最终频率 (向下取整，且至少为 1，防止用户拉太低导致不发射)
    let finalFreq = Math.max(1, Math.floor(baseFreq * freqMult));

    for(let i=0; i<finalFreq; i++) {
      setTimeout(() => { 
        if (!window.isRpPlaying && !document.hidden) window.launchFirework(); 
      }, Math.random() * 1000);
    }

    if (isSpring) {
      if (Math.random() < 0.4) launchGroundFirecracker();
      if (currentTheme.includes('spring-plus')) {
        if (Math.random() < 0.3) launchGatling();
        if (Math.random() < 0.4) launchKongmingLanterns(); 
      }
    }
  }
}, 1000);

setInterval(() => {
  if (currentTheme && currentTheme.includes('spring') && !window.isRpPlaying && !document.hidden) {
    fireworks.push(new Firework(fwCanvas.width * 0.5, fwCanvas.height, fwCanvas.width * 0.5, fwCanvas.height * 0.2, 45, false, 'text'));
  }
}, 10000);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    fireworks.length = 0; particles.length = 0; glows.length = 0;
  }
});