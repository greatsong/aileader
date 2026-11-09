// ───────────────────────── act two: automation, the record, counselling, next year ─────────────────────────
const SHOTS = [[0, 'dawn'], [8.6, 'c1'], [15, 'c2'], [22, 'pick'], [31, 'c3'], [41, 'auto'], [55, 'class'], [63, 'review'], [70, 'record'], [79, 'c4'], [87, 'year'], [97, 'plan'], [108, 'final']];
const SUBS = [
  [9, 14.6, '상담은 늘, 처음부터 묻는 것으로 시작했습니다'],
  [15.4, 18.6, '프로그램 담당 선생님은 같은 내용을 계획서에, 안내문에, 기록에 다시 쓰고'], [18.9, 21.7, '좋은 프로그램을 열어도, 꼭 맞는 학생에게 닿기 어려웠습니다'],
  [22.5, 26.4, '탐색 앱에서 마음이 가는 그림을 고르고, 끌린 이유를 남깁니다'], [28.2, 30.8, '그 한 줄이, 선생님에게 먼저 닿습니다'],
  [31.4, 35, '담임 선생님은 상담 전에 학생의 관심을 먼저 봅니다'], [35.4, 40.6, '여러 부서의 프로그램 가운데, 그 학생에게 맞는 것을 골라 담아 줍니다'],
  [41.4, 45.6, '교육계획서에서 고르면 설계와 기안문, 운영계획서가 자동으로 이어지고'], [46, 50.4, '프로그램 안내는 담아 둔 학생에게 먼저 갑니다'], [50.8, 54.7, '모집 설문도 자동으로 만들어져, 응답이 참가 명단으로 돌아옵니다'],
  [55.4, 58.8, '수업에서는 선생님의 피드백 한마디에 학생의 생각이 달라지고'], [59.2, 62.7, '선생님은 그 과정을 관찰 메모로 남깁니다'],
  [63.4, 66.4, '프로그램이 끝나면 후기 설문도 자동으로 만들어지고'], [66.7, 69.8, '학생의 좋았던 점과 아쉬운 점이 모입니다'],
  [70.4, 74.6, '설문과 관찰로 AI가 초안을 쓰면, 담당 선생님이 읽고 고쳐 확인합니다'], [75, 78.7, '확인한 내용은 담임 선생님께도 전해집니다'],
  [79.4, 83, '담임 선생님과 학생은 그 경험에서 다음 프로그램을 함께 고릅니다'], [83.3, 86.7, '상담이 이어질수록, 학생의 다음 질문도 자랍니다'],
  [87.4, 91.7, '학년말에는 어떤 내용을 더 풍부하게 담는 것이 진로에 좋을지 함께 상담하며'], [92, 96.7, '클릭 한 번으로 넣고, 빼고 — 고르는 것은 선생님과 학생입니다'],
  [97.4, 101, '학생의 후기와 선생님의 의견이 한데 모여 AI 개선안이 되고'], [101.3, 104.6, '선생님의 승인을 거쳐'], [104.9, 107.8, '2027년 교육계획 초안, 완성!']];
const head2 = (x, y, str, k) => { if (k > 0) wtext(ctx, x, y - k * 6, str, 30 * k, 'rgb(255,246,220)', { stroke: 'rgb(84,60,48)' }); };
function stamp(wx, wy, k) { if (k <= 0) return; const s = SCR(wx, wy); ctx.save(); ctx.translate(s[0], s[1]); ctx.rotate(-.2); ctx.scale(k * cam.z, k * cam.z); ctx.strokeStyle = 'rgb(222,84,70)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.stroke(); ctx.font = `700 27px ${FONT2}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgb(222,84,70)'; ctx.fillText('확인', 0, 1); ctx.restore(); }

