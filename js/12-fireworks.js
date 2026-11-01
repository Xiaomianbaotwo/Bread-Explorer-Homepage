/* =========================================================
   12-fireworks.js
   新春无敌版 (完美解决后台堆积卡死问题，稳定 60 帧)
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
    let baseSpeed = 3 + Math.random() * 2; 
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
    }

    if (this.distanceTraveled >= this.distanceToTarget) {
      if (this.type === 'willow') createExplosion(this.tx, this.ty, 45, 'willow');
      else if (this.type === 'double') {
        createExplosion(this.tx, this.ty, this.hue, 'double-outer');
        setTimeout(() => createExplosion(this.tx, this.ty, 45, 'double-inner'), 300);
      } else if (this.type === 'koi') createExplosion(this.tx, this.ty, 45, 'koi');
      else if (this.type === 'text') {
        createTextFirework(this.tx, this.ty); 
      } else {
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
    this.coordinateCount = type === 'willow' ? 15 : (type === 'normal' ? 6 : 3);
    while (this.coordinateCount--) {
      this.coordinates.push([this.x, this.y]);
    }
    this.type = type;
    
    if (type === 'willow') {
      this.speed = Math.random() * 4 + 2;
      this.friction = 0.98; 
      this.gravity = 0.12; 
      this.decay = Math.random() * 0.005 + 0.005;
      this.angle = Math.random() * Math.PI * 2;
    } else if (type === 'firecracker') {
      this.speed = Math.random() * 20 + 10;
      this.gravity = 0.5;
      this.friction = 0.85;
      this.decay = 0.06;
      this.angle = -Math.PI/2 + (Math.random() - 0.5) * 2.5; 
    } else if (type === 'koi') {
      this.speed = 2 + Math.random() * 2;
      this.friction = 1;
      this.gravity = 0;
      this.decay = Math.random() * 0.01 + 0.01;
      this.angle = Math.random() * Math.PI * 2;
      this.wave = Math.random() * Math.PI * 2; 
    } else {
      this.speed = Math.random() * 12 + 3;
      this.friction = 0.94;
      this.gravity = 0.15;
      this.decay = Math.random() * 0.015 + 0.015;
      this.angle = Math.random() * Math.PI * 2;
    }

    this.hue = hue + (Math.random() * 60 - 30);
    this.brightness = Math.random() * 30 + 70;
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
      fwCtx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
    } else {
      fwCtx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
      fwCtx.lineWidth = (this.type === 'firecracker' || this.type === 'willow') ? 2 : 1.5;
    }
    fwCtx.stroke();
  }
}

// ================= 文字烟花粒子 (方块渲染) =================
class TextParticle {
  constructor(x, y, tx, ty) {
    this.x = x; 
    this.y = y;
    this.tx = tx; 
    this.ty = ty;
    this.alpha = 1;
    this.state = 'fly'; 
    this.hue = 45; 
    this.brightness = 100; 
    this.speed = 0.06 + Math.random() * 0.04;
    this.holdTime = 0; 
    this.size = 3 + Math.random() * 2; 
  }
  
  update(index) {
    if (this.state === 'fly') {
      this.x += (this.tx - this.x) * this.speed;
      this.y += (this.ty - this.y) * this.speed;
      
      if (Math.abs(this.x - this.tx) < 1 && Math.abs(this.y - this.ty) < 1) {
        this.x = this.tx;
        this.y = this.ty;
        this.state = 'hold';
        this.holdTime = Date.now();
      }
    } else if (this.state === 'hold') {
      if (Date.now() - this.holdTime > 200) {
        this.state = 'fall';
      }
    } else if (this.state === 'fall') {
      this.y += 0.5 + Math.random() * 0.5;
      this.x += (Math.random() - 0.5) * 1;
      this.alpha -= 0.02;
      if (this.alpha <= 0) {
        particles.splice(index, 1);
      }
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
    this.x = x; 
    this.y = y;
    this.size = 12 + Math.random() * 8;
    this.speed = 0.6 + Math.random() * 0.8;
    this.sway = Math.random() * Math.PI * 2;
    this.alpha = 1;
    this.decay = 0.001;
  }
  update(index) {
    this.sway += 0.02;
    this.y -= this.speed;
    this.x += Math.sin(this.sway) * 1.5;
    this.alpha -= this.decay;
    if (this.y < -50 || this.alpha <= 0) {
      particles.splice(index, 1);
    }
  }
  draw() {
    const w = this.size;
    const h = this.size * 1.2;
    fwCtx.beginPath();
    fwCtx.moveTo(this.x - w/2, this.y - h/2);
    fwCtx.lineTo(this.x + w/2, this.y - h/2);
    fwCtx.lineTo(this.x + w*0.35, this.y + h/2);
    fwCtx.lineTo(this.x - w*0.35, this.y + h/2);
    fwCtx.closePath();
    
    let grad = fwCtx.createLinearGradient(this.x, this.y - h/2, this.x, this.y + h/2);
    grad.addColorStop(0, `rgba(255, 100, 0, ${this.alpha * 0.8})`);
    grad.addColorStop(0.5, `rgba(255, 200, 50, ${this.alpha})`);
    grad.addColorStop(1, `rgba(255, 150, 0, ${this.alpha * 0.8})`);
    fwCtx.fillStyle = grad;
    fwCtx.fill();
    
    fwCtx.strokeStyle = `rgba(150, 50, 0, ${this.alpha})`;
    fwCtx.lineWidth = 2;
    fwCtx.stroke();
    
    fwCtx.beginPath();
    fwCtx.arc(this.x, this.y + h/2, w * 0.2, 0, Math.PI * 2);
    fwCtx.fillStyle = `rgba(255, 255, 200, ${this.alpha})`;
    fwCtx.fill();
  }
}

// ================= 生成器 =================
function createExplosion(x, y, hue, mode) {
  let count = 150;
  if (mode === 'willow') { count = 100; } 
  else if (mode === 'small-burst') { count = 20; hue = 45; } 

  while (count--) {
    if (mode === 'willow') particles.push(new Particle(x, y, 45, 'willow'));
    else if (mode === 'koi') particles.push(new Particle(x, y, 45, 'koi'));
    else particles.push(new Particle(x, y, hue, 'normal'));
  }
}

function createTextFirework(cx, cy) {
  const text = (new Date().getFullYear()) + ' 快乐!';
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');
  offCtx.font = 'bold 80px sans-serif'; 
  const textWidth = offCtx.measureText(text).width;
  offCanvas.width = textWidth + 40; 
  offCanvas.height = 160;
  offCtx.font = 'bold 80px sans-serif';
  offCtx.fillStyle = '#fff';
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);
  
  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
  
  for (let y = 0; y < offCanvas.height; y += 4) {
    for (let x = 0; x < offCanvas.width; x += 4) {
      const index = (y * offCanvas.width + x) * 4;
      const alpha = imgData[index + 3];
      if (alpha > 128) {
        const px = cx + (x - offCanvas.width / 2) * 2.5; 
        const py = cy + (y - offCanvas.height / 2) * 2.5;
        particles.push(new TextParticle(cx, cy, px, py));
      }
    }
  }
  
  glows.push({ x: cx, y: cy, radius: 10, maxRadius: 400, alpha: 1, color: '255, 255, 255' });
}

function launchGatling() {
  const x = Math.random() * (fwCanvas.width * 0.6) + fwCanvas.width * 0.2;
  const y = fwCanvas.height - 10;
  let burst = 0;
  const timer = setInterval(() => {
    if (window.isRpPlaying || document.hidden) { clearInterval(timer); return; }
    for(let i=0; i<8; i++) particles.push(new Particle(x, y, 45, 'firecracker'));
    burst++;
    if (burst > 20) clearInterval(timer);
  }, 50);
}

function launchGroundFirecracker() {
  const x = Math.random() * fwCanvas.width;
  const y = fwCanvas.height - 10;
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
      if (window.isRpPlaying || document.hidden) return;
      const x = Math.random() * fwCanvas.width * 0.8 + fwCanvas.width * 0.1;
      const y = fwCanvas.height + Math.random() * 50; 
      particles.push(new Lantern(x, y));
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
    fwCtx.fillStyle = grad;
    fwCtx.beginPath();
    fwCtx.arc(glow.x, glow.y, glow.radius, 0, Math.PI*2);
    fwCtx.fill();
  }

  let j = particles.length;
  while (j--) {
    particles[j].draw(); 
    particles[j].update(j);
  }
  
  let i = fireworks.length;
  while (i--) { 
    fireworks[i].draw(); 
    fireworks[i].update(i); 
  }
}
loop();

// ================= 触发逻辑 =================
window.launchFirework = function(startX, startY, forcedType = null) {
  if (document.hidden) return; // 页面不可见时直接拦截
  
  let sx, sy, tx, ty;
  let isBg = false;
  
  if (startX !== undefined) {
     sx = startX; sy = fwCanvas.height; tx = startX; ty = startY; 
  } else {
     isBg = true;
     tx = Math.random() * fwCanvas.width;
     const leftBound = fwCanvas.width * 0.25;
     const rightBound = fwCanvas.width * 0.75;
     if (tx > leftBound && tx < rightBound) {
         ty = fwCanvas.height * 0.10 + Math.random() * (fwCanvas.height * 0.15);
     } else {
         ty = fwCanvas.height * 0.10 + Math.random() * (fwCanvas.height * 0.60);
     }
     sx = tx; sy = fwCanvas.height;
  }
  
  let hue = Math.floor(Math.random() * 360);
  let type = forcedType || 'normal';
  
  if (currentTheme && currentTheme.includes('spring') && !forcedType) {
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
  if (document.hidden) return; // ★ 核心修复：页面在后台时不生成新烟花
  
  const isPlus = currentTheme && currentTheme.includes('-plus');
  const isSpring = currentTheme && currentTheme.includes('spring');
  
  if ((isSpring || isPlus) && !window.isRpPlaying) {
    let freq = isPlus ? 3 : 1;
    for(let i=0; i<freq; i++) {
      setTimeout(() => { if (!window.isRpPlaying && !document.hidden) window.launchFirework(); }, Math.random() * 1000);
    }

    if (isSpring) {
      if (Math.random() < 0.4) launchGroundFirecracker();
      
      if (isPlus) {
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

// ★ 终极杀器：当页面离开时，立刻清空所有积压对象；当页面回归时，重置计时。
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    fireworks.length = 0;
    particles.length = 0;
    glows.length = 0;
  }
});