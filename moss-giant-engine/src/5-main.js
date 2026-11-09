// ───────────────────────── direction: shots, camera, compositing ─────────────────────────
const cv = document.getElementById('c'), ctx = cv.getContext('2d'); let RS = 1; cv.width = W; cv.height = H;
function ST(a, b, c, d, e, f) { ctx.setTransform(a * RS, b * RS, c * RS, d * RS, e * RS, f * RS); }
function setRS(r) { RS = r; cv.width = Math.round(W * r); cv.height = Math.round(H * r); }
const soft = mkCanvas(W / 8, H / 8), sg = soft.getContext('2d'), bloomC = mkCanvas(W / 8, H / 8), bg2 = bloomC.getContext('2d');
const AX = RX, AY = 1700, END = 72.6;
const SHOTS = [[0, 'A'], [8.5, 'B'], [20, 'C'], [24.5, 'D'], [30, 'E'], [34, 'F'], [48.5, 'G'], [53.5, 'H'], [59.5, 'I']];
function tr(t, keys) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], (t - a[0]) / (b[0] - a[0])); } return keys[keys.length - 1][1]; }
const chestAt = t => (t >= 21.2 && t < 21.33) ? .5 : (t >= 21.9 && t < 22.0) ? .75 : (t >= 22.5 ? tr(t, [[22.5, .25], [24, .6], [34, .7], [55.5, .8], [56, 1]]) * (t < 55 ? .86 + .14 * Math.sin(t * 2.4) : 1) : 0);
const eyeAt = t => (t >= 25.3 && t < 25.42) ? .55 : (t >= 25.7 && t < 25.87) ? .8 : t >= 26.2 ? tr(t, [[26.2, .2], [27, .8], [49, .85], [50.5, 1]]) : 0;
const lidAt = t => (t >= 28.55 && t < 28.7) || (t >= 50.9 && t < 51.03) ? .08 : tr(t, [[0, .12], [26.2, .12], [27.1, .5], [27.6, .55], [28, .95], [33.8, .95], [34.4, .6], [47.4, .62], [48.4, .85], [49.5, .8], [51.4, 1]]);
const shedAt = t => tr(t, [[34, 0], [40, .32], [44.5, .5], [48, .62], [55.6, .66], [56.4, .86]]);
const sunAt = t => tr(t, [[0, .12], [8.5, .3], [13, .45], [17, .8], [24, .9], [34, 1]]);
const litYAt = t => tr(t, [[12.9, 1100], [13.3, 1262], [15.4, 1398], [17, 1475], [20, 1640], [24.5, 1720], [30, 1900], [34, 2500]]);
const shakeAt = t => { const b = (t0, a, k) => t > t0 ? a * Math.exp(-(t - t0) * k) : 0; return ramp(t, 29.3, 29.9) * (1 - ramp(t, 33.6, 34.6)) * 3.2 + b(34.3, 5, 3) + b(40.4, 8, 3) + b(44.2, 8, 3) + b(47.35, 7, 3) + (t > 55.5 && t < 57.7 ? 4 : 0) + b(55.5, 14, 1.4) + b(57.7, 38, 1.5); };
const windAt = t => { const r = t - 55.6; return r > 0 ? .055 * Math.exp(-r * .9) * (.62 + .38 * Math.cos(r * 7)) + (t > 57.7 ? .035 * Math.exp(-(t - 57.7) * 1.1) * (.7 + .3 * Math.cos((t - 57.7) * 9)) : 0) : 0; };

