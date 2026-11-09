// ───────────────────────── the giant: rig, key poses, cel drawing ─────────────────────────
const cam = { x: RX, y: 1700, z: 1 };
function SCR(x, y, f) { return [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2, f]; }
function frame(o, ang, sx, sy) { const c = Math.cos(ang), s = Math.sin(ang); sx = sx || 1; sy = sy || Math.abs(sx); return { o, ux: [c * sx, s * sx], uy: [-s * sy, c * sy], ang }; }
function boneFrame(A, B, flip) { const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1; return { o: A, ux: [dx / L, dy / L], uy: [-dy / L * flip, dx / L * flip], L, ang: Math.atan2(dy, dx) }; }
function FW_(f, p) { return [f.o[0] + f.ux[0] * p[0] + f.uy[0] * p[1], f.o[1] + f.ux[1] * p[0] + f.uy[1] * p[1]]; }
function M(f, p) { return SCR(f.o[0] + f.ux[0] * p[0] + f.uy[0] * p[1], f.o[1] + f.ux[1] * p[0] + f.uy[1] * p[1], p[2]); }
function circ(x, y, r, k, ry) { const o = []; k = k || 10; for (let i = 0; i < k; i++) { const a = i / k * TAU; o.push([x + Math.cos(a) * r, y + Math.sin(a) * (ry || r)]); } return o; }

