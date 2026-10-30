/* 2일차 진행 화면의 움직이는 장면(종이 프로토타이핑)과 단계 타이머.
   - 장면: 장에 들어오면 처음부터 재생하고, 다른 장으로 가면 멈춘다(PAPER.activate).
   - 손그림 선은 시드를 고정한 난수로 떨림을 만들어 매번 같은 모양으로 그린다.
   - 타이머: [data-tmr="4,2"] 요소에 단계(분)를 적으면 링 타이머가 된다. 단계가 넘어갈 때 짧게 울린다. */
(function () {
  // ── 손그림 도구 ─────────────────────────────────────
  var seed = 11;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function j(a) { return (rnd() - .5) * 2 * a; }
  function f(n) { return Math.round(n * 10) / 10; }
  function seg(x1, y1, x2, y2, a) {
    a = a == null ? 1.4 : a;
    var mx = (x1 + x2) / 2 + j(a * 1.4), my = (y1 + y2) / 2 + j(a * 1.4);
    return 'M' + f(x1 + j(a)) + ' ' + f(y1 + j(a)) + ' Q' + f(mx) + ' ' + f(my) + ' ' + f(x2 + j(a)) + ' ' + f(y2 + j(a));
  }
  function rect(x, y, w, h, a) { return [seg(x, y, x + w, y, a), seg(x + w, y, x + w, y + h, a), seg(x + w, y + h, x, y + h, a), seg(x, y + h, x, y - 2, a)].join(' '); }
  function ell(cx, cy, rx, ry, a) {
    var p = '', n = 26, o = rnd() * 6.28; a = a == null ? .035 : a;
    for (var i = 0; i <= n + 2; i++) { var t = o + i / n * 6.283, k = 1 + j(a); p += (i ? ' L' : 'M') + f(cx + Math.cos(t) * rx * k) + ' ' + f(cy + Math.sin(t) * ry * k); }
    return p;
  }
  function arrow(x1, y1, x2, y2, bend) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - (bend || 0), ang = Math.atan2(y2 - my, x2 - mx), L = 13;
    return 'M' + x1 + ' ' + y1 + ' Q' + mx + ' ' + my + ' ' + x2 + ' ' + y2 +
      ' M' + f(x2 - L * Math.cos(ang - .5)) + ' ' + f(y2 - L * Math.sin(ang - .5)) + ' L' + x2 + ' ' + y2 + ' L' + f(x2 - L * Math.cos(ang + .5)) + ' ' + f(y2 - L * Math.sin(ang + .5));
  }
  function ink(d, cls) { return '<path class="ink' + (cls ? ' ' + cls : '') + '" pathLength="1" d="' + d + '"/>'; }
  function hw(x, y, s, size, cls, anchor) {
    return '<text class="hw' + (cls ? ' ' + cls : '') + '" x="' + x + '" y="' + y + '" font-size="' + (size || 24) + '" text-anchor="' + (anchor || 'middle') + '">' + s + '</text>';
  }
  function face(cx, cy, r, kind) {
    var m = kind === 0 ? 'M' + (cx - 10) + ' ' + (cy + 6) + ' Q' + cx + ' ' + (cy + 15) + ' ' + (cx + 10) + ' ' + (cy + 6)
      : kind === 1 ? seg(cx - 10, cy + 9, cx + 10, cy + 9, .6)
      : 'M' + (cx - 11) + ' ' + (cy + 11) + ' Q' + (cx - 5) + ' ' + (cy + 4) + ' ' + cx + ' ' + (cy + 10) + ' Q' + (cx + 5) + ' ' + (cy + 15) + ' ' + (cx + 11) + ' ' + (cy + 8);
    return ink(ell(cx, cy, r, r)) + ink(ell(cx - 8, cy - 6, 1.6, 1.6, .1), 'thin') + ink(ell(cx + 8, cy - 6, 1.6, 1.6, .1), 'thin') + ink(m, 'thin');
  }

  // 종이 화면 세 장(예시: 수업 끝 3분 이해도 확인). viewBox 240×340
  function sheet1() {
    seed = 21;
    return '<svg viewBox="0 0 240 340">' +
      ink(rect(14, 14, 212, 312, 1.2), 'soft') +
      hw(120, 66, '오늘 수업 어땠나요?', 30) +
      face(62, 140, 27, 0) + face(120, 140, 27, 1) + face(178, 140, 27, 2) +
      hw(62, 196, '좋아요', 21) + hw(120, 196, '보통', 21) + hw(178, 196, '어려워요', 21) +
      ink(rect(64, 252, 112, 46, 1.5)) + hw(120, 284, '다음', 28) + '</svg>';
  }
  function sheet2() {
    seed = 42;
    return '<svg viewBox="0 0 240 340">' +
      ink(rect(14, 14, 212, 312, 1.2), 'soft') +
      hw(120, 66, '어디가 헷갈렸나요?', 30) +
      ink(rect(28, 98, 86, 42, 1.2)) + hw(71, 127, '변수', 23) +
      ink(rect(126, 98, 86, 42, 1.2)) + hw(169, 127, '반복문', 23) +
      ink(rect(28, 152, 86, 42, 1.2)) + hw(71, 181, '조건문', 23) +
      ink(rect(126, 152, 86, 42, 1.2)) + hw(169, 181, '함수', 23) +
      hw(120, 226, '여러 개 골라도 돼요', 19, 'mut') +
      '<g class="fixg">' + ink(rect(64, 254, 112, 46, 1.6), 'fix') + hw(120, 286, '제출', 28, 'fix') + '</g>' + '</svg>';
  }
  function sheet3() {
    seed = 77;
    var bars = [[46, 70], [92, 150], [138, 96], [184, 54]], s = '';
    bars.forEach(function (b, i) { s += ink(rect(b[0] - 15, 270 - b[1], 30, b[1], .9), i === 1 ? 'fill' : ''); });
    return '<svg viewBox="0 0 240 340">' +
      ink(rect(14, 14, 212, 312, 1.2), 'soft') +
      hw(120, 62, '우리 반 결과', 30) + hw(120, 88, '교사 화면', 18, 'mut') +
      ink(seg(24, 271, 216, 271, .8)) + s +
      hw(46, 296, '변수', 18) + hw(92, 296, '반복문', 18) + hw(138, 296, '조건문', 18) + hw(184, 296, '함수', 18) +
      hw(92, 110, '12명', 22, 'fix') + '</svg>';
  }

  // ── 재생 도구 ───────────────────────────────────────
  var scenes = [];
  function Scene(root, run) { this.root = root; this.run = run; this.tk = 0; scenes.push(this); }
  Scene.prototype.reset = function () {
    this.root.getAnimations({ subtree: true }).forEach(function (a) { if (a.effect && a.effect.target && a.effect.target.closest && !a.effect.target.closest('.tmr')) a.cancel(); });
    this.root.querySelectorAll('.steps li, .ppdots i').forEach(function (x) { x.classList.remove('on', 'done'); });
    var tap = this.root.querySelector('.tap'); if (tap) tap._pos = null;
  };
  Scene.prototype.stop = function () { this.tk++; this.cur = null; this.reset(); };
  // 재생 도구. k는 속도 배율이다(1 보통, 0 즉시). 단계 이동(goto)에서 지난 단계는 k=0으로 건너뛴다
  Scene.prototype.api = function (tk) {
    var self = this;
    function live() { if (tk !== self.tk) throw 'stop'; }
    var api = {
      k: 1,
      a: function (el, kf, o) {
        live(); if (!el) return null;
        o = Object.assign({ duration: 600, fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)' }, o || {});
        o.duration *= api.k; if (o.delay) o.delay *= api.k;
        return el.animate(kf, o);
      },
      w: function (ms) { var d = ms * api.k; return new Promise(function (res, rej) { setTimeout(function () { tk === self.tk ? res() : rej('stop'); }, d); }); },
      later: function (fn, ms) { setTimeout(function () { if (tk === self.tk) { try { fn(); } catch (e) {} } }, ms * api.k); },
      q: function (s) { return self.root.querySelector(s); },
      qa: function (s) { return Array.prototype.slice.call(self.root.querySelectorAll(s)); },
      root: self.root,
      live: live
    };
    // 잉크 그리기: 선은 순서대로, 글자는 선이 끝날 무렵 나타난다
    api.draw = function (box, dur, gap) {
      var paths = Array.prototype.slice.call(box.querySelectorAll('.ink')), texts = box.querySelectorAll('.hw');
      dur = dur || 1600; gap = gap == null ? dur / Math.max(paths.length, 1) * .7 : gap;
      paths.forEach(function (p, i) { if (!p.closest('.fixg') || box.classList.contains('fixg')) api.a(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, delay: i * gap, easing: 'ease-in-out' }); });
      Array.prototype.forEach.call(texts, function (t, i) { if (!t.closest('.fixg') || box.classList.contains('fixg')) api.a(t, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: dur * .35 + i * 90 }); });
    };
    api.step = function (n) {
      api.qa('.steps li, .ppdots i').forEach(function (li, i) { li.classList.toggle('on', i === n); li.classList.toggle('done', i < n); });
    };
    api.tap = function (x, y, ms) {   // 손가락 표시를 (x, y)로 옮기고 누른다
      var t = api.q('.tap'), r = t.querySelector('i');
      var from = t._pos || [x, y + 80];
      t._pos = [x, y];
      api.a(t, [{ opacity: 1, transform: 'translate(' + from[0] + 'px,' + from[1] + 'px)' }, { opacity: 1, transform: 'translate(' + x + 'px,' + y + 'px)' }], { duration: ms || 700, easing: 'cubic-bezier(.4,0,.2,1)' });
      return api.w(ms || 700).then(function () {
        api.a(r, [{ opacity: .9, transform: 'scale(.6)' }, { opacity: 0, transform: 'scale(2.2)' }], { duration: 520, easing: 'ease-out', fill: 'none' });
        api.a(t, [{ transform: 'translate(' + x + 'px,' + y + 'px) scale(1)' }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(.82)' }, { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)' }], { duration: 300 });
        return api.w(420);
      });
    };
    return api;
  };
  Scene.prototype.play = function () {
    var self = this, tk = ++this.tk;
    this.reset();
    var api = this.api(tk);
    Promise.resolve().then(function () { return self.run(api); }).catch(function (e) { if (e !== 'stop') console.error(e); });
  };
  // 단계 장면: target 단계까지 앞 단계는 즉시 그려 두고, target 단계만 움직여 보인다(클릭 한 번에 한 단계)
  Scene.prototype.goto = function (target) {
    var self = this, tk = ++this.tk, phases = this.run;
    this.reset(); this.cur = target;
    var api = this.api(tk), chain = Promise.resolve();
    phases.forEach(function (ph, i) {
      if (i > target) return;
      chain = chain.then(function () { api.k = i < target ? 0 : 1; return ph(api); });
    });
    chain.catch(function (e) { if (e !== 'stop') console.error(e); });
  };

  // ── 장면 1: 종이 프로토타이핑 전체 흐름 ──────────────────
  // 책상 좌표(1424×478). 종이 230×326, 줄 위치 x=40·350·660, 위 y=34
  var SW = 230, SH = 326, K = SW / 240, ROW = [40, 350, 660], TOP = 34;
  function at(sheetX, sx, sy) { return [sheetX + sx * K, TOP + sy * K]; }
  // AI 채팅 창: 종이 화면 세 장의 사진(축소본)과 시작 프롬프트를 보내면, 만들어진 HTML 첫 화면이 답으로 온다
  function aiWindowHTML(sheets, appHTML, left, top) {
    return '<div class="aiw" style="left:' + left + 'px;top:' + top + 'px">' +
      '<div class="bar"><i></i><i></i><i></i><span>AI 채팅</span></div>' +
      '<div class="msg me"><div class="ths">' + sheets.map(function (fn) { return '<div class="th">' + fn() + '</div>'; }).join('') + '</div><div class="pr">시작 프롬프트</div></div>' +
      '<div class="msg ai"><div class="prev"><div class="pbar"><i></i><span>index.html</span></div><div class="app">' + appHTML + '</div></div></div>' +
    '</div>';
  }
  // 미니 사진이 AI 창의 축소본 자리로 날아가도록 실제 위치를 잰다(무대 배율을 나눠 책상 좌표로)
  function flyTargets(desk) {
    var d = desk.getBoundingClientRect(), k = d.width / desk.offsetWidth || 1;
    return Array.prototype.map.call(desk.querySelectorAll('.aiw .th'), function (th) {
      var r = th.getBoundingClientRect(); return [(r.left - d.left) / k, (r.top - d.top) / k];
    });
  }
  function introHTML() {
    return '<div class="pp" data-scene="intro" data-stepped="1">' +
      '<div class="desk">' +
        '<div class="sheet s3" style="left:' + ROW[2] + 'px;top:' + TOP + 'px;width:' + SW + 'px;height:' + SH + 'px;z-index:1">' + sheet3() + '<span class="lab">③ 결과</span></div>' +
        '<div class="sheet s2" style="left:' + ROW[1] + 'px;top:' + TOP + 'px;width:' + SW + 'px;height:' + SH + 'px;z-index:2">' + sheet2() + '<span class="lab">② 핵심 행동</span></div>' +
        '<div class="sheet s1" style="left:' + ROW[0] + 'px;top:' + TOP + 'px;width:' + SW + 'px;height:' + SH + 'px;z-index:3">' + sheet1() + '<span class="lab">① 첫 화면</span></div>' +
        '<svg class="arw" width="1424" height="478" style="position:absolute;left:0;top:0;pointer-events:none">' +
          ink(arrow(282, 196, 342, 196, 18)) + ink(arrow(592, 196, 652, 196, 18)) + '</svg>' +
        '<div class="note y ny" style="left:530px;top:92px;width:118px;min-height:76px;font-size:27px;z-index:4">반복문 선택!</div>' +
        '<div class="note p np" style="left:1000px;top:96px;width:200px;min-height:140px;transform:rotate(3deg);z-index:4">제출 버튼이 어디 있죠?<svg width="170" height="40" style="position:absolute;left:14px;bottom:4px">' + ink('M8 22 L22 34 L52 6', 'fix') + '</svg></div>' +
        '<div class="role emo ru" style="left:170px;top:392px">👆</div>' +
        '<div class="role emo rc" style="left:760px;top:392px">🖐</div>' +
        '<div class="role emo ro" style="left:1060px;top:44px">👀</div>' +
        '<div class="bubble bq" style="left:600px;top:300px">?</div>' +
        '<div class="camf" style="left:18px;top:8px;width:900px;height:400px"></div>' +
        '<div class="mini m1" style="left:120px;top:190px"></div><div class="mini m2" style="left:430px;top:190px"></div><div class="mini m3" style="left:740px;top:190px"></div>' +
        aiWindowHTML([sheet1, sheet2, sheet3],
          '<h5>오늘 수업 어땠나요?</h5>' +
          '<div class="faces"><span>😀<small>좋아요</small></span><span class="on">😐<small>보통</small></span><span>😵<small>어려워요</small></span></div>' +
          '<span class="btn2">다음</span>', 940, 30) +
        '<div class="flashw"></div>' +
        '<div class="tap"><i></i></div>' +
      '</div>' +
      '<div class="ppdots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
    '</div>';
  }
  var IT = function (dx, dy, r) { return 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (r || 0) + 'deg)'; };
  var iput = function (p, el, from, to, ms) { return p.a(el, [{ opacity: 1, transform: from }, { opacity: 1, transform: to }], { duration: ms || 900, easing: 'cubic-bezier(.3,.8,.2,1)' }); };
  var PILE = [ROW[2] - ROW[0] + 20, 26, 7];   // 컴퓨터 역할이 걷어 낸 첫 장이 놓이는 자리
  var INTRO = [
    function (p) {   // 1. 종이에 화면 세 장을 그린다
      p.step(0);
      [p.q('.s1'), p.q('.s2'), p.q('.s3')].forEach(function (s, i) {
        p.a(s, [{ opacity: 0, transform: IT(0, 40, i * 2 - 2) }, { opacity: 1, transform: IT(0, 0, i * 1.2 - 1.2) }], { duration: 700, delay: i * 520 });
        p.later(function () { p.draw(s.querySelector('svg'), 1500); }, 300 + i * 520);
      });
      return p.w(3300);
    },
    function (p) {   // 2. 누르는 순서대로 잇는다
      p.step(1); p.draw(p.q('.arw'), 900, 300); return p.w(1500);
    },
    function (p) {   // 3. 세 장을 겹치고, 누른 곳에 맞춰 종이를 바꾼다
      var s1 = p.q('.s1'), s2 = p.q('.s2'), s3 = p.q('.s3');
      p.step(2);
      p.a(p.q('.arw'), [{ opacity: 1 }, { opacity: 0 }], { duration: 400 });
      iput(p, s1, IT(0, 0, -1.2), IT(ROW[1] - ROW[0], 0, -1));
      iput(p, s3, IT(0, 0, 1.2), IT(ROW[1] - ROW[2], 0, 1.5));
      iput(p, s2, IT(0, 0, 0), IT(0, 0, .4));
      p.a(p.q('.ru'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 500 });
      p.a(p.q('.rc'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 700 });
      p.qa('.sheet .lab').forEach(function (l) { p.a(l, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }); });
      return p.w(1100)
        .then(function () { var c = at(ROW[1], 120, 140); return p.tap(c[0], c[1], 800); })
        .then(function () { var c = at(ROW[1], 120, 276); return p.tap(c[0], c[1], 600); })
        .then(function () { iput(p, s1, IT(ROW[1] - ROW[0], 0, -1), IT(PILE[0], PILE[1], PILE[2]), 800); return p.w(900); })
        .then(function () { var c = at(ROW[1], 169, 119); return p.tap(c[0], c[1], 600); })
        .then(function () {
          p.a(p.q('.ny'), [{ opacity: 0, transform: 'scale(1.5) rotate(-12deg)' }, { opacity: 1, transform: 'scale(1) rotate(-4deg)' }], { duration: 380, easing: 'cubic-bezier(.3,1.4,.5,1)' });
          return p.w(600);
        });
    },
    function (p) {   // 4. 멈칫한 곳을 포스트잇에 적는다
      p.step(3);
      var c0 = at(ROW[1], 120, 262);
      return p.tap(c0[0], c0[1], 700).then(function () {
        var t = p.q('.tap'), c = at(ROW[1], 60, 290), d = at(ROW[1], 180, 290);
        p.a(t, [{ transform: 'translate(' + t._pos[0] + 'px,' + t._pos[1] + 'px)' }, { transform: 'translate(' + c[0] + 'px,' + c[1] + 'px)' }, { transform: 'translate(' + d[0] + 'px,' + d[1] + 'px)' }, { transform: 'translate(' + t._pos[0] + 'px,' + t._pos[1] + 'px)' }], { duration: 1500, easing: 'ease-in-out' });
        p.a(p.q('.bq'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 500 });
        p.a(p.q('.ro'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 700 });
        p.a(p.q('.np'), [{ opacity: 0, transform: 'scale(1.4) rotate(10deg)' }, { opacity: 1, transform: 'scale(1) rotate(3deg)' }], { duration: 420, delay: 1100, easing: 'cubic-bezier(.3,1.4,.5,1)' });
        return p.w(1600);
      });
    },
    function (p) {   // 5. 종이 위에서 바로 고친다
      p.step(4);
      p.a(p.q('.bq'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      p.a(p.q('.tap'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      p.draw(p.q('.s2 .fixg'), 900, 260);
      return p.w(1300).then(function () { p.draw(p.q('.np svg'), 400, 0); return p.w(600); });
    },
    function (p) {   // 6. 종이 사진과 시작 프롬프트를 AI에게 준다
      var s1 = p.q('.s1'), s2 = p.q('.s2'), s3 = p.q('.s3');
      p.step(5);
      ['.ny', '.np', '.ru', '.rc', '.ro'].forEach(function (x) { p.a(p.q(x), [{ opacity: 1 }, { opacity: 0 }], { duration: 350 }); });
      iput(p, s1, IT(PILE[0], PILE[1], PILE[2]), IT(0, 0, -1.2), 800);
      iput(p, s3, IT(ROW[1] - ROW[2], 0, 1.5), IT(0, 0, 1.2), 800);
      iput(p, s2, IT(0, 0, .4), IT(0, 0, 0), 800);
      return p.w(1000)
        .then(function () { p.a(p.q('.camf'), [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 400 }); return p.w(650); })
        .then(function () { p.a(p.q('.flashw'), [{ opacity: 0 }, { opacity: .95, offset: .2 }, { opacity: 0 }], { duration: 650, fill: 'none' }); return p.w(500); })
        .then(function () {
          p.a(p.q('.camf'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
          p.a(p.q('.aiw'), [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 500 });
          var tg = flyTargets(p.q('.desk'));
          p.qa('.mini').forEach(function (m, i) {
            var dx = (tg[i] ? tg[i][0] : 1188 + i * 40) - parseFloat(m.style.left), dy = (tg[i] ? tg[i][1] : 98) - parseFloat(m.style.top);
            p.a(m, [{ opacity: 1, transform: 'translate(0,0) rotate(' + (i - 1) * 5 + 'deg)' }, { opacity: 1, transform: 'translate(' + dx * .5 + 'px,' + (dy - 90) + 'px) rotate(0)', offset: .55 }, { opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.8)' }], { duration: 1000, delay: i * 120, easing: 'ease-in-out' });
          });
          p.qa('.aiw .th').forEach(function (th, i) { p.a(th, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 900 + i * 120 }); });
          return p.w(1300);
        })
        .then(function () {
          p.a(p.q('.aiw .pr'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
          p.a(p.q('.aiw .msg.ai'), [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: 500 });
          p.qa('.aiw .app > *').forEach(function (x, i) { p.a(x, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: 900 + i * 260 }); });
          return p.w(1800);
        });
    }
  ];

  // ── 장면 2: 4칸 스케치(두 사람이 각자) ───────────────────
  function quad(seedN, kind, ox, oy) {   // 칸 하나(120×160) 안의 낙서
    seed = seedN; var s = '';
    if (kind === 'phone') s = ink(rect(ox + 34, oy + 22, 54, 100, 1)) + ink(seg(ox + 44, oy + 44, ox + 78, oy + 44, .8), 'thin') + ink(seg(ox + 44, oy + 60, ox + 78, oy + 60, .8), 'thin') + ink(seg(ox + 44, oy + 76, ox + 70, oy + 76, .8), 'thin') + ink(ell(ox + 61, oy + 104, 7, 7), 'thin');
    if (kind === 'bars') s = ink(seg(ox + 20, oy + 120, ox + 102, oy + 120, .8)) + ink(rect(ox + 28, oy + 82, 14, 38, .6)) + ink(rect(ox + 52, oy + 52, 14, 68, .6), 'fill') + ink(rect(ox + 76, oy + 70, 14, 50, .6));
    if (kind === 'chat') s = ink(rect(ox + 16, oy + 28, 64, 30, 1)) + ink(rect(ox + 42, oy + 70, 64, 30, 1)) + ink(seg(ox + 26, oy + 44, ox + 66, oy + 44, .6), 'thin') + ink(seg(ox + 52, oy + 86, ox + 94, oy + 86, .6), 'thin');
    if (kind === 'list') s = ink(rect(ox + 26, oy + 18, 70, 102, 1)) + [40, 62, 84].map(function (y) { return ink(rect(ox + 34, oy + y, 10, 10, .5), 'thin') + ink(seg(ox + 52, oy + y + 6, ox + 86, oy + y + 6, .6), 'thin'); }).join('');
    if (kind === 'cards') s = ink(rect(ox + 22, oy + 40, 46, 64, 1)) + ink(rect(ox + 38, oy + 30, 46, 64, 1)) + ink(rect(ox + 54, oy + 20, 46, 64, 1));
    if (kind === 'clock') s = ink(ell(ox + 61, oy + 66, 38, 38)) + ink(seg(ox + 61, oy + 66, ox + 61, oy + 40, .5)) + ink(seg(ox + 61, oy + 66, ox + 80, oy + 74, .5));
    if (kind === 'qr') s = ink(rect(ox + 30, oy + 28, 62, 62, .8)) + ink(rect(ox + 38, oy + 36, 16, 16, .4), 'fill') + ink(rect(ox + 68, oy + 36, 16, 16, .4), 'fill') + ink(rect(ox + 38, oy + 66, 16, 16, .4), 'fill') + ink(seg(ox + 70, oy + 72, ox + 84, oy + 82, .4), 'thin');
    if (kind === 'map') s = ink(rect(ox + 18, oy + 30, 86, 70, 1)) + ink('M' + (ox + 61) + ' ' + (oy + 78) + ' Q' + (ox + 44) + ' ' + (oy + 56) + ' ' + (ox + 61) + ' ' + (oy + 44) + ' Q' + (ox + 78) + ' ' + (oy + 56) + ' ' + (ox + 61) + ' ' + (oy + 78));
    return s;
  }
  function sketchSheet(seedN, kinds, noCodeIdx) {
    seed = seedN;
    var s = '<svg viewBox="0 0 268 380"><g class="fold">' + ink(seg(134, 14, 134, 366, .8), 'fold') + ink(seg(14, 190, 254, 190, .8), 'fold') + '</g>';
    var pos = [[10, 20], [138, 20], [10, 200], [138, 200]];
    kinds.forEach(function (k, i) { s += '<g class="q q' + i + '">' + quad(seedN + i * 3, k, pos[i][0], pos[i][1]) + (i === noCodeIdx ? hw(pos[i][0] + 61, pos[i][1] + 160, '코드 없이', 22, 'fix') : '') + '</g>'; });
    return s + '</svg>';
  }
  function sketchHTML() {
    return '<div class="desk" data-scene="sketch">' +
      '<div class="sheet ka" style="left:44px;top:46px;width:268px;height:380px"><span class="who">가</span>' + sketchSheet(5, ['phone', 'bars', 'chat', 'list'], 3) + '</div>' +
      '<div class="sheet kb" style="left:350px;top:46px;width:268px;height:380px"><span class="who">나</span>' + sketchSheet(9, ['qr', 'cards', 'clock', 'map'], 1) + '</div>' +
      '<div class="pick" style="left:478px;top:52px;width:150px;height:184px"></div>' +
      '<div class="role rk" style="left:470px;top:440px;background:var(--fix);color:#fff;border-color:var(--fix)">둘이 고른 아이디어</div>' +
    '</div>';
  }
  function sketchRun(p) {
    var a = p.q('.ka'), b = p.q('.kb');
    return Promise.resolve().then(function () {
      [a, b].forEach(function (s, i) { p.a(s, [{ opacity: 0, transform: 'translateY(30px) rotate(' + (i ? 2 : -2) + 'deg)' }, { opacity: 1, transform: 'rotate(' + (i ? 1 : -1) + 'deg)' }], { duration: 600, delay: i * 200 }); });
      return p.w(700);
    }).then(function () {   // 네 칸으로 접은 자국
      [a, b].forEach(function (s) {
        p.a(s.querySelector('svg'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(.06)', offset: .45 }, { transform: 'scaleX(1)' }], { duration: 900, fill: 'none', easing: 'ease-in-out' });
        p.draw(s.querySelector('.fold'), 500, 200);
      });
      return p.w(1200);
    }).then(function () {
      var chain = Promise.resolve();
      [0, 1, 2, 3].forEach(function (i) {
        chain = chain.then(function () { p.draw(a.querySelector('.q' + i), 900); p.draw(b.querySelector('.q' + i), 900); return p.w(1050); });
      });
      return chain;
    }).then(function () {
      p.a(p.q('.pick'), [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1) rotate(-3deg)' }], { duration: 450, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      p.a(p.q('.rk'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300 });
      return p.w(3800);
    }).then(function () { p.a(p.q('.desk') || p.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'none' }); return p.w(380); })
      .then(function () { p.root._scene.play(); });
  }

  // ── 장면 3: 종이 화면 세 장(그리기만) ──────────────────────
  function threeHTML() {
    var w = 200, h = 283, xs = [30, 270, 510];
    return '<div class="desk" data-scene="three">' +
      [sheet1, sheet2, sheet3].map(function (fn, i) {
        return '<div class="sheet t' + i + '" style="left:' + xs[i] + 'px;top:60px;width:' + w + 'px;height:' + h + 'px">' + fn() + '<span class="lab">' + ['① 첫 화면', '② 핵심 행동', '③ 결과'][i] + '</span></div>';
      }).join('') +
      '<div class="note y" style="left:300px;top:392px;width:150px;min-height:100px;font-size:28px;transform:rotate(-3deg)"><small>포스트잇</small>바뀌는 부분·팝업</div>' +
      '<svg class="arw" width="760" height="560" style="position:absolute;left:0;top:0;pointer-events:none">' + ink(arrow(236, 200, 264, 200, 10)) + ink(arrow(476, 200, 504, 200, 10)) + '</svg>' +
    '</div>';
  }
  function threeRun(p) {
    var ss = p.qa('.sheet');
    ss.forEach(function (s, i) {
      p.a(s, [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'rotate(' + (i - 1) + 'deg)' }], { duration: 600, delay: i * 400 });
      setTimeout(function () { try { p.draw(s.querySelector('svg'), 1300); } catch (e) {} }, 200 + i * 400);
    });
    return p.w(2600).then(function () {
      p.draw(p.q('.arw'), 600, 200);
      p.a(p.q('.note'), [{ opacity: 0, transform: 'scale(1.4) rotate(-12deg)' }, { opacity: 1, transform: 'scale(1) rotate(-3deg)' }], { duration: 420, delay: 600, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      return p.w(1200);
    }).then(function () { p.draw(p.q('.t1 .fixg'), 700, 200); });
  }

  // ── 장면 4: 교대 시연 순환(세 팀 또는 네 팀) ──────────────────
  // 팀 수는 팀 입력 장에서 4팀 칸에 이름이 있으면 4, 없으면 3. 책상은 세 팀이면 삼각형, 네 팀이면 사각형
  var LAYOUT = {
    3: { tb: [[340, 130], [560, 370], [120, 370]],
         arcs: ['M450 150 Q590 210 590 290', 'M450 470 Q340 520 230 470', 'M90 290 Q90 210 230 150'],
         heads: ['M582 282 L590 296 L600 282', 'M240 462 L228 470 L240 480', 'M218 146 L232 150 L224 162'] },
    4: { tb: [[180, 120], [500, 120], [500, 372], [180, 372]],
         arcs: ['M286 92 Q340 62 394 92', 'M612 218 Q640 260 612 302', 'M394 452 Q340 476 286 452', 'M68 302 Q40 260 68 218'],
         heads: ['M382 82 L396 93 L380 100', 'M620 290 L611 304 L603 290', 'M298 462 L284 452 L300 444', 'M60 230 L69 216 L77 230'] }
  };
  function teamData() { var d = {}; try { d = JSON.parse(localStorage.getItem('aileader_day2_teams') || '{}'); } catch (e) {} return d; }
  function teamCount() { var d = teamData(); return ((d.t3a || '').trim() || (d.t3b || '').trim()) ? 4 : 3; }
  function teamNames() {
    var d = teamData();
    return [0, 1, 2, 3].map(function (t) { return [(d['t' + t + 'a'] || '').trim() || '가', (d['t' + t + 'b'] || '').trim() || '나']; });
  }
  function spot(n, t, kind) { var c = LAYOUT[n].tb[t]; return kind === 'c' ? [c[0] - 46, c[1] + 98] : [c[0] + 46, c[1] + 98]; }
  function rotHTML() { return '<div class="desk" data-scene="rot"></div>'; }
  function rotBuild(root) {   // 팀 수에 맞춰 책상·화살표·사람 표시를 다시 그린다
    var n = teamCount(), L = LAYOUT[n];
    if (root._n === n) return;
    root._n = n;
    var line = 'fill:none;stroke:#b9ab92;stroke-width:3;stroke-linecap:round';
    var s = '<div class="rnd"><span class="rt"></span></div>' +
      '<svg width="680" height="560" style="position:absolute;left:0;top:0;pointer-events:none">' +
      L.arcs.map(function (d) { return '<path style="' + line + ';stroke-dasharray:10 9" d="' + d + '"/>'; }).join('') +
      L.heads.map(function (d) { return '<path style="' + line + '" d="' + d + '"/>'; }).join('') + '</svg>';
    L.tb.forEach(function (c, t) {
      s += '<div class="tb" style="left:' + c[0] + 'px;top:' + c[1] + 'px"><i class="pp1"></i><i class="pp2"></i><i class="pp3"></i><b style="color:var(--t' + (t + 1) + ')">' + (t + 1) + '팀 책상</b></div>';
    });
    L.tb.forEach(function (c, t) { ['a', 'b'].forEach(function (m) { s += '<div class="tok" data-t="' + t + '" data-m="' + m + '" style="background:var(--t' + (t + 1) + ')"></div>'; }); });
    root.innerHTML = s;
  }
  function rotPos(n, t, m, round) {   // 라운드별 자리: 0 준비, 1 가가 다음 팀으로, 2 나가 다음 팀으로
    var nx = (t + 1) % n;
    if (round === 0) return m === 'a' ? spot(n, t, 'u') : spot(n, t, 'c');
    if (round === 1) return m === 'a' ? spot(n, nx, 'u') : spot(n, t, 'c');
    return m === 'a' ? spot(n, t, 'c') : spot(n, nx, 'u');
  }
  function rotPaint(root, round, animate) {
    var before = root._n;
    rotBuild(root);
    if (root._n !== before) root.querySelectorAll('.tok').forEach(function (el) { el._at = null; });
    var names = teamNames(), n = root._n;
    root.querySelectorAll('.tok').forEach(function (el) {
      var t = +el.dataset.t, m = el.dataset.m, nm = names[t][m === 'a' ? 0 : 1];
      el.textContent = nm.length > 4 ? nm.slice(0, 4) : nm;
      var to = rotPos(n, t, m, round), from = el._at || rotPos(n, t, m, 0);
      el._at = to;
      el.getAnimations().forEach(function (a) { a.cancel(); });
      el.style.transform = 'translate(' + to[0] + 'px,' + to[1] + 'px)';   // 애니메이션이 취소돼도 이 자리에 남는다
      if (animate && (from[0] !== to[0] || from[1] !== to[1]))
        el.animate([{ transform: 'translate(' + from[0] + 'px,' + from[1] + 'px)' }, { transform: 'translate(' + to[0] + 'px,' + to[1] + 'px)' }], { duration: 1300, delay: (m === 'a' ? 0 : 150) + t * 90, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'backwards' });
    });
    root.querySelector('.rt').textContent = ['', '1라운드', '2라운드'][round] || '';
    root._round = round;
  }

  // ── 1단계 문장 틀 채우기 ─────────────────────────────────
  function hypRun(p) {
    var ex = (p.root.dataset.ex || '').split(' | ').map(function (e) { return e.split(' / '); });
    var slots = p.qa('.slot'), lab = p.q('.ex'), names = slots.map(function (s) { return s.dataset.ph; });
    // 빈칸 뒤 조사(은/는, 을/를)는 채운 낱말의 받침에 맞춘다
    function josa(word, pair) { var c = word.charCodeAt(word.length - 1) - 0xAC00; return c >= 0 && c <= 11171 && c % 28 ? pair[0] : pair[1]; }
    function clear() { slots.forEach(function (s, i) { s.classList.remove('on'); s.textContent = names[i]; var js = s.nextElementSibling; if (js && js.classList.contains('js')) js.textContent = js.dataset.d; }); }
    function type(el, text) {
      el.classList.add('on'); el.innerHTML = '<span class="tx"></span><i class="cur"></i>';
      var tx = el.querySelector('.tx'), i = 0;
      return new Promise(function (res, rej) {
        (function tick() {
          try { p.live(); } catch (e) { return rej(e); }
          tx.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(tick, 55); else { el.querySelector('.cur').remove(); res(); }
        })();
      });
    }
    var k = 0;
    function one() {
      clear(); lab.textContent = '예시 ' + (k + 1);
      var e = ex[k % ex.length], ch = p.w(700);
      e.forEach(function (part, i) {
        ch = ch.then(function () { return type(slots[i], part); }).then(function () {
          var js = slots[i].nextElementSibling; if (js && js.classList.contains('js')) js.textContent = josa(part, js.dataset.j);
          return p.w(250);
        });
      });
      return ch.then(function () { return p.w(3800); }).then(function () { k++; return one(); });
    }
    return one();
  }

  // ── 장면 등록·전환 ─────────────────────────────────────
  var RUNS = { intro: INTRO, sketch: sketchRun, three: threeRun, hyp: hypRun };
  function bind(root) {
    if (root._scene) return root._scene;
    var sc = new Scene(root, RUNS[root.dataset.scene]);
    root._scene = sc; return sc;
  }
  function activate(slide, step) {
    step = step || 0;
    scenes.forEach(function (sc) { if (!slide.contains(sc.root)) { sc.stop(); sc.playing = false; } });
    slide.querySelectorAll('[data-scene]').forEach(function (root) {
      if (root.dataset.scene === 'rot') {   // 교대 순환: 0 준비, 1 1라운드, 2 2라운드. 같은 장 안에서 앞뒤로 넘길 때만 움직인다
        var moving = root._live && root._round !== step;
        if (!root._live) root.querySelectorAll('.tok').forEach(function (el) { el._at = null; });
        rotPaint(root, step, moving);
        root._live = true;
        return;
      }
      var sc = bind(root);
      if (root.dataset.stepped) { if (sc.cur !== step) sc.goto(step); return; }
      if (!sc.playing) sc.play();
      sc.playing = true;
    });
    slide.ownerDocument.querySelectorAll('[data-scene="rot"]').forEach(function (r) { if (!slide.contains(r)) r._live = false; });
  }
  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-replay]');
    if (r) { var root = r.closest('[data-scene]'); if (root && root._scene) root._scene.play(); }
  });

  // ── 단계 타이머 ───────────────────────────────────────
  var actx = null;
  function beep(n) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      for (var i = 0; i < (n || 1); i++) {
        var o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * .28;
        o.frequency.value = 880; o.type = 'sine'; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.25, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + .22);
        o.start(t0); o.stop(t0 + .24);
      }
    } catch (e) {}
  }
  function fmt(s) { var neg = s < 0; s = Math.abs(Math.round(s)); return (neg ? '+' : '') + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function initTimer(el) {
    if (el._t) return;
    var segs = el.dataset.tmr.split(',').map(Number), labs = (el.dataset.labels || '').split(','), total = segs.reduce(function (a, b) { return a + b; }, 0) * 60;
    var C = 2 * Math.PI * 41;
    el.classList.add('tmr');
    el.innerHTML = '<div class="ring"><svg viewBox="0 0 92 92"><circle class="bg" cx="46" cy="46" r="41"/><circle class="fg" cx="46" cy="46" r="41" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><span class="t"></span></div>' +
      '<div class="side"><div class="seg-l"></div><div class="segs">' + segs.map(function (m) { return '<i style="--w:' + m + '"></i>'; }).join('') + '</div>' +
      '<div class="ctl"><button type="button" class="go" data-a="go">▶ 시작</button><button type="button" data-a="plus">+1분</button><button type="button" data-a="reset">↺</button></div></div>';
    var st = { el: el, segs: segs, total: total, used: 0, run: false, last: 0, seg: 0, extra: 0 };
    el._t = st;
    function paint() {
      var tot = st.total + st.extra, left = tot - st.used, acc = 0, idx = segs.length - 1;
      for (var i = 0; i < segs.length; i++) { acc += segs[i] * 60 + (i === segs.length - 1 ? st.extra : 0); if (st.used < acc) { idx = i; break; } }
      if (idx !== st.seg && st.run) { beep(1); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
      st.seg = idx;
      el.querySelector('.t').textContent = fmt(left);
      el.querySelector('.fg').setAttribute('stroke-dashoffset', String(C * Math.min(1, Math.max(0, st.used / tot))));
      el.classList.toggle('over', left < 0);
      if (left < 0 && !st.overBeeped) { st.overBeeped = true; beep(3); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
      var lab = labs[idx] || '', sl = el.querySelector('.seg-l');
      sl.innerHTML = left < 0 ? '<b style="color:var(--ai)">시간이 지났습니다</b>' : (segs.length > 1 ? (idx + 1) + '/' + segs.length + ' · <b>' + lab + '</b>' : '<b>' + (lab || '진행 중') + '</b>');
      el.querySelectorAll('.segs i').forEach(function (x, i) { x.classList.toggle('done', i < idx || left < 0); x.classList.toggle('on', i === idx && left >= 0); });
      el.querySelector('[data-a="go"]').textContent = st.run ? '❚❚ 멈춤' : (st.used ? '▶ 계속' : '▶ 시작');
      el.classList.toggle('run', st.run);
    }
    st.paint = paint; paint();
  }
  function tick() {
    var now = performance.now();
    document.querySelectorAll('.tmr').forEach(function (el) {
      var st = el._t; if (!st || !st.run) return;
      st.used += (now - st.last) / 1000; st.last = now; st.paint();
    });
  }
  setInterval(tick, 250);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.tmr button'); if (!b) return;
    var st = b.closest('.tmr')._t, a = b.dataset.a;
    if (a === 'go') { st.run = !st.run; st.last = performance.now(); if (st.run) beep(0); }
    if (a === 'plus') { st.extra += 60; st.overBeeped = st.used > st.total + st.extra; }
    if (a === 'reset') { st.run = false; st.used = 0; st.extra = 0; st.overBeeped = false; st.seg = 0; }
    st.paint();
  });

  // ── 복사 버튼 ─────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    var text = b.parentNode.querySelector('.body2').innerText.trim();
    var done = function () { b.classList.add('ok'); b.textContent = '복사했습니다'; setTimeout(function () { b.classList.remove('ok'); b.textContent = '복사'; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (er) {} ta.remove(); }
  });

  window.PAPER = {
    introHTML: introHTML, sketchHTML: sketchHTML, threeHTML: threeHTML, rotHTML: rotHTML,
    activate: function (slide, step) { slide.querySelectorAll('[data-tmr]').forEach(initTimer); activate(slide, step); },
    repaintTeams: function () { document.querySelectorAll('[data-scene="rot"]').forEach(function (r) { rotPaint(r, r._round || 0); }); },
    teamCount: teamCount, setTimer: function (el, segs, labels) { if (el._t && el._t.run) return; el._t = null; el.dataset.tmr = segs; el.dataset.labels = labels; initTimer(el); },
    // 덱 밖 페이지(slides/demo/oral-paper.html 등)가 같은 손그림 도구로 자기 장면을 만들 때 사용
    kit: { seg: seg, rect: rect, ell: ell, arrow: arrow, ink: ink, hw: hw, seed: function (n) { seed = n; } },
    aiWindowHTML: aiWindowHTML, flyTargets: flyTargets,
    start: function (root, run) { var sc = new Scene(root, run); root._scene = sc; sc.play(); return sc; }
  };
})();
