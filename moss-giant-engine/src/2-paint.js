// ───────────────────────── gouache background painter ─────────────────────────
const WW = 2600, WH = 2400, GY = 2150, RX = 1350, GAPX = 1130;
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
const inGap = (x, y, rx, ry) => ((x - GAPX) / rx) ** 2 + ((y - 110) / ry) ** 2 < 1;
const litMap = (x, y) => clamp(1.15 - Math.hypot((x - 1140) / 760, (y - 2215) / 105), 0, 1);

const BG = {};
function paintForest() {
  const R = rng(20240611);
  // ── L0: sky glare, far misty cedars, back-lit canopy
  let c = mkCanvas(WW, WH), g = c.getContext('2d');
  vgrad(g, WW, WH, [[0, [255, 243, 202]], [.2, [238, 240, 200]], [.45, [196, 220, 194]], [.72, [160, 197, 180]], [1, [128, 170, 158]]]);
  glow(g, GAPX - 80, 60, 1300, [255, 248, 214], .85);
  for (let i = 0; i < 900; i++) { const y = R() * WH; brush(g, R() * WW, y, 120 + R() * 260, 14 + R() * 30, (R() - .5) * .5 + .3, mix([255, 246, 210], [150, 190, 176], clamp(y / WH + (R() - .5) * .25, 0, 1)), .16, R); }
  const bands = [[1780, [176, 208, 190], [190, 218, 194], [214, 232, 200], 64, 4.5, 900, 1500, 120], [1880, [140, 184, 168], [160, 198, 170], [196, 222, 180], 46, 6, 1100, 1700, 170], [1990, [100, 152, 138], [126, 174, 142], [176, 208, 150], 30, 8, 1300, 2000, 230]];
  for (const [by, c0, c1, c2, cnt, sz, h0, h1, w0] of bands) {
    for (let i = 0; i < cnt; i++) { const x = (i + R()) / cnt * (WW + 200) - 100; if (R() < .12) continue; cedar(g, x, by + R() * 60, h0 + R() * (h1 - h0), w0 * (.7 + R() * .6), [c0, c1, c2], R, sz); }
    const mg = g.createLinearGradient(0, by - 900, 0, by + 80); mg.addColorStop(0, 'rgba(214,232,206,0)'); mg.addColorStop(1, 'rgba(222,236,208,.78)'); g.fillStyle = mg; g.fillRect(0, by - 900, WW, 1100);
    g.fillStyle = 'rgba(236,240,210,.12)'; g.fillRect(0, 0, WW, WH);
  }
  glow(g, GAPX + 380, 1500, 900, [255, 244, 205], .32, 1.2);
  for (let i = 0; i < 420; i++) {
    const x = R() * WW, y = -60 + R() * R() * 820; if (inGap(x, y, 310, 370)) continue;
    const near = clamp(1.5 - Math.hypot((x - GAPX) / 700, (y - 110) / 600), 0, 1);
    clump(g, x, y, 60 + R() * 90, 40 + R() * 55, [mix([92, 140, 108], [150, 186, 104], near), mix([128, 172, 110], [196, 216, 112], near), mix([170, 204, 124], [236, 238, 150], near), [250, 248, 186]], R, 9, 1.1, 1 + near);
  }
  g.fillStyle = 'rgba(240,242,208,.14)'; g.fillRect(0, 0, WW, 900);
  mottle(g, WW, WH, R, 60, .05); BG.L0 = c;

  // ── L1: mid-distance old trees, far ground
  c = mkCanvas(WW, WH); g = c.getContext('2d');
  for (let i = 0; i < 1400; i++) { const x = R() * WW, y = 2035 + R() * 130; brush(g, x, y, 30 + R() * 60, 8 + R() * 14, (R() - .5) * .3, mix([118, 166, 128], [176, 204, 140], litMap(x, y + 120) * .8 + R() * .2), .9, R); }
  for (let i = 0; i < 900; i++) { const x = R() * WW, y = 2030 + R() * 120; brush(g, x, y, 10 + R() * 14, 3, -Math.PI / 2 + (R() - .5) * .6, mix([96, 150, 112], [190, 214, 140], R() * R()), .9, R); }
  const tp1 = [[70, 104, 96], [104, 138, 112], [186, 196, 140], [96, 146, 92], [150, 186, 104]];
  for (const [x, w, ln] of [[90, 120, 30], [420, 100, -40], [690, 84, 50], [905, 56, -24], [1775, 70, 30], [1960, 104, -50], [2230, 88, 40], [2500, 124, -20]]) {
    const by = 2062 + R() * 40; trunk(g, x, by, -60, w, ln, tp1, R, { mist: [176, 206, 184] });
    for (let k = 0; k < 2; k++) { const y0 = 700 + R() * 700, dir = R() < .5 ? -1 : 1, ex = x + dir * (110 + R() * 120), ey = y0 - 90 - R() * 80; limb(g, x + ln * (1 - y0 / 2100), y0, ex, ey, w * .22, tp1[0], 40); clump(g, ex, ey - 10, 60 + R() * 40, 34 + R() * 20, [[52, 100, 80], [80, 134, 86], [130, 176, 96], [200, 220, 130]], R, 9, 1.2); }
    for (let k = 0; k < 14; k++) flowers(g, x + (R() - .5) * 200, by + 10 + R() * 40, R, 3, 20, 2.6);
  }
  for (let i = 0; i < 300; i++) {
    const x = R() * WW, y = -60 + R() * R() * 900; if (inGap(x, y, 420, 470)) continue;
    const near = clamp(1.3 - Math.hypot((x - GAPX) / 800, (y - 110) / 700), 0, 1);
    clump(g, x, y, 70 + R() * 110, 46 + R() * 60, [[46, 92, 76], mix([70, 124, 80], [96, 150, 84], near), mix([118, 168, 88], [176, 206, 100], near), [214, 228, 130]], R, 11, 1.15, .7 + near);
  }
  // ferns & bushes at mid ground
  for (let i = 0; i < 26; i++) { const x = R() * WW; if (Math.abs(x - RX) < 420) continue; clump(g, x, 2050 + R() * 40, 50 + R() * 70, 22 + R() * 22, [[58, 108, 84], [86, 140, 90], [140, 184, 104], [200, 220, 130]], R, 7, 1.3); }
  { const mg = g.createLinearGradient(0, 1500, 0, 2200); mg.addColorStop(0, 'rgba(206,226,200,0)'); mg.addColorStop(1, 'rgba(214,232,204,.5)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = mg; g.fillRect(0, 1500, WW, 700); g.restore(); }
  mottle(g, WW, WH, R, 50, .06); BG.L1 = c;

  // ── L2: the clearing floor and the two great trees flanking the giant
  c = mkCanvas(WW, WH); g = c.getContext('2d');
  { const gg = g.createLinearGradient(0, 2105, 0, WH); gg.addColorStop(0, 'rgb(74,122,82)'); gg.addColorStop(1, 'rgb(36,74,58)'); g.fillStyle = gg; g.beginPath(); g.moveTo(0, WH); for (let x = 0; x <= WW; x += 20) g.lineTo(x, 2118 + Math.sin(x * .011) * 10 + Math.sin(x * .037) * 5); g.lineTo(WW, WH); g.fill(); }
  for (let i = 0; i < 1500; i++) { const x = R() * WW, y = 2125 + R() * 275, l = litMap(x, y); brush(g, x, y, 50 + R() * 90, 10 + R() * 18, (R() - .5) * .25, mix(mix([44, 86, 64], [66, 116, 76], R()), [150, 186, 92], l * (.6 + R() * .4)), .85, R); }
  // bare soil where the giant has knelt for centuries
  for (let i = 0; i < 520; i++) { const a = R() * TAU, r = Math.sqrt(R()), x = RX + 60 + Math.cos(a) * 520 * r, y = 2168 + Math.sin(a) * 46 * r; brush(g, x, y, 30 + R() * 60, 6 + R() * 10, (R() - .5) * .3, mix([58, 62, 50], [104, 96, 66], R() * (.4 + litMap(x, y) * .6)), .8, R); }
  for (let i = 0; i < 5200; i++) {
    const x = R() * WW, y = 2112 + Math.pow(R(), .8) * 290, sc = .6 + (y - 2110) / 290 * 1.5, l = litMap(x, y) * (.5 + .5 * R());
    if (Math.hypot((x - RX - 60) / 500, (y - 2168) / 40) < 1 && R() < .8) continue;
    const col = l > .55 ? mix([120, 168, 84], [206, 222, 124], R() * l) : mix([40, 84, 62], [84, 136, 78], R() + l * .5);
    brush(g, x, y, (12 + R() * 22) * sc, 2 + sc * 1.6, -Math.PI / 2 + (R() - .5) * .9, col, .92, R);
  }
  for (let i = 0; i < 150; i++) { const x = R() * WW, y = 2130 + R() * 250; flowers(g, x, y, R, 3 + R() * 6 | 0, 30 + R() * 40, 2.6 + (y - 2110) / 290 * 3.2); }
  for (let i = 0; i < 9; i++) { const x = 150 + R() * 2300, y = 2180 + R() * 150, s = 30 + R() * 50; if (Math.abs(x - RX) < 560) continue; clump(g, x, y, s, s * .5, [[70, 78, 80], [110, 118, 112], [168, 172, 150], [206, 206, 176]], R, 9, 1.2); clump(g, x - s * .2, y - s * .3, s * .7, s * .22, [[58, 104, 60], [96, 146, 70], [150, 190, 90], [200, 220, 120]], R, 6, 1.3); }
  const tp2 = [[44, 62, 60], [80, 100, 84], [190, 186, 124], [70, 124, 66], [142, 180, 86]];
  for (const [x, w, ln] of [[300, 240, 60], [2340, 270, -70]]) {
    trunk(g, x, 2200, -80, w, ln, tp2, R, { dens: 1.4 });
    limb(g, x + ln * .5, 900, x + (x < RX ? 330 : -360), 620, w * .3, tp2[0], 60); limb(g, x + ln * .7, 520, x + (x < RX ? -260 : 280), 300, w * .26, tp2[0], 40);
    for (let k = 0; k < 16; k++) clump(g, x + (R() - .5) * w * 2.6, 2200 + R() * 50, 40 + R() * 60, 20 + R() * 26, [[34, 76, 58], [60, 112, 70], [120, 168, 84], [190, 214, 116]], R, 8, 1.3);
    for (let k = 0; k < 10; k++) flowers(g, x + (R() - .5) * w * 2.4, 2215 + R() * 50, R, 5, 40, 4);
  }
  for (let i = 0; i < 150; i++) {
    const x = R() < .5 ? R() * 820 - 100 : WW - R() * 820 + 100, y = -60 + R() * R() * 760; if (inGap(x, y, 560, 560)) continue;
    clump(g, x, y, 80 + R() * 110, 50 + R() * 60, [[28, 62, 54], [46, 94, 62], [98, 148, 72], [176, 204, 100]], R, 13, 1.15, .8);
  }
  mottle(g, WW, WH, R, 50, .07); BG.L2 = c;

  // ── FG: dark framing foliage (multiplane foreground)
  const FW = 3300, FH = 2800; c = mkCanvas(FW, FH); g = c.getContext('2d'); g.translate(350, 200);
  const fp = [[18, 40, 40], [30, 62, 52], [66, 108, 62], [140, 172, 84]];
  trunk(g, -150, 2700, -200, 420, 90, [[26, 38, 40], [50, 66, 58], [150, 150, 100], [44, 84, 52], [100, 140, 70]], R, { dens: 1.2 });
  limb(g, -40, 560, 620, 330, 120, [26, 38, 40], 90); limb(g, 300, 430, 760, 500, 50, [26, 38, 40], 20);
  for (let i = 0; i < 70; i++) { const x = -350 + R() * 1250, y = -200 + R() * 620 + Math.max(0, x) * .1; if (x > 500 && y > 500) continue; clump(g, x, y, 90 + R() * 110, 60 + R() * 70, fp, R, 17, 1.1, .5); }
  for (let i = 0; i < 46; i++) { const x = WW + 350 - R() * 900, y = -200 + R() * 480 - (WW - x) * .1; clump(g, x, y, 90 + R() * 110, 60 + R() * 60, fp, R, 17, 1.1, .5); }
  for (let i = 0; i < 90; i++) {       // foreground ferns & grasses along the bottom
    const x = -350 + R() * FW, e = Math.abs(x - 1300) / 1650, y = 2600 - e * e * 260 + R() * 60 - 40, n = 9 + R() * 8 | 0, hgt = 120 + R() * 200 + e * 160;
    for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k / (n - 1) - .5) * 2.1, tx = x + Math.cos(a) * hgt * (.7 + R() * .5), ty = y + Math.sin(a) * hgt; const col = R() < .22 ? fp[2] : R() < .5 ? fp[1] : fp[0]; limb(g, x, y + 40, tx, ty, 9 + R() * 8, col, -hgt * .25); if (R() < .5) for (let m = 2; m < 9; m++) { const t = m / 9, px = lerp(x, tx, t), py = lerp(y + 40, ty, t) - hgt * .12 * Math.sin(t * 3.1); dab(g, px, py, 34 * (1 - t * .6), 9, a + 1.2, col, 1); dab(g, px, py, 34 * (1 - t * .6), 9, a - 1.2, col, 1); } }
    if (R() < .3) flowers(g, x, y - hgt * .5, R, 4, 80, 7);
  }
  mottle(g, FW, FH, R, 30, .05); BG.FG = c; BG.FGo = [-350, -200];

  // ── mist texture (tileable) & god-ray plates
  c = mkCanvas(2048, 512); g = c.getContext('2d');
  for (let i = 0; i < 70; i++) { const x = R() * 2048, y = 80 + R() * 360, r = 140 + R() * 300, a = .1 + R() * .25, sy = .16 + R() * .22; for (const dx of [-2048, 0, 2048]) glow(g, x + dx, y, r, [246, 248, 232], a, sy); }
  BG.mist = c;
  BG.rays = [];
  for (let k = 0; k < 3; k++) {
    const s = mkCanvas(WW / 8, WH / 8), sg = s.getContext('2d'); sg.scale(1 / 8, 1 / 8);
    for (let i = 0; i < 4; i++) {
      const x0 = 560 + R() * 900, w0 = 30 + R() * 90, w1 = w0 * (2.2 + R()), len = 1700 + R() * 600, dx = .44 * len;
      const gr = sg.createLinearGradient(x0, 0, x0 + dx, len); gr.addColorStop(0, 'rgba(255,244,196,0)'); gr.addColorStop(.12, 'rgba(255,244,196,.5)'); gr.addColorStop(.6, 'rgba(255,240,190,.3)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
      sg.fillStyle = gr; sg.beginPath(); sg.moveTo(x0, 0); sg.lineTo(x0 + w0, 0); sg.lineTo(x0 + dx + w1, len); sg.lineTo(x0 + dx, len); sg.fill();
    }
    const t = mkCanvas(WW / 16, WH / 16), tg = t.getContext('2d'); tg.drawImage(s, 0, 0, t.width, t.height); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, s.width, s.height); sg.drawImage(t, 0, 0, s.width, s.height);
    BG.rays.push(s);
  }
}

