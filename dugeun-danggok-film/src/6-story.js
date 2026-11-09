// ───────────────────────── the story: one student, two teachers, one line ─────────────────────────
// 두근몽(학생) · 도란(담임) · 뚝딱(프로그램 담당) · 고리(짝) · 아롱(후기 설문) · 초롱(생기부) · 몽실(학교)
const SHOTS = [[0, 'dawn'], [8.6, 'c1'], [15, 'c2'], [22, 'pick'], [31, 'c3'], [41, 'flow'], [50, 'class'], [70, 'review'], [78, 'record'], [86, 'local'], [94.5, 'c4'], [102.5, 'tree'], [114, 'final']];
const SUBS = [
  [9, 14.6, '상담은 늘, 처음부터 묻는 것으로 시작했습니다'],
  [15.4, 18.6, '프로그램 담당 선생님은 같은 내용을 계획서에, 안내문에, 기록에 다시 쓰고'], [18.9, 21.7, '좋은 프로그램을 열어도, 꼭 맞는 학생에게 닿기 어려웠습니다'],
  [22.5, 26.4, '탐색 앱에서 마음이 가는 그림을 고르고, 끌린 이유를 남깁니다'], [28.2, 30.8, '그 한 줄이, 선생님에게 먼저 닿습니다'],
  [31.4, 35, '담임 선생님은 상담 전에 학생의 관심을 먼저 봅니다'], [35.4, 40.6, '여러 부서의 프로그램 가운데, 그 학생에게 맞는 것을 골라 담아 줍니다'],
  [41.4, 45.4, '담당 선생님의 문서는 교육계획서 하나에서 설계, 기안문, 운영계획서로 이어지고'], [45.8, 49.7, '담기는 신청이 아니라 연결입니다 — 모집 때 담당 선생님이 먼저 안내합니다'],
  [50.4, 54.2, '수학·정보 융합 프로젝트 — 우리 학교 전력 사용량을 직접 분석합니다'], [54.6, 59.8, '선생님의 피드백 한마디에, 학생은 계산 기준을 바꾸고'], [60.2, 64.6, '짝에게 이유를 설명하며 결론을 다시 세웁니다'], [65, 69.7, '선생님은 그 과정을 출석과 함께 관찰 메모로 남깁니다'],
  [70.4, 73.8, '프로그램이 끝나면, 학생은 짧은 후기를 남깁니다'], [74.2, 77.7, '좋았던 점은 다음 상담으로, 아쉬운 점은 내년 개선으로 이어집니다'],
  [78.4, 81.8, '확인한 관찰과 결과물로, 학생마다 다른 생기부 초안이 써집니다'], [82.1, 85.7, 'AI는 초안을 쓰고 — 읽고, 고치고, 확인하는 것은 선생님입니다'],
  [86.4, 89.8, '학급 기록은 웹에 올리지 않고, 교사 PC 안에서만 다룹니다'], [90.1, 94.2, '분량이 넘치면 AI가 두 안을 내고, 고르는 것은 담임 선생님입니다'],
  [95, 98.4, '다음 상담은, 실제 경험에서 시작합니다'], [98.8, 102.2, '학생의 다음 질문도 거기서 자랍니다'],
  [103, 106.6, '아쉬웠던 한 줄은 선생님 의견과 만나 AI 개선안이 되고'], [106.9, 110.4, '선생님이 승인하면 2027 교육계획서에 담깁니다'], [110.7, 113.7, '담당자가 바뀌어도, 다음 학생에게 개선은 남습니다'],
  [114.5, 118.6, '앱은 따로, 경험은 이어서'], [121.4, 124.3, 'AI는 조언하고, 확인은 선생님이 합니다']];
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
// the programme itself: feedback changes the student's thinking
function sceneClass(t, f, u) {
  const v = q2(u), b = BG.board, c1 = [b[0] + 86, b[1] + 150], c2 = [b[0] + 244, b[1] + 150]; deskBase(t, f, 1390 + u * 2.5, 478, 1.32);
  chart(ctx, c1[0], c1[1], 0, popK(v, .3), '공간별 총량'); chart(ctx, c2[0], c2[1], 1, popK(v, 10.5), '좌석당·시간대별'); if (v > 10.5 && v < 11.2) sparkle(ctx, c2[0] + 70, c2[1] - 90, 26 * popK(v, 10.5), 4);
  const think = v > 4.6 && v < 7, work = v >= 7 && v < 10.5, tell = v >= 11 && v < 14.6, conc = v >= 14.8, cheer = v > 17.8;
  sheet(ctx, 1100, Yd - 8, 110, 76, .05, { fore: .34, lines: work ? 4 : 2, grow: work ? (v - 7) / 3 : 1, seed: 70 });
  // 짝
  actor('gori', 985, Yd, Sd, { look: work ? [.8, .6] : tell ? [.9, -.1] : conc ? [1, -.5] : [.9, -.4], expr: (v > 12.6 && v < 14.6) || cheer ? 'joy' : tell ? 'o' : 'smile', aR: work ? .3 + (hash(Math.floor(v * 12) + 5) - .5) * .4 : .2, aL: cheer ? 2.2 : .2, sq: v > 12.6 && v < 12.78 ? .92 : 1, hop: hopA(v, 17.9, .4, 26) + hopA(v, 18.6, .4, 20) });
  // 학생
  const P = { sprout: Math.sin(v * 3) * .4, look: [.9, -.5] };
  if (v > .8 && v < 3.5) { P.aR = 2.1; P.expr = 'joy'; P.hop = hopA(v, .8, .35, 22); }
  if (v >= 3.6 && v < 4.6) { P.expr = 'o'; P.look = [.9, -.2]; P.sprout = 1; }
  if (think) { P.look = [.1, .7]; P.aL = 2.5; P.expr = 'worry'; P.sprout = -.5; P.sq = .97; }
  if (work) { P.look = [-.6, .7]; P.lean = -.1; P.aL = .1 + (hash(Math.floor(v * 12)) - .5) * .5; P.expr = v > 9.6 ? 'o' : 'smile'; P.sprout = v > 9.6 ? 1 : 0; }
  if (v >= 10.5 && v < 11) { P.expr = 'joy'; P.hop = hopA(v, 10.5, .4, 34); P.aL = 2.2; P.aR = 2.2; P.look = [1, -.7]; }
  if (tell) { P.look = [-.9, -.1]; P.aL = 1.6 + (Math.floor(v * 3) % 2) * .5; P.expr = 'joy'; }
  if (conc) { P.look = [.9, -.6]; P.aR = 2.1; P.expr = 'joy'; P.hop = hopA(v, 14.8, .35, 22) + hopA(v, 17.9, .4, 30) + hopA(v, 18.6, .4, 22); if (cheer) P.aL = 2.2; }
  actor('dugeun', 1215, Yd, Sd, P);
  // 선생님
  const fb = v > 3.6 && v < 7, note = v > 15.4;
  const tk = actor('ttukttak', 1440, Yd, Sd, { look: fb || work ? [-.9, .1] : conc ? [-.8, 0] : [-.6, -.3], aL: fb ? 1.6 : cheer ? 2.2 : .2, aR: note ? 1.7 : .2, lean: fb ? -.1 : 0, expr: conc ? 'joy' : 'smile', sq: v > 15 && v < 15.18 ? .92 : 1, hop: hopA(v, 18.1, .4, 22) });
  if (note) { const k = popK(v, 15.4); sheet(ctx, tk.handR[0] + 26, tk.handR[1] - 50 * k, 84 * k, 100 * k, .08, { head: [246, 206, 110], lines: 3, grow: clamp((v - 15.6) / 1.4, 0, 1), seed: 77, label: k > .9 ? '관찰 메모' : null, lpx: 21, labelUp: true }); if (v > 16.9) wtext(ctx, tk.handR[0] + 52, tk.handR[1] - 22, '✓', 34 * popK(v, 16.9), 'rgb(222,84,70)'); }
  mark(1235, 500, '…', think ? popK(v, 4.8) : 0); mark(1250, 500, '!', v > 9.6 && v < 10.5 ? popK(v, 9.6) : 0, 'rgb(255,226,130)');
  say(ctx, 1150, 385, ['점심시간에', '불을 끄면 돼요!'], [255, 250, 232], v > .9 && v < 3.5 ? popK(v, .9) : 0, -1);
  say(ctx, 1330, 372, ['좌석 한 개당, 시간대별로', '다시 계산해 볼까?'], [255, 232, 222], fb ? popK(v, 3.7) : 0, -1);
  say(ctx, 1120, 385, ['총량이 아니라', '비율로 봐야 해!'], [255, 250, 232], tell ? popK(v, 11.1) : 0, -1);
  say(ctx, 1190, 372, ['빈 정보실의 모니터', '대기전력을 줄이자!'], [255, 250, 232], conc && v < 17.7 ? popK(v, 14.9) : 0, -1);
  finish(f, .45, 0);
}
// the review: what was good, what could be better
function sceneReview(t, f, u) {
  const v = q2(u), x0 = 3040, ax = 3290, gy = x => pathY(x) - 2; cam.x = 3290 + u * 6; cam.y = 770; cam.z = 1.42; WARM = .1; CEL.lw = 3; CEL.amp = .9; begin(); img(BG.mead, 0, 0, 1, 0, 0);
  const pr = clamp((v - 6) / 1.5, 0, 1); if (pr > 0) { const pts = []; for (let x = ax + 60; x <= ax + 60 + pr * 560; x += 30) pts.push([x, pathY(x) + 8]); goldLine(pts, 5); for (let i = 0; i < 6; i++) { const fx = ax + 110 + i * 90; if (fx < ax + 60 + pr * 560) flowerC(ctx, fx, pathY(fx) + 22, 1, i); } }
  sign(ctx, 3620, gy(3620) + 6, '다음 상담', popK(v, 6.7)); sign(ctx, 3850, gy(3850) + 6, '내년 개선', popK(v, 7.2));
  const e1 = clamp((v - 2.9) / .4, 0, 1), e2 = clamp((v - 5.6) / .4, 0, 1), got = (e1 >= 1 ? 3 : 0) + (e2 >= 1 ? 3 : 0);
  actor('arong', ax, gy(ax), 1.5, { look: [-.8, -.3], lines: got, expr: e2 >= 1 ? 'joy' : 'smile', aL: (v > 2.6 && v < 3.5) || (v > 5.3 && v < 6.2) ? 1.9 : .2, sq: (e1 >= 1 && v < 3.45) || (e2 >= 1 && v < 6.15) ? 1.07 : 1, hop: hopA(v, 6.2, .35, 22) });
  actor('dugeun', x0, gy(x0), 1.5, { look: v < 3.3 ? [.5, -.5] : v < 6 ? [.6, .2] : [.9, 0], expr: v < 3 ? 'joy' : v < 5.6 ? 'smile' : 'joy', aL: v < 3 ? 1.8 : .2, aR: v > 3.4 && v < 5.6 ? 1.6 : v > 6.4 ? 2.2 : .2, sprout: Math.sin(v * 3) * .4, hop: hopA(v, 6.5, .4, 24) });
  if (v > .4 && e1 < 1) say(ctx, lerp(3020, ax - 10, e1), lerp(540, gy(ax) - 110, e1), ['실제 자료를 직접', '분석해서 좋았어요'], [206, 238, 206], popK(v, .4) * (1 - e1 * .75), 1);
  if (v > 3.4 && e2 < 1) say(ctx, lerp(3020, ax - 10, e2), lerp(540, gy(ax) - 110, e2), ['파이썬 설명은', '조금 빨랐어요'], [252, 220, 190], popK(v, 3.4) * (1 - e2 * .75), 1);
  img(BG.meadFG, 0, 1010, 1.12, cam.x, 770); finish(f, .5, 0);
}
// the record: AI drafts from confirmed observation, the teacher reads, edits, confirms
function sceneRecord(t, f, u) {
  const v = q2(u), dx = 500, px = dx + 270, py = 470; deskBase(t, f, 700 + u * 4, 500, 1.42, true);
  const ch = actor('chorong', dx - 170, Yd, Sd, { lit: true, look: [.9, -.3], lean: .1, expr: v > 6 ? 'joy' : 'smile', hop: hopA(v, 6.1, .35, 18) }); wglow(ch.top[0], ch.top[1] + 20, 340, [255, 226, 150], .7); wglow(px - 40, py, 520, [255, 220, 150], .4);
  const grow = clamp((v - 1.3) / 2.2, 0, 1);
  sheet(ctx, px, py, 220, 300, -.02, { lines: 10, rows: 10, grow, seed: 5, head: [190, 170, 236], label: '생기부 초안', lpx: 23, labelUp: true });
  if (grow > .45) { const a = SCR(px - 82, py - 26), bb = SCR(px + 70, py - 4); ctx.fillStyle = v > 5 && v < 5.5 ? 'rgba(255,170,130,.6)' : 'rgba(255,226,110,.5)'; ctx.fillRect(a[0], a[1], bb[0] - a[0], bb[1] - a[1]); }
  for (const [i, sx, t0] of [[0, dx + 60, .5], [1, dx + 520, .7]]) { const e = clamp((v - t0) / .7, 0, 1); if (e >= 1) continue; const x = lerp(sx, px, e), y = lerp(Yd - 60, py, e) - Math.sin(e * Math.PI) * 60; if (i) chart(ctx, x, y, 1, .6 * (1 - e * .5), '결과물'); else sheet(ctx, x, y, 84 * (1 - e * .5), 100 * (1 - e * .5), .08, { head: [246, 206, 110], lines: 3, seed: 77, label: e < .1 ? '관찰 메모' : null, lpx: 21, labelUp: true }); }
  const read = v > 3.5 && v < 5, edit = v >= 5 && v < 5.8, ok = v >= 5.8;
  actor('ttukttak', dx + 40, Yd, Sd, { look: read ? [.9, -.5 + ((v - 3.5) * .5)] : [.9, -.3], aR: edit ? 1.6 + (Math.floor(v * 12) % 2) * .2 : ok && v < 6.3 ? 2.1 : .2, expr: ok ? 'joy' : 'smile', lean: edit ? .1 : 0, hop: hopA(v, 5.8, .3, 20) + hopA(v, 6.6, .35, 16) });
  if (edit) wtext(ctx, px + 100, py - 30, '✎', 40 * popK(v, 5), 'rgb(255,240,200)', { stroke: 'rgb(84,60,48)' });
  if (ok) { const k = popK(v, 5.8), s = SCR(px + 60, py + 96); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(-.2); ctx.scale(k * cam.z, k * cam.z); ctx.strokeStyle = 'rgb(222,84,70)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.stroke(); ctx.font = `700 27px ${FONT2}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgb(222,84,70)'; ctx.fillText('확인', 0, 1); ctx.restore(); }
  finish(f, .2, 0);
}
// the next counselling starts from real experience
function sceneTalk2(t, f, u) {
  const v = q2(u); deskBase(t, f, 1300 + u * 4, 500, 1.4); boardFlyers();
  chart(ctx, 1262, Yd - 62, 1, .62, '결과물'); sheet(ctx, 1340, Yd - 46, 64, 80, .1, { head: [150, 200, 150], lines: 3, seed: 81, label: '후기', lpx: 20, labelUp: true });
  const a = v > .8 && v < 3.7, b = v > 3.9 && v < 7.2, end = v > 7.2;
  actor('dugeun', 1110, Yd, Sd, { look: [.8, b ? -.5 : -.2], expr: b || end || (v > 1.6 && v < 3.7) ? 'joy' : 'smile', aL: b ? 2 : end ? 2.2 : .2, aR: b ? 1.4 + (Math.floor(v * 3) % 2) * .5 : end ? 2.2 : .2, sprout: b ? 1 : Math.sin(v * 3) * .4, hop: hopA(v, 3.9, .35, 26) + hopA(v, 7.25, .4, 30) });
  actor('doran', 1470, Yd, Sd, { look: [-.8, a ? -.1 : .1], expr: a || end ? 'joy' : 'smile', aL: a ? 1.7 + (Math.floor(v * 3) % 2) * .4 : end ? 2.2 : .2, aR: end ? 2.2 : .2, lean: a ? -.08 : 0, sq: v > 5 && v < 5.18 ? .93 : 1, hop: hopA(v, 7.35, .4, 24) });
  say(ctx, 1430, 395, ['계산 기준을 바꾼 과정이', '정말 멋지더라!'], [222, 238, 250], a ? popK(v, .8) : 0, -1);
  say(ctx, 1150, 395, ['다음엔 대기전력을', '직접 재 보고 싶어요!'], [255, 250, 232], b ? popK(v, 3.9) : 0, 1);
  finish(f, .6, 0);
}
function render(t) {
  t = clamp(t, 0, END); const f = Math.floor(t * FPS + 1e-6), tf = f / FPS; let sh = SHOTS[0]; for (const s of SHOTS) if (s[0] <= tf + 1e-9) sh = s; const u = tf - sh[0], id = sh[1];
  ({ dawn: () => sceneExt(tf, f, u, 'dawn'), final: () => sceneExt(tf, f, u, 'final'), c1: () => sceneTalk1(tf, f, u), c2: () => sceneBusy(tf, f, u), pick: () => scenePick(tf, f, u), c3: () => sceneCounsel(tf, f, u), flow: () => sceneFlow(tf, f, u), class: () => sceneClass(tf, f, u), review: () => sceneReview(tf, f, u), record: () => sceneRecord(tf, f, u), local: () => sceneLocal(tf, f, u), c4: () => sceneTalk2(tf, f, u), tree: () => sceneTree(tf, f, u) })[id]();
  ST(1, 0, 0, 1, 0, 0); subs(tf);
}
function audioSchedule(t0) {
  for (const n of nodes) { try { n.stop(); } catch (e) { } } nodes = []; const now = AC.currentTime + .06, at = (t, fn) => { if (t >= t0 - .01) fn(now + t - t0); };
  const N = { D3: 146.8, A2: 110, B2: 123.5, G2: 98, Fs3: 185, D4: 293.7, E4: 329.6, Fs4: 370, A4: 440, B4: 493.9, D5: 587.3, E5: 659.3, Fs5: 740, A5: 880 }, B = .375;
  at(0, w => { pad(w, 9, .035, [N.D3, 220, N.Fs4, N.A4]); nz(w, 8.6, 'lowpass', 500, 600, .5, [[0, 0], [2, .03], [8.6, .01]]); }); [[2.2, N.A4], [2.95, N.D5], [3.7, N.Fs5], [5.2, N.E5], [5.95, N.D5], [6.7, N.A4], [7.9, N.D5]].forEach(([t, n]) => at(t, w => pluck(w, n, .05, 1.4))); at(5.9, w => pop(w, 500));
  // before: plodding low pizzicato, questions without answers
  for (let i = 0; i < 18; i++) at(8.6 + i * .75, w => { pluck(w, [N.B2, N.Fs3, N.B2, N.G2][i % 4], .08, .5); if (i % 2) pluck(w + B, N.D4 * .5, .03, .3); });
  at(9.4, w => pop(w, 520)); at(11.9, w => tone(w, .5, 'sine', 330, 262, [[0, 0], [.05, .05], [.5, 0]])); at(13.3, w => { pluck(w, 392, .05, .6); pluck(w + .25, 415, .05, .8); });
  for (let i = 0; i < 7; i++) at(15.2 + i * .6, w => nz(w, .09, 'lowpass', 500, 200, 1, [[0, 0], [.01, .1], [.09, 0]])); at(18.7, w => pop(w, 560)); at(20.8, w => tone(w, 1.1, 'sine', 330, 196, [[0, 0], [.1, .04], [1.1, 0]]));
  // the pick: a held breath, a heartbeat, the line
  at(22, w => pad(w, 9.4, .03, [N.G2 * 2, 246.9, N.D4, N.Fs4])); at(23.6, w => pop(w, 640)); at(24.1, w => pop(w, 780)); at(25.1, w => pop(w, 600));
  for (const t of [26.6, 27.1]) at(t, w => { tone(w, .22, 'sine', 70, 44, [[0, 0], [.015, .5], [.22, 0]]); tone(w + .13, .22, 'sine', 62, 40, [[0, 0], [.015, .32], [.22, 0]]); });
  at(28.4, w => { tone(w, 1.5, 'sine', 440, 1760, [[0, 0], [.1, .05], [1.5, 0]]); for (let i = 0; i < 9; i++) pop(w + .1 + i * .13, 700 + i * 90); });
  // walking tune (D pentatonic) while the year unfolds
  const mel = [N.D4, 0, N.Fs4, N.A4, 0, N.B4, N.A4, 0, N.Fs4, 0, N.E4, N.Fs4, N.A4, 0, N.D5, 0, N.B4, 0, N.A4, N.Fs4, 0, N.E4, N.D4, 0, N.E4, 0, N.Fs4, N.A4, N.B4, 0, N.A4, 0], bass = [N.D3, N.B2, N.G2, N.A2];
  for (let i = 0; 31 + i * B < 114; i++) { const t = 31 + i * B, dusk = t >= 78 && t < 94.5, hush = t >= 54.6 && t < 60.5; at(t, w => { const n = mel[i % 32]; if (n && !hush) pluck(w, n * (dusk ? .5 : 1), dusk ? .04 : .055, .7); if (i % 4 === 0) pluck(w, bass[(i >> 3) % 4], hush ? .04 : .07, 1.2); if (i % 8 === 4 && !hush) pluck(w, bass[(i >> 3) % 4] * 1.5, .035, .8); }); }
  for (const t of [32.1, 33.2, 33.5, 33.8, 35.8, 37, 38.8, 39.6, 42.2, 42.8, 43.3, 43.9, 44.4, 45, 45.5, 46.8, 50.3, 50.9, 53.7, 59.6, 60.5, 61.1, 64.9, 65.4, 66.9, 70.4, 72.9, 73.4, 75.6, 76.7, 77.2, 79.3, 89.2, 89.5, 95.3, 98.4, 105.1, 106.5, 110.9]) at(t, w => pop(w, 620 + (t * 37 % 300)));
  for (const t of [83.8, 106.6]) at(t, w => tone(w, .18, 'sine', 120, 60, [[0, 0], [.01, .3], [.18, 0]])); at(48.3, w => flut(w, 6)); at(92.2, w => flut(w, 4)); at(102.9, w => flut(w, 5));
  at(107.5, w => { tone(w, 3.4, 'sine', 330, 660, [[0, 0], [.4, .03], [3.4, 0]]); nz(w + .8, 1.4, 'highpass', 5000, 7000, .5, [[0, 0], [.4, .012], [1.4, 0]]); });
  // finale
  at(114, w => { pad(w, 21, .04, [N.D3, 220, N.D4, N.Fs4, N.A4]); pad(w + 10, 11, .03, [N.D5, N.A5 * .75, N.Fs5]); nz(w, 21, 'lowpass', 500, 700, .5, [[0, 0], [3, .05], [8, .08], [21, 0]]); });
  at(117, w => nz(w, 2.4, 'bandpass', 400, 1600, .8, [[0, 0], [.6, .16], [2.4, 0]])); at(118, w => { tone(w, 1.6, 'sine', 300, 900, [[0, 0], [.2, .05], [1.6, 0]]); nz(w, 3, 'bandpass', 900, 300, .8, [[0, 0], [.2, .2], [3, 0]]); });
  const fin = [N.D5, N.Fs5, N.A5, N.Fs5, N.E5, N.D5, N.A4, N.D5, N.E5, N.Fs5, N.A5, N.D5 * 2, N.A5, N.Fs5, N.E5, N.D5]; fin.forEach((n, i) => at(119 + i * .75, w => { pluck(w, n, .06, 1.6); if (i % 2 === 0) pluck(w, bass[(i >> 1) % 4], .07, 1.6); }));
  at(131, w => { for (const [n, d] of [[N.D4, 0], [N.Fs4, .12], [N.A4, .24], [N.D5, .36], [N.Fs5, .48]]) pluck(w + d, n, .06, 3); });
}
