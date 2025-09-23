(() => {
  const canvas = document.getElementById('dragon-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  const W = canvas.width, H = canvas.height;
  // pointer starts center
  let pointer = { x: W/2, y: H/2, vx:0, vy:0 };
  let isClicking = false;

  // dragon body
  const SEGMENTS = 34;
  const points = Array.from({length: SEGMENTS}, () => ({ x: W/2, y: H/2, angle:0 }));

  // particles (ice + flame)
  const particles = [];

  // helper utils
  const rand = (a,b) => a + Math.random()*(b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

  // listen for pointer inside canvas only
  const rect = canvas.getBoundingClientRect();
  function updatePointerFromEvent(e){
    const r = canvas.getBoundingClientRect();
    let cx = e.clientX ?? (e.touches && e.touches[0].clientX) ?? pointer.x + r.left;
    let cy = e.clientY ?? (e.touches && e.touches[0].clientY) ?? pointer.y + r.top;
    pointer.x = clamp(cx - r.left, 0, W);
    pointer.y = clamp(cy - r.top, 0, H);
  }

  canvas.addEventListener('mousemove', e=>{ updatePointerFromEvent(e); });
  canvas.addEventListener('mousedown', e=>{ isClicking = true; });
  canvas.addEventListener('mouseup', e=>{ isClicking = false; });
  canvas.addEventListener('mouseleave', e=>{ /*keep last pos*/ isClicking=false; });
  canvas.addEventListener('touchstart', e=>{ updatePointerFromEvent(e); isClicking = true; e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchmove',  e=>{ updatePointerFromEvent(e); e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchend',   e=>{ isClicking = false; e.preventDefault(); }, {passive:false});

  // spawn particle
  function spawnParticle(x,y, type='ice'){
    if(type==='ice'){
      particles.push({
        x,y,
        vx: rand(-0.6,0.6),
        vy: rand(-1.6,-0.2),
        life: rand(600,1200),
        born: performance.now(),
        size: rand(1.2,3.6),
        color: `hsl(${rand(180,200)}, 90%, ${rand(60,80)}%)`,
        type:'ice'
      });
    } else { // flame
      particles.push({
        x,y,
        vx: rand(-1.6,1.6),
        vy: rand(-3,-1),
        life: rand(300,700),
        born: performance.now(),
        size: rand(3,7),
        color: `hsl(${rand(10,40)}, 90%, ${rand(55,65)}%)`,
        type:'flame'
      });
    }
    // limit
    if(particles.length>700) particles.splice(0, particles.length - 700);
  }

  // draw wing (flap factor)
  function drawWing(x,y,sz,side, t){
    ctx.save();
    ctx.translate(x,y);
    const flap = Math.sin(t*4 + side*Math.PI/2) * 0.45 + 0.5;
    const rot = (side?0.35:-0.35) * (0.6 + flap*0.6);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.bezierCurveTo(sz*0.2, -sz*0.9 - flap*6, sz*0.9, -sz*0.55 - flap*8, sz, 0);
    ctx.bezierCurveTo(sz*0.6, sz*0.55, sz*0.16, sz*0.7, 0, 0);
    ctx.closePath();
    ctx.fillStyle = `rgba(0,240,255,${0.14 + flap*0.18})`;
    ctx.shadowColor = '#00f6ff';
    ctx.shadowBlur = 28 * (0.7 + flap*0.6);
    ctx.fill();

    // wing membrane veins
    ctx.beginPath();
    ctx.moveTo(sz*0.12, -sz*0.05);
    for(let i=0;i<5;i++){
      ctx.quadraticCurveTo(sz*(0.2+i*0.14), -sz*(0.08 + i*0.12) - flap*6, sz*(0.4+i*0.12), 0);
    }
    ctx.strokeStyle = `rgba(150,255,255,${0.08 + flap*0.08})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // main draw
  function animate(t){
    ctx.clearRect(0,0,W,H);

    // subtle background glow
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(0,40,40,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // move head locked to pointer but with tiny smoothing to avoid jitter
    const head = points[0];
    head.x += (pointer.x - head.x) * 0.9;
    head.y += (pointer.y - head.y) * 0.9;

    // compute velocity approx
    pointer.vx = (pointer.x - (head.prevX ?? pointer.x));
    pointer.vy = (pointer.y - (head.prevY ?? pointer.y));
    head.prevX = pointer.x; head.prevY = pointer.y;

    // body follow with slightly increasing lag
    for(let i=1;i<SEGMENTS;i++){
      const p = points[i];
      const target = points[i-1];
      p.x += (target.x - p.x) * (0.24 + i*0.003);
      p.y += (target.y - p.y) * (0.24 + i*0.003);
      // angle for orientation
      p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    }

    // spawn particles at tail with intensity depending on speed
    const tail = points[SEGMENTS-1];
    const speed = Math.hypot(pointer.vx, pointer.vy);
    const tailSpawnRate = clamp(speed*0.6, 0.2, 3.5);
    // spawn some ice always, and flame when clicking
    if(Math.random() < 0.6 * tailSpawnRate) spawnParticle(tail.x, tail.y, 'ice');
    if(isClicking && Math.random() < 0.8) spawnParticle(tail.x, tail.y, 'flame');

    // wings near front segments
    const tsec = t/1000;
    drawWing(points[5].x - 10, points[5].y + 2, 78, 0, tsec);
    drawWing(points[8].x - 22, points[8].y + 10, 66, 1, tsec);

    // body glowing segments with scale highlights
    for(let i=0;i<SEGMENTS;i++){
      const p = points[i];
      const radius = Math.max(2.6, 14 - i*0.36);
      const hue = 188 - i*2.4; // bluish -> teal
      const light = 60 - i*0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI*2);
      // gradient per segment
      const grad = ctx.createRadialGradient(p.x - radius*0.3, p.y - radius*0.3, radius*0.1, p.x, p.y, radius*1.4);
      grad.addColorStop(0, `hsla(${hue}, 95%, ${Math.min(85, light+16)}%, 0.95)`);
      grad.addColorStop(0.6, `hsla(${hue}, 88%, ${Math.max(38, light-6)}%, 0.95)`);
      grad.addColorStop(1, `hsla(${hue-6}, 85%, ${Math.max(18, light-18)}%, 0.9)`);
      ctx.fillStyle = grad;
      // outer glow
      ctx.shadowColor = `hsla(${hue}, 95%, ${Math.min(70, light)}%, 0.9)`;
      ctx.shadowBlur = Math.max(6, 18 - i*0.4);
      ctx.fill();

      // subtle scale shine overlay
      if(i % 2 === 0){
        ctx.beginPath();
        ctx.arc(p.x - radius*0.3, p.y - radius*0.6, radius*0.5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${0.03 + (SEGMENTS - i)*0.0015})`;
        ctx.shadowBlur = 0;
        ctx.fill();
      }
    }

    // draw head details (snout & jaw)
    const h = points[0];
    ctx.save();
    ctx.translate(h.x, h.y);
    // orient head slightly toward movement
    const headAngle = Math.atan2(points[1].y - h.y, points[1].x - h.x);
    ctx.rotate(headAngle + Math.PI/2);
    // snout triangle
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(12, 6);
    ctx.quadraticCurveTo(0, 18, -12, 6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,255,255,0.95)';
    ctx.shadowColor = 'rgba(0,246,255,0.9)';
    ctx.shadowBlur = 30;
    ctx.fill();

    // jaw inner
    ctx.beginPath();
    ctx.moveTo(-8,6);
    ctx.quadraticCurveTo(0,12,8,6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,180,200,0.95)';
    ctx.shadowBlur = 6;
    ctx.fill();

    // eyes
    ctx.beginPath();
    ctx.ellipse(-6, -2, 3.2, 4.5, 0, 0, Math.PI*2);
    ctx.ellipse(6, -2, 3.2, 4.5, 0, 0, Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.fill();
    // pupil
    ctx.beginPath();
    ctx.ellipse(-6, -2, 1.2, 2.6, 0, 0, Math.PI*2);
    ctx.ellipse(6, -2, 1.2, 2.6, 0, 0, Math.PI*2);
    ctx.fillStyle = '#003';
    ctx.fill();

    // horns
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#00f6ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-10,-14);
    ctx.lineTo(-18,-34);
    ctx.lineTo(-6,-18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10,-14);
    ctx.lineTo(18,-34);
    ctx.lineTo(6,-18);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // draw tail flame as jagged flicker
    const tailPoint = points[SEGMENTS-1];
    ctx.save();
    ctx.beginPath();
    const flameF = 1 + Math.sin(t/120) * 0.3;
    ctx.moveTo(tailPoint.x, tailPoint.y);
    ctx.lineTo(tailPoint.x + 8*flameF, tailPoint.y - 18*flameF);
    ctx.lineTo(tailPoint.x + 4*flameF, tailPoint.y - 6*flameF);
    ctx.lineTo(tailPoint.x - 6*flameF, tailPoint.y - 14*flameF);
    ctx.lineTo(tailPoint.x - 10*flameF, tailPoint.y - 6*flameF);
    ctx.closePath();
    // outer glow
    ctx.shadowColor = 'orangered';
    ctx.shadowBlur = 22;
    ctx.fillStyle = isClicking ? 'rgba(255,120,20,0.95)' : 'rgba(255,140,30,0.78)';
    ctx.fill();
    ctx.restore();

    // draw particles (ice and flame)
    const now = performance.now();
    for(let i = particles.length-1; i>=0; i--){
      const p = particles[i];
      const age = now - p.born;
      if(age > p.life){ particles.splice(i,1); continue; }
      const lifeRatio = 1 - age / p.life;
      // integrate
      p.x += p.vx;
      p.y += p.vy;
      // gravity / drift: flames go up slower, ice float up
      if(p.type === 'flame'){ p.vy += 0.06 - lifeRatio*0.02; p.vx *= 0.995; }
      else { p.vy += -0.01; p.vx *= 0.995; }
      // draw
      ctx.beginPath();
      ctx.globalCompositeOperation = (p.type==='flame') ? 'lighter' : 'screen';
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0.02, lifeRatio);
      if(p.type === 'flame'){
        // soft blob
        ctx.moveTo(p.x, p.y);
        ctx.arc(p.x, p.y, p.size * (1 + (1-lifeRatio)*0.8), 0, Math.PI*2);
      } else {
        // tiny sparkle
        ctx.rect(p.x - p.size*0.5, p.y - p.size*0.5, p.size, p.size);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // subtle vignette
    ctx.beginPath();
    ctx.rect(0,0,W,H);
    ctx.fillStyle = 'rgba(0,0,0,0.045)';
    ctx.fill();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