const POSES = {
  kneel: { pel: [25, -335], nk: [-45, -690], hd: [-82, -745], hAng: -.2, look: [-.45, .8], shL: [-315, -585], elL: [-405, -380], wrL: [-385, -190], shR: [215, -640], elR: [325, -440], wrR: [250, -275], hipL: [-85, -330], knL: [-215, -350], anL: [-200, -95], hipR: [140, -320], knR: [225, -80], anR: [470, -95], ftL: 0, ftR: 1.25, tree: 0 },
  stir: { pel: [25, -338], nk: [-42, -705], hd: [-72, -768], hAng: -.13, look: [-.4, .45], shL: [-315, -600], elL: [-407, -392], wrL: [-385, -192], shR: [220, -655], elR: [328, -450], wrR: [252, -280] },
  brace: { pel: [18, -350], nk: [-22, -722], hd: [-34, -806], hAng: -.04, look: [-.3, .15], shL: [-300, -640], elL: [-402, -418], wrL: [-385, -200], shR: [245, -672], elR: [345, -466], wrR: [270, -296], hipL: [-90, -340], hipR: [136, -332] },
  half: { pel: [-5, -455], nk: [-55, -805], hd: [-84, -882], hAng: -.13, look: [-.35, .25], shL: [-335, -735], elL: [-425, -525], wrL: [-405, -325], shR: [225, -760], elR: [335, -548], wrR: [305, -350], hipL: [-115, -438], knL: [-205, -335], anL: [-198, -95], hipR: [120, -434], knR: [208, -300], anR: [235, -95], ftR: 0, tree: -.1 },
  stand: { pel: [0, -600], nk: [0, -965], hd: [0, -1052], hAng: 0, look: [-.2, .05], shL: [-285, -900], elL: [-352, -650], wrL: [-342, -440], shR: [285, -900], elR: [352, -650], wrR: [342, -440], hipL: [-120, -575], knL: [-150, -345], anL: [-165, -95], hipR: [120, -575], knR: [150, -345], anR: [165, -95], ftL: 0, ftR: 0, tree: 0 },
  over: { pel: [0, -606], nk: [6, -976], hd: [10, -1066], hAng: .04, look: [-.2, -.1], shL: [-283, -915], shR: [290, -912], elL: [-362, -668], elR: [362, -666], wrL: [-360, -462], wrR: [356, -458], tree: .12 },
  up: { nk: [2, -970], hd: [4, -1056], hAng: -.03, look: [-.3, -.95], shL: [-287, -906], shR: [287, -904] },
  crouch: { pel: [0, -535], nk: [-12, -895], hd: [-14, -978], hAng: -.03, look: [-.25, -.9], shL: [-292, -830], elL: [-392, -600], wrL: [-410, -398], shR: [282, -832], elR: [388, -602], wrR: [404, -400], hipL: [-122, -512], knL: [-196, -325], hipR: [122, -512], knR: [196, -325], tree: -.08 },
  launch: { pel: [0, -615], nk: [0, -992], hd: [0, -1082], hAng: 0, look: [-.1, -1], shL: [-280, -930], elL: [-340, -690], wrL: [-312, -480], shR: [280, -930], elR: [340, -690], wrR: [312, -480], hipL: [-112, -590], knL: [-128, -350], anL: [-132, -100], hipR: [112, -590], knR: [128, -350], anR: [132, -100], ftL: .0, ftR: 0, tree: .25 },
};
// inherit unspecified joints from the previous logical pose
(function () { const inh = (a, b) => { for (const k in POSES[b]) if (!(k in POSES[a])) POSES[a][k] = POSES[b][k]; }; inh('stir', 'kneel'); inh('brace', 'stir'); inh('half', 'brace'); inh('over', 'stand'); inh('up', 'stand'); inh('crouch', 'up'); inh('launch', 'stand'); POSES.look = Object.assign({}, POSES.kneel, { hd: [-86, -752], hAng: -.12, look: [-.95, .3] }); })();
// [time, pose, ease]
const POSE_KEYS = [[0, 'kneel'], [26.2, 'kneel'], [27.6, 'look', 's'], [33.6, 'look'], [34.6, 'stir', 'o'], [36.4, 'stir'], [39.6, 'brace', 's'], [40.3, 'brace'], [44.2, 'half', 's'], [44.9, 'half'], [47.3, 'over', 's'], [48.3, 'stand', 's'], [49.4, 'stand'], [51.6, 'up', 's'], [54.0, 'up'], [55.4, 'crouch', 's'], [57.55, 'crouch'], [57.8, 'launch', 'i'], [99, 'launch']];
const LAG = { hd: .22, wrL: .2, wrR: .2, elL: .1, elR: .1, hAng: .25, look: .3, tree: .45, nk: .05 };
function poseAt(t) {
  const out = {};
  const ev = (key, tt) => {
    let i = 0; while (i < POSE_KEYS.length - 2 && POSE_KEYS[i + 1][0] <= tt) i++;
    const a = POSE_KEYS[i], b = POSE_KEYS[i + 1]; let u = clamp((tt - a[0]) / (b[0] - a[0]), 0, 1);
    u = b[2] === 'o' ? easeOut(u) : b[2] === 'i' ? u * u : b[2] === 's' ? sstep(u) * .7 + u * u * (3 - 2 * u) * .3 : u;
    const A = POSES[a[1]][key], B = POSES[b[1]][key];
    return typeof A === 'number' ? lerp(A, B, u) : [lerp(A[0], B[0], u), lerp(A[1], B[1], u)];
  };
  for (const k in POSES.kneel) out[k] = ev(k, t - (LAG[k] || 0));
  // stepping arc for the dragging rear leg
  const st = ramp(t, 40.3, 44.2); if (st > 0 && st < 1) { out.anR[1] -= Math.sin(st * Math.PI) * 26; }
  // strain tremor while it fights centuries of rust
  const tr = (ramp(t, 34, 34.6) * (1 - ramp(t, 35.6, 36.4)) + ramp(t, 36.6, 37.4) * (1 - ramp(t, 39.2, 39.8)) * .7 + ramp(t, 40.4, 41) * (1 - ramp(t, 43.6, 44.3)) * .55 + ramp(t, 55.5, 55.8) * (1 - ramp(t, 57.5, 57.6)) * .9);
  if (tr > 0) { const q = Math.floor(t * 12), jx = (hash(q) - .5) * 7 * tr, jy = (hash(q + 99) - .5) * 5 * tr; for (const k of ['nk', 'hd', 'shL', 'shR', 'elL', 'elR', 'pel']) { out[k][0] += jx; out[k][1] += jy; } out.hd[0] += jx * .6; }
  let ry = 0; if (t > 57.7) { const n = (t - 57.7) * 24; ry = -52 * n * n; }
  out.root = [RX, GY + ry]; out.stretch = t > 57.7 ? 1 + Math.min(.22, (t - 57.7) * 1.6) : 1;
  return out;
}
function rig(p) {
  const r = p.root, st = p.stretch || 1, J = k => [r[0] + p[k][0], r[1] + p[k][1] * st], F = {};
  F.J = J; F.torso = boneFrame(J('pel'), J('nk'), 1); const ta = F.torso.ang + Math.PI / 2;
  F.pelvis = frame(J('pel'), ta * .6);
  for (const [s, fl] of [['L', 1], ['R', -1]]) {
    F['ua' + s] = boneFrame(J('sh' + s), J('el' + s), fl); F['fa' + s] = boneFrame(J('el' + s), J('wr' + s), fl);
    F['fist' + s] = { o: J('wr' + s), ux: F['fa' + s].ux, uy: F['fa' + s].uy };
    F['th' + s] = boneFrame(J('hip' + s), J('kn' + s), fl); F['sn' + s] = boneFrame(J('kn' + s), J('an' + s), fl);
    const an = J('an' + s); F['ft' + s] = frame([an[0], an[1] + 20], p['ft' + s] * -fl * -1, -fl);
    const ua = F['ua' + s].ang - Math.PI / 2; F['pd' + s] = frame(J('sh' + s), ua * .45 + ta * .3 + fl * -.2, -fl, 1);
    F['pod' + s] = frame(FW_(F.torso, [F.torso.L * .8, -fl * 175]), ta + fl * -.3, -fl, 1);
  }
  const hd = J('hd'); F.head = frame(hd, p.hAng + ta * .3, .88); F.neck = boneFrame(J('nk'), hd, 1);
  F.tree = frame(FW_(F.pdR, [-36, -132]), F.pdR.ang * .5 + p.tree + .1, .66); F.tree2 = frame(FW_(F.pdL, [70, -118]), p.tree * 1.2 - .2, .34); F.sap = frame(FW_(F.podL, [0, -226]), p.tree * 1.4 - .15, .5);
  F.look = p.look; F.root = r;
  return F;
}
const PALS = {
  cool: { armor: [[108, 142, 138], [70, 102, 112]], cream: [[172, 174, 154], [116, 126, 126]], metal: [[82, 90, 100], [52, 60, 76]], rust: [[118, 96, 84], [88, 72, 74]], moss: [[82, 124, 88], [54, 92, 80]], mossHi: [116, 152, 96], leaf: [[70, 112, 84], [42, 82, 74]], leafHi: [108, 148, 96], bark: [[104, 92, 80], [70, 62, 64]], dark: [32, 36, 48], line: [44, 38, 44] },
  warm: { armor: [[136, 176, 156], [78, 114, 122]], cream: [[236, 224, 180], [152, 148, 134]], metal: [[122, 118, 114], [66, 68, 84]], rust: [[158, 126, 96], [118, 96, 88]], moss: [[134, 176, 80], [74, 118, 72]], mossHi: [196, 218, 108], leaf: [[104, 152, 72], [50, 96, 68]], leafHi: [190, 214, 100], bark: [[142, 112, 80], [84, 66, 62]], dark: [36, 34, 44], line: [48, 36, 32] }
};
let PAL = {};
function setPal(sun) { for (const k in PALS.cool) { const a = PALS.cool[k], b = PALS.warm[k]; PAL[k] = typeof a[0] === 'number' ? rgb(mix(a, b, sun)) : { f: rgb(mix(a[0], b[0], sun)), s: rgb(mix(a[1], b[1], sun)) }; } CEL.line = PAL.line; }

