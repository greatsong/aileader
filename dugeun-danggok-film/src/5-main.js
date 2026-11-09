// ───────────────────────── direction: scenes, camera, compositing, subtitles ─────────────────────────
const cv = document.getElementById('c'), ctx = cv.getContext('2d'); let RS = 1; cv.width = W; cv.height = H;
function ST(a, b, c, d, e, f) { ctx.setTransform(a * RS, b * RS, c * RS, d * RS, e * RS, f * RS); }
function setRS(r) { RS = r; cv.width = Math.round(W * r); cv.height = Math.round(H * r); }
const soft = mkCanvas(W / 8, H / 8), sg = soft.getContext('2d'), END = 135.4;
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
function subs(t) { for (const s of SUBS) if (t >= s[0] && t < s[1]) title(s[2], H - 92, 43, 1); }

// ── exterior: dawn opening / catching the page / golden finale
function sceneExt(t, f, u, mode) {
  const v = q2(u), fin = mode === 'final'; let cy = 1330, cx = 1200, z = 1;
  if (mode === 'dawn') cy = lerp(570, 1330, sstep((u - 1) / 5.5)); else cy = lerp(1330, 650, sstep((u - 4.7) / 5.2));
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
  } else {
    // finale: everyone gathers, the kite goes up on the one golden line
    const cast = [['gori', 520, -1], ['ttukttak', 700, -1], ['doran', 880, -1], ['dugeun', 1060, -1], ['arong', 1440, 1], ['chorong', 1620, 1], ['mongsil', 1810, 1]];
    const q = v - 4, flying = q > 0, kx = flying ? 1250 + 560 * sstep(q / 6) + 70 * Math.sin(q * .8) : 1250, ky = flying ? 1570 - 1270 * (1 - Math.exp(-q * .55)) + 26 * Math.sin(q * 1.3) : GYe;
    let hand = [1090, 1560];
    cast.forEach(([k, x, side], i) => { const arr = .5 + i * .28, e = clamp((v - arr) / 1.5, 0, 1), px = x + side * (1 - sstep(e)) * 820 * (side < 0 ? 1 : 1) * (side < 0 ? -1 : 1) * -1 * side * side * (side < 0 ? -1 : 1), P = { flip: 1 };
      const xx = x + (side < 0 ? -1 : 1) * (1 - sstep(e)) * 820; if (e < 1 && v >= arr) P.walk = xx / 60; if (v < arr) return;
      P.look = flying ? [clamp((kx - x) / 500, -1, 1), -1] : v > 2.9 ? [clamp((1250 - x) / 300, -1, 1), 0] : [side < 0 ? .6 : -.6, 0];
      if (v > 3 && v < 4) P.lean = -.06 * Math.sin((v - 3) * 9); if (flying) { P.expr = 'joy'; const wv = Math.floor(v * 4 + i) % 2; P.aR = 1.7 + wv * .6; P.aL = k === 'dugeun' ? .3 : 1.5 + (1 - wv) * .6; P.hop = hopA((v + i * .37) % 1.8, 0, .4, 22); } if (k === 'dugeun') { P.sprout = Math.sin(v * 4) * .6; if (flying || v > 2.6) P.aR = 2.2; }
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
function sceneFlow(t, f, u) {
  const v = q2(u), dx = 500, Y = 702, names = ['설계', '기안문', '운영계획서', '출석', '설문', '결과 보고', '학교 양식'], cols = [[126, 170, 226], [240, 150, 130], [150, 200, 150], [246, 206, 110], [190, 170, 236], [240, 150, 130], [150, 200, 150]];
  deskBase(t, f, lerp(790, 1090, sstep(u / 5)) - 230 * sstep((u - 5.2) / 1.6), 500, 1.3);
  stack(ctx, dx - 170, Y, 120, Math.max(4, 44 - Math.floor(Math.max(0, v - 1) * 9)), 3);
  const ly = x => 560 - (x - 560) * .13 + Math.sin((x - 560) / 1160 * Math.PI) * 26, last = Math.min(7, Math.floor((v - 1.2) / .55) + 1), ex = v < 1 ? 0 : Math.min(1720, 760 + (v - 1) * 240);
  if (ex > 0) { const pts = []; for (let x = 560; x <= ex; x += 30) pts.push([x, ly(x)]); goldLine(pts, 3.4); }
  for (let i = 0; i < 7; i++) { const t0 = 1.2 + i * .55, k = popK(v, t0); if (k <= 0) continue; const x = 790 + i * 132, sw = Math.sin((v - t0) * 5) * .16 * Math.exp(-(v - t0) * 1.5); sheet(ctx, x + sw * 50, ly(x) + 66 * k, 90 * k, 116 * k, sw, { head: cols[i], lines: 4, seed: i + 3, label: k > .9 ? names[i] : null, lpx: 21 }); const c = SCR(x, ly(x) + 4); ctx.fillStyle = 'rgb(150,110,80)'; ctx.fillRect(c[0] - 4 * cam.z, c[1] - 9 * cam.z, 8 * cam.z, 20 * cam.z); if (v - t0 < .3) sparkle(ctx, x + 50, ly(x) + 10, 20, i); }
  if (v > .6) sheet(ctx, 640, Y - 62 * popK(v, .6), 92 * popK(v, .6), 120 * popK(v, .6), -.05, { head: [120, 180, 130], lines: 4, seed: 1, label: '교육계획서', lpx: 20, labelUp: true });
  const inv = v > 5.6, fly = clamp((v - 7.3) / 1.1, 0, 1);
  const tt = actor('ttukttak', dx + 20, Y, 1.35, { expr: inv ? 'joy' : v < .6 ? 'worry' : 'smile', look: inv ? [-.5, -.4] : v < .6 ? [-1, -.6] : [clamp(.3 + last * .1, 0, 1), -.3], handle: v > .6 && v < 1.2 ? (Math.floor(v * 12) % 2) * 5 : 0, aR: v > 1 && !inv ? 1.5 : .2, aL: inv && fly < .1 ? 2.3 : .2, hop: hopA(v, 5.6, .35, 22) });
  if (inv && fly < 1) { const ex0 = tt.handL[0] - 10, ey0 = tt.handL[1] - 34, x = lerp(ex0, dx - 760, fly * fly), y = ey0 - Math.sin(fly * 3) * 60; if (fly > 0) { const pts = []; for (let i = 0; i <= 10; i++) pts.push([lerp(ex0, x, i / 10), ey0 - Math.sin(fly * 3 * i / 10) * 60]); goldLine(pts, 3); } sheet(ctx, x, y, 84, 58, -.1 + fly * .5, { lines: 2, seed: 60, head: [250, 214, 120] }); wglow(x, y, 90, [255, 232, 150], .5); }
  say(ctx, dx + 130, 370, ['두근몽에게', '모집 안내 보내기'], [255, 250, 232], v > 5.8 && v < 8.6 ? popK(v, 5.8) : 0, 1);
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
function sceneTree(t, f, u) {
  const v = q2(u), GY2 = 906, soil = [5090, 912]; cam.x = 5010 - 70 * (1 - sstep(u / 10)); cam.y = 690; cam.z = 1.25; WARM = .15; CEL.lw = 3; CEL.amp = .9; begin();
  img(BG.mead, 0, 0, 1, 0, 0);
  const aut = ramp(v, 4.8, 5.6) * (1 - ramp(v, 6.3, 6.9)), win = ramp(v, 6.3, 6.9) * (1 - ramp(v, 7.6, 8.3));
  if (aut > 0) tintAll([255, 150, 60], .42 * aut); if (win > 0) { tintAll([170, 200, 255], .5 * win); ctx.fillStyle = `rgba(244,248,255,${.22 * win})`; ctx.fillRect(0, 0, W, H); }
  // the leaf that carries one line of feedback
  const e = clamp((v - .4) / 1.8, 0, 1); if (v > .4 && v < 4.9) { const lx = lerp(4770, soil[0], e) + Math.sin(e * 10) * 50 * (1 - e), ly = lerp(640, soil[1] - 8, e * e) - Math.sin(e * Math.PI) * 190, s = SCR(lx, ly); drawLeaf(ctx, s[0], s[1], 30, e < 1 ? Math.sin(e * 12) * 1.2 : .15, e < 1 ? Math.floor(v * 8) : 0, [236, 196, 96]); if (e >= 1) { wglow(lx, ly, 120, [255, 230, 150], ramp(v, 2.4, 3) * .8); for (let i = 0; i < 5; i++) sparkle(ctx, lx + Math.cos(i * 1.3 + v * 3) * 70, ly - 30 + Math.sin(i * 1.3 + v * 3) * 36, 12 * ramp(v, 2.5, 2.8), i + Math.floor(v * 6)); } }
  // sapling through the seasons
  if (v > 5) { const g = easeOut((v - 5) / 3.4), hgt = 250 * g, top = [soil[0] + 14 * g, soil[1] - hgt], q = k => [soil[0] + Math.sin(k * 3) * 10 * g + 14 * g * k, soil[1] - hgt * k]; cel(ctx, [0, .25, .5, .75, 1].map(k => SCR(...q(k))), { closed: false, lw: 1.5 + g, line: 'rgb(96,132,70)', seed: 4, taper: 0 });
    for (let i = 0; i < 7; i++) { const k0 = .2 + i * .12; if (g < k0) continue; const p = q(Math.min(1, k0 + .04)), m = i % 2 ? 1 : -1, sz = 26 * clamp((g - k0) * 5, 0, 1), s = SCR(p[0] + m * sz * .9, p[1] - sz * .3); drawLeaf(ctx, s[0], s[1], sz, m > 0 ? -.4 : Math.PI + .4, 0, [170, 214, 104]); }
    if (v > 8.6) for (let i = 0; i < 6; i++) { const p = q(.45 + i * .1); flowerC(ctx, p[0] + (i % 2 ? 30 : -30), p[1] + 6, popK(v, 8.6 + i * .09), i + 2); } wglow(top[0], top[1], 160, [255, 240, 170], .35 * g); }
  sign(ctx, 5210, GY2 + 6, '2027', popK(v, 8.4));
  const cheer = v > 9;
  actor('mongsil', 4530, GY2 - 2, 1.5, { look: v < 2.2 ? [.3, -.8] : [.9, .1], expr: cheer ? 'joy' : 'smile', aL: cheer ? 2.2 : .2, aR: cheer ? 2.2 : .2, hop: hopA(v, 9.2, .4, 26) + hopA(v, 9.9, .4, 20) });
  actor('dugeun', 4710, GY2, 1.5, { look: v < 2.2 ? [.7, -.5] : v > 9.4 ? [-.9, 0] : [.9, .2], aR: v < .9 ? 2.3 : cheer ? 2.2 : .2, aL: cheer ? 2.2 : .2, expr: cheer ? 'joy' : 'smile', hop: hopA(v, 9.05, .4, 26) + hopA(v, 9.75, .4, 20) });
  if (v > 8.8) { const e2 = clamp((v - 8.8) / 1.7, 0, 1), nx = lerp(4000, 4370, sstep(e2)); actor('dugeun', nx, GY2 + 4, 1.08, { band: false, look: [.8, -.2], walk: e2 < 1 ? nx / 44 : null, expr: e2 >= 1 ? 'joy' : 'smile', aR: e2 >= 1 ? 2.1 : .2, sprout: Math.sin(v * 5) * .6, hop: hopA(v, 10.6, .35, 18) }); }
  actor('ttukttak', 4890, GY2 + 2, 1.5, { look: v < 2.2 ? [0, -.8] : [.9, .2], aR: v > 4 && v < 5.4 ? 2.2 : cheer ? 2.2 : .2, aL: cheer ? 2.2 : .2, sq: v > 4.1 && v < 4.25 ? .9 : 1, expr: cheer || (v > 4 && v < 5.4) ? 'joy' : 'smile', hop: hopA(v, 4, .3, 20) + hopA(v, 9.3, .4, 26) + hopA(v, 10, .4, 20) });
  say(ctx, 4800, 560, ['“설명이 조금 빨랐어요”'], [252, 226, 200], v > .5 && v < 2.5 ? popK(v, .5) : 0, 1); bubble(ctx, 5080, 700, 'AI 개선안', [224, 214, 250], v > 2.6 && v < 4 ? popK(v, 2.6) : 0); bubble(ctx, 5080, 700, '선생님 승인', [254, 236, 190], v > 4 && v < 5.4 ? popK(v, 4) : 0);
  // seasonal drift: leaves, snow, petals
  for (let i = 0; i < 26; i++) { const a = (v * .6 + hash(i)) % 1, x = 4200 + hash(i * 3) * 1900 + Math.sin(a * 9 + i) * 40 - a * 120, y = 100 + a * 900, s = SCR(x, y); if (aut > .2) drawLeaf(ctx, s[0], s[1], 9, a * 9 + i, Math.floor(v * 8) + i, i % 2 ? [236, 160, 80] : [226, 110, 70]); else if (win > .2) { ctx.fillStyle = `rgba(255,255,255,${.9 * win})`; ctx.beginPath(); ctx.arc(s[0], s[1], 3 + (i % 3), 0, TAU); ctx.fill(); } else if (v > 8.3 && i < 12) drawLeaf(ctx, s[0], s[1], 7, a * 9 + i, Math.floor(v * 8) + i, [250, 206, 216]); }
  img(BG.meadFG, 0, 1040, 1.12, cam.x, 690);
  finish(f, .5, 0);
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
  window.__bench = () => { render(56); const a = performance.now(); for (let i = 1; i <= 5; i++) { render(56 + i / 24); ctx.getImageData(0, 0, 1, 1); } return (performance.now() - a) / 5; };
  { const q = new URLSearchParams(location.search).get('rs'); if (q) setRS(+q); else { const ms = window.__bench(); if (ms > 38) setRS(ms > 95 ? .5 : ms > 60 ? .66 : .8); } render(8.6); }
  msg.style.display = 'none'; btn.style.display = 'inline-block';
  const q = new URLSearchParams(location.search).get('t'); if (q !== null) { ui.style.display = 'none'; render(+q); }
  window.__ready = true; loop();
}, 60);
