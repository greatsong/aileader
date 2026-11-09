// ───────────────────────── painted backgrounds: school hill, teachers' room, meadow ─────────────────────────
const BG = {}, BGS = 1.5;   // interior and meadow are painted larger than they are shown, so close shots stay crisp
const EW = 2400, EH = 1900, IW = 3200, IH = 1040, MW = 6000, MH = 1300, MGY = 905;
const pathY = x => MGY + 14 * Math.sin(x / 260);
function wall(g, x, y, w, h, col, R, n) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = rgb(col); g.fillRect(x, y, w, h); const m = Math.min(1, Math.min(w, h) / 60); for (let i = 0; i < (n || w * h / 900); i++) brush(g, x + R() * w, y + R() * h, (20 + R() * 50) * m, (5 + R() * 9) * m, Math.PI / 2 + (R() - .5) * .3, jit(col, R, 9), .5, R); g.restore(); }
function grassArea(g, x0, x1, y0, y1, R, n, lit, dark) {
  for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), u = Math.pow(R(), .8), y = y0 + u * (y1 - y0), sc = .5 + u * 1.5, l = R(); brush(g, x, y, (10 + R() * 20) * sc, 2 + sc * 1.4, -Math.PI / 2 + (R() - .5) * .9, l > .6 ? mix(lit[0], lit[1], R()) : mix(dark[0], dark[1], R()), .92, R); }
}
function tree(g, x, base, h, w, R, pal, tp) {
  trunk(g, x, base, base - h * .7, w, (R() - .5) * w, tp, R, { dens: 1.2 });
  for (let k = 0; k < 3; k++) { const d = k - 1; limb(g, x, base - h * .5, x + d * h * .22, base - h * .78, w * .35, tp[0], 10); }
  for (let i = 0; i < 16; i++) { const a = R() * TAU, r = Math.sqrt(R()); clump(g, x + Math.cos(a) * h * .36 * r, base - h * .78 + Math.sin(a) * h * .26 * r, h * (.12 + R() * .1), h * (.08 + R() * .07), pal, R, Math.max(5, h * .022), 1.2, 1.1); }
}
function skyPaint(w, h, stops, sun, clouds, R, cp, sc) {
  const c = mkCanvas(w * (sc || 1), h * (sc || 1)), g = c.getContext('2d'); if (sc) g.scale(sc, sc); vgrad(g, w, h, stops);
  for (let i = 0; i < 1100; i++) { const y = R() * h, t = y / h; let col = stops[0][1]; for (let k = 1; k < stops.length; k++) if (t >= stops[k - 1][0] && t <= stops[k][0]) col = mix(stops[k - 1][1], stops[k][1], (t - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0])); brush(g, R() * w, y, 160 + R() * 320, 16 + R() * 34, (R() - .5) * .16, jit(col, R, 8), .3, R); }
  glow(g, sun[0], sun[1], 1200, sun[2], .7); glow(g, sun[0], sun[1], 420, [255, 250, 226], .85); glow(g, sun[0], sun[1], 110, [255, 255, 246], 1);
  for (let i = 0; i < 70; i++) brush(g, R() * w, R() * h * .5, 200 + R() * 400, 6 + R() * 10, -.1 + (R() - .5) * .1, [255, 246, 230], .22, R);
  for (const [x, y, cw, ch, k] of clouds) paintCloud(g, x, y, cw, ch, R, cp[k]);
  return c;
}
function paintExt() {
  const R = rng(31415);
  BG.skyA = skyPaint(EW, EH, [[0, [140, 184, 222]], [.3, [190, 214, 228]], [.5, [240, 226, 208]], [.66, [255, 224, 184]], [1, [255, 214, 172]]], [1960, 1200, [255, 232, 190]], [[420, 620, 620, 300, 0], [1500, 380, 520, 230, 0], [2100, 800, 420, 200, 1], [900, 980, 360, 130, 1]], R, [[[160, 180, 210], [228, 224, 222], [255, 250, 236], [190, 200, 214]], [[214, 180, 180], [250, 220, 190], [255, 246, 220], [240, 200, 160]]]);
  BG.skyB = skyPaint(EW, EH, [[0, [86, 140, 186]], [.22, [150, 192, 200]], [.4, [232, 222, 176]], [.56, [255, 212, 138]], [.72, [255, 184, 116]], [1, [255, 170, 110]]], [460, 1190, [255, 226, 150]], [[1750, 640, 700, 380, 0], [520, 420, 520, 240, 0], [1250, 900, 420, 170, 0], [2200, 1010, 380, 150, 0], [180, 900, 360, 160, 0]], R, [[[206, 172, 176], [246, 210, 172], [255, 244, 212], [240, 196, 150]]]);
  const c = mkCanvas(EW, EH), g = c.getContext('2d');
  // far hills & town
  for (const [by, col, hh, ph] of [[1300, [164, 184, 208], 150, 1], [1345, [136, 164, 184], 110, 4]]) { g.fillStyle = rgb(col); g.beginPath(); g.moveTo(0, EH); for (let x = 0; x <= EW; x += 20) g.lineTo(x, by - hh * (.3 + .7 * Math.abs(Math.sin(x * .0024 + ph) * Math.cos(x * .0011 + ph * 2))) - R() * 6); g.lineTo(EW, EH); g.fill(); for (let i = 0; i < 400; i++) brush(g, R() * EW, by - R() * hh * .6 + 30, 40 + R() * 60, 6 + R() * 8, .4 + R() * .4, jit(mix(col, [236, 226, 214], R() * .5), R, 6), .35, R); }
  for (let i = 0; i < 240; i++) { const x = R() * EW, y = 1330 + R() * 46; dab(g, x, y, 10 + R() * 12, 6 + R() * 5, 0, R() < .4 ? [214, 150, 124] : [238, 230, 214], .8); }
  for (let i = 0; i < 90; i++) { const x = R() * EW; clump(g, x, 1392 + R() * 30, 40 + R() * 60, 22 + R() * 20, [[96, 140, 130], [124, 166, 136], [170, 200, 150], [214, 226, 170]], R, 6, 1.2); }
  { const mg = g.createLinearGradient(0, 1250, 0, 1440); mg.addColorStop(0, 'rgba(255,240,220,0)'); mg.addColorStop(1, 'rgba(255,240,220,.5)'); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = mg; g.fillRect(0, 1250, EW, 200); g.restore(); }
  g.fillStyle = 'rgb(150,188,150)'; g.fillRect(0, 1404, EW, 400); for (let i = 0; i < 160; i++) clump(g, R() * EW, 1420 + R() * 160, 50 + R() * 70, 24 + R() * 20, [[104, 150, 122], [130, 174, 128], [174, 204, 140], [220, 230, 170]], R, 7, 1.2);
  // the hill
  const hillY = x => 1396 + Math.pow(Math.max(0, Math.abs(x - 1470) - 520) / 950, 2) * 190;
  g.fillStyle = 'rgb(112,160,96)'; g.beginPath(); g.moveTo(0, EH); for (let x = 0; x <= EW; x += 20) g.lineTo(x, hillY(x)); g.lineTo(EW, EH); g.fill();
  for (let i = 0; i < 2600; i++) { const x = R() * EW, y = hillY(x) + R() * (EH - hillY(x)), t = (y - 1390) / 510; brush(g, x, y, 50 + R() * 100, 10 + R() * 20, (R() - .5) * .3 + (x - 1470) * .00012, mix(mix([132, 178, 104], [88, 140, 86], t), [176, 204, 112], R() * .5), .8, R); }
  // school trees behind the wings
  const tp = [[78, 70, 62], [120, 104, 84], [200, 180, 130], [90, 140, 80], [150, 186, 96]], lp = [[58, 108, 76], [88, 146, 82], [150, 190, 96], [214, 226, 130]];
  for (const [x, h] of [[900, 330], [990, 270], [1960, 300], [2060, 360], [2190, 280]]) tree(g, x, hillY(x) + 6, h, 26, R, lp, tp);
  // the school
  const WALL = [240, 228, 202], WSH = [206, 196, 180], ROOF = [196, 112, 84], ROOFD = [150, 84, 70], WIN = [96, 124, 150];
  const win = (x, y, w, h) => { g.fillStyle = rgb(WSH); g.fillRect(x - 3, y - 3, w + 6, h + 6); wall(g, x, y, w, h, WIN, R, 5); g.fillStyle = 'rgba(214,232,240,.55)'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + h * .4); g.lineTo(x + w * .6, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h * .2); g.lineTo(x + w * .3, y + h); g.fill(); g.fillStyle = rgb(WALL); g.fillRect(x + w / 2 - 1.5, y, 3, h); g.fillRect(x, y + h / 2 - 1.5, w, 3); BG.wins.push([x + w / 2, y + h / 2]); };
  BG.wins = [];
  for (const x0 of [1010, 1610]) {
    wall(g, x0, 1236, 320, 160, WALL, R); g.fillStyle = rgb(WSH, .55); g.fillRect(x0, 1236, 320, 14);
    g.fillStyle = rgb(ROOFD); g.fillRect(x0 - 14, 1228, 348, 12); g.fillStyle = rgb(ROOF); g.beginPath(); g.moveTo(x0 - 14, 1230); g.lineTo(x0 + 16, 1196); g.lineTo(x0 + 304, 1196); g.lineTo(x0 + 334, 1230); g.fill();
    for (let i = 0; i < 120; i++) brush(g, x0 + R() * 320, 1200 + R() * 28, 16 + R() * 16, 5, 0, jit(R() < .3 ? ROOFD : ROOF, R, 12), .7, R);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) win(x0 + 24 + k * 58, 1262 + r * 66, 40, 44);
  }
  wall(g, 1330, 1186, 280, 210, WALL, R); g.fillStyle = rgb(WALL); g.beginPath(); g.moveTo(1322, 1190); g.lineTo(1470, 1096); g.lineTo(1618, 1190); g.fill();
  g.fillStyle = rgb(ROOF); g.beginPath(); g.moveTo(1304, 1196); g.lineTo(1470, 1082); g.lineTo(1636, 1196); g.lineTo(1612, 1196); g.lineTo(1470, 1104); g.lineTo(1328, 1196); g.fill();
  for (let i = 0; i < 60; i++) { const u = R() * 2 - 1; brush(g, 1470 + u * 150, 1094 + Math.abs(u) * 100, 16, 5, Math.sign(u) * .6, jit(ROOFD, R, 12), .6, R); }
  g.fillStyle = rgb(WSH); g.beginPath(); g.arc(1470, 1158, 34, 0, TAU); g.fill(); g.fillStyle = 'rgb(250,246,232)'; g.beginPath(); g.arc(1470, 1158, 28, 0, TAU); g.fill(); g.strokeStyle = 'rgb(80,84,100)'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(1470, 1158); g.lineTo(1470, 1138); g.moveTo(1470, 1158); g.lineTo(1484, 1164); g.stroke();
  g.strokeStyle = 'rgb(120,110,100)'; g.lineWidth = 4; g.beginPath(); g.moveTo(1470, 1084); g.lineTo(1470, 1010); g.stroke(); g.fillStyle = 'rgb(246,244,236)'; g.beginPath(); g.moveTo(1472, 1012); g.quadraticCurveTo(1500, 1004, 1524, 1016); g.lineTo(1524, 1044); g.quadraticCurveTo(1500, 1034, 1472, 1042); g.fill();
  for (let k = 0; k < 4; k++) win(1352 + k * 62, 1214, 40, 44); win(1352, 1290, 40, 44); win(1548, 1290, 40, 44);
  wall(g, 1412, 1316, 116, 80, WSH, R); g.fillStyle = rgb(ROOFD); g.fillRect(1398, 1302, 144, 16); wall(g, 1436, 1332, 30, 64, [110, 96, 90], R, 4); wall(g, 1474, 1332, 30, 64, [110, 96, 90], R, 4);
  g.fillStyle = 'rgba(70,80,110,.22)'; g.fillRect(1010, 1236, 320, 0); g.beginPath(); g.moveTo(1330, 1196); g.lineTo(1330, 1396); g.lineTo(1300, 1396); g.lineTo(1300, 1240); g.fill();
  for (let i = 0; i < 40; i++) { const x = 1000 + R() * 940; if (Math.abs(x - 1470) < 70) continue; clump(g, x, 1400 + R() * 8, 22 + R() * 22, 12 + R() * 8, lp, R, 5, 1.3); }
  // path
  for (let i = 0; i < 900; i++) { const u = R(), y = 1396 + u * 504, cx = 1470 - Math.pow(u, 1.5) * 760 + Math.sin(u * 5) * 60, w = 30 + u * 190; brush(g, cx + (R() - .5) * w, y, 30 + R() * 50 * (.5 + u), 6 + R() * 10 * (.5 + u), (R() - .5) * .3, mix([226, 206, 160], [198, 176, 132], R()), .7, R); }
  grassArea(g, 0, EW, 1420, EH, R, 5200, [[150, 190, 96], [214, 226, 126]], [[66, 118, 76], [108, 158, 88]]);
  for (let i = 0; i < 170; i++) { const y = 1460 + R() * 420; flowers(g, R() * EW, y, R, 3 + R() * 5 | 0, 30 + R() * 40, 2.4 + (y - 1420) / 480 * 3.6); }
  // the big framing tree
  trunk(g, 190, 1760, 300, 150, 60, [[60, 54, 52], [104, 90, 74], [206, 184, 130], [84, 132, 72], [150, 186, 92]], R, { dens: 1.4 });
  limb(g, 230, 900, 620, 640, 60, [60, 54, 52], 60); limb(g, 220, 700, -40, 520, 50, [60, 54, 52], 30);
  for (let i = 0; i < 90; i++) { const x = -160 + R() * 980, y = 180 + R() * 620 + Math.max(0, x - 300) * .25; if (x > 620 && y > 760) continue; clump(g, x, y, 80 + R() * 90, 50 + R() * 54, [[40, 88, 66], [66, 124, 74], [128, 176, 86], [206, 222, 118]], R, 13, 1.15); }
  mottle(g, EW, EH, R, 50, .05); BG.ext = c; BG.hillY = hillY;
  const f = mkCanvas(EW, 330), fg = f.getContext('2d'); fg.translate(0, -1600);
  for (let i = 0; i < 80; i++) { const x = R() * EW, e = Math.abs(x - 1200) / 1200, y = 1930 - e * e * 90, n = 7 + R() * 6 | 0, hgt = 80 + R() * 120 + e * 110; for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k / (n - 1) - .5) * 1.9, col = R() < .25 ? [80, 128, 70] : R() < .5 ? [44, 84, 60] : [28, 60, 52]; limb(fg, x, y, x + Math.cos(a) * hgt * .8, y + Math.sin(a) * hgt, 8 + R() * 6, col, -hgt * .2); } if (R() < .3) flowers(fg, x, y - hgt * .6, R, 4, 70, 6); }
  BG.extFG = f;
}
function paintInt() {
  const R = rng(27182), c = mkCanvas(IW * BGS, IH * BGS), g = c.getContext('2d'); g.scale(BGS, BGS);
  wall(g, 0, 0, IW, 540, [230, 218, 190], R, 2600); wall(g, 0, 520, IW, 200, [156, 116, 84], R, 1500);
  for (let x = 0; x < IW; x += 64) { g.fillStyle = 'rgba(90,60,44,.35)'; g.fillRect(x + (R() - .5) * 4, 524, 3, 196); } g.fillStyle = 'rgb(120,86,62)'; g.fillRect(0, 512, IW, 14);
  wall(g, 0, 720, IW, 320, [124, 100, 84], R, 1400);
  BG.deskX = [500, 1250, 2000, 2750];
  for (const dx of BG.deskX) {
    // window behind each desk
    const x0 = dx - 190, y0 = 96, w = 380, h = 410; g.fillStyle = 'rgb(250,244,226)'; g.fillRect(x0 - 16, y0 - 16, w + 32, h + 40);
    const gr = g.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, 'rgb(196,222,236)'); gr.addColorStop(1, 'rgb(244,240,214)'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); for (let i = 0; i < 9; i++) clump(g, x0 + R() * w, y0 + h * (.5 + R() * .5), 60 + R() * 60, 40 + R() * 40, [[120, 166, 130], [150, 192, 140], [196, 220, 156], [234, 240, 190]], R, 10, 1.1); glow(g, x0 + w * .3, y0 + 60, 300, [255, 250, 224], .6); g.restore();
    g.fillStyle = 'rgb(250,244,226)'; g.fillRect(x0 + w / 2 - 7, y0, 14, h); g.fillRect(x0, y0 + h * .42, w, 10); g.fillStyle = 'rgb(214,200,172)'; g.fillRect(x0 - 26, y0 + h + 14, w + 52, 16);
    clump(g, x0 + 50, y0 + h - 12, 34, 30, [[60, 110, 70], [90, 150, 80], [150, 196, 100], [210, 226, 130]], R, 6, 1.4); wall(g, x0 + 34, y0 + h, 34, 16, [190, 120, 90], R, 4);
    // desk
    wall(g, dx - 310, 700, 620, 36, [204, 160, 112], R, 160); g.fillStyle = 'rgba(255,236,190,.35)'; g.fillRect(dx - 310, 700, 620, 7);
    wall(g, dx - 296, 736, 592, 304, [150, 106, 74], R, 500); g.fillStyle = 'rgba(60,36,30,.3)'; g.fillRect(dx - 296, 736, 592, 16);
    for (const k of [-1, 1]) { g.strokeStyle = 'rgba(70,44,34,.6)'; g.lineWidth = 3; g.strokeRect(dx + k * 150 - 110, 780, 220, 90); g.strokeRect(dx + k * 150 - 110, 890, 220, 120); g.fillStyle = 'rgb(214,180,120)'; g.fillRect(dx + k * 150 - 22, 818, 44, 9); g.fillRect(dx + k * 150 - 22, 940, 44, 9); }
    // desk-top clutter: mug, books
    wall(g, dx + 216, 664, 30, 38, [228, 232, 236], R, 4); g.strokeStyle = 'rgb(200,206,214)'; g.lineWidth = 5; g.beginPath(); g.arc(dx + 250, 682, 10, -1.2, 1.2); g.stroke();
    for (let k = 0; k < 3; k++) wall(g, dx - 300 + R() * 6, 688 - k * 14, 96 + R() * 14, 13, [[120, 150, 190], [196, 120, 100], [130, 170, 120]][k], R, 5);
    // sun patch on the wainscot
    g.fillStyle = 'rgba(255,240,196,.3)'; g.beginPath(); g.moveTo(dx - 150, 526); g.lineTo(dx + 190, 526); g.lineTo(dx + 290, 700); g.lineTo(dx - 50, 700); g.fill();
  }
  // shelves with binders, corkboard, calendar, clock
  for (const sx of [875, 2375]) { wall(g, sx - 110, 150, 220, 360, [170, 128, 92], R, 120); for (let r = 0; r < 3; r++) { g.fillStyle = 'rgb(110,80,60)'; g.fillRect(sx - 100, 160 + r * 116, 200, 104); let x = sx - 96; while (x < sx + 84) { const w = 12 + R() * 14, hh = 70 + R() * 30; wall(g, x, 264 + r * 116 - hh, w, hh, [[120, 150, 190], [200, 126, 104], [130, 170, 120], [226, 196, 120], [150, 130, 180], [236, 230, 214]][R() * 6 | 0], R, 3); x += w + 2; } } }
  wall(g, 1470, 160, 330, 300, [196, 160, 116], R, 300); g.strokeStyle = 'rgb(130,96,70)'; g.lineWidth = 12; g.strokeRect(1470, 160, 330, 300); BG.board = [1470, 160, 330, 300];
  wall(g, 3010, 180, 120, 150, [246, 242, 230], R, 10); g.fillStyle = 'rgb(206,96,84)'; g.fillRect(3010, 180, 120, 30); for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(120,120,130,.5)'; g.fillRect(3022 + k * 17, 224 + r * 24, 8, 8); } BG.cal = [3010, 180, 120, 150];
  g.fillStyle = 'rgb(120,96,76)'; g.beginPath(); g.arc(1700, 90, 44, 0, TAU); g.fill(); g.fillStyle = 'rgb(250,246,232)'; g.beginPath(); g.arc(1700, 90, 36, 0, TAU); g.fill(); g.strokeStyle = 'rgb(70,70,84)'; g.lineWidth = 4; g.beginPath(); g.moveTo(1700, 90); g.lineTo(1700, 64); g.moveTo(1700, 90); g.lineTo(1718, 98); g.stroke();
  for (const dx of BG.deskX) { glow(g, dx, 300, 520, [255, 246, 214], .22); const sh2 = g.createLinearGradient(0, 760, 0, 1040); sh2.addColorStop(0, 'rgba(50,34,40,0)'); sh2.addColorStop(1, 'rgba(50,34,40,.4)'); g.fillStyle = sh2; g.fillRect(dx - 330, 760, 660, 280); g.fillStyle = 'rgba(70,50,50,.25)'; g.fillRect(dx - 216, 536, 432, 12); }
  { const sh = g.createLinearGradient(0, 0, 0, 200); sh.addColorStop(0, 'rgba(60,50,60,.3)'); sh.addColorStop(1, 'rgba(60,50,60,0)'); g.fillStyle = sh; g.fillRect(0, 0, IW, 200); }
  mottle(g, IW, IH, R, 50, .06); BG.int = c;
}
function paintMeadow() {
  const R = rng(16180);
  let c = skyPaint(MW, MH, [[0, [116, 172, 218]], [.3, [170, 208, 230]], [.5, [226, 236, 232]], [1, [240, 240, 224]]], [5200, 520, [255, 250, 226]], [[500, 300, 620, 280, 0], [1700, 220, 480, 200, 0], [2900, 340, 700, 300, 0], [4100, 240, 520, 220, 0], [5500, 180, 420, 170, 0], [1100, 470, 300, 110, 0], [3500, 500, 320, 110, 0]], R, [[[156, 178, 212], [226, 228, 232], [255, 252, 244], [186, 200, 220]]], 1.3);
  let g = c.getContext('2d');
  for (const [by, col, hh, ph] of [[640, [150, 180, 206], 150, 2], [680, [126, 164, 170], 90, 5]]) { g.fillStyle = rgb(col); g.beginPath(); g.moveTo(0, MH); for (let x = 0; x <= MW; x += 20) g.lineTo(x, by - hh * (.3 + .7 * Math.abs(Math.sin(x * .0021 + ph) * Math.cos(x * .0009 + ph * 2)))); g.lineTo(MW, MH); g.fill(); for (let i = 0; i < 700; i++) brush(g, R() * MW, by - R() * hh * .6 + 30, 40 + R() * 60, 6 + R() * 8, .4 + R() * .4, jit(mix(col, [236, 236, 226], R() * .5), R, 6), .35, R); }
  // tiny school far away
  g.fillStyle = 'rgb(240,230,208)'; g.fillRect(5600, 596, 120, 34); g.fillRect(5640, 578, 40, 20); g.fillStyle = 'rgb(196,116,90)'; g.fillRect(5594, 590, 132, 8); g.beginPath(); g.moveTo(5634, 580); g.lineTo(5660, 562); g.lineTo(5686, 580); g.fill();
  for (let i = 0; i < 220; i++) { const x = R() * MW; clump(g, x, 690 + R() * 40, 50 + R() * 80, 26 + R() * 30, [[92, 140, 124], [120, 168, 130], [170, 204, 146], [220, 232, 176]], R, 7, 1.2); }
  g.fillStyle = 'rgb(120,170,96)'; g.fillRect(0, 716, MW, MH);
  for (let i = 0; i < 5200; i++) { const x = R() * MW, y = 716 + R() * 584, t = (y - 716) / 584; brush(g, x, y, 60 + R() * 110, 10 + R() * 22, (R() - .5) * .25, mix(mix([150, 192, 110], [92, 146, 84], t), [190, 212, 116], R() * .5), .8, R); }
  const lp = [[52, 104, 74], [84, 144, 80], [148, 190, 92], [214, 226, 126]], tp = [[70, 62, 58], [112, 98, 80], [204, 182, 128], [84, 134, 74], [150, 186, 94]];
  for (const x of [380, 1480, 2560, 3660, 4720]) tree(g, x + R() * 60, 800 + R() * 30, 420 + R() * 120, 44, R, lp, tp);
  for (let i = 0; i < 2600; i++) { const x = R() * MW, w = 34; brush(g, x, pathY(x) + 12 + (R() - .5) * w * 2, 40 + R() * 70, 8 + R() * 10, Math.cos(x / 260) * .05, mix([228, 208, 162], [200, 178, 134], R()), .75, R); }
  grassArea(g, 0, MW, 730, 880, R, 5000, [[160, 198, 104], [216, 228, 130]], [[84, 138, 84], [120, 168, 94]]);
  grassArea(g, 0, MW, 950, MH, R, 9000, [[150, 190, 96], [214, 226, 126]], [[60, 112, 74], [104, 154, 86]]);
  for (let i = 0; i < 420; i++) { const x = R() * MW, y = R() < .4 ? 740 + R() * 130 : 960 + R() * 320; flowers(g, x, y, R, 3 + R() * 5 | 0, 30 + R() * 40, 2.4 + (y - 716) / 584 * 4.2); }
  // the old tree where the year comes round
  trunk(g, 5300, 930, 260, 170, 40, [[64, 56, 54], [108, 94, 76], [208, 186, 132], [84, 132, 72], [150, 186, 92]], R, { dens: 1.5 });
  limb(g, 5310, 520, 5560, 330, 70, [64, 56, 54], 50); limb(g, 5300, 470, 5060, 300, 60, [64, 56, 54], 40);
  for (let i = 0; i < 110; i++) { const a = R() * TAU, r = Math.sqrt(R()); clump(g, 5310 + Math.cos(a) * 420 * r, 300 + Math.sin(a) * 250 * r, 70 + R() * 80, 46 + R() * 50, [[44, 94, 68], [72, 132, 76], [136, 182, 88], [212, 226, 122]], R, 12, 1.15); }
  for (let i = 0; i < 300; i++) { const a = R() * TAU, r = Math.sqrt(R()); brush(g, 5100 + Math.cos(a) * 130 * r, 916 + Math.sin(a) * 16 * r, 20 + R() * 30, 5 + R() * 6, 0, mix([96, 76, 60], [136, 108, 76], R()), .8, R); }
  mottle(g, MW, MH, R, 90, .05); BG.mead = c;
  const f = mkCanvas(MW, 300), fg = f.getContext('2d'); fg.translate(0, -1060);
  for (let i = 0; i < 190; i++) { const x = R() * MW, y = 1330 + R() * 30, n = 6 + R() * 6 | 0, hgt = 70 + R() * 150; for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k / (n - 1) - .5) * 1.8, col = R() < .3 ? [96, 146, 76] : R() < .6 ? [52, 100, 66] : [34, 72, 56]; limb(fg, x, y, x + Math.cos(a) * hgt * .8, y + Math.sin(a) * hgt, 8 + R() * 6, col, -hgt * .2); } if (R() < .35) flowers(fg, x, y - hgt * .7, R, 4, 70, 6); }
  BG.meadFG = f;
  // mist texture
  c = mkCanvas(2048, 512); g = c.getContext('2d'); for (let i = 0; i < 70; i++) { const x = R() * 2048, y = 80 + R() * 360, r = 140 + R() * 300, a = .1 + R() * .25, sy = .16 + R() * .22; for (const dx of [-2048, 0, 2048]) glow(g, x + dx, y, r, [250, 248, 236], a, sy); } BG.mist = c;
}
