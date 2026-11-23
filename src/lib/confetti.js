let frameId = 0;
export function confetti(count = 140) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  let canvas = document.getElementById('fx');
  if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'fx'; canvas.setAttribute('aria-hidden', 'true'); document.body.appendChild(canvas); }
  let ctx = null; try { ctx = canvas.getContext('2d'); } catch { /* no canvas */ }
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ['#F8FAFC', '#FACC15', '#EF4444', '#F97316', '#3B82F6', '#22C55E', getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22D3EE'];
  const parts = Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0, angle = (left ? -62 : -118) * Math.PI / 180 + (Math.random() - 0.5) * 0.7, speed = 10 + Math.random() * 10;
    return { x: left ? W * 0.08 : W * 0.92, y: H + 10, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[i % colors.length] };
  });
  cancelAnimationFrame(frameId);
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start; let alive = false;
    ctx.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.vy += 0.28; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y < H + 20) alive = true;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 2200) / 800);
      ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (elapsed < 3000 && alive) frameId = requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
  }
  frameId = requestAnimationFrame(frame);
}
