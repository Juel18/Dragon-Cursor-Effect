const canvas = document.getElementById("dragon-canvas");
const ctx = canvas.getContext("2d");
let pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

window.addEventListener("mousemove", e => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});

// Dragon properties
const segments = 24;
const points = Array.from({ length: segments }, () => ({ x: pointer.x, y: pointer.y }));

function animateDragon() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move segments following each other
  for (let i = segments - 1; i > 0; i--) {
    points[i].x += (points[i - 1].x - points[i].x) * 0.3;
    points[i].y += (points[i - 1].y - points[i].y) * 0.3;
  }
  points[0].x += (pointer.x - points[0].x) * 0.26;
  points[0].y += (pointer.y - points[0].y) * 0.26;

  // Draw head (larger, glowing)
  ctx.beginPath();
  ctx.arc(points[0].x, points[0].y, 18, 0, 2 * Math.PI);
  ctx.fillStyle = "lime";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "aqua";
  ctx.fill();

  // Draw eyes
  ctx.beginPath();
  ctx.arc(points[0].x - 7, points[0].y - 5, 2.2, 0, 2 * Math.PI);
  ctx.arc(points[0].x + 7, points[0].y - 5, 2.2, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.shadowBlur = 0;
  ctx.fill();

  // Draw horns
  ctx.save();
  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x - 10, points[0].y - 10);
  ctx.lineTo(points[0].x - 26, points[0].y - 32);
  ctx.moveTo(points[0].x + 10, points[0].y - 10);
  ctx.lineTo(points[0].x + 26, points[0].y - 32);
  ctx.stroke();
  ctx.restore();

  // Draw body
  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 12 - i * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = `hsl(${120 + i * 10}, 90%, 55%)`;
    ctx.shadowBlur = 17 - i * 0.7;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fill();
  }
  requestAnimationFrame(animateDragon);
}
animateDragon();
