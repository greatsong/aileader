// ───────────────────────── effects animation: vines, debris, birds, dust, flame ─────────────────────────
// drawings are exposed on 3s while the giant strains upward, on 2s elsewhere, on 1s for the launch
function qt(f) { const t = f / FPS, st = (t >= 34 && t < 48.4) ? 3 : (t >= 57.4 && t < 59.5) ? 1 : 2; return Math.floor(f / st) * st / FPS; }
const SIM = { f: -1 };
const VINE_DEFS = [
  { k: 'faL', p: [110, 70], len: 250, g: [RX - 470, GY + 6] }, { k: 'pdL', p: [-110, 52], len: 190 }, { k: 'pdL', p: [120, 44], len: 130 }, { k: 'pdL', p: [148, 10], len: 640, g: [RX - 600, GY + 12] },
  { k: 'pdR', p: [118, 46], len: 230 }, { k: 'pdR', p: [-96, 54], len: 150 }, { k: 'pdR', p: [150, 8], len: 700, g: [RX + 640, GY + 8] }, { k: 'head', p: [-104, 44], len: 80 }, { k: 'head', p: [96, 50], len: 54 },
  { k: 'faR', p: [120, 80], len: 300, g: [RX + 330, GY + 4] }, { k: 'torso', p: [200, 190], len: 170 }, { k: 'podR', p: [50, -160], len: 200 }, { k: 'faL', p: [40, 62], len: 120 }];
