const canvas = document.getElementById('dragon-canvas');
const ctx = canvas.getContext('2d');
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', e => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});

const segments = 30;
const segmentColors = [
  "#23aecd", "#ee3467", "#f7db4e", "#4ff4ed", "#4157a3", "#c586e7", "#dfb344"
];
const points = Array.from({ length: segments }, () => ({ x: pointer.x, y: pointer.y }));

function animateDragon() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sine wave backbone for flowing style
  const amplitude = 26;
  for (let i = segments - 1; i > 0; i--) {
    let t = i / segments;
    points[i].x += (points[i-1].x + Math.sin(t * 6.5) * amplitude - points[i].x) * 0.28;
    points[i].y += (points[i-1].y + Math.cos(t * 5.7) * amplitude * 0.6 - points[i].y) * 0.28;
  }
  points[0].x += (pointer.x - points[0].x) * 0.38;
  points[0].y += (pointer.y - points[0].y) * 0.38;

  // Clouds (draw semi-transparent swirls under the dragon head)
  ctx.save();
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(points[0].x + Math.sin(i) * 34, points[0].y + Math.cos(i*2) * 28 + 22, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#23aecd";
    ctx.shadowBlur = 23;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // Head: bold, round, with fierce eyes and whiskers
  ctx.save();
  ctx.beginPath();
  ctx.arc(points[0].x, points[0].y, 22, 0, 2 * Math.PI);
  ctx.fillStyle = "#4157a3";
  ctx.shadowBlur = 32;
  ctx.shadowColor = "#f7db4e";
  ctx.fill();

  // Eyes
  ctx.beginPath();
  ctx.arc(points[0].x - 8, points[0].y - 5, 3.1, 0, 2 * Math.PI);
  ctx.arc(points[0].x + 8, points[0].y - 5, 3.1, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 0;
  ctx.fill();

  // Horns (curved lines)
  ctx.strokeStyle = "#f7db4e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(points[0].x - 13, points[0].y - 30);
  ctx.quadraticCurveTo(points[0].x - 21, points[0].y - 40, points[0].x, points[0].y - 44);
  ctx.quadraticCurveTo(points[0].x + 21, points[0].y - 40, points[0].x + 13, points[0].y - 30);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = "#c586e7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x - 18, points[0].y + 4);
  ctx.bezierCurveTo(points[0].x - 23, points[0].y + 18, points[0].x - 32, points[0].y + 20, points[0].x - 10, points[0].y + 30);
  ctx.moveTo(points[0].x + 18, points[0].y + 4);
  ctx.bezierCurveTo(points[0].x + 23, points[0].y + 18, points[0].x + 32, points[0].y + 20, points[0].x + 10, points[0].y + 30);
  ctx.stroke();

  ctx.restore();

  // Body: multi-colored scales, shadow for 3D look
  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 13 - i * 0.31, 0, 2 * Math.PI);
    ctx.fillStyle = segmentColors[i % segmentColors.length];
    ctx.shadowColor = "#181c25";
    ctx.shadowBlur = 7 - i * 0.2;
    ctx.fill();
  }

  // Tail: curl and add flame tip for extra style
  ctx.beginPath();
  ctx.moveTo(points[segments-1].x, points[segments-1].y);
  ctx.bezierCurveTo(
    points[segments-1].x + 14, points[segments-1].y + 14,
    points[segments-1].x - 14, points[segments-1].y + 34,
    points[segments-1].x, points[segments-1].y + 42
  );
  ctx.strokeStyle = "#ee3467";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(points[segments-1].x, points[segments-1].y + 45, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "#f7db4e";
  ctx.shadowColor = "#ee3467";
  ctx.shadowBlur = 16;
  ctx.fill();

  requestAnimationFrame(animateDragon);
}

animateDragon();
