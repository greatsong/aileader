// ───────────────────────── the story: one student, two teachers, one line ─────────────────────────
// 두근몽(학생) · 도란(담임) · 뚝딱(프로그램 담당) · 고리(짝) · 아롱(후기 설문) · 초롱(생기부) · 몽실(학교)
const FLY = [[126, 170, 226], [240, 150, 130], [150, 200, 150], [246, 206, 110], [190, 170, 236]], Yd = 702, Sd = 1.35;
function boardFlyers() { const b = BG.board; for (let i = 0; i < 12; i++) sheet(ctx, b[0] + 52 + (i % 4) * 76, b[1] + 58 + Math.floor(i / 4) * 92, 58, 74, (hash(i * 7) - .5) * .22, { head: FLY[i % 5], lines: 3, seed: i, lw: .6 }); }
function mark(x, y, ch, k, col) { if (k > 0) wtext(ctx, x, y - k * 10, ch, 64 * k, col || 'rgb(255,246,220)', { stroke: 'rgb(70,50,44)', rot: .12 }); }

// first counselling: starting from nothing
function sceneTalk1(t, f, u) {
  const v = q2(u); deskBase(t, f, 1320 + u * 4, 500, 1.4); boardFlyers();
  const ask = v > .8 && v < 3.3, ans = v > 3.3, lost = v > 4.7;
  actor('dugeun', 1120, Yd, Sd, { look: ans ? [.2, .7] : [.8, -.2], expr: ans ? 'worry' : 'smile', sweat: ans ? 1 + (Math.floor(v * 6) % 2) : 0, aL: ans ? 2.4 : .2, sq: ans ? .95 : 1, sprout: ans ? -.6 : Math.sin(v * 3) * .4 });
  actor('doran', 1400, Yd, Sd, { look: lost ? [1, -.8] : [-.8, 0], expr: lost ? 'worry' : 'smile', aL: ask ? 1.7 : .2, aR: lost ? 2.5 : .2, lean: ask ? -.08 : 0 });
  say(ctx, 1420, 410, ['요즘 어떤 것에', '관심이 있니?'], [222, 238, 250], ask ? popK(v, .8) : 0, -1);
  say(ctx, 1100, 420, ['음… 잘', '모르겠어요'], [255, 248, 228], ans ? popK(v, 3.3) : 0, 1);
  mark(1500, 470, '?', lost ? popK(v, 4.7) : 0);
  finish(f, .4, 0);
}
// the programme teacher, writing the same thing again and again
function sceneBusy(t, f, u) {
  const v = q2(u), dx = 500; deskBase(t, f, 690 + u * 5, 510, 1.42);
  const n = 12 + Math.floor(v * 4), ph = (v % .6) / .6, call = v > 3.6, sad = v > 5.7;
  stack(ctx, dx - 150, Yd, 120, n, 3); if (!call) sheet(ctx, dx - 150 + Math.sin(v * 9) * 12, lerp(200, Yd - n * 3.4 - 6, ph * ph), 118, 14, Math.sin(v * 13) * .2 * (1 - ph), { lines: 0, seed: 5, flat: true });
  ['계획서', '안내문', '기록'].forEach((nm, i) => sheet(ctx, dx + 150 + i * 106, Yd - 58, 76, 100, (i - 1) * .04, { head: FLY[i], lines: 4, seed: 20 + i, label: nm, lpx: 21, labelUp: true }));
  const P = call ? { look: sad ? [.2, .6] : [(Math.floor(v * 1.4) % 2 ? 1 : -1), -.2], expr: sad ? 'sigh' : 'smile', aL: sad ? .2 : 2.4, aR: .2, sq: sad ? .92 : 1 } : { look: [.7, .6], expr: 'worry', aR: .1 + (hash(Math.floor(v * 12)) - .5) * .5, lean: .06, sweat: 1 + (Math.floor(v * 6) % 2) };
  const r = actor('ttukttak', dx + 10, Yd, Sd, P);
  if (call) sheet(ctx, r.handL[0] - 16, r.handL[1] - (sad ? 10 : 46), 70, 90, -.1, { head: FLY[0], lines: 3, seed: 31 });
  say(ctx, dx + 150, 380, ['수학·정보 융합', '프로젝트 모집!'], [255, 236, 226], call && !sad ? popK(v, 3.7) : 0, 1);
  finish(f, .4, 0);
}
// the student leaves a picture and a reason
const extPath = k => [1470 - Math.pow(k, 1.5) * 760 + Math.sin(k * 5) * 60, 1396 + k * 504];
function scenePick(t, f, u) {
  const v = q2(u), G = 1662; cam.z = lerp(1.05, 1.32, sstep(u / 3)) - .22 * sstep((u - 6.4) / 1.6); cam.x = lerp(1200, 1040, sstep(u / 3)) + 200 * sstep((u - 6.4) / 1.6); cam.y = lerp(1330, 1450, sstep(u / 3)) - 90 * sstep((u - 6.4) / 1.6);
  WARM = .15; CEL.lw = 3; CEL.amp = .9; begin(); img(BG.skyA, 0, 0, .5, 1200, 1330); img(BG.ext, 0, 0, 1, 0, 0); mist(1290, 260, .3, 8, t, EW); wglow(1960, 1200, 900, [255, 236, 200], .45);
  const got = clamp((v - 1.6) / .5, 0, 1), gone = v > 6.3, beat = v >= 4.6 && v < 5.7, bp = beat ? ((v - 4.6) % .5) : 1;
  for (const [k, cx] of [[0, 1020], [1, 1120], [2, 1220]]) { if (k === 1 && got > 0) continue; card(ctx, cx, G + 8, k, { rot: (k - 1) * .05 }); }
  const P = { look: v < .5 ? [.5, .3] : v < 1 ? [.8, .3] : v < 1.6 ? [1, .3] : gone ? [.9, -.5] : [.2, -.7], sprout: beat ? 1 : Math.sin(v * 3) * .4 };
  if (v >= 1.6 && !gone) { P.aL = 2.3; P.aR = 2.3; P.expr = beat ? 'o' : 'joy'; P.hop = hopA(v, 2.15, .4, 30) + hopA(v, 2.7, .4, 20); if (beat) P.sq = bp < .09 ? 1.1 : bp < .18 ? .95 : 1; }
  if (gone) { P.aR = 2.1; P.expr = 'joy'; P.hop = hopA(v, 6.4, .4, 26); }
  const me = actor('dugeun', 860, G, 1.7, P), top = [me.top[0], me.top[1] - 50];
  if (got > 0 && !gone) { card(ctx, lerp(1120, top[0], got), lerp(G + 8, top[1] + 48, got) - Math.sin(got * Math.PI) * 40, 1, {}); if (v > 2.1 && v < 3) sparkle(ctx, top[0] + 56, top[1] - 30, 22 * popK(v, 2.1), 1); }
  say(ctx, 1150, 1330, ['숫자로 비교하며', '이유를 찾고 싶어요'], [255, 250, 232], v > 3.1 && !gone ? popK(v, 3.1) : 0, 1);
  if (beat) { const k = bp < .09 ? 1.25 : 1, s = SCR(me.mid[0], me.mid[1] + 10); sglow(s[0], s[1], 190 * k * cam.z, [255, 170, 150], .6); const hs = SCR(730, 1400 - (v - 4.6) * 30); ctx.fillStyle = 'rgb(240,120,130)'; ctx.save(); ctx.translate(hs[0], hs[1]); ctx.scale(k * 1.4 * cam.z, k * 1.4 * cam.z); ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -14, -30, 0, -10); ctx.bezierCurveTo(14, -30, 34, -4, 0, 20); ctx.fill(); ctx.restore(); }
  if (gone) { const pr = clamp((v - 6.4) / 1.5, 0, 1), pts = [[me.handR[0], me.handR[1]]], N = 26, upto = Math.floor(pr * N); for (let i = 0; i <= upto; i++) { const k = .5 * (1 - i / N); pts.push(extPath(k)); } pts[1] = [lerp(me.handR[0], pts[1][0], .5), pts[1][1] - 10]; goldLine(pts, 4.5); const hd = pts[pts.length - 1]; wglow(hd[0], hd[1], 90, [255, 240, 170], .9 * (1 - ramp(v, 8, 8.6))); sparkle(ctx, hd[0], hd[1], 26 * (1 - ramp(v, 8, 8.6)), Math.floor(v * 12)); for (let i = 2; i < upto; i += 3) { const q = extPath(.5 * (1 - i / N)); flowerC(ctx, q[0] + 20, q[1] + 6, 1, i); } if (pr >= 1) for (const w of BG.wins.slice(10, 16)) wglow(w[0], w[1], 40, [255, 226, 150], .8 * ramp(v, 7.9, 8.3)); }
  img(BG.extFG, 0, 1600, 1.1, 1200, 1330); finish(f, .5, 0);
}
// second counselling: the homeroom teacher already knows, and puts a programme in the basket
function sceneCounsel(t, f, u) {
  const v = q2(u), bx = 1545; deskBase(t, f, 1290 + u * 3, 500, 1.4); boardFlyers();
  if (v < 1.1) { const pr = clamp(v / 1, 0, 1), pts = []; for (let i = 0; i <= 12 * pr; i++) pts.push([lerp(560, 1370, i / 12), 560 + Math.sin(i / 12 * Math.PI) * -60 + (i / 12) * 100]); goldLine(pts, 4); if (pts.length) { const h = pts[pts.length - 1]; wglow(h[0], h[1], 80, [255, 240, 170], .9); } }
  // baskets and flyers from three departments
  cel(ctx, [SCR(bx - 50, Yd - 54, 1), SCR(bx + 50, Yd - 54, 1), SCR(bx + 38, Yd, 1), SCR(bx - 38, Yd, 1)], { fill: tint([214, 170, 110]), shade: tint([176, 130, 84]), off: [-5, -4], lw: 1, seed: 6 });
  const names = ['과학', '수리정보', '진로진학'], fx = [960, 1080, 1200], chosen = v > 4.8, e = clamp((v - 5.3) / .7, 0, 1);
  names.forEach((nm, i) => { const k = popK(v, 2.2 + i * .3); if (k <= 0 || (v > 6 && i !== 1)) return; if (i === 1 && chosen) { if (e >= 1) return; const x = lerp(fx[1], bx, e), y = lerp(Yd - 58, Yd - 70, e) - Math.sin(e * Math.PI) * 130 - hopA(v, 4.8, .4, 24); wglow(x, y, 110, [255, 236, 150], .6); sheet(ctx, x, y, 80, 104, e * .5, { head: FLY[0], lines: 4, seed: 41, label: e > 0 ? null : nm, lpx: 22, labelUp: true }); return; } sheet(ctx, fx[i], Yd - 58 * k, 80 * k, 104 * k, (i - 1) * .05, { head: FLY[[2, 0, 4][i]], lines: 4, seed: 40 + i, label: k > .9 ? nm : null, lpx: 22, labelUp: true }); });
  if (e >= 1) sheet(ctx, bx - 4, Yd - 76, 70, 86, .12, { head: FLY[0], lines: 3, seed: 41 });
  cel(ctx, [SCR(bx - 52, Yd - 40, 1), SCR(bx + 52, Yd - 40, 1), SCR(bx + 38, Yd, 1), SCR(bx - 38, Yd, 1)], { fill: tint([214, 170, 110]), shade: tint([176, 130, 84]), off: [-5, -4], lw: 1, seed: 8 + (e >= 1 && v < 6.2 ? 1 : 0) }); for (let i = -2; i <= 2; i++) cel(ctx, [SCR(bx + i * 19, Yd - 38), SCR(bx + i * 15, Yd - 2)], { closed: false, lw: .5, seed: i + 9, line: 'rgb(140,100,70)' });
  if (v > 1) card(ctx, 1318, Yd, 1, { rot: -.06 }); if (v > 1 && v < 2) sparkle(ctx, 1360, Yd - 110, 22 * popK(v, 1), 3);
  const here = clamp((v - 6.2) / 1.5, 0, 1), sx = lerp(760, 1180, sstep(here)), tell = v > 7.8;
  actor('doran', 1440, Yd, Sd, { look: v < 1 ? [-.9, -.3] : v < 2.2 ? [-.8, .6] : v < 3.6 ? [-1, .2] : v < 4.8 ? [-.9 + (Math.floor(v * 2) % 3) * .2, .2] : v < 6.1 ? [.8, .2] : [-.9, 0], expr: (v > 1.1 && v < 2.2) || v > 4.8 ? 'joy' : 'smile', aL: tell ? 1.8 : chosen && v < 5.4 ? 2 : .2, aR: e > 0 && e < 1 ? 1.8 : .2, hop: hopA(v, 1.1, .3, 18) + hopA(v, 8.7, .35, 16) });
  mark(1500, 480, '!', v > 1.1 && v < 2.1 ? popK(v, 1.1) : 0, 'rgb(255,226,130)');
  if (v > 6.2) actor('dugeun', sx, Yd, Sd, { look: [.8, tell ? -.2 : 0], walk: here < 1 ? sx / 56 : null, hop: (here < 1 ? Math.abs(Math.sin(sx / 56 * TAU)) * 4 : 0) + hopA(v, 8.6, .4, 30) + hopA(v, 9.2, .4, 22), expr: v > 8.5 ? 'joy' : 'smile', aL: v > 8.5 ? 2.2 : .2, aR: v > 8.5 ? 2.2 : .2, sprout: v > 8.5 ? 1 : Math.sin(v * 3) * .4 });
  say(ctx, 1400, 395, ['네 관심에 꼭 맞는', '프로그램이 있어!'], [222, 238, 250], tell ? popK(v, 7.8) : 0, -1);
  if (e >= 1) wtext(ctx, bx, Yd - 150 - popK(v, 6) * 6, '담아 주기', 26 * popK(v, 6), 'rgb(255,246,220)', { stroke: 'rgb(84,60,48)' });
  finish(f, .45, 0);
}
// the review: what was good, what could be better
function sceneReview(t, f, u) {
  const v = q2(u), x0 = 3040, ax = 3290, gy = x => pathY(x) - 2; cam.x = 3290 + u * 6; cam.y = 770; cam.z = 1.42; WARM = .1; CEL.lw = 3; CEL.amp = .9; begin(); img(BG.mead, 0, 0, 1, 0, 0, 1.3);
  const pr = clamp((v - 6) / 1.5, 0, 1); if (pr > 0) { const pts = []; for (let x = ax + 60; x <= ax + 60 + pr * 560; x += 30) pts.push([x, pathY(x) + 8]); goldLine(pts, 5); for (let i = 0; i < 6; i++) { const fx = ax + 110 + i * 90; if (fx < ax + 60 + pr * 560) flowerC(ctx, fx, pathY(fx) + 22, 1, i); } }
  sign(ctx, 3620, gy(3620) + 6, '다음 상담', popK(v, 6.7)); sign(ctx, 3850, gy(3850) + 6, '내년 개선', popK(v, 7.2));
  const e1 = clamp((v - 2.9) / .4, 0, 1), e2 = clamp((v - 5.6) / .4, 0, 1), got = (e1 >= 1 ? 3 : 0) + (e2 >= 1 ? 3 : 0);
  actor('arong', ax, gy(ax), 1.5, { look: [-.8, -.3], lines: got, expr: e2 >= 1 ? 'joy' : 'smile', aL: (v > 2.6 && v < 3.5) || (v > 5.3 && v < 6.2) ? 1.9 : .2, sq: (e1 >= 1 && v < 3.45) || (e2 >= 1 && v < 6.15) ? 1.07 : 1, hop: hopA(v, 6.2, .35, 22) });
  actor('dugeun', x0, gy(x0), 1.5, { look: v < 3.3 ? [.5, -.5] : v < 6 ? [.6, .2] : [.9, 0], expr: v < 3 ? 'joy' : v < 5.6 ? 'smile' : 'joy', aL: v < 3 ? 1.8 : .2, aR: v > 3.4 && v < 5.6 ? 1.6 : v > 6.4 ? 2.2 : .2, sprout: Math.sin(v * 3) * .4, hop: hopA(v, 6.5, .4, 24) });
  if (v > .4 && e1 < 1) say(ctx, lerp(3020, ax - 10, e1), lerp(540, gy(ax) - 110, e1), ['실제 자료를 직접', '분석해서 좋았어요'], [206, 238, 206], popK(v, .4) * (1 - e1 * .75), 1);
  if (v > 3.4 && e2 < 1) say(ctx, lerp(3020, ax - 10, e2), lerp(540, gy(ax) - 110, e2), ['파이썬 설명은', '조금 빨랐어요'], [252, 220, 190], popK(v, 3.4) * (1 - e2 * .75), 1);
  if (v < 1.9) { wtext(ctx, ax + 10, gy(ax) - 262, '후기 설문 자동 생성', 30 * popK(v, .15), 'rgb(255,246,220)', { stroke: 'rgb(84,60,48)' }); sparkle(ctx, ax + 150, gy(ax) - 290, 22 * popK(v, .15), 2); }
  img(BG.meadFG, 0, 1010, 1.12, cam.x, 770); finish(f, .5, 0);
}