function simReset() {
  SIM.f = -1; SIM.R = rng(99); SIM.parts = []; SIM.puffs = []; SIM.flock = []; SIM.prev = null; SIM.vines = null;
}
function initVines(F) {
  SIM.vines = VINE_DEFS.map(d => { const a = FW_(F[d.k], d.p), n = Math.max(5, Math.round(d.len / 26)), pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push(d.g ? { x: lerp(a[0], d.g[0], u), y: lerp(a[1], d.g[1], u) + Math.sin(u * Math.PI) * 30, px: 0, py: 0 } : { x: a[0] + Math.sin(i) * 3, y: a[1] + u * d.len, px: 0, py: 0 }); } for (const p of pts) { p.px = p.x; p.py = p.y; } return { d, pts, seg: d.len / n, pinned: !!d.g }; });
}
function spawn(type, x, y, vx, vy, size) { if (SIM.parts.length > 900) return; const R = SIM.R; SIM.parts.push({ type, x, y, vx, vy, size: size || 6, rot: R() * 6, vr: (R() - .5) * 8, age: 0, seed: R() * 1000 | 0, ground: GY + 4 + R() * 46 }); }
function puff(x, y, r, vx, vy, life, front, col) { if (SIM.puffs.length > 260) return; SIM.puffs.push({ x, y, r, vx, vy, age: 0, life, front, seed: SIM.R() * 1000 | 0, col: col || 0 }); }
function simStep(f) {
  const t = f / FPS, ones = t >= 57.4 && t < 59.5; if (!ones && f % 2) return; const dt = ones ? 1 / 24 : 1 / 12, R = SIM.R;
  const F = rig(poseAt(qt(f))); if (!SIM.vines) initVines(F);
  const ringT = t - 55.6, blast = ringT > 0 ? Math.exp(-ringT * 1.2) : 0, lift = t > 57.7;
  // vines
  for (const v of SIM.vines) {
    const a = FW_(F[v.d.k], v.d.p), P = v.pts, n = P.length - 1;
    for (let i = 1; i <= n; i++) { const p = P[i]; if (v.pinned && i === n) continue; const vx = (p.x - p.px) * .93, vy = (p.y - p.py) * .93; p.px = p.x; p.py = p.y; p.x += vx + (Math.sin(t * 1.7 + i + v.seg) * 6 + blast * (p.x < RX ? -2600 : 2600)) * dt * dt; p.y += vy + (lift ? 300 : 1500) * dt * dt; }
    P[0].x = a[0]; P[0].y = a[1];
    for (let it = 0; it < 8; it++) for (let i = 0; i < n; i++) { const p = P[i], q = P[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, e = (d - v.seg) / d * .5; const pa = i === 0, pb = v.pinned && i + 1 === n; if (pa && pb) continue; const wa = pa ? 0 : pb ? 1 : .5, wb = pb ? 0 : pa ? 1 : .5; p.x += dx * e * wa * 2; p.y += dy * e * wa * 2; q.x -= dx * e * wb * 2; q.y -= dy * e * wb * 2; }
    for (const p of P) if (p.y > GY + 14 && !lift) p.y = GY + 14;
    if (v.pinned && Math.hypot(P[n].x - a[0], P[n].y - a[1]) > v.d.len * 1.1) { v.pinned = false; for (let i = 0; i < 9; i++) spawn(i % 2 ? 'leaf' : 'clod', P[n].x + (R() - .5) * 60, P[n].y - R() * 30, (R() - .5) * 300, -200 - R() * 300, 5 + R() * 6); puff(P[n].x, GY, 26, 0, -20, 1.2, 1); }
  }
  // debris shaken loose from the armour
  const anchors = [['pdL', [-120, -40], [120, -110]], ['pdR', [-120, -110], [120, -40]], ['head', [-100, -60], [100, -100]], ['podL', [-50, -200], [50, -200]], ['podR', [-50, -200], [50, -200]], ['faL', [40, 80], [200, 80]], ['faR', [40, 80], [200, 80]], ['torso', [330, -210], [330, 210]], ['snR', [0, -70], [220, -90]], ['thL', [0, 60], [120, 60]]];
  const cur = anchors.map(a => FW_(F[a[0]], a[1]));
  if (SIM.prev && t > 33.8 && t < 58.4) {
    const pose = poseAt(qt(f)), trem = Math.abs(pose.nk[0] - poseAt(qt(f) - 1 / 12).nk[0]);
    anchors.forEach((a, i) => {
      const sp = Math.hypot(cur[i][0] - SIM.prev[i][0], cur[i][1] - SIM.prev[i][1]) / dt, rate = clamp(sp / 60 + trem * .25 + blast * 3, 0, 5) * (t < 48.6 ? 1 : .35) + (t > 55.6 && t < 57.7 ? .8 : 0);
      const n = Math.floor(rate * .8 + R() * .9);
      for (let k = 0; k < n; k++) { const u = R(), w = FW_(F[a[0]], [lerp(a[1][0], a[2][0], u), lerp(a[1][1], a[2][1], u)]), q = R(); const bx = blast * (w[0] < RX ? -1 : 1) * 700; spawn(q < .66 ? 'dust' : q < .78 ? 'clod' : q < .88 ? 'moss' : 'leaf', w[0], w[1], (R() - .5) * 90 + bx, -R() * 60, q < .66 ? 2 + R() * 2.5 : 3 + R() * 7); }
    });
    // heavy contacts
    if (Math.abs(t - 40.4) < .05 || Math.abs(t - 44.2) < .05) for (let i = 0; i < 10; i++) puff(RX + 120 + R() * 380, GY + 10 - R() * 20, 30 + R() * 30, (R() - .5) * 160, -30 - R() * 50, 1.6 + R(), R() < .6);
    if (Math.abs(t - 41.2) < .05) for (let i = 0; i < 6; i++) puff(RX - 400 + (R() - .5) * 160, GY + 10, 24 + R() * 22, (R() - .5) * 120, -30 - R() * 40, 1.4 + R(), 1);
    if (t > 40.4 && t < 44 && f % 6 === 0) puff(RX + 240 + R() * 200, GY + 8, 20 + R() * 20, 40 + R() * 40, -20, 1.2, 1);
  }
  SIM.prev = cur;
  // ignition & launch dust
  if (t >= 55.5 && t < 59.5) {
    const n = t < 57.7 ? 3 : 7; for (let i = 0; i < n; i++) { const dir = R() < .5 ? -1 : 1, sp = 300 + R() * 900 + (t > 57.7 ? 500 : 0); puff(RX + dir * (60 + R() * 200), GY + 10 - R() * 30, 40 + R() * 50, dir * sp, -40 - R() * (t > 57.7 ? 500 : 120), 1.1 + R() * 1.2, R() < .55, R() < .3 ? 1 : 0); }
    if (t < 58.6) for (let i = 0; i < 6; i++) { const a = R() * TAU; spawn('leaf', RX + Math.cos(a) * 500 * R(), GY - 30 - R() * 500, Math.cos(a) * (500 + R() * 900), -200 - R() * 700, 6 + R() * 8); }
  }
  // integrate particles
  for (const p of SIM.parts) {
    p.age += dt; if (p.type === 'leaf' || p.type === 'moss') { const k = p.type === 'leaf' ? 2.6 : 1.2; p.vx += (-p.vx * k + Math.sin(p.age * 5 + p.seed) * 160 + blast * (p.x < RX ? -900 : 900)) * dt; p.vy += ((p.type === 'leaf' ? 300 : 620) - p.vy * k) * dt; if (lift && t < 59.5) { p.vy -= 900 * dt * Math.exp(-Math.abs(p.x - RX) / 500); p.vx += (RX - p.x) * .6 * dt; } }
    else { p.vy += 640 * dt; p.vx *= .98; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.y > p.ground && p.vy > 0) { p.dead = true; if (p.type === 'clod' && p.size > 8 && R() < .5) puff(p.x, p.ground, 9 + R() * 8, (R() - .5) * 40, -14, .7, 1); }
  }
  SIM.parts = SIM.parts.filter(p => !p.dead && p.age < 9 && p.y > -400);
  for (const p of SIM.puffs) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.12, dt); p.vy *= Math.pow(.3, dt); p.r += (30 + p.r * .5) * dt; }
  SIM.puffs = SIM.puffs.filter(p => p.age < p.life);
  // flocks
  const burst = (n, far) => { for (let i = 0; i < n; i++) { const x = 150 + R() * 2300, top = Math.abs(x - GAPX) < 420 ? 780 : 480; SIM.flock.push({ x, y: top + R() * 300 - (far ? 100 : 0), vx: (R() - .5) * 260 + (x < GAPX ? 60 : -60), vy: -260 - R() * 260, s: far ? 7 + R() * 6 : 13 + R() * 15, ph: R() * 4 | 0, d: R() * 1.1, age: 0 }); } };
  if (f === Math.round(30.5 * FPS)) burst(70); if (f === Math.round(31.2 * FPS)) burst(40); if (f === Math.round(55.7 * FPS)) burst(26, 1);
  for (const b of SIM.flock) { b.age += dt; if (b.age < b.d) continue; b.vx += (GAPX - b.x) * .12 * dt + Math.sin(b.age * 3 + b.s) * 40 * dt; b.vy += (-150 - b.vy) * .6 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.ph++; }
  SIM.flock = SIM.flock.filter(b => b.y > -100);
}
function simTo(f) { if (f < SIM.f) simReset(); while (SIM.f < f) { SIM.f++; simStep(SIM.f); } }