function layer(img, p, ox, oy, shear) {
  const ex = AX + (cam.x - AX) * p, ey = AY + (cam.y - AY) * p, z = cam.z; ST(z, 0, 0, z, W / 2 - ex * z, H / 2 - ey * z); ctx.drawImage(img, ox || 0, oy || 0);
  if (shear) for (const sd of [-1, 1]) { ctx.save(); ctx.beginPath(); ctx.rect(sd < 0 ? -600 : RX, -600, sd < 0 ? RX + 600 : WW, WH + 1200); ctx.clip(); ctx.transform(1, 0, -sd * shear, 1, sd * shear * GY, 0); ctx.drawImage(img, ox || 0, oy || 0); ctx.restore(); }
  ST(1, 0, 0, 1, 0, 0);
}
function softLayer(img, p) { const ex = AX + (cam.x - AX) * p, ey = AY + (cam.y - AY) * p, z = cam.z; ST(z * 5, 0, 0, z * 5, W / 2 - ex * z, H / 2 - ey * z); ctx.drawImage(img, 0, 0); ST(1, 0, 0, 1, 0, 0); }
function mistBand(p, y0, h, a, speed, t) {
  if (a <= .01) return; const ex = AX + (cam.x - AX) * p, ey = AY + (cam.y - AY) * p, z = cam.z, wd = 3400; ST(z, 0, 0, z, W / 2 - ex * z, H / 2 - ey * z); ctx.globalAlpha = Math.min(1, a);
  const off = ((t * speed) % wd + wd) % wd; for (let x = -wd + off - 400; x < WW + 400; x += wd) ctx.drawImage(BG.mist, x, y0, wd, h); ctx.globalAlpha = 1; ST(1, 0, 0, 1, 0, 0);
}
function rays(a, t, p, k0, k1) { ctx.globalCompositeOperation = 'screen'; for (let k = k0; k < k1; k++) { const ex = AX + (cam.x - AX) * p, ey = AY + (cam.y - AY) * p, z = cam.z; ST(z * 8, 0, 0, z * 8, W / 2 - ex * z, H / 2 - ey * z); ctx.globalAlpha = clamp(a * (.6 + .25 * Math.sin(t * .45 + k * 2.1)), 0, 1); ctx.drawImage(BG.rays[k], 0, 0); } ST(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
function sglow(x, y, r, col, a, sy) { glow(sg, x / 8, y / 8, Math.max(1, r / 8), col, a, sy); }
function poseSeed(p) { let s = 0; for (const k in p) { const v = p[k]; s += typeof v === 'number' ? v * 131 : v[0] * 17.3 + v[1] * 7.7; } return Math.abs(Math.round(s * 3)) % 9973; }
const grainC = []; function mkGrain() { for (let k = 0; k < 4; k++) { const c = mkCanvas(480, 260), g = c.getContext('2d'), d = g.createImageData(480, 260), R = rng(k + 5); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (R() - .5) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); grainC.push(c); } }
function finish(f, sun, fade) {
  // diffusion glow, colour unification, film grain
  ctx.globalCompositeOperation = 'screen'; ctx.drawImage(soft, 0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light'; let g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, `rgba(255,214,130,${.36 * sun})`); g.addColorStop(.55, 'rgba(255,220,160,0)'); g.addColorStop(1, 'rgba(40,70,130,.26)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .075; ctx.drawImage(grainC[f & 3], 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  g = ctx.createRadialGradient(W / 2, H / 2, H * .55, W / 2, H / 2, H * 1.12); g.addColorStop(0, 'rgba(20,20,40,0)'); g.addColorStop(1, 'rgba(20,20,40,.34)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (fade > 0) { ctx.fillStyle = `rgba(8,8,12,${fade})`; ctx.fillRect(0, 0, W, H); }
}
function ambientLeaves(t, sun, n, sunny) {
  for (let i = 0; i < n; i++) { const sp = 46 + hash(i * 3) * 50, per = 1900 / sp, u = ((t + hash(i) * per) % per), x = 300 + hash(i * 7) * 2000 + Math.sin(u * 1.2 + i) * 70 + u * 14, y = 250 + u * sp + Math.cos(u * 1.2 + i) * 18; if (y > GY + 20) continue; const s = SCR(x, y); drawLeaf(ctx, s[0], s[1], (5 + hash(i * 11) * 5) * cam.z, u * 1.5 + i, Math.floor(u * 6) + i, i % 3 === 0, sunny && sun > .5); }
}
function motes(t, sun) { for (let i = 0; i < 46; i++) { const x = 700 + hash(i * 5) * 1200 + Math.sin(t * .22 + i) * 60, y = 500 + hash(i * 9) * 1650 + Math.cos(t * .17 + i * 2) * 50 - t * 3 % 80, s = SCR(x, y), tw = .5 + .5 * Math.sin(t * 1.4 + i * 3); sglow(s[0], s[1], (7 + hash(i) * 8) * cam.z, [255, 246, 200], sun * tw * .8); } }

function drawForest(t, f, id, u) {
  const tq = qt(f), pose = poseAt(tq), F = rig(pose), sun = sunAt(t), sh = shakeAt(t);
  // ── camera
  let cx, cy, z, fg = true;
  if (id === 'A') { z = .8; cx = 1300; cy = lerp(665, 1650, sstep((u - 1.4) / 6.2)); }
  else if (id === 'B') { z = lerp(2.25, 2.45, u / 11.5); cx = lerp(1150, 1172, u / 11.5); cy = lerp(1438, 1428, u / 11.5); fg = false; }
  else if (id === 'C') { const c = FW_(F.torso, [F.torso.L * .68, -14]); z = lerp(2.5, 2.85, sstep(u / 4.5)); cx = c[0] - 20; cy = c[1] - 10; fg = false; }
  else if (id === 'D') { z = lerp(2.7, 2.6, u / 5.5); cx = 1178; cy = lerp(1424, 1412, sstep((u - 2) / 3)); fg = false; }
  else if (id === 'E') { z = .8; cx = 1300; cy = lerp(1010, 960, u / 4); }
  else if (id === 'F') { z = .9; cx = 1330; const hy = F.J('hd')[1]; cy = clamp(lerp(1640, hy + 330, ramp(t, 35.5, 39)), 1150, 1640); cy = Math.min(1640, tr(t, [[34, 1640], [36.5, 1640], [40.3, 1600], [44.2, 1510], [47.4, 1360], [48.5, 1340]])); }
  else if (id === 'G') { z = lerp(2.0, 2.2, sstep(u / 5)); cx = 1345; cy = lerp(1160, 1085, sstep((u - .8) / 3)); fg = false; }
  else { z = .8; cx = 1300; cy = lerp(1560, 1360, sstep((t - 57.75) / 1.4)); }
  cam.z = z; cam.x = cx + (hash(f * 2) - .5) * 2 * sh / z; cam.y = cy + (hash(f * 2 + 1) - .5) * 2 * sh / z;
  const S = { eye: eyeAt(t), lid: lidAt(t), chest: chestAt(t), shed: shedAt(t), sway: 0 }, wind = windAt(t);
  const mistA = lerp(1, .78, ramp(t, 20, 40)) * lerp(1, .22, ramp(t, 55.7, 56.9)), close = z > 1.5;
  ST(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W / 8, H / 8);
  if (close) { softLayer(BG.L0b, .8); } else layer(BG.L0, .8, 0, 0, wind * .3); mistBand(.84, 1150, 1050, .75 * mistA, 5, t); mistBand(.84, 420, 760, .32 * mistA, -4, t);
  if (close) softLayer(BG.L1b, .9); else layer(BG.L1, .9, 0, 0, wind * .6); mistBand(.95, 1420, 800, .62 * mistA, -9, t); rays(sun * .85, t, .92, 0, 2);
  layer(BG.L2, 1, 0, 0, wind);
  drawFlock(ctx);
  // pod exhaust behind the body
  const ign = ramp(t, 55.5, 55.62), up = t > 57.7;
  if (ign > 0 && F.root[1] > -900) for (const s of ['L', 'R']) { const b = SCR(...FW_(F['pod' + s], [0, 60])); flame(ctx, b[0], b[1], (up ? 1100 : Math.min(F.root[1] - FW_(F['pod' + s], [0, 60])[1] + 20, 620)) * z, 150 * z, Math.PI / 2 + (s === 'L' ? .06 : -.06), f * 7 + (s === 'L' ? 1 : 50)); }
  drawPuffs(ctx, 0, f);
  if (F.root[1] > GY - 600) { const k = 1 - (GY - F.root[1]) / 600, hw = (F.J('anR')[0] - F.J('wrL')[0]) * .5 + 150, mx = (F.J('anR')[0] + F.J('wrL')[0]) * .5 + 40, a = SCR(mx, GY + 34); ctx.fillStyle = `rgba(22,44,46,${.36 * k})`; ctx.beginPath(); ctx.ellipse(a[0], a[1], hw * z, 44 * z, 0, 0, TAU); ctx.fill(); }
  // ── the giant
  CEL.lw = 2.1 + z * .85; CEL.amp = .75 + z * .4; CEL.seed = poseSeed(pose);
  const litY = litYAt(t), hero = birdState(t, F);
  if (F.root[1] > -1400) {
    if (t < 34) { setPal(lerp(.08, .3, sun)); drawRobot(ctx, F, S); drawVines(ctx); if (hero) drawBird(ctx, hero, false); }
    if (t >= 12.9) {
      ctx.save();
      if (t < 34) { const a = SCR(1268 - 3000, litY + 1400), b = SCR(1268 + 3000, litY - 1400); cel(ctx, [a, b, [b[0], -3000], [a[0], -3000]], { fill: null, lw: 0, seed: 3 }); ctx.beginPath(); const pl = wobble(dense([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], false, 40), 12, 5, 160); ctx.moveTo(pl[0][0], pl[0][1]); for (const p of pl) ctx.lineTo(p[0], p[1]); ctx.lineTo(b[0], -4000); ctx.lineTo(a[0], -4000); ctx.clip(); }
      setPal(1); drawRobot(ctx, F, S); drawVines(ctx); if (hero) drawBird(ctx, hero, true); ctx.restore();
    }
  }
  setPal(sun > .5 ? 1 : .3);
  if (!close || id === 'C') drawTufts(ctx, tq, sun);
  drawParts(ctx, sun > .5); drawPuffs(ctx, 1, f);
  // foot flames & ground wash
  if (ign > 0 && F.root[1] > -900) {
    for (const s of ['L', 'R']) { const b = SCR(...FW_(F['ft' + s], [0, 70])); if (up) flame(ctx, b[0], b[1], 900 * z, 190 * z, Math.PI / 2, f * 13 + (s === 'L' ? 3 : 60)); else for (const d of [-1, 1]) flame(ctx, b[0] + d * 60 * z, b[1] - 6 * z, (260 + 200 * hash(f + d)) * z * ign, 70 * z, d > 0 ? -.06 : Math.PI + .06, f * 11 + d * 5 + (s === 'L' ? 0 : 30)); }
    const c = SCR(RX, GY - 200); sglow(c[0], c[1], 900 * z, [255, 214, 130], .75 * ign); sglow(c[0], c[1] + 190 * z, 1500 * z, [255, 190, 110], .6 * ign, .3);
  }
  if (up) { const c = SCR(RX, Math.max(F.root[1] - 300, cam.y - 900)); const g0 = SCR(RX, GY); const w = 190 * z * Math.exp(-(t - 57.7) * .9); sg.fillStyle = 'rgba(255,246,214,.95)'; sg.beginPath(); sg.moveTo((c[0] - w * .5) / 8, -8); sg.lineTo((c[0] + w * .5) / 8, -8); sg.lineTo((g0[0] + w * 1.5) / 8, g0[1] / 8); sg.lineTo((g0[0] - w * 1.5) / 8, g0[1] / 8); sg.fill(); for (let i = 0; i < 14; i++) { const lx = g0[0] + (hash(i * 3 + f) - .5) * w * 2.6, ly = hash(i * 7 + f) * H; cel(ctx, [[lx, ly], [lx + (hash(i) - .5) * 6, ly + 90 + hash(i + f) * 200]], { closed: false, lw: .7, line: 'rgba(255,252,230,.85)', seed: i }); } sglow(g0[0], g0[1] - 500 * z, 1300 * z, [255, 226, 160], .8 * Math.exp(-(t - 57.7) * .8), 1.6); }
  // wind ring racing over the forest floor
  const rT = t - 55.6; if (rT > 0 && rT < 2.6) { const rad = 2700 * easeOut(rT / 2.3), a0 = 1 - ramp(rT, 1.2, 2.5); for (let i = 0; i < 46; i++) { const a = i / 46 * TAU + hash(i) * .1, rr = rad * (.94 + hash(i * 3) * .12), x = RX + Math.cos(a) * rr, y = GY + 14 + Math.sin(a) * rr * .13, s = SCR(x, y); drawPuff(ctx, s[0], s[1], (40 + rad * .045 + hash(i * 5) * 40) * z, i * 3 + (f >> 1), a0 * .9, DUST[i % 4 === 0 ? 1 : 0]); }
    for (let i = 0; i < 26; i++) { const a = hash(i * 9 + (f >> 1)) * TAU, r1 = rad * (.55 + hash(i * 3 + (f >> 1)) * .4), pts = []; for (let k = 0; k < 5; k++) { const aa = a + k * .05; pts.push(SCR(RX + Math.cos(aa) * r1, GY - 20 - hash(i) * 500 * (rad / 2700) + Math.sin(aa) * r1 * .13)); } cel(ctx, pts, { closed: false, lw: .6, line: `rgba(255,250,226,${.8 * a0})`, seed: i }); } }
  mistBand(1.03, 1760, 560, .5 * mistA, 13, t);
  rays(sun * .7, t, 1, 2, 3);
  ambientLeaves(t, sun, close ? 5 : 9, true);
  if (fg) layer(BG.FG, 1.16, BG.FGo[0], BG.FGo[1], wind * 1.5);
  // ── light effects on the soft layer
  motes(t, sun);
  if (F.eyes && S.eye > 0) for (const e of F.eyes) { const s = SCR(e[0], e[1]); sglow(s[0], s[1], 64 * z * (.6 + S.eye * .5), [255, 196, 100], S.eye * .9); }
  if (S.chest > 0 && F.chestW) { const s = SCR(F.chestW[0], F.chestW[1]); sglow(s[0], s[1], 190 * z * (.5 + S.chest * .6), [255, 180, 90], S.chest * .8); }
  if (t > 12.9 && t < 34 && close) { const a = ramp(t, 12.9, 15) * .5, hd = F.J('hd'), d = [.4, .917], n = [-.917, .4], p0 = [hd[0] - d[0] * 1500, hd[1] - d[1] * 1500], p1 = [hd[0] + d[0] * (litY - 1400) * 1.2, hd[1] + d[1] * (litY - 1400) * 1.2]; const q = (p, w) => { const s = SCR(p[0] + n[0] * w, p[1] + n[1] * w); return [s[0] / 8, s[1] / 8]; }; const A = q(p0, -160), B = q(p0, 200), C = q(p1, 240), Dd = q(p1, -200); const gr = sg.createLinearGradient(A[0], A[1], Dd[0], Dd[1]); gr.addColorStop(0, `rgba(255,240,190,${a})`); gr.addColorStop(.8, `rgba(255,240,190,${a * .7})`); gr.addColorStop(1, 'rgba(255,240,190,0)'); sg.fillStyle = gr; sg.beginPath(); sg.moveTo(A[0], A[1]); sg.lineTo(B[0], B[1]); sg.lineTo(C[0], C[1]); sg.lineTo(Dd[0], Dd[1]); sg.fill(); }
  { const s = SCR(GAPX - 100, 120); sglow(s[0], s[1], 1100 * z, [255, 240, 190], .5 * sun); }
  const fl = t - 55.5; if (fl > 0 && fl < .25) { sg.fillStyle = `rgba(255,250,224,${.8 * (1 - fl / .25)})`; sg.fillRect(0, 0, W / 8, H / 8); }
  const fl2 = t - 57.7; if (fl2 > 0 && fl2 < .4) { sg.fillStyle = `rgba(255,252,236,${.95 * (1 - fl2 / .4)})`; sg.fillRect(0, 0, W / 8, H / 8); }
  finish(f, sun, t < 1.6 ? 1 - t / 1.6 : 0);
}

// ── final shot: above the canopy
const BURST = [1120, 2340];
const SKYP = (function () { const o = []; let x = BURST[0], y = BURST[1]; for (let i = 0; i < 800; i++) { const s = i * .02, ph = -.18 * Math.sin(Math.min(s, 2.2) / 2.2 * Math.PI) + 1.45 * sstep((s - .5) / 5.5), v = 1560 * Math.exp(-s * .95) + 30; o.push([x, y]); x += Math.sin(ph) * v * .02; y -= Math.cos(ph) * v * .02; } return o; })();
function skyPath(s) { const q = clamp(s / .02, 0, 798), i = q | 0, u = q - i; return { x: lerp(SKYP[i][0], SKYP[i + 1][0], u), y: lerp(SKYP[i][1], SKYP[i + 1][1], u), sc: 1 / (1 + s * .9) }; }
const TRAILC = ['rgb(255,253,238)', 'rgb(255,224,166)', 'rgb(236,176,124)'];
function drawSky(t, f, u) {
  const s = u - .9, camY = 2080 - 1100 * sstep((u - 1.25) / 5.2), top = camY - H / 2, f2 = f >> 1, sh = (s > 0 ? 16 * Math.exp(-s * 1.4) : 1.2 * ramp(u, 0, .9)), jx = (hash(f * 2) - .5) * 2 * sh, jy = (hash(f * 2 + 1) - .5) * 2 * sh;
  ST(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W / 8, H / 8);
  cam.x = W / 2; cam.y = camY; cam.z = 1; CEL.lw = 2.4; CEL.amp = .9; CEL.seed = 5;
  ctx.drawImage(BG.sky, jx * .3, -top + jy * .3);
  const Y = y => y - top;
  // distant startled birds
  ctx.fillStyle = 'rgb(86,84,96)'; if (s > .1) for (let i = 0; i < 26; i++) { const a = s - .1 - hash(i) * .5; if (a < 0) continue; const dir = hash(i * 3) < .5 ? -1 : 1, x = BURST[0] + dir * (60 + hash(i * 7) * 500) + dir * a * (60 + hash(i * 5) * 90), y = Y(2290 - hash(i * 11) * 60 - a * (50 + hash(i * 13) * 60) - Math.sin(a * 2 + i) * 14), z = 4 + hash(i * 17) * 4, w = [-1, .1, .9, .1][(f2 + i) & 3]; ctx.beginPath(); ctx.moveTo(x - z * 1.6, y + w * z * 1.4); ctx.quadraticCurveTo(x - z * .5, y - z * .3, x, y); ctx.quadraticCurveTo(x + z * .5, y - z * .3, x + z * 1.6, y + w * z * 1.4); ctx.lineTo(x, y + z * .6); ctx.fill(); }
  if (s > 0) {
    // mist & light trail (far → near)
    const s0 = Math.max(0, Math.min(s, 9)); const fade = 1 - ramp(u, 9.5, 13) * .55;
    for (let q = Math.floor(s0 / .07); q >= 0; q--) { const sp = q * .07, p = skyPath(sp), age = s - sp, k = .22 + .78 * p.sc, r = (12 + 50 * Math.sqrt(age)) * k * (.55 + hash(q) * .8), x = p.x + (hash(q * 3) - .5) * 44 * k * (1 + age * .25) + age * 7 * (1 - p.sc), y = p.y + (hash(q * 7) - .5) * 44 * k * (1 + age * .2); if (Y(y) < -200 || Y(y) > H + 200) continue; drawPuff(ctx, x, Y(y), r, q * 5 + ((f2 >> 1) % 3), clamp(1.1 - age / 10, 0, 1) * .9 * fade * (age < .12 ? age / .12 : 1), TRAILC); }
    const core = []; for (let sp = Math.max(0, s - 2.2); sp <= s; sp += .04) { const p = skyPath(sp); core.push([p.x, Y(p.y)]); }
    if (core.length > 2 && s < 9) { const p = skyPath(s), a = 1 - ramp(s, 6.5, 9); ink(ctx, wobble(core, f2, 1.2, 30), (20 * p.sc + 2.5), `rgba(255,236,170,${a})`, f2, false, 400); ink(ctx, wobble(core, f2, 1.2, 30), (9 * p.sc + 1.2), `rgba(255,255,240,${a})`, f2, false, 300); for (let i = 0; i < core.length; i += 6) sglow(core[i][0], core[i][1], 60 * p.sc + 14, [255, 226, 150], .25 * a * i / core.length); }
    // burst plume at the canopy
    for (let i = 0; i < 16; i++) { const a = hash(i) * Math.PI, d = (150 + hash(i * 3) * 330) * (1 - Math.exp(-s * 1.6)), x = BURST[0] + Math.cos(a) * d * 1.5, y = BURST[1] - 30 - Math.sin(a) * d * .7 - s * 12; drawPuff(ctx, x, Y(y), (44 + hash(i * 7) * 50) * (1 + s * .22), i * 9 + ((f2 >> 1) % 2), clamp(1 - s / 4.6, 0, 1) * .92, TRAILC); }
    // the giant itself, on model, climbing away
    const p = skyPath(s), pn = skyPath(s + .03), ang = Math.atan2(pn.y - p.y, pn.x - p.x) + Math.PI / 2;
    if (p.sc > .16) { const zr = .2 * p.sc, pose = poseAt(57.9); pose.root = [RX, GY]; pose.stretch = 1.12; const F = rig(pose);
      ctx.save(); ctx.translate(p.x, Y(p.y)); ctx.rotate(ang); flame(ctx, 0, 520 * zr, 1700 * zr, 640 * zr, Math.PI / 2, f * 5); ctx.translate(-W / 2, -H / 2); cam.x = RX; cam.y = GY - 600; cam.z = zr; CEL.lw = .9 + zr * 9; CEL.amp = .3; CEL.seed = f2; setPal(1); drawRobot(ctx, F, { eye: 1, lid: 1, chest: 1, shed: .9 }); ctx.restore(); cam.x = W / 2; cam.y = camY; cam.z = 1; CEL.lw = 2.4; CEL.amp = .9; }
    const tw = s > 2.6 ? (1 - ramp(s, 8.2, 10)) : 0; if (tw > 0) { const r = (16 + 12 * hash(f2)) * (.5 + p.sc * 2) * tw, x = p.x, y = Y(p.y); ctx.fillStyle = 'rgb(255,254,240)'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2, rr = i % 2 ? r * .16 : r * (i % 4 ? .6 : 1); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.fill(); sglow(x, y, r * 3.2, [255, 240, 190], .9 * tw); }
    sglow(p.x, Y(p.y), 300 * p.sc + 30, [255, 220, 140], .8 * (1 - ramp(s, 6, 9)));
    if (s < .35) { sg.fillStyle = `rgba(255,250,226,${.9 * (1 - s / .35)})`; sg.fillRect(0, 0, W / 8, H / 8); }
  } else sglow(BURST[0], Y(BURST[1] - 20), 200 + u * 420, [255, 232, 160], .25 + u * .6, .5);
  ctx.drawImage(BG.skyFG, jx, -top + jy);
  // leaves flung up from the canopy
  if (s > 0) for (let i = 0; i < 110; i++) { const a = -Math.PI * (.08 + hash(i) * .84), v = 500 + hash(i * 3) * 1500, e = (1 - Math.exp(-s * 1.5)) / 1.5, x = BURST[0] + Math.cos(a) * v * e * 1.2 + Math.sin(s * 2 + i) * 30 * s - s * 30, y = BURST[1] + Math.sin(a) * v * e + 46 * Math.pow(s, 1.5) * (.6 + hash(i * 5)); if (Y(y) > H + 30 || Y(y) < -30) continue; drawLeaf(ctx, x, Y(y), 5 + hash(i * 7) * 9, s * 3 + i, Math.floor(s * 9) + i, i % 3 === 0, true); }
  // big sunlit leaves swirling down past the lens
  CEL.lw = 2.8; for (let i = 0; i < 20; i++) { const a = u - (1.9 + hash(i * 3) * 6.5); if (a < 0) continue; const sp = 150 + hash(i * 5) * 150, ph = hash(i * 7) * 6, x = hash(i * 11) * (W + 500) - 100 + Math.sin(a * 1.7 + ph) * (90 + hash(i) * 110) - a * 46, y = -90 + a * sp + Math.cos(a * 1.7 + ph) * 46 + (camY - 2080) * -.0 + ramp(u, 1.2, 6.6) * 0; if (y > H + 100) continue; drawLeaf(ctx, x, y, 24 + hash(i * 13) * 34, a * 2.1 + ph, Math.floor(a * 8) + i, i % 2 === 0, true); }
  sglow(BG.sun[0], Y(BG.sun[1]), 1200, [255, 226, 150], .55); sglow(0, H, 900, [255, 214, 140], .3);
  finish(f, 1, u > 11.4 ? ramp(u, 11.4, 13) : 0);
}

function render(t) {
  t = clamp(t, 0, END); const f = Math.floor(t * FPS + 1e-6); let sh = SHOTS[0]; for (const s of SHOTS) if (s[0] <= f / FPS + 1e-9) sh = s;
  const tf = f / FPS;
  if (sh[1] === 'I') drawSky(tf, f, tf - sh[0]); else { simTo(f); drawForest(tf, f, sh[1], tf - sh[0]); }
}

// ───────────────────────── sound (synthesised) ─────────────────────────
let AC = null, OUT = null, NB = null, nodes = [];
function env(g, when, pts) { g.setValueAtTime(pts[0][1], when + pts[0][0]); for (let i = 1; i < pts.length; i++) g.linearRampToValueAtTime(pts[i][1], when + pts[i][0]); }
function nz(w, dur, type, f0, f1, q, pts) { const s = AC.createBufferSource(); s.buffer = NB; s.loop = true; const fl = AC.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, w); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), w + dur); const g = AC.createGain(); env(g.gain, w, pts); s.connect(fl).connect(g).connect(OUT); s.start(w); s.stop(w + dur + .1); nodes.push(s); return fl; }
function tone(w, dur, type, f0, f1, pts, lp) { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, w); o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), w + dur); const g = AC.createGain(); env(g.gain, w, pts); let n = o; if (lp) { const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; n = o.connect(fl); } n.connect(g).connect(OUT); o.start(w); o.stop(w + dur + .1); nodes.push(o); return o; }
function chirp(w, base, vol, n) { for (let i = 0; i < n; i++) tone(w + i * .085, .07, 'sine', base * (1.25 + .1 * (i % 2)), base * (.9 + .05 * i), [[0, 0], [.012, vol], [.07, 0]]); }
function groan(w, dur, f, vol) { const o = tone(w, dur, 'sawtooth', f, f * .82, [[0, 0], [dur * .25, vol], [dur * .8, vol * .8], [dur, 0]], 260); const R = rng(w * 100 | 0); for (let x = .2; x < dur; x += .25 + R() * .5) o.frequency.linearRampToValueAtTime(f * (.82 + R() * .36), w + x); for (let x = .1; x < dur - .4; x += .5 + R() * .9) { const cf = 260 + R() * 520, d = .18 + R() * .4; const c = AC.createOscillator(); c.type = 'sawtooth'; c.frequency.setValueAtTime(cf, w + x); c.frequency.linearRampToValueAtTime(cf * (1.15 + R() * .5), w + x + d * .5); c.frequency.linearRampToValueAtTime(cf * (.8 + R() * .3), w + x + d); const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = cf * 1.5; bp.Q.value = 9; const g = AC.createGain(); env(g.gain, w + x, [[0, 0], [d * .3, vol * .28], [d, 0]]); c.connect(bp).connect(g).connect(OUT); c.start(w + x); c.stop(w + x + d + .05); nodes.push(c); } }
function thud(w, vol) { tone(w, .9, 'sine', 70, 26, [[0, 0], [.02, vol], [.9, 0]]); nz(w, .7, 'lowpass', 400, 80, 1, [[0, 0], [.02, vol * .6], [.7, 0]]); }
function audioSchedule(t0) {
  for (const n of nodes) { try { n.stop(); } catch (e) { } } nodes = []; const now = AC.currentTime + .06, R = rng(11);
  const at = (t, fn) => { if (t >= t0 - .01) fn(now + t - t0); };
  at(0, w => { nz(w, 59, 'lowpass', 420, 520, .5, [[0, 0], [3, .05], [50, .06], [59, .02]]); nz(w, 59, 'highpass', 5000, 6000, .5, [[0, 0], [4, .006], [59, .004]]); });
  for (const [t, b] of [[1.6, 3200], [3.3, 4100], [4.4, 2800], [6.4, 3600], [7.8, 4400], [9.6, 3000], [16.4, 3500], [18.7, 4200], [23, 2900], [27.2, 3900]]) at(t, w => chirp(w, b, .018, 2 + (b % 3)));
  for (let i = 0; i < 7; i++) at(10.6 + i * .095, w => nz(w, .06, 'bandpass', 1400, 900, 2, [[0, 0], [.015, .05], [.06, 0]]));
  at(14.3, w => chirp(w, 3900, .06, 3)); at(14.8, w => chirp(w, 4200, .06, 4)); at(27.95, w => chirp(w, 3600, .045, 1));
  at(13, w => { for (const [fq, v] of [[880, .012], [1318, .008], [1760, .005]]) tone(w, 8, 'sine', fq, fq, [[0, 0], [3, v], [6, v * .6], [8, 0]]); });
  for (const t of [21.2, 21.9, 22.5]) at(t, w => { nz(w, .08, 'bandpass', 2400, 1200, 4, [[0, 0], [.005, .09], [.08, 0]]); tone(w, .5, 'sine', 62, 48, [[0, 0], [.02, .22], [.5, 0]]); });
  at(22.5, w => { tone(w, 35.2, 'sine', 55, 55, [[0, 0], [2, .07], [33, .09], [35.2, .0]]); tone(w, 35.2, 'triangle', 110.4, 110.4, [[0, 0], [2, .02], [33, .03], [35.2, 0]]); });
  for (const [t, fq] of [[25.3, 1180], [25.7, 1320], [26.2, 1480]]) at(t, w => tone(w, .5, 'sine', fq, fq * .98, [[0, 0], [.01, .04], [.5, 0]]));
  at(29.3, w => nz(w, 28.4, 'lowpass', 70, 110, 1, [[0, 0], [.8, .45], [4.5, .3], [10, .36], [18, .3], [26, .5], [28.4, .8]]));
  at(29.8, w => { for (let i = 0; i < 5; i++) nz(w + i * .08, .06, 'bandpass', 1500, 1000, 2, [[0, 0], [.015, .05], [.06, 0]]); chirp(w, 4300, .05, 3); });
  at(30.5, w => { for (let i = 0; i < 60; i++) { const x = R() * 2.6; nz(w + x, .07, 'bandpass', 900 + R() * 1800, 800, 2, [[0, 0], [.02, .035], [.07, 0]]); } for (let i = 0; i < 16; i++) chirp(w + R() * 2.4, 2600 + R() * 2200, .022, 2); });
  at(34.2, w => groan(w, 1.8, 58, .16)); at(36.5, w => groan(w, 3.4, 49, .2)); at(40.4, w => groan(w, 4, 44, .22)); at(44.9, w => groan(w, 2.8, 52, .2)); at(54, w => groan(w, 1.5, 60, .12));
  at(34, w => nz(w, 14.4, 'highpass', 2600, 3200, .7, [[0, 0], [.6, .02], [6, .028], [13, .02], [14.4, 0]]));
  at(40.4, w => thud(w, .5)); at(44.2, w => thud(w, .55)); at(47.35, w => thud(w, .7));
  const pad = (w, dur, vol) => { for (const [fq, v] of [[146.8, 1], [220, .7], [293.7, .5], [370, .5], [440, .35], [659.3, .22]]) { tone(w, dur, 'sine', fq, fq, [[0, 0], [dur * .35, vol * v], [dur * .75, vol * v], [dur, 0]]); tone(w, dur, 'triangle', fq * 1.003, fq * 1.003, [[0, 0], [dur * .4, vol * v * .3], [dur, 0]]); } };
  at(48.6, w => pad(w, 7, .035));
  at(55.5, w => { tone(w, 2.3, 'sawtooth', 38, 190, [[0, 0], [.1, .12], [2.2, .22], [2.3, 0]], 900); nz(w, 2.3, 'bandpass', 300, 2600, 1.2, [[0, 0], [.08, .35], [.6, .2], [2.2, .42], [2.3, .3]]); nz(w + .05, 2.2, 'bandpass', 1400, 180, .8, [[0, 0], [.15, .5], [2.2, 0]]); thud(w, .6); });
  at(55.7, w => { for (let i = 0; i < 20; i++) chirp(w + R() * 1.5, 2600 + R() * 2000, .014, 2); });
  at(57.7, w => { tone(w, 2.2, 'sine', 90, 24, [[0, 0], [.03, .9], [2.2, 0]]); nz(w, 4.2, 'lowpass', 5000, 160, .7, [[0, 0], [.03, .9], [1.8, .5], [4.2, .0]]); tone(w, 1.6, 'sawtooth', 200, 900, [[0, 0], [.05, .12], [1.6, 0]], 1800); });
  at(59.5, w => { nz(w, 13, 'lowpass', 500, 300, .5, [[0, .1], [.9, .16], [13, .02]]); nz(w, 13, 'highpass', 4000, 5000, .5, [[0, 0], [2, .008], [13, 0]]); pad(w + .6, 12.4, .06); });
  at(60.4, w => { thud(w, .7); nz(w, 5, 'bandpass', 1800, 160, .8, [[0, 0], [.04, .7], [1.2, .35], [5, 0]]); tone(w, 6, 'sawtooth', 160, 60, [[0, 0], [.05, .1], [6, 0]], 500); });
  at(63.2, w => { for (const fq of [1760, 2637, 3520]) tone(w, 3, 'sine', fq, fq, [[0, 0], [.02, .022], [3, 0]]); });
}

