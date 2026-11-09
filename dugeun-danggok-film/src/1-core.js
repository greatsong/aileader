// ───────────────────────── core: math, colour, ink & cel drawing ─────────────────────────
const W = 1920, H = 1040, TAU = Math.PI * 2, FPS = 24;
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { n = Math.imul(n ^ 0x9E3779B9, 0x85EBCA6B); n ^= n >>> 13; n = Math.imul(n, 0xC2B2AE35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function vnoise(x, seed) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i * 7919 + seed * 104729) * (1 - u) + hash((i + 1) * 7919 + seed * 104729) * u) * 2 - 1; }
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIn = t => Math.pow(clamp(t, 0, 1), 3);
function hx(s) { return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]; }
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c, a) { return a === undefined || a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function jit(c, R, amt) { const d = (R() - .5) * 2 * amt, e = (R() - .5) * amt; return [clamp(c[0] + d + e, 0, 255), clamp(c[1] + d, 0, 255), clamp(c[2] + d - e, 0, 255)]; }
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Smooth a control polygon into a dense polyline (Catmull-Rom). Points may carry a 3rd element =1 for a hard corner.
function dense(pts, closed, step) {
  step = step || 7; const n = pts.length, out = [];
  const g = i => closed ? pts[(i % n + n) % n] : pts[clamp(i, 0, n - 1)];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p1 = g(i), p2 = g(i + 1); let p0 = g(i - 1), p3 = g(i + 2);
    if (p1[2]) p0 = p1; if (p2[2]) p3 = p2;
    const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([
        .5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
  return out;
}
// hand wobble: low-frequency displacement along the line, seeded per drawing
function wobble(poly, seed, amp, wl) {
  wl = wl || 46; let s = 0; const out = new Array(poly.length);
  for (let i = 0; i < poly.length; i++) {
    if (i) s += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
    out[i] = [poly[i][0] + vnoise(s / wl, seed) * amp, poly[i][1] + vnoise(s / wl + 31.7, seed + 5) * amp];
  }
  return out;
}
function tracePoly(ctx, poly) { ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]); }
// pressure-varying ink stroke rendered as a filled ribbon
function ink(ctx, poly, w, col, seed, closed, taper) {
  const n = poly.length; if (n < 2) return;
  const L = [], Rr = []; let s = 0;
  let total = 0; for (let i = 1; i < n; i++) total += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  for (let i = 0; i < n; i++) {
    const a = poly[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = poly[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    if (i) s += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
    let ww = w * (.72 + .34 * vnoise(s / 55, seed + 11) + .12 * vnoise(s / 13, seed + 3));
    // slightly heavier on undersides / right sides (away from light)
    ww *= 1 + .22 * clamp(dx * .7 - dy * .0 + (dx < 0 ? 0 : .15), -1, 1) * (closed ? 1 : .5);
    if (!closed && taper !== 0) { const e = Math.min(s, total - s), tl = Math.min(total * .45, (taper || 26)); ww *= .25 + .75 * Math.min(1, e / tl); }
    ww = Math.max(.35, ww) * .5;
    L.push([poly[i][0] - dy * ww, poly[i][1] + dx * ww]); Rr.push([poly[i][0] + dy * ww, poly[i][1] - dx * ww]);
  }
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
  if (closed) { ctx.closePath(); ctx.moveTo(Rr[0][0], Rr[0][1]); for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]); ctx.closePath(); }
  else for (let i = n - 1; i >= 0; i--) ctx.lineTo(Rr[i][0], Rr[i][1]);
  ctx.fill();
}
// ── cel context: global drawing state for character layers
const CEL = { lw: 3, amp: 1.1, line: 'rgb(46,36,34)', seed: 1 };
// cel shape: flat fill + optional offset core shadow + ink outline. returns wobbled polyline
function cel(ctx, pts, o) {
  const seed = (o.seed || 0) + CEL.seed;
  let poly = pts; if (!o.raw) poly = dense(pts, o.closed !== false, o.step);
  poly = wobble(poly, seed, o.amp === undefined ? CEL.amp : o.amp);
  if (o.fill) {
    tracePoly(ctx, poly); ctx.closePath();
    if (o.shade) {
      ctx.fillStyle = o.shade; ctx.fill();
      ctx.save(); ctx.clip();
      const off = o.off || [-10, -8];
      ctx.translate(off[0], off[1]); tracePoly(ctx, poly); ctx.closePath(); ctx.fillStyle = o.fill; ctx.fill();
      ctx.restore();
    } else { ctx.fillStyle = o.fill; ctx.fill(); }
  }
  if (o.lw !== 0) ink(ctx, poly, (o.lw || 1) * CEL.lw, o.line || CEL.line, seed, o.closed !== false, o.taper);
  return poly;
}
function clipTo(ctx, poly) { ctx.save(); tracePoly(ctx, poly); ctx.closePath(); ctx.clip(); }
// organic blob polygon (fixed seed → on-model patches)
function blob(cx, cy, rx, ry, seed, k, rough) {
  const pts = []; k = k || 9; rough = rough === undefined ? .35 : rough;
  for (let i = 0; i < k; i++) { const a = i / k * TAU, r = 1 + (hash(seed * 31 + i) - .5) * 2 * rough; pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]); }
  return pts;
}