// ── drawing
function leafPts(x, y, len, wid, ang) { const c = Math.cos(ang), s = Math.sin(ang), q = (a, b) => [x + a * c - b * s, y + a * s + b * c]; return [q(len / 2, 0).concat(1), q(len * .1, -wid / 2), q(-len / 2, 0).concat(1), q(-len * .05, wid / 2)]; }
function drawLeaf(ctx, sx, sy, size, rot, phase, lit, sunny) {
  const w = [1, .62, .16, .62][phase & 3], back = (phase & 3) >= 2;
  const col = sunny ? (back ? [150, 176, 70] : lit ? [226, 232, 120] : [182, 208, 92]) : (back ? [60, 104, 70] : [112, 158, 82]);
  cel(ctx, leafPts(sx, sy, size * 2, size * w, rot), { fill: rgb(col), lw: size > 7 ? .45 : .3, seed: phase, step: 5, line: 'rgb(54,74,44)' });
  if (size > 14 && w > .5) cel(ctx, [[sx - Math.cos(rot) * size * .8, sy - Math.sin(rot) * size * .8], [sx + Math.cos(rot) * size * .8, sy + Math.sin(rot) * size * .8]], { closed: false, lw: .3, seed: 2, line: 'rgb(84,112,52)' });
}
function drawVines(ctx) {
  if (!SIM.vines) return;
  for (let vi = 0; vi < SIM.vines.length; vi++) {
    const v = SIM.vines[vi], pts = v.pts.map(p => SCR(p.x, p.y));
    cel(ctx, pts, { closed: false, lw: 1.25, line: 'rgb(52,84,62)', seed: 300 + vi, taper: 0 });
    for (let i = 1; i < pts.length; i++) { const p = pts[i], q = pts[i - 1], a = Math.atan2(p[1] - q[1], p[0] - q[0]) + (i % 2 ? 1.1 : -1.1), s = 9 * cam.z; cel(ctx, leafPts(p[0] + Math.cos(a) * s, p[1] + Math.sin(a) * s, s * 2.1, s * .95, a), { fill: i % 3 ? PAL.moss.f : PAL.moss.s, lw: .35, seed: 400 + vi * 20 + i, step: 5 }); }
  }
}
function drawParts(ctx, sunny) {
  for (const p of SIM.parts) {
    const s = SCR(p.x, p.y), z = cam.z; if (s[0] < -50 || s[0] > W + 50 || s[1] < -50 || s[1] > H + 50) continue;
    if (p.type === 'dust') { ctx.fillStyle = p.seed % 2 ? 'rgba(96,84,66,.9)' : 'rgba(190,176,140,.9)'; ctx.fillRect(s[0], s[1], p.size * z * .8, p.size * z * (1 + Math.min(4, Math.abs(p.vy) / 160))); }
    else if (p.type === 'leaf') drawLeaf(ctx, s[0], s[1], p.size * z, p.rot, (p.age * 9 + p.seed) | 0, p.seed % 3 === 0, sunny);
    else cel(ctx, blob(s[0], s[1], p.size * z, p.size * z * .8, p.seed, 6, .4), { fill: p.type === 'moss' ? PAL.moss.f : 'rgb(92,74,60)', shade: p.type === 'moss' ? PAL.moss.s : 'rgb(62,52,50)', off: [-2 * z, -2 * z], lw: .4, seed: p.seed, step: 5 });
  }
}
function puffShape(x, y, r, seed, k) { const o = [], n = 8; for (let i = 0; i < n; i++) { const a = i / n * TAU + seed, d = TAU / n * .3, rr = 1 + (hash(seed * 7 + i) - .5) * .34; o.push([x + Math.cos(a - d * 1.66) * r * .8 * k, y + Math.sin(a - d * 1.66) * r * .68 * k, 1]); for (const [da, q] of [[-d, .97], [0, 1.06], [d, .97]]) o.push([x + Math.cos(a + da) * r * rr * q * k, y + Math.sin(a + da) * r * rr * q * .85 * k]); } return o; }
function drawPuff(ctx, sx, sy, r, seed, alpha, cols) {
  if (alpha <= .02 || r < 2) return; ctx.globalAlpha = alpha;
  const pl = cel(ctx, puffShape(sx, sy, r, seed, 1), { fill: cols[1], lw: .35, line: cols[2], seed, step: 6, amp: .6 });
  clipTo(ctx, pl); cel(ctx, puffShape(sx - r * .16, sy - r * .2, r, seed, .78), { fill: cols[0], lw: 0, seed: seed + 1, step: 6, amp: .6 }); ctx.restore(); ctx.globalAlpha = 1;
}
const DUST = [['rgb(232,222,190)', 'rgb(190,178,150)', 'rgb(150,138,120)'], ['rgb(255,240,200)', 'rgb(236,200,150)', 'rgb(190,150,110)']];
function drawPuffs(ctx, front, f) { for (const p of SIM.puffs) { if (!!p.front !== !!front) continue; const s = SCR(p.x, p.y), u = p.age / p.life; drawPuff(ctx, s[0], s[1], p.r * cam.z, p.seed + ((f / 4) | 0) * 0, (1 - u * u) * .9, DUST[p.col]); } }
function drawFlock(ctx) {
  ctx.fillStyle = 'rgb(54,66,74)';
  for (const b of SIM.flock) { if (b.age < b.d) continue; const s = SCR(b.x, b.y), z = cam.z * b.s, w = [-1, -.2, .8, -.2][b.ph & 3], dir = b.vx < 0 ? -1 : 1;
    ctx.beginPath(); ctx.ellipse(s[0], s[1], z * .9, z * .36, dir * -.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s[0] - z * .5 * dir, s[1]); ctx.quadraticCurveTo(s[0] - z * .3 * dir, s[1] + w * z * 1.1, s[0] - z * 1.5 * dir, s[1] + w * z * 1.9); ctx.lineTo(s[0] + z * .5 * dir, s[1] - z * .1); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s[0] - z * .2 * dir, s[1]); ctx.quadraticCurveTo(s[0] + z * .6 * dir, s[1] + w * z * .9, s[0] + z * .9 * dir, s[1] + w * z * 1.7); ctx.lineTo(s[0] + z * .6 * dir, s[1]); ctx.fill(); }
}
// ── the little bird
const BIRD_KEYS = [[11.25, 'land'], [11.45, 'sit', 1], [12.2, 'sit', -1], [13.0, 'sit', 1], [13.6, 'hop'], [13.75, 'sit', 1], [14.3, 'chirp'], [14.55, 'sit', 1], [14.8, 'chirp'], [15.1, 'sit', 1], [16.0, 'sit', -1], [16.9, 'up'], [18.2, 'sit', 1], [18.9, 'fluff'], [19.2, 'sit', 1], [24.5, 'sit', -1], [25.35, 'sit', 1], [26.25, 'hop'], [26.45, 'sit', 1], [27.9, 'tilt'], [28.9, 'sit', 1], [29.35, 'duck'], [29.8, 'fly']];
function birdState(t, F) {
  const perch = FW_(F.pdL, [-58, -150]);
  if (t < 9.3 || t > 31) return null;
  if (t < 11.25) { const u = (t - 9.3) / 1.95, e = 1 - Math.pow(1 - u, 2.2); const x = perch[0] - 760 * (1 - e) + 0, y = perch[1] - 16 - 240 * (1 - e) - Math.sin(u * Math.PI) * -70 - Math.sin(u * 9) * 14 * (1 - u); return { x, y, pose: u > .86 ? 'brake' : 'fly', dir: 1, fl: Math.floor(t * 12) }; }
  if (t >= 29.8) { const u = t - 29.8; return { x: perch[0] - u * 560 - u * u * 300, y: perch[1] - 16 - u * 380 - Math.sin(u * 8) * 10, pose: 'fly', dir: -1, fl: Math.floor(t * 12) }; }
  let k = BIRD_KEYS[0]; for (const b of BIRD_KEYS) if (b[0] <= t) k = b;
  let hop = 0; if (k[1] === 'hop') hop = Math.sin((t - k[0]) / .15 * Math.PI) * 9;
  return { x: perch[0] + (t > 13.6 ? 10 : 0) + (t > 26.25 ? -16 : 0), y: perch[1] - 13 - Math.max(0, hop), pose: k[1], dir: t > 26.25 && t < 29.8 ? 1 : 1, hd: k[2] || 1, fl: Math.floor(t * 12) };
}
function drawBird(ctx, b, sunny) {
  const z = cam.z * 1.15, o = SCR(b.x, b.y), d = b.dir; let rot = 0, hr = 0, hd = b.hd || 1, sq = 1;
  if (b.pose === 'fly') rot = -.25; if (b.pose === 'brake') rot = -.9; if (b.pose === 'land' || b.pose === 'duck') sq = .8; if (b.pose === 'chirp' || b.pose === 'up') hr = -.55; if (b.pose === 'tilt') hr = .45; if (b.pose === 'fluff') sq = 1.12;
  const c = Math.cos(rot * d), s = Math.sin(rot * d), T = (x, y, f) => [o[0] + (x * d * c - y * sq * s) * z, o[1] + (x * d * s + y * sq * c) * z, f];
  const back = sunny ? 'rgb(112,136,170)' : 'rgb(84,106,138)', backS = sunny ? 'rgb(78,98,134)' : 'rgb(62,80,112)', belly = sunny ? 'rgb(250,240,214)' : 'rgb(206,206,196)', bellyS = sunny ? 'rgb(214,196,172)' : 'rgb(160,166,170)', lw = .5, ln = 'rgb(48,40,44)';
  const C = (pts, fill, shade, o2) => cel(ctx, pts.map(p => T(p[0], p[1], p[2])), Object.assign({ fill, shade, off: [-2.5 * z, -2 * z], lw, line: ln, seed: 500 + (b.fl % 2), step: 4, amp: .5 }, o2));
  const flying = b.pose === 'fly' || b.pose === 'brake', up = b.fl % 2 === 0;
  if (flying) C(up ? [[-2, -6], [-10, -34], [2, -40], [10, -30], [8, -8]] : [[-4, -2], [-12, 18], [-2, 26], [8, 16], [8, -2]], backS);
  C([[-12, 1, 1], [-36, -3 + (b.pose === 'brake' ? 8 : 0)], [-38, 5 + (b.pose === 'brake' ? 10 : 0)], [-12, 9, 1]], back, backS);
  if (!flying) { cel(ctx, [T(-2, 12), T(-3, 21)], { closed: false, lw: .45, line: ln, seed: 1 }); cel(ctx, [T(5, 12), T(5, 21)], { closed: false, lw: .45, line: ln, seed: 2 }); }
  C([[-17, 0], [-8, -13], [9, -14], [19, -5], [16, 9], [1, 15], [-13, 10]], belly, bellyS);
  // head (can turn independently)
  const hx = 14, hy = -16, hc = Math.cos(hr), hs = Math.sin(hr), Hd = (x, y, f) => { const X = x * hd, a = X * hc - y * hs, bb = X * hs + y * hc; return [hx + a, hy + bb, f]; };
  if (!flying) C([[-19, -1], [-5, -12], [9, -9], [7, 4], [-13, 7]], back, backS);
  C(circ(0, 0, 11.5, 9).map(p => Hd(p[0], p[1])), back, backS);
  C([[1, 0], [9, -4], [11, 3], [5, 8], [0, 6]].map(p => Hd(p[0], p[1])), belly, null, { lw: .3 });
  const open = b.pose === 'chirp' ? 4 : 0; C([[10, -3 - open, 1], [21, 0 - open * .6, 1], [10, 1, 1]].map(p => Hd(p[0], p[1], 1)), 'rgb(232,170,84)', null, { lw: .4 }); if (open) C([[10, 1, 1], [19, 4, 1], [10, 4, 1]].map(p => Hd(p[0], p[1], 1)), 'rgb(200,140,70)', null, { lw: .4 });
  const e = T(...Hd(5, -3)); ctx.fillStyle = ln; ctx.beginPath(); ctx.arc(e[0], e[1], 1.9 * z, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e[0] - .6 * z, e[1] - .7 * z, .6 * z, 0, TAU); ctx.fill();
  if (flying) C(up ? [[-6, -8], [-16, -40], [-2, -48], [10, -38], [10, -10]] : [[-6, -4], [-16, 22], [-4, 32], [8, 22], [10, -2]], back, backS);
}
// ── cel grass around the giant's feet
const TUFTS = (function () { const R = rng(4242), o = []; for (let i = 0; i < 34; i++) o.push({ x: RX - 760 + R() * 1560, y: GY + 18 + R() * 70, n: 5 + R() * 4 | 0, h: 30 + R() * 36, seed: R() * 1000 | 0, fl: R() < .3 ? ['#f6f1dc', '#f3d977', '#eeb4c0'][R() * 3 | 0] : null }); o.sort((a, b) => a.y - b.y); return o; })();
function drawTufts(ctx, t, sun) {
  const ringT = t - 55.6, rr = ringT > 0 ? 2600 * easeOut(ringT / 2.2) : -1, trem = ramp(t, 29.3, 29.8) * (1 - ramp(t, 48, 48.5));
  for (const g of TUFTS) {
    const d = g.x - RX; let bend = Math.sin(t * 1.3 + g.seed) * .07 + trem * (hash(g.seed + Math.floor(t * 12)) - .5) * .22;
    if (rr > 0) { const k = clamp((rr - Math.abs(d)) / 300, 0, 1) * Math.exp(-Math.max(0, ringT - Math.abs(d) / 1200) * 1.1); bend += Math.sign(d) * k * 1.25 * (1 + .25 * Math.sin(ringT * 16 + g.seed)); if (t > 57.7) bend += Math.sign(d) * .5 * Math.exp(-(t - 57.7)); }
    const h = g.h * (1 + (g.y - GY) / 160);
    for (let k = 0; k < g.n; k++) { const bx = g.x + (k - g.n / 2) * 7, a = -Math.PI / 2 + (k - g.n / 2) * .16 + bend + (hash(g.seed + k) - .5) * .3, hh = h * (.55 + hash(g.seed * 3 + k) * .6), tx = bx + Math.cos(a) * hh, ty = g.y + Math.sin(a) * hh * (1 - Math.abs(bend) * .25), mx = bx + Math.cos(a - bend * .5) * hh * .5, my = g.y + Math.sin(a - bend * .5) * hh * .5;
      const lit = litMap(g.x, g.y + 40) * sun > .25 && k % 2; cel(ctx, [SCR(bx - 3.2, g.y, 1), SCR(mx - 2.4, my), SCR(tx, ty, 1), SCR(mx + 2.4, my), SCR(bx + 3.2, g.y, 1)], { fill: lit ? 'rgb(160,196,96)' : k % 3 ? 'rgb(92,142,80)' : 'rgb(62,110,74)', lw: .38, line: 'rgb(40,70,54)', seed: g.seed + k, step: 9 });
      if (g.fl && k === 1) { const q = SCR(tx, ty - 3); cel(ctx, circ(q[0], q[1], 4.6 * cam.z, 6), { fill: g.fl, lw: .35, seed: g.seed }); } }
  }
}
// ── hand-drawn flame tongue (re-drawn every frame, on ones)
function flame(ctx, sx, sy, len, wid, ang, seed) {
  const c = Math.cos(ang), s = Math.sin(ang), sh = (k, sd) => { const L = [], Rr = [], n = 7; for (let i = 0; i <= n; i++) { const t = i / n, w = wid * k * Math.sin(Math.PI * Math.pow(t, .55)) * (.75 + hash(sd + i * 3) * .5) * .5, l = len * k * t * (1 + (hash(sd + 77) - .5) * .2), wob = (hash(sd + i * 5 + 1) - .5) * wid * .3 * t; L.push([sx + c * l - s * (w + wob), sy + s * l + c * (w + wob)]); Rr.push([sx + c * l + s * (w - wob), sy + s * l - c * (w - wob)]); } return L.concat(Rr.reverse()); };
  cel(ctx, sh(1, seed), { fill: 'rgb(255,170,84)', lw: .4, line: 'rgb(236,120,70)', seed, amp: 0, step: 8 }); cel(ctx, sh(.72, seed + 9), { fill: 'rgb(255,226,130)', lw: 0, seed, amp: 0, step: 8 }); cel(ctx, sh(.42, seed + 19), { fill: 'rgb(255,254,236)', lw: 0, seed, amp: 0, step: 8 });
}
