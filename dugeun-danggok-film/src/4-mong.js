// ───────────────────────── the mongs (cel characters) and their props ─────────────────────────
const cam = { x: 960, y: 520, z: 1 };
function SCR(x, y, f) { return [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2, f]; }
function frame(o, ang, sx, sy) { const c = Math.cos(ang), s = Math.sin(ang); sx = sx || 1; sy = sy || Math.abs(sx); return { o, ux: [c * sx, s * sx], uy: [-s * sy, c * sy] }; }
function M(f, p) { return SCR(f.o[0] + f.ux[0] * p[0] + f.uy[0] * p[1], f.o[1] + f.ux[1] * p[0] + f.uy[1] * p[1], p[2]); }
function FWp(f, p) { return [f.o[0] + f.ux[0] * p[0] + f.uy[0] * p[1], f.o[1] + f.ux[1] * p[0] + f.uy[1] * p[1]]; }
function circ(x, y, r, k, ry) { const o = []; k = k || 10; for (let i = 0; i < k; i++) { const a = i / k * TAU; o.push([x + Math.cos(a) * r, y + Math.sin(a) * (ry || r)]); } return o; }
const FONT = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","NanumGothic","Noto Sans CJK KR",sans-serif';
const FONT2 = '"Jua","BM JUA","BMJUA","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR","NanumGothic","Noto Sans CJK KR",sans-serif';
let WARM = 0;   // 0 daylight … 1 golden hour
const tint = c => rgb(mix(c, [c[0] * 1.04 + 10, c[1] * .93 + 4, c[2] * .78], WARM));
const MONG = {
  dugeun: { f: [250, 208, 150], s: [228, 168, 122], fy: -46, hw: 43, body: [[0, 0], [30, -7], [44, -40], [36, -78], [0, -98], [-36, -78], [-44, -40], [-30, -7]] },
  doran: { f: [198, 226, 248], s: [158, 196, 234], fy: -52, hw: 46, body: circ(0, -50, 47, 12) },
  ttukttak: { f: [240, 130, 118], s: [206, 96, 98], fy: -28, hw: 50, body: [[-38, 0], [-47, -5], [-51, -34], [-49, -64], [-40, -71], [40, -71], [49, -64], [51, -34], [47, -5], [38, 0]] },
  arong: { f: [253, 247, 228], s: [232, 220, 198], fy: -52, hw: 43, body: [[-43, 0, 1], [-43, -86, 1], [43, -86, 1], [43, -15, 1], [28, 0, 1]] },
  chorong: { f: [160, 162, 238], s: [124, 124, 208], fy: -40, hw: 28, body: [[-23, 0], [-27, -54], [-37, -70], [-41, -92], [0, -84], [41, -92], [37, -70], [27, -54], [23, 0]] },
  salang: { f: [180, 230, 188], s: [140, 204, 162], fy: -56, hw: 40, body: [[0, 0, 1], [47, -52, 1], [0, -106, 1], [-47, -52, 1]] },
  mongsil: { f: [251, 251, 253], s: [214, 212, 240], fy: -36, hw: 54, body: [[-24, 0], [-50, -7], [-58, -30], [-44, -47, 1], [-34, -68], [-8, -80], [12, -74, 1], [30, -80], [46, -66], [48, -50, 1], [60, -32], [50, -8], [22, 0]] },
  gori: { f: [210, 200, 242], s: [178, 166, 222], fy: -40, hw: 50, body: [[-50, 0], [-50, -76], [-34, -76], [-33, -90], [-18, -90], [-17, -76], [2, -76], [2, -50], [13, -48], [13, -30], [2, -28], [2, 0]] }
};
function mong(ctx, kind, wx, wy, s, P) {
  P = P || {}; const d = MONG[kind], z = cam.z, sq = P.sq || 1, fl = P.flip || 1, leg = P.legs === false ? 0 : 20, look = P.look || [0, 0], expr = P.expr || 'smile';
  const f = frame([wx, wy - leg * s * Math.min(1, sq) - (P.hop || 0)], (P.lean || 0), s * fl * (2 - sq), s * sq), os = CEL.seed, olw = CEL.lw; CEL.seed = (P.seed || 0) * 7 + kind.length * 13; CEL.lw = (2.2 + s * z * .9);
  const LN = CEL.line, Cs = (pts, col, sh, o) => cel(ctx, pts.map(p => M(f, p)), Object.assign({ fill: tint(col), shade: sh ? tint(sh) : null, off: [-9 * s * z, -8 * s * z], lw: 1.15, seed: 0 }, o));
  const Ls = (pts, o) => cel(ctx, pts.map(p => M(f, p)), Object.assign({ closed: false, lw: 1.15, taper: 0, seed: 1 }, o));
  // legs
  if (leg) for (const m of [-1, 1]) { const w = P.walk == null ? 0 : Math.sin(P.walk * TAU + (m > 0 ? Math.PI : 0)), fx = m * 15 + w * 10, fyy = leg / sq - Math.max(0, -w) * 0 - Math.max(0, Math.cos(P.walk == null ? 1.57 : P.walk * TAU + (m > 0 ? Math.PI : 0))) * (P.walk == null ? 0 : 7); Ls([[m * 14, -3], [fx, fyy], [fx + 7 * (P.walk == null ? m : 1), fyy + 1]], { seed: 2 + m }); }
  // behind-body extras
  if (kind === 'ttukttak') { const hj = P.handle || 0; Cs([[-26, -70], [-26, -94 - hj], [-14, -104 - hj], [14, -104 - hj], [26, -94 - hj], [26, -70], [15, -70], [15, -89 - hj], [9, -93 - hj], [-9, -93 - hj], [-15, -89 - hj], [-15, -70]], [246, 216, 142], [226, 186, 116]); }
  if (kind === 'doran') Cs([[20, -16], [46, 3, 1], [36, -26]], d.f, d.s);
  if (kind === 'gori') Cs([[0, 0], [0, -76], [16, -76], [17, -90], [32, -90], [33, -76], [50, -76], [50, 0]], [252, 208, 192], [234, 178, 166]);
  if (kind === 'salang') { const t = P.t || 0, pts = [], p2 = []; for (let i = 0; i <= 7; i++) { const u = i / 7, x = Math.sin(u * 5 - t * 7) * 12 * u - (P.windx || 0) * u * 60, y = u * 62 + (P.windy || 0) * u * 30; pts.push([x - 6, y]); p2.push([x + 6, y + 3]); } Cs(pts.concat(p2.reverse()), [240, 128, 116], null, { lw: .9 }); }
  if (kind === 'dugeun') { const w = (P.sprout || 0), st = [[0, -96], [3, -108], [2, -118]]; Ls(st, { line: 'rgb(86,128,60)' }); for (const m of [-1, 1]) { const a = (m > 0 ? -.5 : Math.PI + .5) + m * w * .5, c = Math.cos(a), sn = Math.sin(a), q = (x, y, k) => [2 + x * c - y * sn, -118 + x * sn + y * c, k]; Cs([q(0, 0, 1), q(12, -9), q(30, -4, 1), q(14, 7)], [176, 218, 104], [140, 190, 84], { lw: .95, seed: 5 + m }); } }
  // body
  const bp = Cs(d.body, d.f, d.s);
  if (kind === 'ttukttak') { Ls([[-50, -50], [50, -50]], { lw: .8 }); Cs([[-9, -58, 1], [9, -58, 1], [9, -43, 1], [-9, -43, 1]], [246, 216, 142], null, { lw: .9 }); }
  if (kind === 'arong') { Cs([[43, -15, 1], [28, -15, 1], [28, 0, 1]], [244, 222, 150], null, { lw: .9 }); Ls([[-28, -20], [-12, -29], [6, -21], [26, -33]], { lw: 2.6, line: 'rgba(188,170,236,.9)', taper: 20 }); for (let i = 0; i < 5; i++) { const x = -32 + i * 16; Ls([[x, -80], [x - 4, -90], [x + 2, -96], [x + 6, -88]], { lw: .8, seed: 8 + i }); } const n = P.lines || 0; for (let i = 0; i < n; i++) Ls([[-30, -74 + i * 6], [-30 + 26 + hash(i) * 30, -74 + i * 6]], { lw: .5, line: 'rgba(110,110,130,.8)', seed: 20 + i }); }
  if (kind === 'chorong') { Cs(circ(0, -90, 41, 12, 13), P.lit ? [255, 250, 214] : [252, 246, 222], [236, 224, 190]); Cs([[-6, -24, 1], [6, -24, 1], [6, -10, 1], [-6, -10, 1]], [246, 216, 142], null, { lw: .8 }); }
  if (kind === 'salang') { Ls([[0, -2], [0, -104]], { lw: .5, line: 'rgba(120,190,140,.9)' }); Ls([[-45, -52], [45, -52]], { lw: .5, line: 'rgba(120,190,140,.9)' }); }
  if (kind === 'dugeun' && P.band !== false) {   // the 낭만당곡 headband
    Cs([[36, -74, 1], [58, -70], [64, -58, 1], [44, -64]], [250, 250, 246], [222, 222, 228], { lw: .8, seed: 70 }); Cs([[38, -70, 1], [54, -56], [52, -46, 1], [38, -60]], [250, 250, 246], [222, 222, 228], { lw: .8, seed: 71 });
    clipTo(ctx, bp); Cs([[-50, -88], [50, -82], [50, -60], [-50, -66]], [252, 251, 246], null, { lw: .85, seed: 72 }); ctx.restore();
    const c = M(f, [0, -74]); ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate((P.lean || 0) + .06); ctx.font = `700 ${15.5 * s * z * sq}px ${FONT2}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgb(206,66,58)'; ctx.fillText('낭만당곡', 0, 0); ctx.restore(); }
  // arms
  for (const m of [-1, 1]) { const a = .45 + (m < 0 ? (P.aL == null ? .2 : P.aL) : (P.aR == null ? .2 : P.aR)), sx = m * d.hw * .93, sy = d.fy + 8, ex = sx + m * Math.sin(a) * 27, ey = sy + Math.cos(a) * 27; Ls([[sx, sy], [sx + m * Math.sin(a + .25) * 14, sy + Math.cos(a + .25) * 14], [ex, ey]], { seed: 30 + m }); const h = M(f, [ex, ey]); ctx.fillStyle = LN; ctx.beginPath(); ctx.arc(h[0], h[1], 3.4 * s * z, 0, TAU); ctx.fill(); if (m > 0) P.handR = FWp(f, [ex, ey]); else P.handL = FWp(f, [ex, ey]); }
  // face
  const cx = look[0] * 7, cy = d.fy + look[1] * 5, ex = 15;
  ctx.fillStyle = 'rgba(255,160,160,.7)'; for (const m of [-1, 1]) { const b = M(f, [cx + m * (ex + 11), cy + 9]); ctx.beginPath(); ctx.ellipse(b[0], b[1], 7.5 * s * z, 4.6 * s * z, 0, 0, TAU); ctx.fill(); }
  for (const m of [-1, 1]) {
    const e = [cx + m * ex, cy];
    if (expr === 'joy') Ls([[e[0] - 5, e[1] + 2], [e[0], e[1] - 4], [e[0] + 5, e[1] + 2]], { lw: .95, seed: 40 + m });
    else if (expr === 'blink' || expr === 'sigh') Ls([[e[0] - 5, e[1]], [e[0] + 5, e[1] + (expr === 'sigh' ? 2 * m : 0)]], { lw: .95, seed: 40 + m });
    else { const q = M(f, e); ctx.fillStyle = LN; ctx.beginPath(); ctx.arc(q[0], q[1], 4.4 * s * z, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q[0] - 1.3 * s * z, q[1] - 1.5 * s * z, 1.4 * s * z, 0, TAU); ctx.fill(); }
    if (expr === 'worry' || expr === 'sigh') Ls([[e[0] - 6 * m - 2 * m, e[1] - 11], [e[0] + 5 * m, e[1] - 8 - 5]], { lw: .7, seed: 44 + m });
  }
  if (expr === 'smile' || expr === 'blink') Ls([[cx - 6, cy + 7], [cx, cy + 12], [cx + 6, cy + 7]], { lw: .9, seed: 50 });
  else if (expr === 'joy') Cs([[cx - 8, cy + 6, 1], [cx + 8, cy + 6, 1], [cx + 5, cy + 14], [cx - 5, cy + 14]], [236, 110, 110], null, { lw: .8, seed: 50 });
  else if (expr === 'o') Cs(circ(cx, cy + 11, 4.5, 7), [120, 70, 70], null, { lw: .7, seed: 50 });
  else Ls([[cx - 7, cy + 12], [cx - 2, cy + 9], [cx + 3, cy + 12], [cx + 7, cy + 10]], { lw: .9, seed: 50 });
  if (P.sweat) { const k = P.sweat, q = [d.hw * .7 + k * 6, d.fy - 26 - k * 10]; Cs([[q[0], q[1] - 9, 1], [q[0] + 5, q[1] + 2], [q[0], q[1] + 6], [q[0] - 5, q[1] + 2]], [170, 214, 246], null, { lw: .7, seed: 60 }); }
  P.top = FWp(f, [0, d.body === MONG.salang.body ? -106 : -100]); P.mid = FWp(f, [0, d.fy]); P.f = f;
  CEL.seed = os; CEL.lw = olw; return P;
}
// ── props
function wtext(ctx, wx, wy, str, px, col, o) { o = o || {}; const s = SCR(wx, wy); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(o.rot || 0); ctx.font = `${o.bold === false ? 500 : 700} ${px * cam.z}px ${o.font || FONT2}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = px * cam.z * .22; ctx.strokeStyle = o.stroke; ctx.strokeText(str, 0, 0); } ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); }
function sheet(ctx, wx, wy, w, h, rot, o) {
  o = o || {}; const c = Math.cos(rot), s = Math.sin(rot), fo = o.fore == null ? 1 : o.fore, q = (x, y, k) => SCR(wx + x * c - y * fo * s, wy + x * s + y * fo * c, k);
  const pl = cel(ctx, [q(-w / 2, -h / 2, 1), q(w / 2, -h / 2, 1), q(w / 2, h / 2, 1), q(-w / 2, h / 2, 1)], { fill: tint(o.fill || [252, 250, 242]), shade: o.flat ? null : tint([226, 222, 214]), off: [-5 * cam.z, -5 * cam.z], lw: o.lw || .75, seed: o.seed || 0, step: 9 });
  if (o.head) cel(ctx, [q(-w / 2 + 4, -h / 2 + 4, 1), q(w / 2 - 4, -h / 2 + 4, 1), q(w / 2 - 4, -h / 2 + h * .2, 1), q(-w / 2 + 4, -h / 2 + h * .2, 1)], { fill: tint(o.head), lw: 0, seed: 1, step: 9 });
  const n = o.lines == null ? 4 : o.lines, y0 = o.head ? -h / 2 + h * .32 : -h / 2 + h * .18; ctx.strokeStyle = 'rgba(120,120,136,.7)'; ctx.lineWidth = Math.max(.8, 1.4 * cam.z); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const y = y0 + i * (h * .62 / Math.max(4, o.rows || n)), a = q(-w * .36, y), k = (o.grow == null ? 1 : clamp(o.grow * n - i, 0, 1)) * (.55 + hash(i + (o.seed || 0)) * .45); if (k <= 0) continue; const b = q(-w * .36 + w * .72 * k, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  if (o.label) wtext(ctx, wx - (h * .5 + 16) * -s * 0, wy + (h / 2 + 15) * (o.labelUp ? -1 : 1), o.label, o.lpx || 17, o.lcol || 'rgb(70,56,50)', { stroke: 'rgba(255,250,236,.9)' });
  return pl;
}
function stack(ctx, wx, wy, w, n, seed) {
  if (n <= 0) return; const hh = n * 3.4, lean = Math.sin(seed) * n * .12;
  cel(ctx, [SCR(wx - w / 2, wy, 1), SCR(wx + w / 2, wy, 1), SCR(wx + w / 2 + lean, wy - hh, 1), SCR(wx - w / 2 + lean, wy - hh, 1)], { fill: tint([246, 242, 230]), shade: tint([220, 214, 204]), off: [-8 * cam.z, 0], lw: .9, seed: seed, step: 12 });
  ctx.strokeStyle = 'rgba(120,112,110,.55)'; ctx.lineWidth = Math.max(.7, cam.z);
  for (let i = 2; i < n; i += 2) { const y = wy - i * 3.4, j = (hash(i + seed) - .5) * 9 + lean * i / n, a = SCR(wx - w / 2 + j, y), b = SCR(wx + w / 2 + j, y); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (let i = 5; i < n; i += 7) sheet(ctx, wx + (hash(i * 3 + seed) - .5) * 22 + lean * i / n, wy - i * 3.4, w + 8, 12, (hash(i + seed) - .5) * .12, { lines: 0, lw: .6, seed: i, flat: true });
}
function sign(ctx, wx, wy, str, pop) {
  const k = pop == null ? 1 : pop; if (k <= 0) return; const hgt = 96 * k;
  cel(ctx, [SCR(wx - 5, wy, 1), SCR(wx + 5, wy, 1), SCR(wx + 5, wy - hgt, 1), SCR(wx - 5, wy - hgt, 1)], { fill: tint([150, 110, 78]), lw: .8, seed: 3, step: 12 });
  const w = (30 + str.length * 23) * k; cel(ctx, [SCR(wx - w / 2, wy - hgt - 22, 1), SCR(wx + w / 2 + 6, wy - hgt - 26, 1), SCR(wx + w / 2 + 2, wy - hgt + 22, 1), SCR(wx - w / 2 - 4, wy - hgt + 24, 1)], { fill: tint([226, 190, 134]), shade: tint([190, 150, 104]), off: [-4 * cam.z, -4 * cam.z], lw: 1, seed: 4, step: 12 });
  if (k > .9) wtext(ctx, wx, wy - hgt, str, 30, 'rgb(84,56,40)');
}
function card(ctx, wx, wy, kind, o) {
  o = o || {}; const w = 74, h = 96, rot = o.rot || 0, pl = sheet(ctx, wx, wy - h / 2, w, h, rot, { lines: 0, fill: [254, 250, 238], seed: 10 + kind, lw: .95 });
  const s = SCR(wx, wy - h / 2 - 4), z = cam.z; ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(rot); ctx.scale(z, z);
  if (kind === 0) { ctx.fillStyle = 'rgb(246,200,96)'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 10 : 23; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); }
  else if (kind === 1) { const cs = ['rgb(126,170,226)', 'rgb(150,200,150)', 'rgb(240,150,130)']; [18, 34, 26].forEach((b, i) => { ctx.fillStyle = cs[i]; ctx.fillRect(-24 + i * 17, 20 - b, 13, b); }); ctx.strokeStyle = 'rgb(90,90,110)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-28, 21); ctx.lineTo(28, 21); ctx.stroke(); }
  else { ctx.fillStyle = 'rgb(238,150,170)'; ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -14, -30, 0, -10); ctx.bezierCurveTo(14, -30, 34, -4, 0, 20); ctx.fill(); }
  ctx.restore(); return pl;
}
function bubble(ctx, wx, wy, str, col, k) { if (k <= 0) return; const w = (34 + str.length * 25) * k, h = 58 * k; cel(ctx, [SCR(wx - w / 2, wy - h / 2), SCR(wx, wy - h / 2 - 3), SCR(wx + w / 2, wy - h / 2), SCR(wx + w / 2 + 8, wy), SCR(wx + w / 2, wy + h / 2), SCR(wx - w * .1, wy + h / 2 + 2), SCR(wx - w * .3, wy + h / 2 + 14 * k, 1), SCR(wx - w * .3, wy + h / 2), SCR(wx - w / 2, wy + h / 2), SCR(wx - w / 2 - 8, wy)], { fill: tint(col), lw: .9, seed: str.length, step: 8 }); if (k > .85) wtext(ctx, wx, wy, str, 29, 'rgb(60,56,60)'); }
function sparkle(ctx, wx, wy, r, seed, col) { const s = SCR(wx, wy), z = cam.z; ctx.fillStyle = col || 'rgb(255,246,190)'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + hash(seed) * .5, rr = (i % 2 ? r * .22 : r) * z; ctx.lineTo(s[0] + Math.cos(a) * rr, s[1] + Math.sin(a) * rr); } ctx.fill(); }
function leafPts(x, y, len, wid, ang) { const c = Math.cos(ang), s = Math.sin(ang), q = (a, b) => [x + a * c - b * s, y + a * s + b * c]; return [q(len / 2, 0).concat(1), q(len * .1, -wid / 2), q(-len / 2, 0).concat(1), q(-len * .05, wid / 2)]; }
function drawLeaf(ctx, sx, sy, size, rot, phase, col) { const w = [1, .62, .16, .62][phase & 3], back = (phase & 3) >= 2, c = col || (back ? [150, 176, 70] : [196, 216, 96]); cel(ctx, leafPts(sx, sy, size * 2, size * w, rot), { fill: tint(c), lw: size > 7 ? .45 : .3, seed: phase, step: 5, line: 'rgb(60,80,46)' }); }
function flowerC(ctx, wx, wy, k, seed) { if (k <= 0) return; const cols = [[250, 244, 226], [248, 216, 110], [240, 172, 186], [176, 176, 232]], c = cols[seed % 4], hgt = (16 + hash(seed) * 14) * k, top = [wx + (hash(seed * 3) - .5) * 6, wy - hgt]; cel(ctx, [SCR(wx, wy), SCR(top[0], top[1])], { closed: false, lw: .5, line: 'rgb(70,120,64)', seed }); const s = SCR(top[0], top[1]), r = 5.5 * k * cam.z; ctx.fillStyle = tint(c); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + seed; ctx.beginPath(); ctx.arc(s[0] + Math.cos(a) * r * .8, s[1] + Math.sin(a) * r * .8, r * .62, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgb(236,160,70)'; ctx.beginPath(); ctx.arc(s[0], s[1], r * .45, 0, TAU); ctx.fill(); }

function say(ctx, wx, wy, lines, col, k, dir) {
  if (k <= 0) return; const n = lines.length, len = Math.max(...lines.map(l => l.length)), w = (40 + len * 25) * k, h = (30 + n * 36) * k, d = dir || 1, tx = wx - d * w * .22;
  cel(ctx, [SCR(wx - w / 2, wy - h / 2 + 8), SCR(wx - w / 2 + 10, wy - h / 2), SCR(wx, wy - h / 2 - 4), SCR(wx + w / 2 - 10, wy - h / 2), SCR(wx + w / 2, wy - h / 2 + 8), SCR(wx + w / 2 + 6, wy), SCR(wx + w / 2, wy + h / 2 - 8), SCR(wx + w / 2 - 10, wy + h / 2), SCR(tx + 16, wy + h / 2 + 2), SCR(tx - d * 6, wy + h / 2 + 30 * k, 1), SCR(tx - 14, wy + h / 2 + 2), SCR(wx - w / 2 + 10, wy + h / 2), SCR(wx - w / 2, wy + h / 2 - 8), SCR(wx - w / 2 - 6, wy)], { fill: tint(col || [255, 252, 240]), lw: 1, seed: len * 3 + n, step: 8 });
  if (k > .85) lines.forEach((l, i) => wtext(ctx, wx, wy + (i - (n - 1) / 2) * 36, l, 28, 'rgb(64,54,56)'));
}
function chart(ctx, wx, wy, kind, k, ttl) {
  if (k <= 0) return; const w = 150 * k, h = 196 * k; sheet(ctx, wx, wy, w, h, kind ? .03 : -.03, { lines: 0, seed: 50 + kind, lw: .9 }); if (k < .5) return;
  wtext(ctx, wx, wy - 76 * k, ttl, 19 * k, 'rgb(70,64,70)'); const s = SCR(wx, wy + 70 * k), z = cam.z * k; ctx.save(); ctx.translate(s[0], s[1]); ctx.scale(z, z);
  ctx.strokeStyle = 'rgb(96,92,104)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-56, 0); ctx.lineTo(56, 0); ctx.stroke();
  const bars = kind ? [[-46, 92, 'rgb(240,150,120)'], [-24, 44, 'rgb(246,206,130)'], [10, 40, 'rgb(126,170,226)'], [32, 38, 'rgb(170,204,236)']] : [[-44, 104, 'rgb(126,170,226)'], [-10, 70, 'rgb(240,150,120)'], [24, 38, 'rgb(150,200,150)']];
  for (const [x, b, c] of bars) { ctx.fillStyle = c; ctx.fillRect(x, -b, kind ? 18 : 24, b); } ctx.restore();
}
