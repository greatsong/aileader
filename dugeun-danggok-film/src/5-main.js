// ───────────────────────── direction: scenes, camera, compositing, subtitles ─────────────────────────
const cv = document.getElementById('c'), ctx = cv.getContext('2d'); let RS = 1; cv.width = W; cv.height = H;
function ST(a, b, c, d, e, f) { ctx.setTransform(a * RS, b * RS, c * RS, d * RS, e * RS, f * RS); }
function setRS(r) { RS = r; cv.width = Math.round(W * r); cv.height = Math.round(H * r); }
const soft = mkCanvas(W / 8, H / 8), sg = soft.getContext('2d'), END = 105.4;
const SHOTS = [[0, 'dawn'], [9, 'd0'], [13.5, 'd1'], [18, 'd2'], [22.5, 'd3'], [28, 'catch'], [34.5, 'walk'], [54, 'flow'], [64, 'local'], [72.5, 'tree'], [84, 'final']];
function tr(t, keys, ease) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const a = keys[i - 1], b = keys[i]; let u = (t - a[0]) / (b[0] - a[0]); if (ease) u = sstep(u); return lerp(a[1], b[1], u); } return keys[keys.length - 1][1]; }
const hopA = (v, t0, d, h) => v > t0 && v < t0 + d ? Math.sin((v - t0) / d * Math.PI) * h : 0;
const popK = (v, t0) => v < t0 ? 0 : v < t0 + .09 ? .6 : v < t0 + .18 ? 1.16 : v < t0 + .27 ? .95 : 1;
const q2 = v => Math.floor(v * 12) / 12;
function begin() { ST(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W / 8, H / 8); }
function img(im, ox, oy, p, ax, ay) { const z = cam.z, ex = ax + (cam.x - ax) * p, ey = ay + (cam.y - ay) * p; ST(z, 0, 0, z, W / 2 - ex * z, H / 2 - ey * z); ctx.drawImage(im, ox, oy); ST(1, 0, 0, 1, 0, 0); }
function mist(y0, h, a, speed, t, ww) { if (a <= .01) return; const z = cam.z, wd = 3400; ST(z, 0, 0, z, W / 2 - cam.x * z, H / 2 - cam.y * z); ctx.globalAlpha = a; const off = ((t * speed) % wd + wd) % wd; for (let x = -wd + off - 400; x < ww + 400; x += wd) ctx.drawImage(BG.mist, x, y0, wd, h); ctx.globalAlpha = 1; ST(1, 0, 0, 1, 0, 0); }
function sglow(x, y, r, col, a, sy) { glow(sg, x / 8, y / 8, Math.max(1, r / 8), col, a, sy); }
function wglow(wx, wy, r, col, a, sy) { const s = SCR(wx, wy); sglow(s[0], s[1], r * cam.z, col, a, sy); }
function tintAll(col, a, mode) { ctx.globalCompositeOperation = mode || 'soft-light'; ctx.fillStyle = rgb(col, a); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
const grainC = []; function mkGrain() { for (let k = 0; k < 4; k++) { const c = mkCanvas(480, 260), g = c.getContext('2d'), d = g.createImageData(480, 260), R = rng(k + 5); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (R() - .5) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); grainC.push(c); } }
function finish(f, warm, fade) {
  ctx.globalCompositeOperation = 'screen'; ctx.drawImage(soft, 0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light'; let g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, `rgba(255,220,150,${.3 * warm})`); g.addColorStop(.55, 'rgba(255,220,160,0)'); g.addColorStop(1, 'rgba(50,70,130,.2)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07; ctx.drawImage(grainC[f & 3], 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  g = ctx.createRadialGradient(W / 2, H / 2, H * .55, W / 2, H / 2, H * 1.12); g.addColorStop(0, 'rgba(20,20,40,0)'); g.addColorStop(1, 'rgba(20,20,40,.3)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (fade > 0) { ctx.fillStyle = `rgba(10,10,14,${Math.min(1, fade)})`; ctx.fillRect(0, 0, W, H); }
}
function actor(kind, x, y, s, P) { P = P || {}; const l = P.look || [0, 0]; P.seed = Math.abs(Math.round(x * 3 + y * 7 + (P.aL || 0) * 50 + (P.aR || 0) * 90 + (P.sq || 1) * 211 + (P.lean || 0) * 307 + (P.hop || 0) * 5 + l[0] * 41 + l[1] * 59 + (P.expr || '').length * 11 + (P.walk || 0) * 100 + (P.t || 0) * 60)) % 997; return mong(ctx, kind, x, y, s, P); }
function goldLine(pts, w) { if (pts.length < 2) return; const s = pts.map(p => SCR(p[0], p[1])); ink(ctx, wobble(s, 7, .8, 60), (w || 5) * cam.z, 'rgb(255,214,110)', 3, false, 0); ink(ctx, wobble(s, 7, .8, 60), (w || 5) * .4 * cam.z, 'rgb(255,250,220)', 3, false, 0); for (let i = 0; i < s.length; i += 4) sglow(s[i][0], s[i][1], 26 * cam.z, [255, 220, 130], .28); }
function title(str, y, px, a, font, col) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${px}px ${font || FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = px * .16; ctx.strokeStyle = 'rgba(58,40,34,.82)'; ctx.strokeText(str, W / 2, y); ctx.fillStyle = col || 'rgb(255,248,226)'; ctx.fillText(str, W / 2, y); ctx.restore(); }
const SUBS = [
  [9.3, 13.3, '프로그램 담당 — 계획, 홍보, 출석, 생기부… 같은 내용을 몇 번이고 씁니다'], [13.8, 17.8, '담임 — 이 학생의 관심에 맞는 프로그램은 어디에 있을까요'], [18.3, 22.3, '생기부 담당 — 기록을 모으고, 학번을 하나하나 대조합니다'], [22.8, 27.7, '학교 — 담당자가 바뀌면, 해마다 처음부터 다시 시작합니다'],
  [30.6, 34.2, '그래서, 한 줄로 이어 보기로 했습니다'], [36.3, 39.4, '학생이 마음이 가는 그림을 고르고, 끌린 이유를 남기면'], [41.3, 44.5, '담임은 그 관심을 보며 상담하고, 맞는 프로그램을 담아 줍니다'], [46.3, 49.5, '프로그램이 끝나면 짧은 후기가 남아, 다음 상담으로 이어지고'], [51.2, 53.8, '선생님이 확인한 관찰과 결과물이 학생별 생기부 초안이 됩니다'],
  [54.4, 58.6, '교육계획서에서 고르면 설계 초안, 기안문, 운영계획서까지'], [59, 63.7, '출석과 설문, 결과 보고, 학교 양식 엑셀도 한 흐름으로 이어집니다'], [64.4, 67.8, '학급 기록은 웹에 올리지 않고, 교사 PC 안에서만 다룹니다'], [68.1, 72.2, '분량이 넘치면 AI가 두 안을 내고, 고르는 것은 선생님입니다'],
  [73, 76.6, '후기 한 줄과 선생님 의견이 AI 개선안이 되고'], [76.9, 80.4, '선생님이 승인한 개선은 2027 교육계획서에 담깁니다'], [80.7, 83.7, '담당자가 바뀌어도, 개선은 남습니다'], [84.5, 88.8, '올해는 두 서비스를 따로 운영하며 확인하고, 내년에 통합을 검토합니다'], [91.4, 94.3, 'AI는 조언하고, 확인은 선생님이 합니다']];
function subs(t) { for (const s of SUBS) if (t >= s[0] && t < s[1]) title(s[2], H - 92, 43, 1); }

// ── exterior: dawn opening / catching the page / golden finale
function sceneExt(t, f, u, mode) {
  const v = q2(u), fin = mode === 'final'; let cy = 1330, cx = 1200, z = 1;
  if (mode === 'dawn') cy = lerp(570, 1330, sstep((u - 1) / 5.5)); else if (mode === 'catch') { z = lerp(1.05, 1.3, sstep(u / 3.2)); cx = lerp(1200, 1080, sstep(u / 3.2)) + 160 * sstep((u - 5.3) / 1.2); cy = lerp(1330, 1440, sstep(u / 3.2)); } else cy = lerp(1330, 650, sstep((u - 4.7) / 5.2));
  cam.x = cx; cam.y = cy; cam.z = z; WARM = fin ? 1 : .15; CEL.lw = 3; CEL.amp = .9; begin();
  img(fin ? BG.skyB : BG.skyA, 0, 0, .5, 1200, 1330);
  // small birds far away
  ctx.fillStyle = fin ? 'rgb(120,96,96)' : 'rgb(110,120,140)'; for (let i = 0; i < 7; i++) { const x = 300 + ((u * 46 + i * 150) % 2000), y = 760 + i * 34 + Math.sin(u * .8 + i) * 20, s = SCR(x, y), zz = 5 + (i % 3) * 2, w = [-1, .1, .9, .1][(Math.floor(u * 6) + i) & 3]; ctx.beginPath(); ctx.moveTo(s[0] - zz * 1.6, s[1] + w * zz * 1.4); ctx.quadraticCurveTo(s[0] - zz * .5, s[1] - zz * .3, s[0], s[1]); ctx.quadraticCurveTo(s[0] + zz * .5, s[1] - zz * .3, s[0] + zz * 1.6, s[1] + w * zz * 1.4); ctx.lineTo(s[0], s[1] + zz * .6); ctx.fill(); }
  img(BG.ext, 0, 0, 1, 0, 0);
  if (fin) { tintAll([255, 150, 70], .3); for (const w of BG.wins) wglow(w[0], w[1], 34, [255, 214, 130], .75); wglow(460, 1190, 1100, [255, 220, 150], .5); }
  else { mist(1290, 260, mode === 'dawn' ? .6 : .3, 8, t, EW); wglow(1960, 1200, 900, [255, 236, 200], .45); }
  const GYe = 1662;
  if (mode === 'dawn') {
    const up = v >= 5.9, yo = up ? (1 - easeOut((v - 5.9) / .3)) * 230 : 400, sq = v < 6.1 ? 1.12 : v < 6.27 ? .93 : 1;
    actor('dugeun', 820, GYe + yo, 1.7, { sq, look: [.6, -.5], expr: (v > 7.3 && v < 7.45) ? 'blink' : v > 8 ? 'joy' : 'smile', sprout: Math.sin(v * 3) * .5, band: true, aL: v > 8 ? 1.8 : .2, aR: v > 8 ? 1.8 : .2, hop: hopA(v, 8, .42, 34) });
  } else if (mode === 'catch') {
    for (let i = 0; i < 9; i++) { const a = v - i * .28; if (a < 0) continue; const x = 2350 - a * (330 + 40 * i) + Math.sin(a * 3 + i) * 60, y = 520 + i * 44 + a * 190 + Math.sin(a * 5 + i) * 20; sheet(ctx, x, y, 60, 78, Math.sin(a * 4 + i) * 1.1, { fore: .25 + .75 * Math.abs(Math.cos(a * 5 + i)), seed: i, lines: 3 }); }
    const land = [930, GYe + 6], e = clamp(v / 2, 0, 1); let hx = lerp(1900, land[0], e), hy = lerp(760, land[1], e * e) + Math.sin(e * 9) * 46 * (1 - e), hrot = Math.sin(e * 11) * .9 * (1 - e) + .1, hf = e < 1 ? .3 + .7 * Math.abs(Math.cos(e * 12)) : .28;
    const dx = v < 2.2 ? 800 : v < 2.9 ? lerp(800, 868, (v - 2.2) / .7) : 868, P = { look: v < 2 ? [clamp((hx - 800) / 600, -1, 1), clamp((hy - 1500) / 300, -1, .6)] : [.6, .4], sprout: Math.sin(v * 3) * .4, band: true };
    P.hop = hopA(v, 2.2, .35, 26) + hopA(v, 2.55, .35, 26); if (v >= 2.2 && v < 2.9) P.walk = (v - 2.2) * 2.4;
    if (v >= 2.95 && v < 3.3) { P.lean = .32; P.aR = -.2; }
    const beat = v >= 4 && v < 5.1, bp = beat ? ((v - 4) % .5) : 1;
    if (v >= 3.3 && v < 5.1) { P.aR = 2.3; P.aL = 1.4; P.look = [.5, -.7]; P.expr = beat ? 'o' : 'smile'; if (beat) { P.sq = bp < .09 ? 1.1 : bp < .18 ? .95 : 1; P.sprout = 1; } }
    if (v >= 5.1 && v < 5.4) { P.sq = .82; P.aR = .2; P.look = [.6, .6]; }
    if (v >= 5.4) { P.sq = v < 5.5 ? 1.14 : 1; P.expr = 'joy'; P.aL = 2; P.aR = 2; P.hop = hopA(v, 5.4, .4, 30) + hopA(v, 6, .4, 22); P.sprout = 1; }
    if (v >= 5.4) { const hd = Math.min(2500, land[0] + (v - 5.4) * 1500), pts = []; for (let x = land[0]; x <= hd; x += 30) pts.push([x, land[1] - (x - land[0]) * .05 + Math.sin(x / 150) * 8]); goldLine(pts, 5); for (let k = 0; k < 14; k++) { const fx = land[0] + 60 + k * 105; flowerC(ctx, fx, land[1] - (fx - land[0]) * .05 + Math.sin(fx / 150) * 8, popK(v, 5.4 + (fx - land[0]) / 1500 + .05), k); } }
    const pr = actor('dugeun', dx, GYe, 1.7, P);
    if (v >= 3.3 && v < 5.1) { hx = pr.handR[0] + 8; hy = pr.handR[1] - 40; hrot = -.12; hf = 1; } else if (v >= 2.95 && v < 3.3) { hx = land[0]; hy = land[1] - 10; }
    if (v < 5.4) sheet(ctx, hx, hy, 60, 78, hrot, { fore: hf, seed: 40, lines: 3, head: [250, 214, 120] });
    if (beat) { const k = bp < .09 ? 1.25 : 1, s = SCR(pr.mid[0], pr.mid[1] + 10); sglow(s[0], s[1], 190 * k, [255, 170, 150], .6); const hs = SCR(dx - 70, GYe - 300 - (v - 4) * 30); ctx.fillStyle = 'rgb(240,120,130)'; ctx.save(); ctx.translate(hs[0], hs[1]); ctx.scale(k * 1.3, k * 1.3); ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -14, -30, 0, -10); ctx.bezierCurveTo(14, -30, 34, -4, 0, 20); ctx.fill(); ctx.restore(); }
  } else {
    // finale: everyone gathers, the kite goes up on the one golden line
    const cast = [['gori', 520, -1], ['ttukttak', 700, -1], ['doran', 880, -1], ['dugeun', 1060, -1], ['arong', 1440, 1], ['chorong', 1620, 1], ['mongsil', 1810, 1]];
    const q = v - 4, flying = q > 0, kx = flying ? 1250 + 560 * sstep(q / 6) + 70 * Math.sin(q * .8) : 1250, ky = flying ? 1570 - 1270 * (1 - Math.exp(-q * .55)) + 26 * Math.sin(q * 1.3) : GYe;
    let hand = [1090, 1560];
    cast.forEach(([k, x, side], i) => { const arr = .5 + i * .28, e = clamp((v - arr) / 1.5, 0, 1), px = x + side * (1 - sstep(e)) * 820 * (side < 0 ? 1 : 1) * (side < 0 ? -1 : 1) * -1 * side * side * (side < 0 ? -1 : 1), P = { flip: 1 };
      const xx = x + (side < 0 ? -1 : 1) * (1 - sstep(e)) * 820; if (e < 1 && v >= arr) P.walk = xx / 60; if (v < arr) return;
      P.look = flying ? [clamp((kx - x) / 500, -1, 1), -1] : v > 2.9 ? [clamp((1250 - x) / 300, -1, 1), 0] : [side < 0 ? .6 : -.6, 0];
      if (v > 3 && v < 4) P.lean = -.06 * Math.sin((v - 3) * 9); if (flying) { P.expr = 'joy'; const wv = Math.floor(v * 4 + i) % 2; P.aR = 1.7 + wv * .6; P.aL = k === 'dugeun' ? .3 : 1.5 + (1 - wv) * .6; P.hop = hopA((v + i * .37) % 1.8, 0, .4, 22); } if (k === 'dugeun') { P.band = true; P.sprout = Math.sin(v * 4) * .6; if (flying || v > 2.6) P.aR = 2.2; }
      const r = actor(k, xx, GYe + (i % 2) * 14, 1.42 + (i % 3) * .06, P); if (k === 'dugeun') hand = r.handR; });
    if (v > 2.2) { const sw = v < 4 ? Math.sin(v * 10) * .12 * ramp(v, 3, 4) : .25 * Math.sin(q * 1.1) + .15, sc = flying ? lerp(1.6, 1.15, sstep(q / 5)) : 1.6;
      const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14; pts.push([lerp(hand[0], kx, a), lerp(hand[1], ky - 4, a) + Math.sin(a * Math.PI) * (flying ? 60 + 60 * Math.min(1, q / 3) : 8)]); } goldLine(pts, 3.2);
      actor('salang', kx, ky, sc, { legs: !flying, lean: sw, t: v, windx: flying ? .6 : 0, expr: flying ? 'joy' : v > 3 ? 'o' : 'smile', aL: flying ? 1.6 : .3, aR: flying ? 1.6 : .3, look: flying ? [.3, -.4] : [-.4, 0], hop: v < 4 ? hopA(v, 3.55, .3, 16) : 0 }); wglow(kx, ky - 80, 150, [255, 236, 170], flying ? .4 : 0); }
    if (v > 3 && v < 5.4) for (let i = 0; i < 16; i++) { const a = SCR(300 + hash(i + Math.floor(v * 12)) * 1800, 1380 + hash(i * 3) * 300); cel(ctx, [a, [a[0] + 120 + hash(i) * 120, a[1] - 14]], { closed: false, lw: .5, line: 'rgba(255,250,226,.7)', seed: i }); }
  }
  img(BG.extFG, 0, 1600, 1.1, 1200, 1330);
  if (fin) { for (let i = 0; i < 22; i++) { const a = u - (2.8 + hash(i * 3) * 9); if (a < 0) continue; const sp = 140 + hash(i * 5) * 150, ph = hash(i * 7) * 6, x = hash(i * 11) * (W + 600) - 100 + Math.sin(a * 1.7 + ph) * (90 + hash(i) * 110) - a * 50, y = -90 + a * sp + Math.cos(a * 1.7 + ph) * 46; if (y > H + 100) continue; drawLeaf(ctx, x, y, 20 + hash(i * 13) * 30, a * 2.1 + ph, Math.floor(a * 8) + i); }
    title('AI를 잘 가르치는 AI중점학교를 넘어,', 450, 60, ramp(u, 10.6, 11.4) * (1 - ramp(u, 15.6, 16.2)), FONT2); title('AI 시대의 미래교육을 하는 학교로', 560, 90, ramp(u, 11.6, 12.4) * (1 - ramp(u, 15.6, 16.2)), FONT2);
    title('두근두근 당곡 프로젝트', 450, 60, ramp(u, 16.5, 17.2), FONT2); title('감사합니다! :)', 566, 104, ramp(u, 17, 17.7), FONT2); }
  finish(f, fin ? 1 : .5, mode === 'dawn' ? 1 - u / 1.5 : fin ? ramp(u, 19.6, 21.2) : 0);
  if (mode === 'dawn') { const a = ramp(u, 1.6, 2.6) * (1 - ramp(u, 7.4, 8.4)); title('두근두근 당곡', 300, 124, a, FONT2); title('프로그램 설계부터 개별화된 생기부까지', 420, 46, a, FONT); }
}
// ── teachers' room
function deskBase(t, f, cx, cy, z, dusk) {
  cam.x = cx; cam.y = cy; cam.z = z; WARM = dusk ? .5 : .1; CEL.lw = 3; CEL.amp = .9; begin(); img(BG.int, 0, 0, 1, 0, 0);
  if (dusk) { tintAll([96, 104, 170], .62, 'multiply'); }
}
function sceneDesk(t, f, k, u) {
  const v = q2(u), dx = BG.deskX[k], Y = 702, s = 1.35; deskBase(t, f, dx + (k === 1 ? 170 : k === 0 ? 175 : 0) + u * 5, 524, 1.45);
  if (k === 0) {
    const n = 10 + Math.floor(v * 6), top = Y - n * 3.4, look = v > 3.1; stack(ctx, dx - 150, Y, 120, n, 3 + (look ? Math.floor(v * 12) % 2 : 0) * .4);
    const ph = (v % .5) / .5; sheet(ctx, dx - 150 + Math.sin(v * 9) * 14, lerp(180, top - 6, ph * ph), 118, 14, Math.sin(v * 13) * .2 * (1 - ph), { lines: 0, seed: 5, flat: true });
    sheet(ctx, dx + 96, Y - 6, 96, 70, .08, { fore: .32, lines: 4, seed: 7 });
    actor('ttukttak', dx + 10, Y, s, { expr: look ? 'o' : 'worry', look: look ? [-1, -1] : [.6, .7], aR: look ? .2 : .1 + (hash(Math.floor(v * 12)) - .5) * .5, aL: look ? 1.2 : .2, lean: look ? -.08 : .06, sweat: look ? 0 : 1 + (Math.floor(v * 6) % 2) });
  } else if (k === 1) {
    const b = BG.board, cols = [[126, 170, 226], [240, 150, 130], [150, 200, 150], [246, 206, 110], [190, 170, 236]];
    for (let i = 0; i < 12; i++) sheet(ctx, b[0] + 52 + (i % 4) * 76, b[1] + 58 + Math.floor(i / 4) * 92, 58, 74, (hash(i * 7) - .5) * .22, { head: cols[i % 5], lines: 3, seed: i, lw: .6 });
    const P = { look: v < 1 ? [-.7, .6] : v < 1.8 ? [1, -.9] : v < 2.6 ? [.3, -.9] : v < 3.3 ? [1, -.3] : [.2, -.4], aL: 1.1, expr: v > 2.9 ? 'worry' : 'smile', aR: v > 2.9 ? 2.5 + (Math.floor(v * 6) % 2) * .15 : .2, sweat: v > 3.3 ? 1 : 0 };
    const r = actor('doran', dx + 30, Y, s, P); sheet(ctx, r.handL[0] - 22, r.handL[1] - 30, 58, 74, -.14, { head: cols[2], lines: 3, seed: 30 });
    if (v > 3.2) wtext(ctx, dx + 96, Y - 250 - popK(v, 3.2) * 14, '?', 70 * popK(v, 3.2), 'rgb(255,246,220)', { stroke: 'rgb(70,50,44)', rot: .15 });
  } else if (k === 2) {
    const lx = dx + 140, ly = 470, row = Math.min(7, Math.floor(v / .36)), bad = v > 2.9;
    sheet(ctx, lx, ly, 210, 300, .03, { lines: 11, rows: 11, seed: 3 }); const ry = ly - 150 + 300 * .18 + row * (300 * .62 / 11);
    const a = SCR(lx - 92, ry - 9), bb = SCR(lx + 92, ry + 9); ctx.fillStyle = bad ? 'rgba(246,130,110,.45)' : 'rgba(255,226,120,.5)'; ctx.fillRect(a[0], a[1], bb[0] - a[0], bb[1] - a[1]);
    const r = actor('chorong', dx - 100, Y, s, { lit: true, look: [.8, -.2 + row * .06], expr: bad ? 'worry' : 'smile', lean: .12, aR: 1.5, sweat: bad ? 1 : 0, hop: bad ? hopA(v, 2.9, .25, 14) : 0 });
    const lens = SCR(r.top[0] + 20, r.top[1] + 26), tg = SCR(lx - 60, ry); sg.fillStyle = 'rgba(255,240,170,.34)'; sg.beginPath(); sg.moveTo(lens[0] / 8, lens[1] / 8 - 3); sg.lineTo(tg[0] / 8 + 20, tg[1] / 8 - 7); sg.lineTo(tg[0] / 8 + 20, tg[1] / 8 + 7); sg.lineTo(lens[0] / 8, lens[1] / 8 + 3); sg.fill(); sglow(lens[0], lens[1], 120, [255, 240, 180], .5);
    if (bad) wtext(ctx, lx + 132, ry - popK(v, 2.9) * 6, '!', 64 * popK(v, 2.9), 'rgb(240,110,96)', { stroke: 'rgb(255,246,230)' });
  } else {
    const c = BG.cal, wind = v > 2, n = wind ? Math.max(0, Math.round(24 - (v - 2) * 13)) : 24;
    cel(ctx, [SCR(c[0], c[1], 1), SCR(c[0] + c[2], c[1], 1), SCR(c[0] + c[2], c[1] + 30, 1), SCR(c[0], c[1] + 30, 1)], { fill: 'rgb(206,96,84)', lw: 0, seed: 1 }); wtext(ctx, c[0] + c[2] / 2, c[1] + 16, v < 1.6 ? '2026' : '2027', 22, 'rgb(255,244,230)');
    if (v >= 1.3 && v < 1.9) sheet(ctx, c[0] + c[2] / 2, c[1] + 75 - (v - 1.3) * 120, c[2], c[3] * (1 - (v - 1.3) / .6), -.1 * (v - 1.3) * 4, { lines: 3, seed: 2, lw: .6 });
    stack(ctx, dx + 150, Y, 120, n, 5);
    if (wind) for (let i = 0; i < 14; i++) { const a = v - 2 - i * .12; if (a < 0) continue; sheet(ctx, dx + 150 + a * (420 + i * 30) + Math.sin(a * 6 + i) * 20, Y - 80 - a * (90 + i * 16) - Math.sin(a * 4 + i) * 30, 90, 110, a * 3 + i, { fore: .3 + .7 * Math.abs(Math.cos(a * 7 + i)), lines: 3, seed: i }); }
    if (wind && v < 4.6) for (let i = 0; i < 9; i++) { const a = SCR(dx - 360 + hash(i + Math.floor(v * 12)) * 700, 300 + hash(i * 3) * 380); cel(ctx, [a, [a[0] + 130 + hash(i) * 100, a[1] - 20]], { closed: false, lw: .5, line: 'rgba(255,255,244,.75)', seed: i }); }
    actor('mongsil', dx - 60, Y, s, v < 1.3 ? { look: [.2, 0] } : v < 2 ? { look: [1, -.9], expr: 'o' } : v < 3.5 ? { look: [1, -.4], expr: 'o', aL: 2.2, aR: 2.4, lean: .14, hop: hopA(v, 2.1, .3, 16) } : { look: [.6, .5], expr: 'sigh', sq: .9, aL: 0, aR: 0 });
  }
  finish(f, .4, 0);
}
function sceneFlow(t, f, u) {
  const v = q2(u), dx = 500, Y = 702, names = ['설계', '기안문', '운영계획서', '출석', '설문', '결과 보고', '학교 양식'], cols = [[126, 170, 226], [240, 150, 130], [150, 200, 150], [246, 206, 110], [190, 170, 236], [240, 150, 130], [150, 200, 150]];
  deskBase(t, f, lerp(790, 1090, sstep(u / 8.5)), 500, 1.3);
  stack(ctx, dx - 170, Y, 120, Math.max(4, 44 - Math.floor(Math.max(0, v - 1.2) * 6)), 3);
  const ly = x => 560 - (x - 560) * .13 + Math.sin((x - 560) / 1160 * Math.PI) * 26, last = Math.min(7, Math.floor((v - 1.4) / .85) + 1), ex = v < 1.2 ? 0 : Math.min(1720, 760 + (v - 1.2) * 150);
  if (ex > 0) { const pts = []; for (let x = 560; x <= ex; x += 30) pts.push([x, ly(x)]); goldLine(pts, 3.4); }
  for (let i = 0; i < 7; i++) { const t0 = 1.4 + i * .85, k = popK(v, t0); if (k <= 0) continue; const x = 790 + i * 132, sw = Math.sin((v - t0) * 5) * .16 * Math.exp(-(v - t0) * 1.5); sheet(ctx, x + sw * 50, ly(x) + 66 * k, 90 * k, 116 * k, sw, { head: cols[i], lines: 4, seed: i + 3, label: k > .9 ? names[i] : null, lpx: 21 }); const c = SCR(x, ly(x) + 4); ctx.fillStyle = 'rgb(150,110,80)'; ctx.fillRect(c[0] - 4 * cam.z, c[1] - 9 * cam.z, 8 * cam.z, 20 * cam.z); if (v - t0 < .3) sparkle(ctx, x + 50, ly(x) + 10, 20, i); }
  if (v > .6) sheet(ctx, 640, Y - 62 * popK(v, .6), 92 * popK(v, .6), 120 * popK(v, .6), -.05, { head: [120, 180, 130], lines: 4, seed: 1, label: '교육계획서', lpx: 20, labelUp: true });
  const joy = v > 7.6;
  actor('ttukttak', dx + 20, Y, 1.35, { expr: joy ? 'joy' : v < .6 ? 'worry' : 'smile', look: v < .6 ? [-1, -.6] : [clamp(.3 + last * .1, 0, 1), -.3], handle: v > .6 && v < 1.4 ? (Math.floor(v * 12) % 2) * 5 : 0, aR: joy ? 2.2 : v > 1.2 ? 1.5 : .2, aL: joy ? 2.2 : .2, hop: hopA(v, 7.6, .4, 26) + hopA(v, 8.2, .4, 22) });
  finish(f, .4, 0);
}
function sceneLocal(t, f, u) {
  const v = q2(u), dx = 2000, Y = 702, lp = [dx + 60, Y]; deskBase(t, f, dx + 40 + u * 4, 524, 1.45, true);
  // the teacher's PC
  cel(ctx, [SCR(lp[0] - 86, Y - 2, 1), SCR(lp[0] + 86, Y - 2, 1), SCR(lp[0] + 74, Y - 14, 1), SCR(lp[0] - 74, Y - 14, 1)], { fill: 'rgb(170,176,190)', lw: .9, seed: 2 });
  const blink = v > 1.8 && v < 2.1 || v > 6.9 && v < 7.2; cel(ctx, [SCR(lp[0] - 72, Y - 14, 1), SCR(lp[0] + 72, Y - 14, 1), SCR(lp[0] + 78, Y - 118, 1), SCR(lp[0] - 78, Y - 118, 1)], { fill: 'rgb(120,128,150)', lw: 1, seed: 3 });
  cel(ctx, [SCR(lp[0] - 64, Y - 22, 1), SCR(lp[0] + 64, Y - 22, 1), SCR(lp[0] + 69, Y - 110, 1), SCR(lp[0] - 69, Y - 110, 1)], { fill: blink ? 'rgb(255,250,220)' : 'rgb(206,232,244)', lw: .5, seed: 4 }); wtext(ctx, lp[0], Y - 66, '교사 PC', 24, 'rgb(70,84,110)'); wglow(lp[0], Y - 66, blink ? 240 : 150, [200, 226, 255], blink ? .7 : .4);
  const ch = actor('chorong', dx - 250, Y, 1.35, { lit: true, look: [.8, 0], expr: v > 7 ? 'joy' : 'smile', hop: hopA(v, 7.1, .35, 18) }); wglow(ch.top[0], ch.top[1] + 20, 330, [255, 226, 150], .7); wglow(dx - 60, Y - 30, 560, [255, 214, 140], .38, .5);
  const pick = v > 5.6, P = { look: v < 1 ? [-.3, .5] : v < 2 ? [.8, .2] : v < 4.2 ? [.9, -.4] : v < 4.9 ? [.5, -.7] : v < 5.6 ? [1, -.7] : [.5, -.6], aR: v < 1.8 ? 1.3 : pick && v < 6.4 ? 2.2 : .2, expr: v > 7 ? 'joy' : 'smile', hop: hopA(v, 5.6, .32, 22) + hopA(v, 7.1, .35, 18) };
  const dr = actor('doran', dx - 100, Y, 1.35, P);
  if (v < 1.8) { const e = clamp((v - 1) / .8, 0, 1); sheet(ctx, lerp(dr.handR[0] + 16, lp[0], e), lerp(dr.handR[1] - 30, Y - 70, e), 54 * (1 - e * .6), 70 * (1 - e * .6), -.1, { lines: 3, seed: 9 }); }
  const g = actor('gori', dx + 300, Y, 1.35, { look: [-.7, -.3], aL: v > 3.2 ? 2.2 : .2, aR: v > 3.5 ? 2.2 : .2, expr: v > 7 ? 'joy' : 'smile', hop: hopA(v, 3.1, .3, 16) + hopA(v, 7.2, .35, 18) });
  const A = [dx + 210, Y - 250], B = [dx + 370, Y - 250];
  if (v > 3.2) { const k = popK(v, 3.2), e = clamp((v - 6.2) / .7, 0, 1), x = lerp(A[0], lp[0], sstep(e)), y = lerp(A[1], Y - 70, sstep(e)) - Math.sin(e * Math.PI) * 60, sc = k * (1 - e * .65); if (pick && e < 1) wglow(x, y, 130, [255, 236, 150], .6); if (e < 1) sheet(ctx, x, y, 96 * sc, 124 * sc, -.05, { head: [126, 170, 226], lines: 5, seed: 11, label: e > 0 ? null : '1안', lpx: 24, labelUp: true }); }
  if (v > 3.5) { const k = popK(v, 3.5), a = Math.max(0, v - 6.1); if (a < 1.2) sheet(ctx, B[0] + a * 40, B[1] + a * a * 420, 96 * k, 124 * k, .05 + a * 2.2, { head: [240, 150, 130], lines: 5, seed: 12, label: a > 0 ? null : '2안', lpx: 24, labelUp: true, fore: a > 0 ? .4 + .6 * Math.abs(Math.cos(a * 8)) : 1 }); }
  finish(f, .2, 0);
}
// ── the meadow walk: one student's year on one line
const WPX = [840, 1930, 3040, 4140];
function sceneWalk(t, f, u) {
  const v = q2(u); cam.x = tr(u, [[0, 700], [1.8, 1070], [5, 1070], [6.8, 2180], [10, 2180], [11.8, 3260], [15, 3260], [16.8, 4390], [19.5, 4410]], true); cam.y = 770; cam.z = 1.42; WARM = .1; CEL.lw = 3; CEL.amp = .9; begin();
  img(BG.mead, 0, 0, 1, 0, 0);
  const wx = tr(v, [[0, 300], [1.6, WPX[0]], [5, WPX[0]], [6.6, WPX[1]], [10, WPX[1]], [11.6, WPX[2]], [15, WPX[2]], [16.6, WPX[3]], [19.5, WPX[3]]], true), moving = (v < 1.6) || (v > 5 && v < 6.6) || (v > 10 && v < 11.6) || (v > 15 && v < 16.6), hd = wx + 90;
  const pts = []; for (let x = -40; x <= hd; x += 30) pts.push([x, pathY(x) + 8]); goldLine(pts, 5);
  for (let i = 0; i < 60; i++) { const fx = 60 + i * 86; if (fx > hd || Math.abs(fx - cam.x) > 1100) continue; flowerC(ctx, fx, pathY(fx) + 22 + (i % 3) * 9, clamp((hd - fx) / 130, 0, 1) > .99 ? 1 : popK((hd - fx) / 130 * .3, 0), i); }
  const gy = x => pathY(x) - 2, P = { band: true, sprout: Math.sin(v * 3) * .4, look: [.6, 0] }; if (moving) { P.walk = wx / 62; P.hop = Math.abs(Math.sin(wx / 62 * TAU)) * 5; }
  let cardAt = null;
  // WP1 — interest
  { const a = v - 1.6, x0 = WPX[0]; for (const [k, cx] of [[0, x0 + 170], [1, x0 + 262], [2, x0 + 354]]) { if (k === 1 && a > 1.2) continue; card(ctx, cx, gy(cx) + 4, k, { rot: (k - 1) * .05 }); }
    sign(ctx, x0 + 480, gy(x0 + 480) + 6, '관심');
    if (a >= 0 && a < 3.4) { P.look = a < .4 ? [.5, .2] : a < .8 ? [.8, .2] : a < 1.2 ? [1, .2] : [.2, -.8]; if (a > 1.2) { P.expr = 'joy'; P.aL = 2.3; P.aR = 2.3; P.hop = hopA(a, 1.75, .4, 30) + hopA(a, 2.3, .4, 22); } }
    if (a > 1.2 && v < 7.2) { const e = clamp((a - 1.2) / .5, 0, 1); cardAt = e; if (v < 6.6) { P.aL = 2.3; P.aR = 2.3; } } }
  // WP2 — counselling, into the basket
  const b = v - 6.6; { const x0 = WPX[1], bx = x0 + 350;
    cel(ctx, [SCR(bx - 52, gy(bx) - 56, 1), SCR(bx + 52, gy(bx) - 56, 1), SCR(bx + 40, gy(bx) + 4), SCR(bx - 40, gy(bx) + 4)], { fill: tint([214, 170, 110]), shade: tint([176, 130, 84]), off: [-5, -4], lw: 1, seed: 6 + (b > 2.2 && b < 2.4 ? 1 : 0) });
    for (const [o, c] of [[-22, [240, 150, 130]], [14, [150, 200, 150]]]) sheet(ctx, bx + o, gy(bx) - 78, 44, 56, o * .01, { head: c, lines: 2, seed: 20 + o, lw: .7 });
    if (b > 2.2) card(ctx, bx - 4, gy(bx) - 52, 1, { rot: -.1 });
    cel(ctx, [SCR(bx - 54, gy(bx) - 44, 1), SCR(bx + 54, gy(bx) - 44, 1), SCR(bx + 40, gy(bx) + 4), SCR(bx - 40, gy(bx) + 4)], { fill: tint([214, 170, 110]), shade: tint([176, 130, 84]), off: [-5, -4], lw: 1, seed: 8 }); for (let i = -2; i <= 2; i++) cel(ctx, [SCR(bx + i * 20, gy(bx) - 42), SCR(bx + i * 16, gy(bx) + 2)], { closed: false, lw: .5, seed: i + 9, line: 'rgb(140,100,70)' });
    sign(ctx, x0 + 500, gy(x0 + 500) + 6, '상담');
    const D = { look: b < 0 ? [-.8, 0] : b < .6 ? [-.8, -.2] : b < 1.7 ? [-.5, .3] : b < 2.3 ? [.9, .3] : [-.6, 0], aL: b > .5 && b < 1.7 ? 1.5 : .2, aR: b > 3.4 ? 2 + (Math.floor(v * 4) % 2) * .5 : .2, sq: b > 1.15 && b < 1.32 ? .92 : 1, expr: b > 2.3 ? 'joy' : 'smile', hop: hopA(b, 2.4, .35, 20) };
    const dr = actor('doran', x0 + 190, gy(x0 + 190), 1.5, D);
    if (b >= 0 && b < 2.2) { cardAt = null; const e1 = clamp(b / .6, 0, 1), e2 = clamp((b - 1.7) / .5, 0, 1), hx = [dr.handL[0] - 20, dr.handL[1] - 20], sx = [x0, gy(x0) - 250], x = e2 > 0 ? lerp(hx[0], bx, e2) : lerp(sx[0], hx[0], e1), y = e2 > 0 ? lerp(hx[1], gy(bx) - 60, e2) - Math.sin(e2 * Math.PI) * 90 : lerp(sx[1], hx[1], e1); card(ctx, x, y + 48, 1, { rot: e2 * .6 }); if (b < .6) { P.aR = 2; P.look = [.8, -.2]; } if (b > 2.3) { P.expr = 'joy'; } }
    if (b > 2.3 && b < 3.4) { P.expr = 'joy'; P.hop = hopA(b, 2.5, .35, 22); sparkle(ctx, bx + 40, gy(bx) - 110, 22 * popK(b, 2.3), 2); } }
  // WP3 — taking part, leaving a review
  const c3 = v - 11.6; { const x0 = WPX[2], ax = x0 + 230;
    sign(ctx, x0 + 430, gy(x0 + 430) + 6, '후기');
    const got = c3 > 2.2 ? (c3 > 2.7 ? 6 : 3) : 0; actor('arong', ax, gy(ax), 1.5, { look: c3 < 0 ? [-.8, 0] : [-.7, -.3], lines: got, expr: c3 > 2.7 ? 'joy' : 'smile', aL: c3 > 1.9 && c3 < 2.9 ? 1.8 : .2, hop: hopA(c3, 2.8, .35, 22), sq: (c3 > 2.2 && c3 < 2.32) || (c3 > 2.7 && c3 < 2.82) ? 1.07 : 1 });
    if (c3 >= 0 && c3 < 1.1) { P.expr = 'joy'; P.aL = 2; P.aR = 2; P.hop = hopA(c3, .1, .4, 34) + hopA(c3, .6, .4, 28); for (let i = 0; i < 4; i++) sparkle(ctx, x0 + (i - 1.5) * 60, gy(x0) - 240 - (i % 2) * 40, 16 * popK(c3, .1 + i * .12) * (1 - ramp(c3, .8, 1.1)), i); }
    for (const [i, str, col, t0, t1] of [[0, '좋았던 점', [206, 238, 206], 1.1, 1.9], [1, '아쉬운 점', [252, 220, 190], 1.5, 2.4]]) { if (c3 < t0) continue; const e = clamp((c3 - t1) / .35, 0, 1); if (e >= 1) continue; bubble(ctx, lerp(x0 + 40 + i * 70, ax - 10, e), lerp(gy(x0) - 250 - i * 74, gy(ax) - 110, e), str, col, popK(c3, t0) * (1 - e * .7)); }
    if (c3 > 1.1 && c3 < 2.4) P.look = [.4, -.6]; }
  // WP4 — the record writes itself, the teacher confirms
  const d4 = v - 16.6; { const x0 = WPX[3], px = x0 + 330, py = gy(px) - 126;
    sign(ctx, x0 + 520, gy(x0 + 520) + 6, '생기부');
    sheet(ctx, px, py, 170, 226, -.03, { lines: 9, rows: 9, grow: d4 < .5 ? 0 : clamp((d4 - .5) / 1.6, 0, 1), seed: 5, head: [190, 170, 236] });
    const ch = actor('chorong', x0 + 160, gy(x0 + 160), 1.5, { lit: d4 > 0, look: [.8, -.2], lean: .1, expr: d4 > 2.3 ? 'joy' : 'smile', hop: hopA(d4, 2.4, .35, 20) });
    if (d4 > 0) { const lens = SCR(ch.top[0] + 22, ch.top[1] + 28), tg = SCR(px - 60, py); sg.fillStyle = 'rgba(255,240,170,.3)'; sg.beginPath(); sg.moveTo(lens[0] / 8, lens[1] / 8 - 3); sg.lineTo(tg[0] / 8, tg[1] / 8 - 13); sg.lineTo(tg[0] / 8, tg[1] / 8 + 13); sg.lineTo(lens[0] / 8, lens[1] / 8 + 3); sg.fill(); }
    if (d4 > 2.3) { const k = popK(d4, 2.3), s = SCR(px + 44, py + 74); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(-.2); ctx.scale(k, k); ctx.strokeStyle = 'rgb(222,84,70)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke(); ctx.font = `700 26px ${FONT2}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgb(222,84,70)'; ctx.fillText('확인', 0, 1); ctx.restore(); }
    if (d4 > 2.3) { P.expr = 'joy'; P.aL = 2; P.aR = 2; P.hop = hopA(d4, 2.45, .4, 28); } else if (d4 > 0) P.look = [.9, -.3]; }
  const me = actor('dugeun', wx, gy(wx), 1.5, P);
  if (cardAt !== null) { const x0 = WPX[0], fx = x0 + 262, tx = me.top[0], ty = me.top[1] - 44; card(ctx, lerp(fx, tx, cardAt), lerp(gy(fx) + 4, ty + 48, cardAt) - Math.sin(cardAt * Math.PI) * 40, 1, {}); if (cardAt >= 1 && v < 5) sparkle(ctx, tx + 50, ty - 30, 20 * popK(v, 2.3 + 1.6 - 1.6), 1); }
  img(BG.meadFG, 0, 1010, 1.12, cam.x, 770);
  finish(f, .5, 0);
}
function sceneTree(t, f, u) {
  const v = q2(u), GY2 = 906, soil = [5090, 912]; cam.x = 5010 - 70 * (1 - sstep(u / 10)); cam.y = 690; cam.z = 1.25; WARM = .15; CEL.lw = 3; CEL.amp = .9; begin();
  img(BG.mead, 0, 0, 1, 0, 0);
  const aut = ramp(v, 4.8, 5.6) * (1 - ramp(v, 6.3, 6.9)), win = ramp(v, 6.3, 6.9) * (1 - ramp(v, 7.6, 8.3));
  if (aut > 0) tintAll([255, 150, 60], .42 * aut); if (win > 0) { tintAll([170, 200, 255], .5 * win); ctx.fillStyle = `rgba(244,248,255,${.22 * win})`; ctx.fillRect(0, 0, W, H); }
  // the leaf that carries one line of feedback
  const e = clamp((v - .4) / 1.8, 0, 1); if (v > .4 && v < 4.9) { const lx = lerp(4560, soil[0], e) + Math.sin(e * 10) * 70 * (1 - e), ly = lerp(150, soil[1] - 8, e * e), s = SCR(lx, ly); drawLeaf(ctx, s[0], s[1], 30, e < 1 ? Math.sin(e * 12) * 1.2 : .15, e < 1 ? Math.floor(v * 8) : 0, [236, 196, 96]); if (e >= 1) { wglow(lx, ly, 120, [255, 230, 150], ramp(v, 2.4, 3) * .8); for (let i = 0; i < 5; i++) sparkle(ctx, lx + Math.cos(i * 1.3 + v * 3) * 70, ly - 30 + Math.sin(i * 1.3 + v * 3) * 36, 12 * ramp(v, 2.5, 2.8), i + Math.floor(v * 6)); } }
  // sapling through the seasons
  if (v > 5) { const g = easeOut((v - 5) / 3.4), hgt = 250 * g, top = [soil[0] + 14 * g, soil[1] - hgt], q = k => [soil[0] + Math.sin(k * 3) * 10 * g + 14 * g * k, soil[1] - hgt * k]; cel(ctx, [0, .25, .5, .75, 1].map(k => SCR(...q(k))), { closed: false, lw: 1.5 + g, line: 'rgb(96,132,70)', seed: 4, taper: 0 });
    for (let i = 0; i < 7; i++) { const k0 = .2 + i * .12; if (g < k0) continue; const p = q(Math.min(1, k0 + .04)), m = i % 2 ? 1 : -1, sz = 26 * clamp((g - k0) * 5, 0, 1), s = SCR(p[0] + m * sz * .9, p[1] - sz * .3); drawLeaf(ctx, s[0], s[1], sz, m > 0 ? -.4 : Math.PI + .4, 0, [170, 214, 104]); }
    if (v > 8.6) for (let i = 0; i < 6; i++) { const p = q(.45 + i * .1); flowerC(ctx, p[0] + (i % 2 ? 30 : -30), p[1] + 6, popK(v, 8.6 + i * .09), i + 2); } wglow(top[0], top[1], 160, [255, 240, 170], .35 * g); }
  sign(ctx, 5210, GY2 + 6, '2027', popK(v, 8.4));
  const cheer = v > 9;
  actor('mongsil', 4470, GY2 - 2, 1.5, { look: v < 2.2 ? [.3, -.8] : [.9, .1], expr: cheer ? 'joy' : 'smile', aL: cheer ? 2.2 : .2, aR: cheer ? 2.2 : .2, hop: hopA(v, 9.2, .4, 26) + hopA(v, 9.9, .4, 20) });
  actor('gori', 4670, GY2, 1.5, { look: v < 2.2 ? [.2, -.8] : [.9, .2], aR: v > 2.5 && v < 4 ? 2.1 : cheer ? 2.2 : .2, aL: cheer ? 2.2 : .2, expr: cheer ? 'joy' : 'smile', hop: hopA(v, 2.5, .3, 18) + hopA(v, 9.05, .4, 26) + hopA(v, 9.75, .4, 20) });
  actor('ttukttak', 4870, GY2 + 2, 1.5, { look: v < 2.2 ? [0, -.8] : [.9, .2], aR: v > 4 && v < 5.4 ? 2.2 : cheer ? 2.2 : .2, aL: cheer ? 2.2 : .2, sq: v > 4.1 && v < 4.25 ? .9 : 1, expr: cheer || (v > 4 && v < 5.4) ? 'joy' : 'smile', hop: hopA(v, 4, .3, 20) + hopA(v, 9.3, .4, 26) + hopA(v, 10, .4, 20) });
  bubble(ctx, 5080, 700, 'AI 개선안', [224, 214, 250], v > 2.6 && v < 4 ? popK(v, 2.6) : 0); bubble(ctx, 5080, 700, '선생님 승인', [254, 236, 190], v > 4 && v < 5.4 ? popK(v, 4) : 0);
  // seasonal drift: leaves, snow, petals
  for (let i = 0; i < 26; i++) { const a = (v * .6 + hash(i)) % 1, x = 4200 + hash(i * 3) * 1900 + Math.sin(a * 9 + i) * 40 - a * 120, y = 100 + a * 900, s = SCR(x, y); if (aut > .2) drawLeaf(ctx, s[0], s[1], 9, a * 9 + i, Math.floor(v * 8) + i, i % 2 ? [236, 160, 80] : [226, 110, 70]); else if (win > .2) { ctx.fillStyle = `rgba(255,255,255,${.9 * win})`; ctx.beginPath(); ctx.arc(s[0], s[1], 3 + (i % 3), 0, TAU); ctx.fill(); } else if (v > 8.3 && i < 12) drawLeaf(ctx, s[0], s[1], 7, a * 9 + i, Math.floor(v * 8) + i, [250, 206, 216]); }
  img(BG.meadFG, 0, 1040, 1.12, cam.x, 690);
  finish(f, .5, 0);
}
function render(t) {
  t = clamp(t, 0, END); const f = Math.floor(t * FPS + 1e-6), tf = f / FPS; let sh = SHOTS[0]; for (const s of SHOTS) if (s[0] <= tf + 1e-9) sh = s; const u = tf - sh[0], id = sh[1];
  if (id === 'dawn' || id === 'catch' || id === 'final') sceneExt(tf, f, u, id); else if (id[0] === 'd') sceneDesk(tf, f, +id[1], u); else if (id === 'walk') sceneWalk(tf, f, u); else if (id === 'flow') sceneFlow(tf, f, u); else if (id === 'local') sceneLocal(tf, f, u); else sceneTree(tf, f, u);
  ST(1, 0, 0, 1, 0, 0); subs(tf);
}

// ───────────────────────── sound (synthesised) ─────────────────────────
let AC = null, OUT = null, NB = null, nodes = [];
function env(g, when, pts) { g.setValueAtTime(pts[0][1], when + pts[0][0]); for (let i = 1; i < pts.length; i++) g.linearRampToValueAtTime(pts[i][1], when + pts[i][0]); }
function nz(w, dur, type, f0, f1, q, pts) { const s = AC.createBufferSource(); s.buffer = NB; s.loop = true; const fl = AC.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, w); fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), w + dur); const g = AC.createGain(); env(g.gain, w, pts); s.connect(fl).connect(g).connect(OUT); s.start(w); s.stop(w + dur + .1); nodes.push(s); }
function tone(w, dur, type, f0, f1, pts) { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, w); o.frequency.exponentialRampToValueAtTime(Math.max(10, f1), w + dur); const g = AC.createGain(); env(g.gain, w, pts); o.connect(g).connect(OUT); o.start(w); o.stop(w + dur + .1); nodes.push(o); }
const pluck = (w, fq, vol, d) => { tone(w, d || .9, 'triangle', fq, fq, [[0, 0], [.012, vol], [.18, vol * .35], [d || .9, 0]]); tone(w, .5, 'sine', fq * 2, fq * 2, [[0, 0], [.01, vol * .3], [.5, 0]]); };
const pop = (w, fq) => tone(w, .14, 'sine', fq, fq * 1.6, [[0, 0], [.01, .07], [.14, 0]]);
const flut = (w, n) => { for (let i = 0; i < n; i++) nz(w + i * .09, .07, 'bandpass', 1800, 1100, 2, [[0, 0], [.015, .04], [.07, 0]]); };
const pad = (w, dur, vol, fqs) => { for (const fq of fqs) { tone(w, dur, 'sine', fq, fq, [[0, 0], [dur * .3, vol], [dur * .75, vol], [dur, 0]]); tone(w, dur, 'triangle', fq * 1.003, fq * 1.003, [[0, 0], [dur * .4, vol * .25], [dur, 0]]); } };
function audioSchedule(t0) {
  for (const n of nodes) { try { n.stop(); } catch (e) { } } nodes = []; const now = AC.currentTime + .06, at = (t, fn) => { if (t >= t0 - .01) fn(now + t - t0); };
  const N = { D3: 146.8, A2: 110, B2: 123.5, G2: 98, Fs3: 185, D4: 293.7, E4: 329.6, Fs4: 370, A4: 440, B4: 493.9, D5: 587.3, E5: 659.3, Fs5: 740, A5: 880 }, B = .375;
  at(0, w => { pad(w, 9.5, .035, [N.D3, 220, N.Fs4, N.A4]); nz(w, 9, 'lowpass', 500, 600, .5, [[0, 0], [2, .03], [9, .01]]); }); [[2.2, N.A4], [2.95, N.D5], [3.7, N.Fs5], [5.2, N.E5], [5.95, N.D5], [6.7, N.A4], [7.9, N.D5]].forEach(([t, n]) => at(t, w => pluck(w, n, .05, 1.4))); at(5.9, w => pop(w, 500)); at(8, w => pop(w, 700));
  // the overloaded room: plodding low pizzicato
  for (let i = 0; i < 25; i++) at(9 + i * .75, w => { pluck(w, [N.B2, N.Fs3, N.B2, N.G2][i % 4], .08, .5); if (i % 2) pluck(w + B, [N.D4, N.Fs4][i % 2] * .5, .03, .3); });
  for (let i = 0; i < 9; i++) at(9.2 + i * .5, w => nz(w, .09, 'lowpass', 500, 200, 1, [[0, 0], [.01, .1], [.09, 0]])); at(16.7, w => pluck(w, 392, .05, .6)); at(16.95, w => pluck(w, 415, .05, .8)); at(20.9, w => tone(w, .3, 'square', 300, 240, [[0, 0], [.01, .03], [.3, 0]]));
  at(24.5, w => { nz(w, 3, 'bandpass', 500, 1400, .8, [[0, 0], [.3, .14], [1.6, .1], [3, 0]]); flut(w + .1, 14); }); at(26, w => tone(w, 1.2, 'sine', 330, 196, [[0, 0], [.1, .04], [1.2, 0]]));
  at(28, w => { pad(w, 6.6, .03, [N.G2 * 2, 246.9, N.D4]); flut(w, 8); flut(w + 1.2, 5); });
  for (const t of [32, 32.5]) at(t, w => { tone(w, .22, 'sine', 70, 44, [[0, 0], [.015, .5], [.22, 0]]); tone(w + .13, .22, 'sine', 62, 40, [[0, 0], [.015, .32], [.22, 0]]); });
  at(33.4, w => { tone(w, 1.3, 'sine', 440, 1760, [[0, 0], [.1, .05], [1.3, 0]]); for (let i = 0; i < 8; i++) pop(w + .1 + i * .11, 700 + i * 90); });
  // walking tune (D pentatonic), carried through the middle of the film
  const mel = [N.D4, 0, N.Fs4, N.A4, 0, N.B4, N.A4, 0, N.Fs4, 0, N.E4, N.Fs4, N.A4, 0, N.D5, 0, N.B4, 0, N.A4, N.Fs4, 0, N.E4, N.D4, 0, N.E4, 0, N.Fs4, N.A4, N.B4, 0, N.A4, 0], bass = [N.D3, N.B2, N.G2, N.A2];
  for (let i = 0; 34.5 + i * B < 84; i++) { const t = 34.5 + i * B, dusk = t >= 64 && t < 72.5; at(t, w => { const n = mel[i % 32]; if (n) pluck(w, n * (dusk ? .5 : 1), dusk ? .04 : .055, .7); if (i % 4 === 0) pluck(w, bass[(i >> 3) % 4], .07, 1.2); if (i % 8 === 4) pluck(w, bass[(i >> 3) % 4] * 1.5, .035, .8); }); }
  for (const t of [35.7, 37.9, 41.9, 43.3, 46.4, 47.7, 48.1, 49.4, 51.7, 55.4, 56.3, 57.1, 58, 58.8, 59.7, 60.5, 67.2, 67.5, 69.6, 81, 81.1]) at(t, w => pop(w, 620 + (t * 37 % 300)));
  at(53.5, w => { tone(w, .18, 'sine', 120, 60, [[0, 0], [.01, .3], [.18, 0]]); }); at(76.6, w => tone(w, .18, 'sine', 120, 60, [[0, 0], [.01, .3], [.18, 0]])); at(73, w => flut(w, 6)); at(70.2, w => flut(w, 4));
  at(77.5, w => { tone(w, 3.4, 'sine', 330, 660, [[0, 0], [.4, .03], [3.4, 0]]); nz(w + .8, 1.4, 'highpass', 5000, 7000, .5, [[0, 0], [.4, .012], [1.4, 0]]); });
  // finale
  at(84, w => { pad(w, 21, .04, [N.D3, 220, N.D4, N.Fs4, N.A4]); pad(w + 10, 11, .03, [N.D5, N.A5 * .5 * 1.5, N.Fs5]); nz(w, 21, 'lowpass', 500, 700, .5, [[0, 0], [3, .05], [8, .08], [21, 0]]); });
  at(87, w => nz(w, 2.4, 'bandpass', 400, 1600, .8, [[0, 0], [.6, .16], [2.4, 0]])); at(88, w => { tone(w, 1.6, 'sine', 300, 900, [[0, 0], [.2, .05], [1.6, 0]]); nz(w, 3, 'bandpass', 900, 300, .8, [[0, 0], [.2, .2], [3, 0]]); });
  const fin = [N.D5, N.Fs5, N.A5, N.Fs5, N.E5, N.D5, N.A4, N.D5, N.E5, N.Fs5, N.A5, N.D5 * 2, N.A5, N.Fs5, N.E5, N.D5]; fin.forEach((n, i) => at(89 + i * .75, w => { pluck(w, n, .06, 1.6); if (i % 2 === 0) pluck(w, bass[(i >> 1) % 4], .07, 1.6); }));
  at(101, w => { for (const [n, d] of [[N.D4, 0], [N.Fs4, .12], [N.A4, .24], [N.D5, .36], [N.Fs5, .48]]) pluck(w + d, n, .06, 3); });
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
  base = from || 0; lastF = -1;
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
  paintExt(); paintInt(); paintMeadow(); mkGrain();
  window.__bench = () => { render(40); const a = performance.now(); for (let i = 1; i <= 5; i++) { render(40 + i / 24); ctx.getImageData(0, 0, 1, 1); } return (performance.now() - a) / 5; };
  { const q = new URLSearchParams(location.search).get('rs'); if (q) setRS(+q); else { const ms = window.__bench(); if (ms > 38) setRS(ms > 95 ? .5 : ms > 60 ? .66 : .8); } render(8.6); }
  msg.style.display = 'none'; btn.style.display = 'inline-block';
  const q = new URLSearchParams(location.search).get('t'); if (q !== null) { ui.style.display = 'none'; render(+q); }
  window.__ready = true; loop();
}, 60);