// plan → draft documents → notice → recruiting survey, all following from one choice
function sceneAuto(t, f, u) {
  const v = q2(u), dx = 500, sx = 1340; deskBase(t, f, 1010 + u * 3, 500, 1.22);
  const ly = x => 566 - (x - 560) * .1 + Math.sin((x - 560) / 1000 * Math.PI) * 24, ex = v < .5 ? 0 : Math.min(1560, 600 + (v - .5) * 330);
  stack(ctx, dx - 170, Yd, 120, Math.max(4, 40 - Math.floor(Math.max(0, v - .6) * 10)), 3);
  if (ex > 0) { const pts = []; for (let x = 560; x <= ex; x += 30) pts.push([x, ly(x)]); goldLine(pts, 3.4); }
  if (v > .3) { const k = popK(v, .3); sheet(ctx, 640, Yd - 62 * k, 92 * k, 120 * k, -.05, { head: [120, 180, 130], lines: 4, seed: 1, label: '교육계획서', lpx: 20, labelUp: true }); }
  const names = ['설계', '기안문', '운영계획서', '안내문'], sent = clamp((v - 4.6) / 1.2, 0, 1);
  names.forEach((nm, i) => { const t0 = .9 + i * .6, k = popK(v, t0); if (k <= 0 || (i === 3 && sent > 0)) return; const x = 760 + i * 112, sw = Math.sin((v - t0) * 5) * .16 * Math.exp(-(v - t0) * 1.5); sheet(ctx, x + sw * 50, ly(x) + 66 * k, 88 * k, 112 * k, sw, { head: FLY[i], lines: 4, seed: i + 3, label: k > .9 ? nm : null, lpx: 21 }); const c = SCR(x, ly(x) + 4); ctx.fillStyle = 'rgb(150,110,80)'; ctx.fillRect(c[0] - 4 * cam.z, c[1] - 9 * cam.z, 8 * cam.z, 20 * cam.z); if (v - t0 < .3) sparkle(ctx, x + 50, ly(x) + 10, 20, i); });
  head2(870, 330, '① 계획 · 기안', popK(v, .9)); head2(1210, 330, '② 프로그램 안내', popK(v, 4.6)); head2(1500, 330, '③ 모집 설문', popK(v, 7));
  // the student at the next desk
  const got = v > 5.8, fill = v > 7.5 && v < 8.9, back = clamp((v - 9.2) / 1.3, 0, 1), wave = v > 11.3;
  const me = actor('dugeun', sx, Yd, Sd, { look: wave ? [-.9, -.1] : fill ? [.7, .3] : got && v < 7 ? [-.2, -.6] : [-.8, -.2], expr: (got && v < 7) || wave || (v > 8.9 && v < 9.6) ? 'joy' : 'smile', aL: got && v < 7 ? 2.2 : wave ? 1.8 + (Math.floor(v * 4) % 2) * .5 : .2, aR: fill ? 1.2 + (hash(Math.floor(v * 12)) - .5) * .5 : wave ? .2 : .2, sprout: got && v < 7 ? 1 : Math.sin(v * 3) * .4, hop: hopA(v, 5.8, .4, 28) + hopA(v, 8.95, .35, 20) + hopA(v, 11.4, .4, 22) });
  if (sent > 0 && v < 7) { const x = sent < 1 ? lerp(1096, me.handL[0] - 10, sent) : me.handL[0] - 10, y = sent < 1 ? lerp(ly(1096) + 66, me.handL[1] - 30, sent) - Math.sin(sent * Math.PI) * 50 : me.handL[1] - 34; wglow(x, y, 90, [255, 232, 150], .5); sheet(ctx, x, y, 84, 60, -.1 + sent * .2, { lines: 2, seed: 60, head: [250, 214, 120], label: sent >= 1 ? '모집 안내' : null, lpx: 20, labelUp: true }); }
  if (v > 7 && back < 1) { const k = popK(v, 7) * (1 - back * .45), x = lerp(1470, 600, sstep(back)), y = back > 0 ? ly(x) + 60 : Yd - 64; sheet(ctx, x, y, 92 * k, 118 * k, back * .3, { head: [190, 170, 236], lines: 3, seed: 62, label: back > 0 ? null : '모집 설문', lpx: 20, labelUp: true }); for (let i = 0; i < 3; i++) if (v > 7.7 + i * .4 && back <= 0) wtext(ctx, x - 26, y - 8 + i * 22, '✓', 24 * popK(v, 7.7 + i * .4), 'rgb(84,160,96)'); if (back > 0) wglow(x, y, 80, [255, 232, 150], .5); }
  // the programme teacher presses once and has time to look up
  const done = back >= 1;
  const tk = actor('ttukttak', dx + 20, Yd, Sd, { expr: done || wave ? 'joy' : v < .5 ? 'worry' : 'smile', look: v < .5 ? [-1, -.6] : wave ? [.9, -.1] : [clamp(.2 + v * .12, 0, 1), -.2], handle: v > .5 && v < 1 ? (Math.floor(v * 12) % 2) * 5 : 0, aL: done && !wave ? 2.2 : .2, aR: wave ? 1.8 + (Math.floor(v * 4 + 1) % 2) * .5 : .2, hop: hopA(v, 10.5, .35, 22) + hopA(v, 11.6, .4, 20) });
  if (done) { sheet(ctx, tk.handL[0] - 14, tk.handL[1] - (wave ? 0 : 44), 80, 100, -.08, { head: [190, 170, 236], lines: 4, seed: 63, label: wave ? null : '참가 명단', lpx: 21, labelUp: true }); if (!wave) wtext(ctx, tk.handL[0] + 12, tk.handL[1] - 36, '✓', 30 * popK(v, 10.5), 'rgb(84,160,96)'); }
  finish(f, .45, 0);
}
// the programme itself, in one beat: feedback changes the student's thinking
function sceneClass(t, f, u) {
  const v = q2(u), b = BG.board, c1 = [b[0] + 86, b[1] + 150], c2 = [b[0] + 244, b[1] + 150]; deskBase(t, f, 1390 + u * 3, 478, 1.32);
  chart(ctx, c1[0], c1[1], 0, 1, '공간별 총량'); chart(ctx, c2[0], c2[1], 1, popK(v, 3.8), '좌석당·시간대별'); if (v > 3.8 && v < 4.4) sparkle(ctx, c2[0] + 70, c2[1] - 90, 26 * popK(v, 3.8), 4);
  const fb = v > .5 && v < 3.3, think = v > 1.3 && v < 3.4, tell = v >= 4.2 && v < 7.2, cheer = v > 7.2, note = v > 5.4;
  sheet(ctx, 1100, Yd - 8, 110, 76, .05, { fore: .34, lines: 4, seed: 70 });
  actor('gori', 985, Yd, Sd, { look: tell ? [.9, -.1] : [.9, -.3], expr: v > 5.6 ? 'joy' : tell ? 'o' : 'smile', aL: cheer ? 2.2 : .2, sq: v > 5.6 && v < 5.78 ? .92 : 1, hop: hopA(v, 7.25, .4, 24) });
  const P = { sprout: Math.sin(v * 3) * .4, look: [.9, -.4] };
  if (think) { P.look = [.1, .7]; P.aL = 2.5; P.expr = 'worry'; P.sprout = -.5; P.sq = .97; }
  if (v >= 3.4 && v < 4.2) { P.expr = 'joy'; P.hop = hopA(v, 3.8, .4, 32); P.aL = 2.2; P.aR = 2.2; P.look = [1, -.7]; P.sprout = 1; }
  if (tell) { P.look = [-.9, -.1]; P.aL = 1.6 + (Math.floor(v * 3) % 2) * .5; P.expr = 'joy'; }
  if (cheer) { P.expr = 'joy'; P.aL = 2.2; P.aR = 2.2; P.hop = hopA(v, 7.2, .4, 30); }
  actor('dugeun', 1215, Yd, Sd, P);
  const tk = actor('ttukttak', 1440, Yd, Sd, { look: [-.9, .1], aL: fb ? 1.6 : cheer ? 2.2 : .2, aR: note ? 1.7 : .2, lean: fb ? -.1 : 0, expr: v > 3.8 ? 'joy' : 'smile', sq: v > 4.4 && v < 4.58 ? .92 : 1, hop: hopA(v, 7.35, .4, 20) });
  if (note) { const k = popK(v, 5.4); sheet(ctx, tk.handR[0] + 26, tk.handR[1] - 50 * k, 84 * k, 100 * k, .08, { head: [246, 206, 110], lines: 3, grow: clamp((v - 5.5) / 1, 0, 1), seed: 77, label: k > .9 ? '관찰 메모' : null, lpx: 21, labelUp: true }); if (v > 6.5) wtext(ctx, tk.handR[0] + 52, tk.handR[1] - 22, '✓', 34 * popK(v, 6.5), 'rgb(222,84,70)'); }
  mark(1255, 500, '…', think && v > 1.5 ? popK(v, 1.5) : 0); mark(1270, 500, '!', v > 3.4 && v < 3.8 ? popK(v, 3.4) : 0, 'rgb(255,226,130)');
  say(ctx, 1330, 372, ['좌석 한 개당, 시간대별로', '다시 계산해 볼까?'], [255, 232, 222], fb ? popK(v, .5) : 0, -1);
  say(ctx, 1120, 385, ['총량이 아니라', '비율로 봐야 해!'], [255, 250, 232], tell ? popK(v, 4.3) : 0, -1);
  finish(f, .45, 0);
}
// AI drafts from the survey and the observation; the teacher edits, confirms, and it reaches the homeroom teacher
function sceneRecord(t, f, u) {
  const v = q2(u), dx = 500, px = dx + 270, py = 470; deskBase(t, f, 700 + 250 * sstep((u - 5.8) / 2), 500, 1.42, true);
  const ch = actor('chorong', dx - 170, Yd, Sd, { lit: true, look: [.9, -.3], lean: .1, expr: v > 5.6 ? 'joy' : 'smile', hop: hopA(v, 5.8, .35, 18) }); wglow(ch.top[0], ch.top[1] + 20, 340, [255, 226, 150], .7); wglow(px - 40, py, 520, [255, 220, 150], .4);
  const grow = clamp((v - 1.3) / 1.9, 0, 1), read = v > 3.3 && v < 4.6, edit = v >= 4.6 && v < 5.6, ok = v >= 5.6, go = clamp((v - 6.3) / 1.3, 0, 1);
  sheet(ctx, px, py, 220, 300, -.02, { lines: 10, rows: 10, grow, seed: 5, head: [190, 170, 236], label: '생기부 초안', lpx: 23, labelUp: true });
  if (grow > .45) { const a = SCR(px - 82, py - 26), bb = SCR(px + 70, py - 4); ctx.fillStyle = edit && Math.floor(v * 12) % 2 ? 'rgba(255,170,130,.6)' : 'rgba(255,226,110,.5)'; ctx.fillRect(a[0], a[1], bb[0] - a[0], bb[1] - a[1]); }
  for (const [i, x0, t0, nm, col] of [[0, dx + 60, .4, '관찰 메모', [246, 206, 110]], [1, dx + 540, .6, '설문 응답', [150, 200, 150]]]) { const e = clamp((v - t0) / .8, 0, 1); if (e >= 1) continue; sheet(ctx, lerp(x0, px, e), lerp(Yd - 60, py, e) - Math.sin(e * Math.PI) * 60, 84 * (1 - e * .5), 100 * (1 - e * .5), .08 - i * .16, { head: col, lines: 3, seed: 77 + i, label: e < .15 ? nm : null, lpx: 21, labelUp: true }); }
  actor('ttukttak', dx + 40, Yd, Sd, { look: read ? [.9, -.5 + (v - 3.3) * .5] : go > 0 ? [1, -.1] : [.9, -.3], aR: edit ? 1.6 + (Math.floor(v * 12) % 2) * .2 : ok && v < 6.2 ? 2.1 : go > 0 ? 1.4 : .2, expr: ok ? 'joy' : 'smile', lean: edit ? .1 : 0, hop: hopA(v, 5.6, .3, 20) });
  if (edit) wtext(ctx, px + 104, py - 30, '✎', 40 * popK(v, 4.6), 'rgb(255,240,200)', { stroke: 'rgb(84,60,48)' });
  stamp(px + 60, py + 96, ok ? popK(v, 5.6) : 0);
  // on to the homeroom teacher at the next desk
  const dr = actor('doran', 1130, Yd, Sd, { look: go > 0 ? [-.9, -.2] : [-.6, .2], expr: go >= 1 ? 'joy' : 'smile', aL: go > .6 ? 1.9 : .2, hop: hopA(v, 7.6, .4, 24) + hopA(v, 8.2, .35, 16) });
  if (go > 0) { const tx = dr.handL[0] - 26, ty = dr.handL[1] - 34, x = lerp(px, tx, sstep(go)), y = lerp(py, ty, sstep(go)) - Math.sin(go * Math.PI) * 70, pts = []; for (let i = 0; i <= 10; i++) { const g = go * i / 10; pts.push([lerp(px + 60, tx, sstep(g)), lerp(py, ty, sstep(g)) - Math.sin(g * Math.PI) * 70]); } goldLine(pts, 3.4); wglow(x, y, 100, [255, 236, 160], .6); sheet(ctx, x, y, 220 * (1 - go * .62), 300 * (1 - go * .62), -.02 + go * .1, { lines: 6, seed: 9, head: [190, 170, 236] }); }
  finish(f, .2, 0);
}
// counselling again: from the experience to the next programme
function sceneTalk2(t, f, u) {
  const v = q2(u); deskBase(t, f, 1300 + u * 4, 500, 1.4); boardFlyers();
  chart(ctx, 1262, Yd - 62, 1, .62, '결과물'); sheet(ctx, 1340, Yd - 46, 64, 80, .1, { head: [150, 200, 150], lines: 3, seed: 81, label: '후기', lpx: 20, labelUp: true });
  const a = v > .6 && v < 3.1, b = v > 3.3 && v < 5.8, nx = v > 5.8, end = v > 6.9;
  actor('dugeun', 1110, Yd, Sd, { look: [.8, b ? -.5 : nx ? -.5 : -.2], expr: b || end || (v > 1.4 && v < 3.1) ? 'joy' : nx ? 'o' : 'smile', aL: b ? 2 : end ? 2.2 : .2, aR: b ? 1.4 + (Math.floor(v * 3) % 2) * .5 : end ? 2.2 : .2, sprout: b || nx ? 1 : Math.sin(v * 3) * .4, hop: hopA(v, 3.3, .35, 26) + hopA(v, 6.95, .4, 30) });
  const dr = actor('doran', 1470, Yd, Sd, { look: [-.8, a ? -.1 : .1], expr: a || nx ? 'joy' : 'smile', aL: a ? 1.7 + (Math.floor(v * 3) % 2) * .4 : nx ? 2.3 : .2, aR: end ? 2.2 : .2, lean: a ? -.08 : 0, sq: v > 4.4 && v < 4.58 ? .93 : 1, hop: hopA(v, 5.8, .3, 18) + hopA(v, 7.05, .4, 24) });
  if (nx) { const k = popK(v, 5.8); sheet(ctx, dr.handL[0] - 20, dr.handL[1] - 56 * k, 84 * k, 108 * k, -.1, { head: FLY[2], lines: 4, seed: 83, label: k > .9 ? '다음 프로그램' : null, lpx: 21, labelUp: true }); if (v < 6.6) sparkle(ctx, dr.handL[0] + 30, dr.handL[1] - 120, 24 * k, 5); }
  say(ctx, 1430, 395, ['계산 기준을 바꾼 과정이', '정말 멋지더라!'], [222, 238, 250], a ? popK(v, .6) : 0, -1);
  say(ctx, 1150, 395, ['다음엔 대기전력을', '직접 재 보고 싶어요!'], [255, 250, 232], b ? popK(v, 3.3) : 0, 1);
  finish(f, .6, 0);
}
// year-end counselling: what to put into the record, in and out with one click
function sceneYear(t, f, u) {
  const v = q2(u), px = 1640, py = 316, items = [['융합 프로젝트', 1195, 3.4, 99, 0], ['과학 탐구', 1295, 4.7, 99, 2], ['독서 토론', 1395, -1, 6.1, 4]];
  deskBase(t, f, 1380 + u * 3, 470, 1.36); tintAll([255, 180, 110], .16);
  const isIn = it => v >= it[2] + .5 && v < it[3], n = items.filter(isIn).length;
  sheet(ctx, px, py, 210, 280, .02, { lines: 3, rows: 10, seed: 5, head: [190, 170, 236], label: '생기부', lpx: 24, labelUp: true });
  let row = 0; for (const it of items) if (isIn(it)) { const a = SCR(px - 78, py - 2 + row * 30), bb = SCR(px + 74, py + 16 + row * 30); ctx.fillStyle = rgb(FLY[it[4]], .85); ctx.fillRect(a[0], a[1], bb[0] - a[0], bb[1] - a[1]); row++; }
  { const a = SCR(px - 90, py + 164), w = 180 * cam.z, hh = 16 * cam.z; ctx.fillStyle = 'rgba(70,56,60,.5)'; ctx.fillRect(a[0], a[1], w, hh); ctx.fillStyle = 'rgb(126,196,130)'; ctx.fillRect(a[0], a[1], w * (.34 + n * .2), hh); wtext(ctx, px, py + 198, '분량', 20, 'rgb(255,246,220)', { stroke: 'rgb(84,60,48)' }); }
  for (const it of items) {
    const eIn = clamp((v - it[2]) / .5, 0, 1), eOut = clamp((v - it[3]) / .5, 0, 1), onDesk = it[2] < 0 ? eOut : 1 - eIn; if (it[2] >= 0 && eIn >= 1) continue; if (it[2] < 0 && eOut <= 0) continue;
    const e = 1 - onDesk, x = lerp(it[1], px, e), y = lerp(Yd - 50, py + 20, e) - Math.sin(e * Math.PI) * 70; sheet(ctx, x, y, 84 * (1 - e * .4), 92 * (1 - e * .4), (it[4] - 2) * .03, { head: FLY[it[4]], lines: 3, seed: 90 + it[4], label: e < .1 ? it[0] : null, lpx: 20, labelUp: true }); if (e > 0 && e < 1) wglow(x, y, 80, [255, 236, 160], .5);
  }
  for (const [t0, x, y, ch] of [[3.4, 1195, Yd - 150, '+'], [4.7, 1295, Yd - 150, '+'], [6.1, px - 130, py + 10, '−']]) if (v >= t0 && v < t0 + .7) { mark(x, y, ch, popK(v, t0), 'rgb(255,226,130)'); sparkle(ctx, x + 44, y - 20, 18 * popK(v, t0), 3); }
  const q1 = v > .5 && v < 3.1, a1 = v > 2.9 && v < 4.5, q2b = v > 5.4 && v < 7.2, end = v > 7.8;
  actor('dugeun', 1070, Yd, Sd, { look: a1 ? [.7, .2] : v > 4.5 && v < 5.4 ? [1, -.6] : [.9, -.3], expr: a1 || end || (v > 4.6 && v < 5.4) ? 'joy' : 'smile', aR: a1 || (v > 4.5 && v < 5.2) ? 2 : end ? 2.2 : .2, aL: end ? 2.2 : .2, sprout: a1 ? 1 : Math.sin(v * 3) * .4, hop: hopA(v, 3.4, .3, 20) + hopA(v, 4.7, .3, 20) + hopA(v, 7.9, .4, 28) + hopA(v, 8.6, .4, 20) });
  actor('doran', 1500, Yd, Sd, { look: q1 ? [-.8, -.1] : q2b ? [.6, -.6] : [-.7, 0], expr: end || q2b ? 'joy' : 'smile', aL: q1 ? 1.7 : .2, aR: q2b ? 2.2 : end ? 2.2 : .2, lean: q1 ? -.08 : 0, hop: hopA(v, 6.1, .3, 18) + hopA(v, 8, .4, 24) });
  say(ctx, 1400, 372, ['진로에는 어떤 활동을', '더 담으면 좋을까?'], [222, 238, 250], q1 ? popK(v, .5) : 0, -1);
  say(ctx, 1100, 392, ['융합 프로젝트요!'], [255, 250, 232], a1 ? popK(v, 2.9) : 0, 1);
  say(ctx, 1430, 388, ['이건 빼도 되겠다'], [222, 238, 250], q2b ? popK(v, 5.4) : 0, -1);
  finish(f, .7, 0);
}
// everyone's feedback becomes next year's plan
function scenePlan(t, f, u) {
  const v = q2(u), G = 906, soil = [5090, 912]; cam.x = 5010 - 70 * (1 - sstep(u / 10)); cam.y = 690; cam.z = 1.25; WARM = .15; CEL.lw = 3; CEL.amp = .9; begin(); img(BG.mead, 0, 0, 1, 0, 0);
  const cast = [['doran', 4370], ['mongsil', 4540], ['dugeun', 4715], ['ttukttak', 4895]], done = v > 9.4;
  // student reviews (leaves) and teacher notes (pages) gather at the roots
  for (let i = 0; i < 6; i++) { const t0 = .3 + i * .32, e = clamp((v - t0) / 1.5, 0, 1); if (e <= 0 || v > 4.9) continue; const fromT = i % 2, sx = fromT ? (i % 4 === 1 ? 4420 : 4930) : 4760, x = lerp(sx, soil[0] + (i - 2.5) * 14, e) + Math.sin(e * 9 + i) * 30 * (1 - e), y = lerp(650, soil[1] - 8, e * e) - Math.sin(e * Math.PI) * (150 + i * 14), s = SCR(x, y); if (fromT) sheet(ctx, x, y, 44, 54, e < 1 ? Math.sin(e * 10 + i) : .2, { head: FLY[i % 5], lines: 2, seed: i, lw: .6, fore: e < 1 ? .4 + .6 * Math.abs(Math.cos(e * 9)) : .35 }); else drawLeaf(ctx, s[0], s[1], 24 * cam.z, e < 1 ? Math.sin(e * 12 + i) * 1.2 : .15 + i * .3, e < 1 ? Math.floor(v * 8) + i : 0, [[236, 196, 96], [196, 216, 96], [240, 160, 120]][(i / 2) | 0]); }
  if (v > 2.4 && v < 4.9) { wglow(soil[0], soil[1] - 10, 150, [255, 230, 150], ramp(v, 2.4, 3) * .85); for (let i = 0; i < 5; i++) sparkle(ctx, soil[0] + Math.cos(i * 1.3 + v * 3) * 80, soil[1] - 34 + Math.sin(i * 1.3 + v * 3) * 38, 13 * ramp(v, 2.5, 2.8), i + Math.floor(v * 6)); }
  if (v > 5) { const g = easeOut((v - 5) / 3), hgt = 250 * g, q = k => [soil[0] + Math.sin(k * 3) * 10 * g + 14 * g * k, soil[1] - hgt * k]; cel(ctx, [0, .25, .5, .75, 1].map(k => SCR(...q(k))), { closed: false, lw: 1.5 + g, line: 'rgb(96,132,70)', seed: 4, taper: 0 });
    for (let i = 0; i < 7; i++) { const k0 = .2 + i * .12; if (g < k0) continue; const p = q(Math.min(1, k0 + .04)), m = i % 2 ? 1 : -1, sz = 26 * clamp((g - k0) * 5, 0, 1), s = SCR(p[0] + m * sz * .9, p[1] - sz * .3); drawLeaf(ctx, s[0], s[1], sz * cam.z, m > 0 ? -.4 : Math.PI + .4, 0, [170, 214, 104]); }
    if (v > 7.8) for (let i = 0; i < 6; i++) { const p = q(.45 + i * .1); flowerC(ctx, p[0] + (i % 2 ? 30 : -30), p[1] + 6, popK(v, 7.8 + i * .09), i + 2); } wglow(q(1)[0], q(1)[1], 160, [255, 240, 170], .35 * g); }
  cast.forEach(([k, x], i) => { const giving = v > .3 && v < 2.2, P = { look: v < 2.4 ? [.6, -.5] : done ? [.6, -.4] : [.9, .1], expr: done || (k === 'ttukttak' && v > 4 && v < 5.3) ? 'joy' : 'smile', aR: (giving && k !== 'mongsil') || done || (k === 'ttukttak' && v > 4 && v < 5.3) ? 2.2 : .2, aL: done ? 2.2 : .2, hop: (k === 'ttukttak' ? hopA(v, 4, .3, 20) : 0) + hopA(v + i * .12, 9.5, .4, 28) + hopA(v + i * .12, 10.2, .4, 20) }; if (k === 'dugeun') P.sprout = Math.sin(v * 3) * .4; actor(k, x, G + (i % 2) * 4, 1.45, P); });
  head2(4740, 520, '학생 후기', v > .3 && v < 2.5 ? popK(v, .3) : 0); head2(4500, 560, '선생님 의견', v > .7 && v < 2.5 ? popK(v, .7) : 0);
  bubble(ctx, 5080, 700, 'AI 개선안', [224, 214, 250], v > 2.6 && v < 4 ? popK(v, 2.6) : 0); bubble(ctx, 5080, 700, '선생님 승인', [254, 236, 190], v > 4 && v < 5.3 ? popK(v, 4) : 0);
  if (v > 8.2) { const k = popK(v, 8.2), dxp = 5270, dyp = 640; wglow(dxp, dyp, 220, [255, 240, 180], .5); sheet(ctx, dxp, dyp, 170 * k, 222 * k, .03, { head: [120, 180, 130], lines: 8, rows: 8, grow: clamp((v - 8.4) / 1, 0, 1), seed: 12, label: k > .9 ? '2027 교육계획 초안' : null, lpx: 23, labelUp: true }); if (done) { wtext(ctx, dxp + 20, dyp + 40, '완성!', 54 * popK(v, 9.4), 'rgb(240,104,90)', { stroke: 'rgb(255,250,236)', rot: -.12 }); for (let i = 0; i < 4; i++) sparkle(ctx, dxp + (i - 1.5) * 70, dyp - 150 - (i % 2) * 30, 22 * popK(v, 9.4 + i * .08), i); } }
  img(BG.meadFG, 0, 1040, 1.12, cam.x, 690); finish(f, .55, 0);
}
// the closing line, drawn letter by letter
function endTitle(u) {
  const v = q2(u), line = (str, y, px, t0, gap, beat) => {
    ctx.font = `700 ${px}px ${FONT2}`; const ws = [...str].map(c => ctx.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0); let x = W / 2 - tot / 2;
    const tEnd = t0 + str.length * gap, bp = beat && v > tEnd + .4 ? ((v - tEnd - .4) % 1.9) : 9, pulse = bp < .09 || (bp > .42 && bp < .51) ? 1.07 : 1;
    [...str].forEach((c, i) => { const k = popK(v, t0 + i * gap) * pulse; if (k > 0) { ctx.save(); ctx.translate(x + ws[i] / 2, y + (1 - Math.min(1, k)) * 20); ctx.rotate((hash(i * 7 + px) - .5) * .09); ctx.scale(k, k); ctx.font = `700 ${px}px ${FONT2}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = px * .2; ctx.strokeStyle = 'rgba(96,56,40,.9)'; ctx.strokeText(c, 0, 0); ctx.fillStyle = beat && i < 4 ? 'rgb(255,214,196)' : 'rgb(255,248,226)'; ctx.fillText(c, 0, 0); ctx.restore(); } x += ws[i]; }); return tEnd; };
  ST(1, 0, 0, 1, 0, 0);
  if (v > 5.6) { ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(W / 2, 230, 40, W / 2, 230, 760); g.addColorStop(0, `rgba(255,226,170,${.5 * ramp(v, 5.6, 7)})`); g.addColorStop(1, 'rgba(255,226,170,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 620); ctx.globalCompositeOperation = 'source-over'; }
  line('이래서', 150, 70, 6, .12); const te = line('두근두근 당곡 프로젝트!', 270, 112, 6.9, .085, true);
  if (v > te) for (let i = 0; i < 7; i++) { const a = (v - te) * .5 + i * .9, x = 360 + i * 200 + Math.sin(a * 2 + i) * 20, y = 400 - ((a * 60 + i * 37) % 300), k = popK(v, te + i * .12) * (1 - ((a * 60 + i * 37) % 300) / 300); if (k <= 0) continue; ctx.fillStyle = `rgba(255,150,150,${.85 * k})`; ctx.save(); ctx.translate(x, y); ctx.scale(k * .9, k * .9); ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -14, -30, 0, -10); ctx.bezierCurveTo(14, -30, 34, -4, 0, 20); ctx.fill(); ctx.restore(); }
  const fd = ramp(u, 17.4, 19.4); if (fd > 0) { ctx.fillStyle = `rgba(255,242,216,${fd})`; ctx.fillRect(0, 0, W, H); }
}
function render(t) {
  t = clamp(t, 0, END); const f = Math.floor(t * FPS + 1e-6), tf = f / FPS; let sh = SHOTS[0]; for (const s of SHOTS) if (s[0] <= tf + 1e-9) sh = s; const u = tf - sh[0], id = sh[1];
  ({ dawn: () => sceneExt(tf, f, u, 'dawn'), final: () => sceneExt(tf, f, u, 'final'), c1: () => sceneTalk1(tf, f, u), c2: () => sceneBusy(tf, f, u), pick: () => scenePick(tf, f, u), c3: () => sceneCounsel(tf, f, u), auto: () => sceneAuto(tf, f, u), class: () => sceneClass(tf, f, u), review: () => sceneReview(tf, f, u * 8 / 7), record: () => sceneRecord(tf, f, u), c4: () => sceneTalk2(tf, f, u), year: () => sceneYear(tf, f, u), plan: () => scenePlan(tf, f, u) })[id]();
  ST(1, 0, 0, 1, 0, 0); subs(tf);
}
// ── music: bright, bouncy, hopeful (D major, about 100 bpm)
function audioSchedule(t0) {
  for (const n of nodes) { try { n.stop(); } catch (e) { } } nodes = []; const now = AC.currentTime + .06, at = (t, fn) => { if (t >= t0 - .01) fn(now + t - t0); };
  const D4 = 293.66, E4 = 329.63, F4 = 369.99, G4 = 392, A4 = 440, B4 = 493.88, C5 = 554.37, D5 = 587.33, E5 = 659.25, F5 = 739.99, G5 = 783.99, A5 = 880, B5 = 987.77, D6 = 1174.66, B = .3;
  const melA = [D5, 0, F5, A5, 0, F5, A5, B5, A5, 0, F5, D5, 0, E5, F5, 0, G5, 0, B5, D6, 0, B5, A5, G5, F5, 0, A5, E5, 0, 0, E5, F5], melB = [A5, 0, A5, B5, A5, 0, F5, 0, G5, 0, E5, F5, 0, D5, 0, 0, B4, 0, D5, G5, 0, B5, A5, G5, A5, 0, 0, E5, F5, G5, A5, 0];
  const CH = { D: [146.83, 220, D4, F4], G: [98, 246.94, D4, G4], A: [110, 220, 277.18, E4], Bm: [123.47, 246.94, D4, F4] }, prog = ['D', 'D', 'G', 'A', 'D', 'Bm', 'G', 'A'];
  const kick = (w, v) => tone(w, .13, 'sine', 110, 46, [[0, 0], [.008, v], [.13, 0]]), hat = (w, v) => nz(w, .04, 'highpass', 7000, 9000, .7, [[0, 0], [.004, v], [.04, 0]]), snap = (w, v) => nz(w, .07, 'bandpass', 2000, 1500, 1.5, [[0, 0], [.005, v], [.07, 0]]);
  const groove = (ta, tb, lvl) => { for (let i = 0; ta + i * B < tb; i++) { const t = ta + i * B, bar = Math.floor(i / 8) % 8, pos = i % 8, c = CH[prog[bar]]; at(t, w => {
    const n = (bar < 4 ? melA : melB)[(bar % 4) * 8 + pos]; if (n && lvl > 0) { pluck(w, n, .05 * lvl, .55); if (lvl > 1.2) pluck(w, n / 2, .025, .5); }
    if (pos === 0 || pos === 4) { pluck(w, c[0], .085, .5); if (lvl > .5) kick(w, .16); } if (pos === 2 || pos === 6) { pluck(w, c[2], .028, .22); pluck(w, c[3], .028, .22); if (lvl > .5) snap(w, .03); } if (pos === 7 && bar % 2) pluck(w, c[1], .04, .25);
    if (lvl > .5) hat(w, pos % 2 ? .02 : .011); }); } };
  // opening: bright arpeggio over a warm pad
  at(0, w => pad(w, 9, .03, [146.83, 220, F4, A4])); [D5, F5, A5, D6, A5, F5, G5, B5, D6, B5, A5, F5, E5, A5].forEach((n, i) => at(1.6 + i * .45, w => pluck(w, n, .05, 1.1))); at(5.9, w => pop(w, 520));
  // before: a lighter, slightly wistful vamp without drums
  for (let i = 0; 8.6 + i * B < 22; i++) { const pos = i % 8, c = CH[['Bm', 'G', 'Bm', 'A'][Math.floor(i / 8) % 4]]; at(8.6 + i * B, w => { if (pos === 0 || pos === 4) pluck(w, c[0], .08, .5); if (pos === 3 || pos === 6) pluck(w, c[2 + (pos & 1)], .03, .3); }); }
  at(9.4, w => pop(w, 520)); at(11.9, w => tone(w, .5, 'sine', 330, 262, [[0, 0], [.05, .05], [.5, 0]])); at(13.3, w => { pluck(w, 392, .05, .6); pluck(w + .25, 415, .05, .8); }); at(18.7, w => pop(w, 560)); at(20.8, w => tone(w, 1.1, 'sine', 330, 196, [[0, 0], [.1, .04], [1.1, 0]]));
  // the pick: a held breath, a heartbeat, the line
  at(22, w => pad(w, 9.4, .03, [196, 246.94, D4, F4])); [[23.6, G5], [24.1, B5], [25.1, D6], [25.6, B5]].forEach(([t, n]) => at(t, w => pluck(w, n, .045, 1.2)));
  for (const t of [26.6, 27.1]) at(t, w => { tone(w, .22, 'sine', 70, 44, [[0, 0], [.015, .5], [.22, 0]]); tone(w + .13, .22, 'sine', 62, 40, [[0, 0], [.015, .32], [.22, 0]]); });
  at(28.4, w => { tone(w, 1.5, 'sine', 440, 1760, [[0, 0], [.1, .05], [1.5, 0]]); for (let i = 0; i < 9; i++) pop(w + .1 + i * .13, 700 + i * 90); });
  // from here the year runs on the bright groove
  groove(31, 70, 1); groove(70, 79, .45); groove(79, 108, 1); groove(108, 123.6, 1.5);
  for (const t of [32.1, 33.2, 33.5, 33.8, 35.8, 39.6, 41.9, 42.5, 43.1, 43.7, 46.8, 48, 49.9, 51.7, 52.1, 52.5, 58.8, 59.2, 63.2, 66, 68.8, 75.6, 84.8, 90.4, 91.7, 93.1, 105.2, 106.4]) at(t, w => pop(w, 620 + (t * 37 % 300)));
  for (const t of [75.6, 101]) at(t, w => tone(w, .18, 'sine', 120, 60, [[0, 0], [.01, .3], [.18, 0]]));
  // finale: pad, bells, the kite, and a last rising chord
  at(108, w => { pad(w, 19.6, .035, [146.83, 220, D4, F4, A4]); nz(w, 19, 'lowpass', 500, 700, .5, [[0, 0], [3, .04], [8, .06], [19, 0]]); });
  at(111, w => nz(w, 2.4, 'bandpass', 400, 1600, .8, [[0, 0], [.6, .14], [2.4, 0]])); at(112, w => tone(w, 1.6, 'sine', 300, 900, [[0, 0], [.2, .05], [1.6, 0]]));
  [...'이래서두근두근당곡프로젝트!'].forEach((c, i) => at(114 + (i < 3 ? i * .12 : .9 + (i - 3) * .09), w => pop(w, 660 + i * 46)));
  for (const t of [117.2, 117.62]) at(t, w => { tone(w, .22, 'sine', 74, 46, [[0, 0], [.015, .4], [.22, 0]]); });
  at(123.6, w => { [D4, F4, A4, D5, F5, A5, D6].forEach((n, i) => pluck(w + i * .13, n, .06, 3.2)); pad(w, 4, .04, [146.83, 220, D4, F4, A4, D5]); });
}