// state: {eye:0..1 glow, lid:0..1 open, chest:0..1, shed:0..1, flame:0..1}
function drawRobot(ctx, F, S) {
  let sc = 100; const z = cam.z, lod = z > 1.5, D = .5;
  const P = (f, pts, col, o) => { o = o || {}; const c = typeof col === 'string' ? PAL[col] : col, sh = (o.sh || 18) * z; return cel(ctx, pts.map(p => M(f, p)), Object.assign({ fill: c.f || c, shade: c.s, off: [-sh, -sh * .7], seed: sc++ }, o)); };
  const Ln = (f, pts, o) => cel(ctx, pts.map(p => M(f, p)), Object.assign({ closed: false, lw: D, seed: sc++ }, o));
  const dot = (f, x, y, r, col) => P(f, circ(x, y, r, 7), col || 'metal', { sh: r * .5, lw: D });
  const moss = (f, clip, x, y, rx, ry, seed, thr) => {
    sc += 3; if (S.shed > (thr === undefined ? 2 : thr)) return; clipTo(ctx, clip);
    const b = blob(x, y, rx, ry, seed, 11, .3); P(f, b, 'moss', { sh: 9, lw: .5, line: PAL.moss.s, seed: seed * 7 });
    ctx.fillStyle = PAL.mossHi; for (let i = 0; i < 7; i++) { const q = M(f, [x + (hash(seed * 13 + i) - .6) * rx * 1.3, y + (hash(seed * 17 + i) - .65) * ry * 1.2]); ctx.beginPath(); ctx.ellipse(q[0], q[1], 4.5 * z, 2.6 * z, hash(seed + i) * 3, 0, TAU); ctx.fill(); }
    const fl = lod ? 6 : 3; for (let i = 0; i < fl; i++) { if (hash(seed * 5 + i) < .35) continue; const q = M(f, [x + (hash(seed * 23 + i) - .5) * rx * 1.4, y + (hash(seed * 29 + i) - .5) * ry * 1.1]); ctx.fillStyle = ['#f6f1dc', '#f3d977', '#eeb4c0'][i % 3]; ctx.beginPath(); ctx.arc(q[0], q[1], 2.6 * z, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  const rust = (f, clip, list) => { clipTo(ctx, clip); for (const [x, y, rx, ry, seed, dark] of list) {
      if (dark) { for (let i = 0; i < 5; i++) { const q = blob(x + (hash(seed * 3 + i) - .5) * rx * 2.2, y + (hash(seed * 5 + i) - .5) * ry * 2.2, 3 + hash(seed + i) * 6, 2.5 + hash(seed * 2 + i) * 5, seed + i, 6, .5).map(p => M(f, p)); cel(ctx, q, { fill: PAL.metal.s, lw: .25, seed: seed + i, step: 5 }); } continue; }
      const c = M(f, [x, y]), w = (1.2 + hash(seed) * 2.2) * z, len = (ry * 1.2 + 14 + hash(seed * 9) * 34) * z; ctx.fillStyle = PAL.rust.s; ctx.globalAlpha = .6; ctx.beginPath(); ctx.moveTo(c[0] - w, c[1]); ctx.lineTo(c[0] + w, c[1]); ctx.lineTo(c[0] + w * .2, c[1] + len); ctx.fill(); ctx.globalAlpha = 1;
      cel(ctx, blob(x, y, rx * .7, ry * .7, seed, 9, .3).map(p => M(f, p)), { fill: PAL.rust.f, lw: .3, line: PAL.rust.s, seed: seed, step: 5 });
      for (let i = 0; i < 4; i++) { const q = M(f, [x + (hash(seed * 7 + i) - .5) * rx * 2.6, y + (hash(seed * 11 + i) - .5) * ry * 2.6]); ctx.fillStyle = PAL.rust.f; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + hash(seed + i) * 3) * z, (1.5 + hash(seed - i) * 2) * z, i, 0, TAU); ctx.fill(); }
    } ctx.restore(); };
  let h2; const tuft = (f, x, y, n, h, seed, thr, flower) => { h *= .62; n += 2;
    if (S.shed > (thr === undefined ? 2 : thr)) { sc += n; return; }
    for (let k = 0; k < n; k++) { h2 = 0; const dx = (k - (n - 1) / 2) * 4.5 + (hash(seed + k) - .5) * 5, ln = (hash(seed * 3 + k) - .5) * h * .9 + (S.sway || 0) * h * .5, hh = h * (.6 + hash(seed * 7 + k) * .6); P(f, [[x + dx - 2, y, 1], [x + dx + ln * .4 - 1.6, y - hh * .55], [x + dx + ln, y - hh, 1], [x + dx + ln * .4 + 1.6, y - hh * .5], [x + dx + 2, y, 1]], 'moss', { sh: 2, lw: .4, step: 9 }); }
    if (flower) { const q = [x + (S.sway || 0) * h * .4, y - h * 1.05]; Ln(f, [[x, y], [x + 2, y - h * .5], q], { lw: .35, line: PAL.moss.s }); P(f, circ(q[0], q[1], 3.6, 6), { f: flower }, { lw: .35 }); }
  };
  const clumpC = (f, x, y, rx, ry, seed) => {
    const sh = k => { const o = [], n = 11; for (let i = 0; i < n; i++) { const a = i / n * TAU, d = TAU / n * .3, r = 1 + (hash(seed * 11 + i) - .5) * .22; o.push([x + Math.cos(a - d * 1.66) * rx * .84 * k, y + Math.sin(a - d * 1.66) * ry * .84 * k, 1]); for (const [da, rr] of [[-d, .98], [0, 1.07], [d, .98]]) o.push([x + Math.cos(a + da) * rx * r * rr * k, y + Math.sin(a + da) * ry * r * rr * k]); } return o; };
    const pl = P(f, sh(1), { f: PAL.leaf.s }, { lw: .7, step: 4, seed: seed * 3 }); clipTo(ctx, pl);
    P(f, sh(.8).map(p => [p[0] - rx * .16, p[1] - ry * .18]), { f: PAL.leaf.f }, { lw: 0, step: 6, seed: seed * 3 + 1 });
    P(f, sh(.42).map(p => [p[0] - rx * .36, p[1] - ry * .4]), { f: PAL.leafHi }, { lw: 0, step: 6, seed: seed * 3 + 2 }); ctx.restore();
  };
  const L = k => F[k].L;

  // ── thruster pods behind the shoulders
  for (const s of ['R', 'L']) {
    const f = F['pod' + s]; const pl = P(f, [[-64, 70, 1], [-68, -150], [-44, -214], [0, -232], [44, -214], [68, -150], [64, 70, 1]], 'armor', { sh: 22 });
    clipTo(ctx, pl); P(f, [[-80, -150], [80, -150], [80, -122], [-80, -122]], 'cream', { sh: 22, lw: D }); ctx.restore();
    rust(f, pl, [[30, -60, 22, 40, 41 + sc % 7], [-40, -180, 16, 12, 43, 1]]); Ln(f, [[-30, -100], [-30, 20]]); Ln(f, [[0, -100], [0, 30]]); Ln(f, [[30, -100], [30, 20]]);
    moss(f, pl, -10, -226, 62, 34, s === 'L' ? 51 : 52, .9);
    if (s === 'L') { tuft(f, 18, -228, 4, 30, 61, .8); }
  }
  // sapling on the left pod
  if (S.shed < .97) { const f = F.sap; P(f, [[-9, 4, 1], [-5, -70], [-16, -130], [-4, -136], [6, -74], [11, 4, 1]], 'bark', { sh: 5, lw: .7 }); clumpC(f, -22, -160, 62, 50, 71); clumpC(f, 34, -120, 40, 32, 72); }

  // ── legs (far → near)
  const leg = s => {
    const fs = F['sn' + s], ft = F['th' + s], ff = F['ft' + s], l = fs.L, lt = ft.L;
    const fp = P(ff, [[-128, 4], [-138, 46], [-124, 75, 1], [132, 75, 1], [142, 46], [122, -4], [60, -24], [-72, -22]], 'metal', { sh: 16 });
    Ln(ff, [[-70, 30], [-66, 74]]); Ln(ff, [[0, 34], [0, 74]]); Ln(ff, [[70, 30], [66, 74]]); Ln(ff, [[-134, 30], [-60, 22], [60, 22], [136, 30]]);
    const tp = P(ft, [[-24, -72], [lt * .5, -78], [lt + 6, -64], [lt + 6, 64], [lt * .5, 74], [-24, 68]], 'armor', { sh: 26 }); Ln(ft, [[10, -20], [lt - 30, -16]]); rust(ft, tp, [[lt * .5, 40, 30, 20, 81], [lt * .2, -50, 18, 14, 82, 1]]);
    const sp = P(fs, [[-6, -72], [l * .4, -80], [l - 22, -102], [l + 30, -110, 1], [l + 30, 110, 1], [l - 22, 102], [l * .4, 80], [-6, 72]], 'armor', { sh: 30 });
    clipTo(ctx, sp); P(fs, [[l - 12, -120], [l + 40, -120], [l + 40, 120], [l - 12, 120]], 'cream', { sh: 30, lw: D }); ctx.restore();
    Ln(fs, [[30, 0], [l - 30, 0]]); Ln(fs, [[l * .45, -80], [l * .5, 0], [l * .45, 80]]);
    rust(fs, sp, [[l * .7, s === 'L' ? 60 : -40, 34, 26, 91], [l * .3, -40, 16, 22, 92], [l * .86, -70, 20, 12, 93, 1]]);
    moss(fs, sp, l + 20, s === 'L' ? 70 : -60, 60, 70, 94, .55); moss(fs, sp, l * .3, 80, 40, 30, 95, .4);
    const kp = P(fs, circ(0, 0, 80, 11), 'cream', { sh: 26 }); dot(fs, 0, 0, 22); rust(fs, kp, [[30, 44, 26, 18, 96]]); moss(fs, kp, s === 'L' ? -10 : 0, s === 'L' ? 70 : -76, 60, 34, 97, .6);
  };
  leg('R'); leg('L');
  // ── pelvis
  { const f = F.pelvis; { const pv = P(f, [[-150, -44], [150, -44], [166, 40], [112, 96], [-112, 96], [-166, 40]], 'metal', { sh: 26 }); clipTo(ctx, pv); P(f, [[-170, -50], [170, -50], [170, 6], [-170, -4]], { f: PAL.metal.s }, { lw: 0 }); ctx.restore(); }
    for (const m of [-1, 1]) { const pp = P(f, [[m * 172, -32], [m * 70, -44], [m * 78, 72], [m * 150, 104], [m * 188, 40]], 'armor', { sh: 22 }); if (m > 0) rust(f, pp, [[130, 60, 26, 22, 101]]); else moss(f, pp, -150, -30, 50, 30, 102, .5); }
    P(f, [[-54, -48, 1], [54, -48, 1], [62, 60], [0, 112], [-62, 60]], 'cream', { sh: 20 }); Ln(f, [[0, -30], [0, 80]]); dot(f, 0, 30, 12); }
  // ── torso: ribbed belly, barrel chest, furnace hatch
  { const f = F.torso, l = f.L;
    const ab = P(f, [[-34, -128], [l * .3, -138], [l * .46, -152], [l * .46, 152], [l * .3, 138], [-34, 128]], 'metal', { sh: 34 });
    for (const x of [14, 52, 90, 128]) Ln(f, [[x, -134], [x + 7, 0], [x, 134]]);
    const ch = P(f, [[l * .33, -172], [l * .5, -228], [l * .78, -244], [l * .97, -204], [l * 1.05, -92], [l * 1.05, 92], [l * .97, 204], [l * .78, 244], [l * .5, 228], [l * .33, 172], [l * .27, 0]], 'armor', { sh: 46 });
    // cast shadow of the head on the chest
    clipTo(ctx, ch); const hs = FW_(F.head, [30, 120]); const hq = SCR(hs[0], hs[1]); ctx.fillStyle = PAL.armor.s; ctx.beginPath(); ctx.ellipse(hq[0], hq[1], 150 * z, 60 * z, .1, 0, TAU); ctx.fill(); ctx.restore();
    Ln(f, [[l * .98, -150], [l * .62, -196], [l * .4, -150]]); Ln(f, [[l * .98, 150], [l * .62, 196], [l * .4, 150]]); Ln(f, [[l * .42, -60], [l * .36, 0], [l * .42, 60]]);
    rust(f, ch, [[l * .5, 150, 40, 30, 111], [l * .86, -170, 30, 40, 112], [l * .4, -110, 22, 30, 113, 1], [l * .93, 80, 14, 26, 114, 1], [l * .55, -200, 16, 30, 115]]);
    if (lod) for (const v of [-150, -110, 110, 150]) dot(f, l * .93, v, 6, 'cream');
    moss(f, ch, l * 1.03, -180, 60, 90, 116, .75); moss(f, ch, l * 1.0, 190, 50, 70, 117, .6); moss(f, ch, l * .36, 150, 30, 50, 118, .3);
    // hatch
    const hx0 = l * .68, hv = -14; P(f, circ(hx0, hv, 80, 12), 'cream', { sh: 14 });
    const g = S.chest || 0, rc = P(f, circ(hx0, hv, 60, 11), { f: rgb(mix([30, 32, 44], [255, 176, 84], g)) }, { lw: D }); clipTo(ctx, rc);
    if (g > .02) { P(f, circ(hx0 - 4, hv, 40, 9), { f: rgb(mix([30, 32, 44], [255, 226, 150], g)) }, { lw: 0 }); P(f, circ(hx0 - 6, hv, 18, 8), { f: rgb(mix([30, 32, 44], [255, 252, 232], g)) }, { lw: 0 }); }
    for (const v of [-34, 0, 34]) P(f, [[hx0 - 70, hv + v - 7], [hx0 + 70, hv + v - 7], [hx0 + 70, hv + v + 7], [hx0 - 70, hv + v + 7]], 'metal', { sh: 4, lw: D }); ctx.restore();
    if (lod) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3; dot(f, hx0 + Math.cos(a) * 70, hv + Math.sin(a) * 70, 4.5); }
    P(f, [[l * 1.0, -104], [l * 1.1, -72], [l * 1.12, 0], [l * 1.1, 72], [l * 1.0, 104], [l * .975, 0]], 'cream', { sh: 14 });
    F.chestW = FW_(f, [hx0, hv]);
  }
  // ── neck, jaw, head
  { const fn = F.neck; P(fn, [[-10, -44], [fn.L, -40], [fn.L, 40], [-10, 44]], 'metal', { sh: 14, lw: D });
    const f = F.head, lx = F.look[0], ly = F.look[1], fx = lx * 30, fy = ly * 22;
    P(f, [[-58 + fx * .5, 50], [58 + fx * .5, 50], [46 + fx * .6, 98 + fy * .5], [-46 + fx * .6, 98 + fy * .5]], 'metal', { sh: 12 }); for (const v of [-22, 0, 22]) Ln(f, [[v + fx * .55, 66], [v + fx * .6, 92 + fy * .5]]);
    for (const m of [-1, 1]) { P(f, circ(m * 122 + fx * .15, -4, 26, 9), 'cream', { sh: 8 }); dot(f, m * 124 + fx * .15, -4, 9); }
    P(f, [[-10, -108], [-6, -158], [4, -170], [14, -164], [16, -110]], 'cream', { sh: 5 }); Ln(f, [[-4, -150], [12, -146]]);
    const hp = P(f, [[-120, 50, 1], [-126, 10], [-114, -52], [-72, -102], [0, -120], [72, -102], [114, -52], [126, 10], [120, 50, 1], [62, 64 + fy * .25], [0, 68 + fy * .35], [-62, 64 + fy * .25]], 'armor', { sh: 30 });
    Ln(f, [[-124, 22], [-62, 38 + fy * .3], [0, 42 + fy * .4], [62, 38 + fy * .3], [124, 22]]); Ln(f, [[fx * .3, -118], [fx * .5, -50 + fy]]);
    rust(f, hp, [[70, -70, 30, 22, 121], [-96, 30, 18, 14, 122], [96, 20, 14, 20, 123, 1], [-30, -100, 14, 10, 124, 1]]);
    clipTo(ctx, hp);
    const vz = P(f, [[-80 + fx, -30 + fy], [fx, -37 + fy], [80 + fx, -30 + fy], [90 + fx, fy], [80 + fx, 27 + fy], [fx, 31 + fy], [-80 + fx, 27 + fy], [-90 + fx, fy]], { f: PAL.dark }, { lw: .8 });
    ctx.restore(); clipTo(ctx, vz); F.eyes = [];
    for (const m of [-1, 1]) {
      const ex = m * 40 + fx * 1.25, ey = -3 + fy * 1.1, g = S.eye || 0; P(f, circ(ex, ey, 24, 10), 'metal', { sh: 6, lw: D });
      const lens = P(f, circ(ex, ey, 18, 10), { f: rgb(mix([44, 62, 70], [255, 190, 86], g)) }, { lw: D }); clipTo(ctx, lens);
      if (g > .05) { P(f, circ(ex + lx * 4, ey + ly * 3, 11, 8), { f: rgb(mix([44, 62, 70], [255, 232, 150], g)) }, { lw: 0 }); P(f, circ(ex + lx * 5, ey + ly * 4, 5, 7), { f: rgb(mix([44, 62, 70], [255, 253, 236], g)) }, { lw: 0 }); }
      else P(f, circ(ex - 6, ey - 7, 4, 6), { f: 'rgb(110,136,140)' }, { lw: 0 });
      const lid = 1 - (S.lid === undefined ? 1 : S.lid); if (lid > .02) { const yy = ey - 20 + lid * 40; P(f, [[ex - 24, ey - 26], [ex + 24, ey - 26], [ex + 24, yy], [ex, yy + 3], [ex - 24, yy]], 'metal', { sh: 3, lw: D }); }
      ctx.restore(); F.eyes.push(FW_(f, [ex, ey]));
    }
    ctx.restore();
    moss(f, hp, -40, -112, 90, 40, 125, .85); moss(f, hp, 112, -30, 30, 50, 126, .5);
    tuft(f, -52, -108, 5, 26, 127, .7); tuft(f, -20, -118, 3, 34, 128, .8, '#f6f1dc'); tuft(f, 44, -108, 3, 20, 129, .5, '#f3d977');
  }
  // ── arms
  const arm = s => {
    const fu = F['ua' + s], ff = F['fa' + s], fh = F['fist' + s], fp = F['pd' + s], lu = fu.L, l = ff.L;
    { const up = P(fu, [[-10, -52], [lu * .5, -56], [lu + 14, -50], [lu + 14, 50], [lu * .5, 56], [-10, 52]], 'metal', { sh: 20 }); clipTo(ctx, up); P(fu, [[-20, -70], [lu * .62, -70], [lu * .5, 70], [-20, 70]], { f: PAL.metal.s }, { lw: 0 }); ctx.restore(); if (lod) { Ln(fu, [[lu * .6, -20], [lu - 60, -18]]); Ln(fu, [[lu * .6, 14], [lu - 60, 16]]); } } Ln(fu, [[lu - 30, -52], [lu - 26, 0], [lu - 30, 52]]); Ln(fu, [[lu - 52, -53], [lu - 48, 0], [lu - 52, 53]]);
    const hd = P(fh, [[4, -72], [70, -80], [118, -62], [130, 0], [118, 62], [70, 80], [4, 72]], 'metal', { sh: 20 });
    Ln(fh, [[72, -40], [126, -36]]); Ln(fh, [[76, 0], [130, 0]]); Ln(fh, [[72, 40], [126, 36]]); Ln(fh, [[66, -74], [74, 0], [66, 74]]);
    rust(fh, hd, [[40, 40, 22, 18, 131]]);
    const gp = P(ff, [[6, -64], [l * .45, -86], [l - 12, -94], [l + 18, -88, 1], [l + 18, 88, 1], [l - 12, 94], [l * .45, 86], [6, 64]], 'armor', { sh: 30 });
    clipTo(ctx, gp); P(ff, [[l - 30, -110], [l + 30, -110], [l + 30, 110], [l - 30, 110]], 'cream', { sh: 30, lw: D }); ctx.restore();
    Ln(ff, [[30, 30], [l - 44, 36]]); Ln(ff, [[l * .3, -80], [l * .34, -20]]);
    rust(ff, gp, [[l * .55, -50, 30, 24, 141], [l * .2, 40, 18, 16, 142], [l * .8, 60, 14, 22, 143, 1]]);
    if (lod) for (const v of [-60, -20, 20, 60]) dot(ff, l - 8, v, 5);
    moss(ff, gp, l * .4, 90, 70, 40, 144, .5); moss(ff, gp, l * .9, 80, 40, 40, 145, .35);
    P(ff, circ(0, 0, 58, 10), 'metal', { sh: 16 }); dot(ff, 0, 0, 20, 'cream');
    // pauldron
    const pp = P(fp, [[-152, 40, 1], [-154, -20], [-112, -112], [0, -152], [112, -112], [154, -20], [152, 40, 1], [92, 62], [0, 70], [-92, 62]], 'armor', { sh: 40 });
    Ln(fp, [[-152, 10], [-92, 34], [0, 42], [92, 34], [152, 10]]); Ln(fp, [[0, -150], [4, -60], [0, 40]], { lw: .4 });
    rust(fp, pp, [[70, -30, 40, 30, 151], [-100, 0, 22, 18, 152], [20, 30, 30, 14, 153, 1], [-40, -80, 16, 12, 154, 1]]);
    if (lod) for (const v of [-120, -70, -20, 30, 80, 126]) dot(fp, v, 52 - Math.abs(v) * .12, 6, 'cream');
    moss(fp, pp, -30, -130, 120, 52, s === 'L' ? 155 : 156, .9); moss(fp, pp, 120, -60, 40, 50, 157, .45);
    if (s === 'L') { tuft(fp, -60, -128, 5, 30, 161, .75); tuft(fp, 30, -146, 4, 26, 162, .85, '#eeb4c0'); tuft(fp, 84, -122, 3, 22, 163, .6, '#f6f1dc'); }
    else { tuft(fp, -96, -112, 4, 26, 164, .7); tuft(fp, 70, -128, 4, 30, 165, .8, '#f3d977'); }
  };
  arm('R');
  // ── the old tree rooted in the right shoulder
  { const f = F.tree; P(f, [[-22, 8, 1], [-12, -60], [-30, -128], [-18, -196], [-2, -200], [-8, -130], [12, -62], [24, 8, 1]], 'bark', { sh: 9 });
    P(f, [[-20, -120], [-70, -168], [-62, -176], [-14, -138]], 'bark', { sh: 4, lw: .7 }); P(f, [[2, -90], [58, -134], [64, -124], [8, -74]], 'bark', { sh: 4, lw: .7 });
    Ln(f, [[-6, -10], [0, -50]], { lw: .35 }); Ln(f, [[-16, -80], [-12, -110]], { lw: .35 });
    clumpC(f, -86, -196, 78, 60, 171); clumpC(f, 70, -160, 70, 54, 172); clumpC(f, -10, -250, 104, 76, 173); if (S.shed < .9) clumpC(f, -30, -150, 44, 30, 174); }
  arm('L');
  if (S.shed < .95) { const f = F.tree2; P(f, [[-16, 8, 1], [-8, -70], [-20, -150], [-4, -156], [8, -72], [18, 8, 1]], 'bark', { sh: 6, lw: .6 }); clumpC(f, -30, -190, 96, 76, 181); clumpC(f, 50, -140, 60, 46, 182); }
}