// ── the sky above the canopy (final shot)
const SKW = 1920, SKH = 2600, HORIZ = 2170;
function paintCloud(g, cx, cy, w, h, R, pal) {
  const lumps = [], K = 7 + (w / 90 | 0);
  for (let i = 0; i < K; i++) { const u = (i + R()) / K * 2 - 1; lumps.push([cx + u * w / 2, cy - h * (1 - u * u) * (.35 + .5 * R()), h * (.26 + .24 * R()) * (1 - Math.abs(u) * .4)]); }
  for (let i = 0; i < K; i++) { const u = (i + R()) / K * 2 - 1; lumps.push([cx + u * w * .42, cy - h * .12 * R(), h * (.22 + .12 * R())]); }
  for (const [x, y, r] of lumps) for (let i = 0; i < r * 1.2; i++) { const a = R() * TAU, q = Math.sqrt(R()) * r; dab(g, x + Math.cos(a) * q, y + Math.sin(a) * q, r * (.3 + R() * .3), r * (.2 + R() * .2), R() * 3, jit(pal[0], R, 5), .95); }
  for (const [x, y, r] of lumps) for (let i = 0; i < r * 1.1; i++) { const a = R() * TAU, q = Math.sqrt(R()) * r * .78; dab(g, x - r * .22 + Math.cos(a) * q, y - r * .12 + Math.sin(a) * q, r * (.26 + R() * .26), r * (.16 + R() * .2), R() * 3, jit(pal[1], R, 5), .95); }
  for (const [x, y, r] of lumps) for (let i = 0; i < r * .7; i++) { const a = 3.5 + (R() - .5) * 2.2, q = (.3 + R() * .62) * r; dab(g, x + Math.cos(a) * q, y + Math.sin(a) * q, r * (.2 + R() * .22), r * (.12 + R() * .16), R() * 3, jit(pal[2], R, 4), .95); }
  for (let i = 0; i < w / 9; i++) brush(g, cx + (R() - .5) * w * .95, cy + h * .1 + R() * h * .1, 60 + R() * 120, 8 + R() * 12, 0, mix(pal[0], pal[3], R()), .28, R);
}
function paintSky() {
  const R = rng(777); let c = mkCanvas(SKW, SKH), g = c.getContext('2d');
  const ST = [[0, [84, 138, 184]], [.18, [136, 184, 198]], [.34, [212, 220, 184]], [.48, [250, 228, 164]], [.68, [255, 208, 132]], [HORIZ / SKH, [255, 178, 112]], [1, [255, 178, 112]]]; vgrad(g, SKW, SKH, ST);
  for (let i = 0; i < 1500; i++) { const y = R() * HORIZ, t = y / SKH; let col = ST[0][1]; for (let k = 1; k < ST.length; k++) if (t >= ST[k - 1][0] && t <= ST[k][0]) col = mix(ST[k - 1][1], ST[k][1], (t - ST[k - 1][0]) / (ST[k][0] - ST[k - 1][0])); brush(g, R() * SKW, y, 160 + R() * 320, 16 + R() * 34, (R() - .5) * .16, jit(col, R, 9), .3, R); }
  const SUN = [400, 2075]; glow(g, SUN[0], SUN[1], 1300, [255, 236, 170], .75); glow(g, SUN[0], SUN[1], 520, [255, 250, 220], .9); glow(g, SUN[0], SUN[1], 130, [255, 255, 246], 1);
  // high cirrus streaks
  for (let i = 0; i < 90; i++) { const x = R() * SKW, y = 100 + R() * 1200; brush(g, x, y, 200 + R() * 400, 6 + R() * 10, -.12 + (R() - .5) * .1, mix([226, 236, 236], [255, 240, 206], y / 1100), .26, R); }
  const cp = [[206, 172, 172], [244, 208, 170], [255, 242, 208], [240, 196, 150]], cp2 = [[150, 174, 204], [222, 218, 212], [255, 248, 230], [170, 190, 208]];
  paintCloud(g, 1560, 1830, 760, 520, R, cp); paintCloud(g, 1160, 2010, 520, 230, R, cp); paintCloud(g, 60, 1660, 520, 300, R, cp);
  paintCloud(g, 300, 1210, 600, 310, R, cp); paintCloud(g, 1690, 1010, 520, 270, R, cp); paintCloud(g, 420, 420, 560, 260, R, cp2); paintCloud(g, 1500, 330, 420, 180, R, cp2); paintCloud(g, 820, 2080, 300, 90, R, cp);
  // mountains
  for (const [by, col, hh] of [[HORIZ + 6, [176, 160, 184], 120], [HORIZ + 26, [140, 142, 170], 80]]) { g.fillStyle = rgb(col); g.beginPath(); g.moveTo(0, by + 60); for (let x = 0; x <= SKW; x += 24) g.lineTo(x, by - hh * (.35 + .65 * Math.abs(Math.sin(x * .0031 + by) * Math.cos(x * .0013 + by * .5))) - R() * 8); g.lineTo(SKW, by + 60); g.fill(); for (let i = 0; i < 300; i++) brush(g, R() * SKW, by - R() * hh * .5 + 20, 40 + R() * 60, 6 + R() * 8, .5 + R() * .4, jit(mix(col, [255, 206, 150], R() * .5), R, 6), .35, R); }
  glow(g, SUN[0], HORIZ + 20, 900, [255, 226, 170], .6, .16);
  const rows = (g, r0, r1) => { for (let r = r0; r < r1; r++) { const t = r / 9, y = HORIZ + 34 + t * t * 330 + t * 60, sz = 5 + t * 15, far = 1 - t;
      const pal = [mix([30, 66, 56], [150, 160, 136], far * .85), mix([52, 100, 62], [176, 180, 136], far * .85), mix([150, 170, 76], [226, 206, 140], far * .7), mix([240, 220, 120], [255, 232, 170], far)];
      const n = 20 - r; for (let i = 0; i < n * 2; i++) { const x = (i + R()) / (n * 2) * (SKW + 300) - 150; clump(g, x, y + R() * 26 * (1 + t * 2), (40 + R() * 40) * (.5 + t * 2.2), (22 + R() * 20) * (.5 + t * 1.8), pal, R, sz, 1.2, 1.3); if (R() < .16) cedar(g, x, y + 20, (90 + R() * 70) * (.5 + t * 1.6), 60 * (.5 + t * 1.5), pal, R, sz * .8); }
      const mg = g.createLinearGradient(0, y - 20, 0, y + 80 + t * 80); mg.addColorStop(0, 'rgba(255,226,170,0)'); mg.addColorStop(1, `rgba(255,228,176,${.5 * far + .1})`); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = mg; g.fillRect(0, y - 20, SKW, 200); g.restore(); } };
  { const gg = g.createLinearGradient(0, HORIZ + 30, 0, SKH); gg.addColorStop(0, 'rgb(170,176,134)'); gg.addColorStop(.3, 'rgb(84,118,76)'); gg.addColorStop(1, 'rgb(32,66,54)'); g.fillStyle = gg; g.fillRect(0, HORIZ + 34, SKW, SKH); }
  rows(g, 0, 6); mottle(g, SKW, SKH, R, 40, .04); BG.sky = c; BG.sun = SUN;
  c = mkCanvas(SKW, SKH); g = c.getContext('2d'); rows(g, 6, 10); BG.skyFG = c;
}
