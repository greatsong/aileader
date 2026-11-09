// ───────────────────────── gouache brush helpers ─────────────────────────
function dab(ctx, x, y, l, w, ang, col, a) { ctx.fillStyle = rgb(col, a); ctx.beginPath(); ctx.ellipse(x, y, Math.max(.5, l / 2), Math.max(.5, w / 2), ang, 0, TAU); ctx.fill(); }
function brush(ctx, x, y, l, w, ang, col, a, R) {
  const n = Math.max(2, Math.round(w / 3.5)), c = Math.cos(ang), s = Math.sin(ang); ctx.lineCap = 'round'; ctx.lineWidth = w / n * 1.7;
  for (let i = 0; i < n; i++) {
    const off = (i / (n - 1) - .5) * w, l2 = l * (.6 + .4 * R()), sh = (R() - .5) * l * .25;
    ctx.strokeStyle = rgb(jit(col, R, 7), a * (.55 + .45 * R())); ctx.beginPath();
    ctx.moveTo(x + c * (sh - l2 / 2) - s * off, y + s * (sh - l2 / 2) + c * off); ctx.lineTo(x + c * (sh + l2 / 2) - s * off, y + s * (sh + l2 / 2) + c * off); ctx.stroke();
  }
}
function vgrad(ctx, w, h, stops) { const g = ctx.createLinearGradient(0, 0, 0, h); for (const [p, c, a] of stops) g.addColorStop(p, rgb(c, a === undefined ? 1 : a)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
function glow(ctx, x, y, r, col, a, sy) { ctx.save(); ctx.translate(x, y); ctx.scale(1, sy || 1); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, rgb(col, a)); g.addColorStop(.5, rgb(col, a * .45)); g.addColorStop(1, rgb(col, 0)); ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.restore(); }
// leafy mass: dark body, mid tones, sun-facing lights (light from upper-left)
function clump(ctx, cx, cy, rx, ry, pal, R, sz, dens, boost) {
  const n = Math.round(rx * ry / (sz * sz) * (dens || 1.3));
  for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()); dab(ctx, cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, sz * (1.1 + R()), sz * (.6 + .5 * R()), R() * TAU, jit(pal[0], R, 9), .96); }
  for (let i = 0; i < n * .75; i++) { const a = R() * TAU, r = Math.sqrt(R()) * .86; dab(ctx, cx - rx * .14 + Math.cos(a) * rx * r, cy - ry * .2 + Math.sin(a) * ry * r, sz * (.9 + R() * .8), sz * (.5 + .4 * R()), R() * TAU, jit(pal[1], R, 10), .95); }
  for (let i = 0; i < n * .42 * (boost || 1); i++) { const a = 3.9 + (R() - .5) * 2.4, r = .45 + .55 * R(); dab(ctx, cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, sz * (.8 + R() * .7), sz * (.45 + .35 * R()), R() * TAU, jit(pal[2], R, 10), .95); }
  for (let i = 0; i < n * .1 * (boost || 1); i++) { const a = 3.9 + (R() - .5) * 1.6, r = .7 + .3 * R(); dab(ctx, cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, sz * (.6 + R() * .5), sz * (.35 + .3 * R()), R() * TAU, jit(pal[3], R, 8), .95); }
}
function cedar(ctx, x, base, h, w, pal, R, sz) {
  ctx.fillStyle = rgb(pal[0]); ctx.fillRect(x - w * .03, base - h * .92, w * .06, h * .92);
  const tiers = Math.round(h / (sz * 2.6));
  for (let k = 0; k < tiers; k++) {
    const t = k / tiers; if (t > .84) break; const y = base - h + t * h, hw = w * .5 * (.08 + .92 * Math.pow(t / .84, .75)) * (.75 + .45 * R());
    const m = Math.max(2, hw / sz * 2.4);
    for (let j = 0; j < m; j++) { const u = R() * 2 - 1, xx = x + u * hw; dab(ctx, xx, y + Math.abs(u) * sz * 1.8 + R() * sz, sz * (1.7 + R()), sz * (.7 + R() * .5), u * (.5 + R() * .3), jit(pal[0], R, 7), 1); }
    for (let j = 0; j < m * .45; j++) { const u = -R(), xx = x + u * hw; dab(ctx, xx, y + Math.abs(u) * sz * 1.5 + R() * sz * .6 - sz * .3, sz * (1.2 + R()), sz * (.5 + R() * .3), u * .5, jit(pal[1], R, 7), .9); }
    if (R() < .5) { const u = -.3 - R() * .7; dab(ctx, x + u * hw, y + Math.abs(u) * sz - sz * .4, sz * 1.2, sz * .45, u * .5, pal[2], .85); }
  }
}
function trunk(ctx, x, base, top, w, lean, pal, R, o) {
  o = o || {}; const N = 46, Lp = [], Rp = [], cxs = [], hws = [], ph = R() * 9;
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = lerp(base, top, t), cx = x + lean * t + Math.sin(t * 5 + ph) * w * .12, hw = w * .5 * (1 - .42 * t) * (1 + 1.1 * Math.pow(1 - t, 14)) * (1 + .05 * Math.sin(t * 23 + ph));
    cxs.push(cx); hws.push(hw); Lp.push([cx - hw, y]); Rp.push([cx + hw, y]);
  }
  ctx.fillStyle = rgb(pal[0]); ctx.beginPath(); ctx.moveTo(Lp[0][0], Lp[0][1]); for (const p of Lp) ctx.lineTo(p[0], p[1]); for (let i = N; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]); ctx.fill();
  const cnt = Math.round(w * (base - top) / 520 * (o.dens || 1));
  for (let i = 0; i < cnt; i++) {
    const t = R(), k = Math.min(N - 1, t * N | 0), u = R() * 2 - 1, y = lerp(base, top, t), px = cxs[k] + u * hws[k] * .88;
    let c = u < -.55 ? mix(pal[1], pal[2], R() * .9) : u < .05 ? mix(pal[0], pal[1], R()) : mix(pal[0], [pal[0][0] * .7, pal[0][1] * .75, pal[0][2] * .85], R());
    if (o.mist) c = mix(c, o.mist, clamp(1 - t * 3.2, 0, 1) * .55);
    brush(ctx, px, y, 40 + R() * 110, 4 + R() * w * .07, Math.PI / 2 + (R() - .5) * .12, c, .85, R);
  }
  // roots
  for (let i = 0; i < 5; i++) { const u = (i / 4) * 2 - 1, rx = x + u * w * .8; ctx.strokeStyle = rgb(mix(pal[0], pal[1], u < 0 ? .5 : 0)); ctx.lineWidth = w * .2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + u * w * .3, base - w * .5); ctx.quadraticCurveTo(rx, base - w * .15, rx + u * w * .5, base + w * .12); ctx.stroke(); }
  // moss skirt & dapples
  if (pal[3]) for (let i = 0; i < w * 1.6; i++) { const t = R() * R() * .32, k = t * N | 0, u = R() * 2 - 1; dab(ctx, cxs[k] + u * hws[k] * .9, lerp(base, top, t), 7 + R() * 12, 4 + R() * 6, R() * 3, jit(u < -.2 ? pal[4] || pal[3] : pal[3], R, 10), .9); }
  return { cxs, hws };
}
function limb(ctx, x0, y0, x1, y1, w, col, bend) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + (bend || 0); ctx.strokeStyle = rgb(col); ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) { const a = i / 10, b = (i + 1) / 10, q = t => [(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * my + t * t * y1], p = q(a), p2 = q(b); ctx.lineWidth = w * (1 - .75 * a); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
}
function flowers(ctx, x, y, R, n, sp, s) {
  const cols = [[248, 243, 226], [246, 218, 104], [238, 176, 186], [168, 172, 228]], c = cols[R() * cols.length | 0];
  for (let i = 0; i < n; i++) { const fx = x + (R() - .5) * sp, fy = y + (R() - .5) * sp * .35; dab(ctx, fx, fy, s * (1 + R() * .6), s * (.7 + R() * .4), R() * 3, jit(c, R, 8), 1); if (s > 3.5) dab(ctx, fx, fy, s * .35, s * .35, 0, [226, 150, 60], 1); }
}
function mottle(ctx, w, h, R, n, a) { ctx.save(); ctx.globalCompositeOperation = 'source-atop'; for (let i = 0; i < n; i++) { const d = R() < .5; glow(ctx, R() * w, R() * h, 60 + R() * 220, d ? [30, 50, 60] : [255, 240, 200], a * (.5 + R() * .5), .5 + R() * .5); } ctx.restore(); }
function paintCloud(g, cx, cy, w, h, R, pal) {
  const lumps = [], K = 7 + (w / 90 | 0);
  for (let i = 0; i < K; i++) { const u = (i + R()) / K * 2 - 1; lumps.push([cx + u * w / 2, cy - h * (1 - u * u) * (.35 + .5 * R()), h * (.26 + .24 * R()) * (1 - Math.abs(u) * .4)]); }
  for (let i = 0; i < K; i++) { const u = (i + R()) / K * 2 - 1; lumps.push([cx + u * w * .42, cy - h * .12 * R(), h * (.22 + .12 * R())]); }
  for (const [x, y, r] of lumps) for (let i = 0; i < r * 1.2; i++) { const a = R() * TAU, q = Math.sqrt(R()) * r; dab(g, x + Math.cos(a) * q, y + Math.sin(a) * q, r * (.3 + R() * .3), r * (.2 + R() * .2), R() * 3, jit(pal[0], R, 5), .95); }
  for (const [x, y, r] of lumps) for (let i = 0; i < r * 1.1; i++) { const a = R() * TAU, q = Math.sqrt(R()) * r * .78; dab(g, x - r * .22 + Math.cos(a) * q, y - r * .12 + Math.sin(a) * q, r * (.26 + R() * .26), r * (.16 + R() * .2), R() * 3, jit(pal[1], R, 5), .95); }
  for (const [x, y, r] of lumps) for (let i = 0; i < r * .7; i++) { const a = 3.5 + (R() - .5) * 2.2, q = (.3 + R() * .62) * r; dab(g, x + Math.cos(a) * q, y + Math.sin(a) * q, r * (.2 + R() * .22), r * (.12 + R() * .16), R() * 3, jit(pal[2], R, 4), .95); }
  for (let i = 0; i < w / 9; i++) brush(g, cx + (R() - .5) * w * .95, cy + h * .1 + R() * h * .1, 60 + R() * 120, 8 + R() * 12, 0, mix(pal[0], pal[3], R()), .28, R);
}