// ───────────────────────── player ─────────────────────────
let playing = false, T0 = 0, base = 0, lastF = -1, muted = false, slow = 0;
const ui = document.getElementById('ui'), btn = document.getElementById('go'), msg = document.getElementById('msg'), bar = document.getElementById('bar');
function nowT() { return playing ? base + (AC ? AC.currentTime - T0 : (performance.now() / 1000 - T0)) : base; }
function loop() {
  requestAnimationFrame(loop); if (!playing) return; const t = nowT(), f = Math.floor(t * FPS);
  if (t >= END) { playing = false; base = 0; ui.style.display = 'flex'; btn.textContent = '↻  다시 보기'; return; }
  if (f !== lastF) { if (lastF >= 0 && f - lastF > 1 && f - lastF < 12) slow += f - lastF - 1; else slow = Math.max(0, slow - .25); if (slow > 30 && RS > .5) { setRS(RS > .8 ? .8 : RS > .66 ? .66 : .5); slow = 0; } lastF = f; render(t); bar.style.width = (t / END * 100) + '%'; }
}
function play(from) {
  base = from || 0; simReset(); lastF = -1;
  try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); OUT = AC.createGain(); const cmp = AC.createDynamicsCompressor(); OUT.connect(cmp).connect(AC.destination); NB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } AC.resume(); OUT.gain.value = muted ? 0 : .9; audioSchedule(base); T0 = AC.currentTime + .06; } catch (e) { AC = null; T0 = performance.now() / 1000; }
  playing = true; ui.style.display = 'none';
}
btn.onclick = () => play(0);
addEventListener('keydown', e => {
  if (e.key === ' ') { e.preventDefault(); if (ui.style.display !== 'none') { play(0); return; } if (playing) { base = nowT(); playing = false; if (AC) AC.suspend(); } else { if (AC) { AC.resume(); audioSchedule(base); T0 = AC.currentTime + .06; } else T0 = performance.now() / 1000; playing = true; } }
  else if (e.key === 'm' || e.key === 'M') { muted = !muted; if (OUT) OUT.gain.value = muted ? 0 : .9; }
  else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => { }); }
  else if (e.key === 'r' || e.key === 'R') play(0);
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { play(clamp(nowT() + (e.key === 'ArrowRight' ? 5 : -5), 0, END - 1)); }
});
window.__render = t => { render(t); };
setTimeout(() => {
  paintForest(); paintSky(); mkGrain(); window.__bench = () => { simReset(); render(37); const a = performance.now(); for (let i = 1; i <= 5; i++) { render(37 + i / 24); ctx.getImageData(0, 0, 1, 1); } return (performance.now() - a) / 5; }; for (const k of ['L0', 'L1']) { const c = mkCanvas(WW / 5, WH / 5), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(BG[k], 0, 0, c.width, c.height); BG[k + 'b'] = c; } simReset(); setPal(.1); render(4.5);
  { const q = new URLSearchParams(location.search).get('rs'); if (q) setRS(+q); else { const ms = window.__bench(); if (ms > 38) setRS(clamp(Math.sqrt(34 / ms), .5, 1) < .8 ? (ms > 95 ? .5 : .66) : .8); } simReset(); render(4.5); }
  msg.style.display = 'none'; btn.style.display = 'inline-block';
  const q = new URLSearchParams(location.search).get('t'); if (q !== null) { ui.style.display = 'none'; render(+q); }
  window.__ready = true; loop();
}, 60);
