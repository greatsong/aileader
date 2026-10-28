/* 1일차 슬라이드 내용. 장 제목은 고정, 핵심 줄·항목·노트는 솔라 프로4 집필(_src/solar_day1_v1.md, solar_day1_fix1.md).
   [data-s="k"]는 k번째 클릭부터 보인다. notes는 N키 발표자 노트(줄마다 한 문단). 2일차 내용은 넣지 않는다(연수생 비공개). */
(function () {
  var HUB = 'greatsong.github.io/aileader';
  var C = function (f) { return 'captures/' + encodeURI(f); };
  var ttl = function (t, tag) { return '<div class="ttl"><h2>' + t + '</h2>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</div>'; };
  // 질문·체험 장 제목: 위에 질문 알약(번호 + 질문), 아래에 큰 이름과 몇 번째 답인지 보여 주는 점(total개 중 idx번째).
  // phrase가 없으면 배지와 제목을 한 줄로. 체험 장(tone 'exp')은 알약을 '체험 n'으로
  var qttl = function (q, phrase, idx, name, tone, total) {
    var cls = 'ttl q' + (tone ? ' ' + tone : '') + (phrase ? '' : ' one');
    if (!phrase) return '<div class="' + cls + '"><span class="qno">' + q + '</span><h2>' + name + '</h2></div>';
    var chip = tone === 'exp' ? phrase + ' <b>' + q + '</b>' : '<b>' + q + '</b>' + phrase;
    var dots = '';
    for (var k = 1; k <= (total || 0); k++) dots += '<i' + (String(k) === String(idx || q) ? ' class="on"' : '') + '></i>';
    return '<div class="' + cls + '"><div class="chip">' + chip + '</div>' +
      '<h2>' + name + (dots ? '<span class="dots">' + dots + '</span>' : '') + '</h2></div>';
  };
  var pts = function (s, attr) { return '<ul class="pts"' + (attr || '') + '>' + s.split(' | ').map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };
  var shot = function (f) { return '<img class="shot" alt="" src="' + C(f) + '">'; };
  var go = function (href, label, sub) { return '<a class="go' + (sub ? ' sub' : '') + '" href="' + href + '" target="_blank" rel="noopener">' + label + ' ↗</a>'; };
  // 실제 화면(앞 화면 지도·연수 메인)을 끼우는 상자. from 요소 가운데에서 원으로 펼쳐진다
  var live = function (src, title, from) { return '<div class="live" data-src="' + src + '" data-from="' + from + '"><iframe title="' + title + '"></iframe></div>'; };
  var hookKeys = function (f) {   // 끼운 화면을 누른 뒤에도 → ← 와 리모컨(PageDown/Up)은 덱이 받는다
    try { f.contentDocument.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); window.DECK.next(); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); window.DECK.prev(); }
    }); } catch (e) {}
  };
  var liveStep = function (el, step) {
    var box = el.querySelector('.live'), f = box.querySelector('iframe');
    if (!f.getAttribute('src')) { f.addEventListener('load', function () { hookKeys(f); }); f.src = box.dataset.src; }   // 장에 들어오면 미리 불러 둔다
    var o = el.querySelector(box.dataset.from), x = 0, y = 0, n = o;
    while (n && n !== el) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    if (o) { box.style.setProperty('--cx', (x + o.offsetWidth / 2) + 'px'); box.style.setProperty('--cy', (y + o.offsetHeight / 2) + 'px'); }
    box.classList.toggle('on', step >= 1);
  };
  var bwLoad = function () {   // 3D 장면은 WebGL이 무거워 앞 장에 들어올 때 한 번만 불러 둔다(장을 떠나 있으면 그리지 않는다)
    var f = document.querySelector('.bw iframe');
    if (f && !f.getAttribute('src')) f.src = 'bitworld.html?embed=1';
  };
  // 커밋 히트맵(content/commits.js, slides/_src/build_commits.py가 만든다). 칸 색은 커밋이 있는 칸들의 4분위로 5단계
  var CM = window.COMMITS || { days: {}, wh: [], from: '2026-01-01', to: '2026-01-01' };
  var leveler = function (vals) {
    var nz = vals.filter(function (v) { return v > 0; }).sort(function (a, b) { return a - b; });
    var q = function (p) { return nz.length ? nz[Math.min(nz.length - 1, Math.floor(p * (nz.length - 1)))] : 0; };
    var t = [q(.25), q(.5), q(.75)], max = nz.length ? nz[nz.length - 1] : 0;
    var f = function (v) { return v <= 0 ? 0 : v <= t[0] ? 1 : v <= t[1] ? 2 : v <= t[2] ? 3 : 4; };
    // 범례: 단계마다 실제로 들어가는 커밋 수 범위(같은 값이 겹쳐 빈 단계면 '·')
    var lo = [0, 1, t[0] + 1, t[1] + 1, t[2] + 1], hi = [0, t[0], t[1], t[2], max];
    f.ranges = lo.map(function (a, i) { var b = hi[i]; return a > b ? '·' : a === b ? String(a) : a + '–' + b; });
    return f;
  };
  // 3D 빌딩 숲 자료(content/skyline.js). 2D와 같은 색 단계를 쓴다
  var skyDays = function () {
    var end = new Date(CM.to + 'T00:00:00'), m1 = end.getMonth() + 1, vals = [], k, rows = [], cells = [], cols = [], m, d;
    for (k in CM.days) vals.push(CM.days[k]);
    for (d = 1; d <= 31; d++) cols.push(d === 1 || d % 5 === 0 ? String(d) : '');
    for (m = 1; m <= m1; m++) {
      rows.push(m + '월'); var row = [];
      for (d = 1; d <= 31; d++) {
        var dt = new Date(2026, m - 1, d), key = '2026-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
        row.push(dt.getMonth() !== m - 1 || dt > end ? null : (CM.days[key] || 0));
      }
      cells.push(row);
    }
    return { rows: rows, cols: cols, cells: cells, level: leveler(vals), maxH: 6.5, tip: function (r, c, v) { return (r + 1) + '월 ' + (c + 1) + '일 · ' + v + '개'; } };
  };
  var skyWeek = function () {
    var names = ['월', '화', '수', '목', '금', '토', '일'], vals = [], cols = [], hr;
    (CM.wh || []).forEach(function (r) { vals = vals.concat(r); });
    for (hr = 0; hr < 24; hr++) cols.push(hr % 3 === 0 ? String(hr) : '');
    return { rows: names, cols: cols, cells: CM.wh || [], level: leveler(vals), maxH: 5.5, tip: function (r, c, v) { return names[r] + '요일 ' + c + '시 · ' + v + '개'; } };
  };
  var skyStep = function (fn) { var d = null; return function (el, step) { if (!window.SKY) return; d = d || fn(); window.SKY.step(el, step, d); }; };
  var legendOf = function (lv, unit) {
    return '<div class="hm-leg"><span class="u">' + unit + '</span>' + lv.ranges.map(function (r, i) {
      return '<span class="k"><i class="l' + i + '"></i><small>' + r + '</small></span>'; }).join('') + '</div>';
  };
  var heatDays = function () {
    var end = new Date(CM.to + 'T00:00:00'), m1 = end.getMonth() + 1, vals = [], k, d, m;
    for (k in CM.days) vals.push(CM.days[k]);
    var lv = leveler(vals), h = '<div class="hm md"><span></span>';
    for (d = 1; d <= 31; d++) h += '<b>' + d + '</b>';
    for (m = 1; m <= m1; m++) {
      h += '<em>' + m + '월</em>';
      for (d = 1; d <= 31; d++) {
        var dt = new Date(2026, m - 1, d), key = '2026-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
        if (dt.getMonth() !== m - 1 || dt > end) { h += '<i class="x"></i>'; continue; }
        var v = CM.days[key] || 0;
        h += '<i class="l' + lv(v) + '" style="--d:' + ((m - 1) * 40 + d * 14) + 'ms" title="' + m + '월 ' + d + '일 · ' + v + '개"></i>';
      }
    }
    return h + '</div>' + legendOf(lv, '하루 커밋 수');
  };
  var heatWeek = function () {
    var names = ['월', '화', '수', '목', '금', '토', '일'], vals = [], w, hr;
    (CM.wh || []).forEach(function (r) { vals = vals.concat(r); });
    var lv = leveler(vals), h = '<div class="hm wh"><span></span>';
    for (hr = 0; hr < 24; hr++) h += '<b>' + hr + '</b>';
    for (w = 0; w < 7; w++) {
      h += '<em>' + names[w] + '</em>';
      for (hr = 0; hr < 24; hr++) {
        var v = (CM.wh[w] || [])[hr] || 0;
        h += '<i class="l' + lv(v) + '" style="--d:' + (w * 60 + hr * 22) + 'ms" title="' + names[w] + '요일 ' + hr + '시 · ' + v + '개"></i>';
      }
    }
    return h + '</div>' + legendOf(lv, '1~10월 합계 커밋 수');
  };
  // 질문 4: 한 장에 도구 둘. 카드마다 캡처 · 이름 · 항목 · 버튼(gos는 go() 이어 붙인 것)
  var card = function (name, f, items, gos) {
    return '<div class="pc"><div class="pic">' + shot(f) + '</div><h3>' + name + '</h3>' + pts(items) + '<div class="gos">' + gos + '</div></div>';
  };
  var demo = function (side, pic) { return '<div class="demo"><div class="side">' + side + '</div><div class="pic">' + pic + '</div></div>'; };

  window.SLIDES = [
  // ── 시작 ─────────────────────────────────────────────
  { sec: '시작', title: '표지', html:
    '<div class="cover">' +
      '<div class="eyebrow">동작관악 AI에듀테크 선도교사단</div>' +
      '<h1>바이브코딩 사례 나눔과<br><span class="a">아이데이션 해커톤</span></h1>' +
      '<div class="who"><b>당곡고등학교 송석리</b></div>' +
    '</div>',
    notes: '자, 오늘은 제가 직접 만든 수업용 도구를 보여 드리고 두 앱을 함께 체험하는 시간입니다.\n저는 당곡고등학교 정보 교사로, 올해 2월부터 수업용 도구를 직접 만들어 수업에 사용하고 있습니다.\n먼저 제가 만든 도구 사례를 간단히 살펴보겠습니다.' },

  // 표지 다음: 지도 QR을 크게. 화면을 누르면(1단계) QR 자리에서 실제 앞 화면 지도가 원으로 펼쳐진다
  { sec: '시작', title: '우리 학교를 지도에', steps: 1, html:
    ttl('우리 학교를 지도에') +
    '<div class="qrstage">' +
      '<div class="qrbig"><img alt="" src="../assets/qr/map.svg"></div>' +
      '<div class="qrurl">greatsong.github.io/<br>aileader/map</div>' +
    '</div>' +
    live('../map/board.html', '앞 화면 지도', '.qrbig'),
    onStep: liveStep,
    notes: '학교를 올리면 앞 화면 지도에 바로 표시됩니다. 궁금한 것을 적어 주시면 오늘 이야기에 반영하겠습니다.\n올라오는 동안 지도를 함께 보며 어느 지역에서 오셨는지 짚어 보겠습니다. 활동 시간은 5분입니다.' },

  // ── 소개 ─────────────────────────────────────────────
  // 세종과학고 특강(260923) 자기소개 2~4장 원본 그대로(neural-explorer/public/lecture-assets/source/slide-02~04.png)
  // intro-02만 고침(2026-10-27): 서울대 사범대학 강사 2020 – 2026.8, '2020 – 2022 재단법인 카카오임팩트 이사' 줄 추가(줄 간격을 조금 좁혀 맞춤)
  { sec: '소개', title: '제 소개 1', fx: 'fade', html: '<div class="full"><img alt="" src="img/intro-02.png"></div>', notes: '' },
  { sec: '소개', title: '제 소개 2', fx: 'fade', html: '<div class="full"><img alt="" src="img/intro-03.png"></div>', notes: '' },
  { sec: '소개', title: '제 소개 3', fx: 'fade', html: '<div class="full"><img alt="" src="img/intro-04.png"></div>', notes: '' },

  // 아톰의 세상과 비트의 세상: 초안(1e7e700)의 차이나는 클라스 장면 두 장(source-06·07)을 화면 가득 겹쳐 차례로. 앞 장 위에 다음 장이 덮인다
  { sec: '소개', title: '아톰의 세상과 비트의 세상', fx: 'fade', html:
    '<div class="bleed paper">' +
      '<div class="layer"><img alt="" src="img/atom-bit-1.webp"></div>' +
      '<div class="layer" data-s="1"><img alt="" src="img/atom-bit-2.webp"></div>' +
    '</div>',
    onStep: function () { bwLoad(); },   // 다음 장(3D)을 미리 불러 둔다
    notes: '닐 거센필드는 세상을 아톰의 세상과 비트의 세상으로 구분했습니다. 아톰은 물질이고 비트는 정보입니다.\n교사가 만드는 도구는 비트의 세상에 있습니다. 풀려는 문제는 교실이라는 아톰의 세상에 있습니다.' },

  // 넓어지는 비트의 세상: 10/26 워크숍 인트로 3D(bitworld.html)를 통째로 끼운다. 덱의 단계 0~8이 장면의 단계
  { sec: '소개', title: '넓어지는 비트의 세상', steps: 8, html:
    '<div class="bw"><iframe title="아톰의 세상과 비트의 세상 3D 장면"></iframe></div>',
    onStep: function (el, step) {
      el.dataset.k = step; bwLoad();
      var w = el.querySelector('iframe').contentWindow;
      if (w && w.BW) w.BW.go(step);
    },
    notes: '' },

  // ── 네 질문 ──────────────────────────────────────────
  // 올해 커밋: 월일별, 요일별·시간대별(진행자 맥북의 로컬 저장소 기준)
  // 누르면(1단계) 같은 자료가 3D 빌딩 숲으로: 위에서 내려다본 채로 건물이 솟고 카메라가 옆으로 내려온다. 끌면 돌려 보고, 건물에 올리면 커밋 수
  // 간지: 세종과학고 특강(260923) 간지 모양 그대로(보라 바탕 #6B46FF에 흰 굵은 글자 한 줄)
  { sec: '바이브 코딩 프로젝트', title: '바이브 코딩 프로젝트', fx: 'fade', html: '<div class="sep"><h2>바이브 코딩 프로젝트</h2></div>', notes: '' },

  { sec: '바이브 코딩 프로젝트', title: '2026년 커밋 히트맵 · 월일별', steps: 1, html: function () {
    return ttl('2026년 커밋 히트맵', '월일별') + heatDays() + '<div class="sky nonext"></div>'; }, onStep: skyStep(skyDays), notes: '' },
  { sec: '바이브 코딩 프로젝트', title: '2026년 커밋 히트맵 · 요일별·시간대별', steps: 1, html: function () {
    return ttl('2026년 커밋 히트맵', '요일별·시간대별') + heatWeek() + '<div class="sky nonext"></div>'; }, onStep: skyStep(skyWeek), notes: '' },

  { sec: '바이브 코딩 프로젝트', title: '제가 해 온 네 가지 질문', steps: 4, html:
    ttl('제가 해 온 네 가지 질문') +
    '<ol class="qs">' +
      '<li data-s="1"><span class="qno">1</span>매일 내 옆에서 나와 대화할 수 있는 팅커벨이 있다면?</li>' +
      '<li data-s="2"><span class="qno">2</span>AI가 날 도와준다면 어떤 수업을 해볼 수 있을까?</li>' +
      '<li data-s="3"><span class="qno">3</span>그동안 수집되지 못한 데이터를 AI로 수집할 수 있다면 어떤 의미있는 교육을 해볼 수 있을까?</li>' +
      '<li data-s="4"><span class="qno">4</span>AI시대, 아이들에게 더 필요해진 능력들, 더 중요해진 능력들을 어떻게 기르도록 도와줄 수 있을까?</li>' +
    '</ol>',
    notes: '올해 도구를 만들면서 이 네 질문을 붙들어 왔습니다. 오늘은 그 질문에 대한 답 몇 가지를 보여 드리겠습니다.\n매일 내 옆에서 나와 대화할 수 있는 팅커벨이 있다면, AI가 날 도와준다면 어떤 수업을 해볼 수 있을까, 그동안 수집되지 못한 데이터를 AI로 수집할 수 있다면 어떤 의미있는 교육을 해볼 수 있을까, AI시대 아이들에게 더 필요해진 능력들을 어떻게 기르도록 도와줄 수 있을까입니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 1) 팅커비스', html:
    qttl('1', '매일 내 옆에서 나와 대화할 수 있는 팅커벨이 있다면?', '', '팅커비스(thinkervis)') +
    '<div class="tink"><img alt="" src="img/tinkervis.webp"></div>',   // 팅커비스 그림: ai-ta-project-assessment/raw/art/fig_ai.png
    notes: '' },

  { sec: '바이브 코딩 프로젝트', title: '질문 2) 답 하나, 커리큘럼 위버', html:
    qttl('2', 'AI가 날 도와준다면', '1', '커리큘럼 위버', '', 2) +
    demo(pts('교사 팀이 AI 공동설계자와 함께 협력 원리에 따라 융합 수업을 설계하는 플랫폼 | 성취기준을 검색하고 다른 교과의 연결된 성취기준 찾기 | 국어·영어·음악 교사 세 명이 절차를 끝까지 밟아 수업까지 실행한 사례') +
         '<div class="gos">' + go('https://curriculum-weaver.vercel.app/graph', '커리큘럼 위버 열기') +
           go('https://github.com/greatsong/k-curriculum-2022', '교육과정 깃허브', true) + '</div>',
         shot('기존-커리큘럼위버-성운3D-0905.png')),
    notes: '로그인 없이 열리는 교육과정 지도로 짧게 시연하겠습니다. 성취기준 하나를 검색해 연결된 다른 교과를 보여 드립니다.\n10월 교사 연수 뒤 사용이 멈춘 기록도 숨기지 않고 언급하겠습니다.\n10월 연수 첫날 교사 메시지 924건, 둘째 날 289건, 그 뒤 8일 동안 0건이었으나 원인은 분석하지 않았습니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 2) 답 둘, 당곡 AI 채팅 앱', html:
    qttl('2', 'AI가 날 도와준다면', '2', '당곡 AI 채팅 앱', '', 2) +
    demo(pts('당곡고 학생 누구나 학습 목적으로 다양한 유료 AI를 자유롭게 쓸 수 있도록 | 학생들의 학습 과정을 선생님이 확인하고, 프롬프트 사용에 대한 평가까지 자동으로') +
         '<div class="gos">' + go('https://danggok-ai.vercel.app', 'AI 채팅 앱 열기') + '</div>',
         shot('04-AI채팅-로그인.png')),
    notes: '모든 학생이 유료 AI를 사용할 수 있게 하려고 만든 도구입니다. 진행자 계정으로 직접 시연하겠습니다.\n학교망에서 여러 학생이 같은 주소로 접속해 요청 한도를 올린 일이 있었습니다. 5월에 학교 NAT 때문에 요청 한도를 분당 500회에서 3,000회로 올렸습니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 3) 답 하나, 구술 평가 with 팅커비스', html:
    qttl('3', '수집되지 못한 데이터', '1', '구술 평가 <span class="with">with 팅커비스</span>', '', 3) +
    demo(pts('팀 구술을 녹음하면 AI가 받아 적고 피드백 초안 작성 | 교사가 검토한 피드백만 학생에게 전달') +
         '<div class="gos">' + go('https://greatsong.github.io/ai-ta-project-assessment/', '구술 평가 발표 자료') + '</div>',   // 앱 시연은 진행자가 따로 연 브라우저에서
         shot('06-구술평가-해결의흐름.png')),
    notes: '그동안 말로 사라지던 설명이 기록과 피드백이 됩니다. AI는 정리하고 초안을 쓰고 판단은 교사가 합니다.\n데이터 과학 팀 프로젝트에서 팀마다 3~5분 구술을 진행했습니다. 학습 효과는 아직 측정하지 않았습니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 3) 답 둘, AI 면접 앱', html:
    qttl('3', '수집되지 못한 데이터', '2', 'AI 면접 앱', '', 3) +
    demo(pts('생기부와 대학 자료로 기본 질문을 만들고 답마다 꼬리질문 | 끝나면 연습 메모와 다음 연습 목표 | 이름·학번은 교사 노트북에만, AI에는 가린 생기부 글만') +
         '<div class="gos">' + go('http://localhost:4069/#/s/1/3/1', '시연 화면 열기') + '</div>',   // 진행자 맥북의 시연 서버(interview-coach/demo/시연서버_켜기.command, 가짜 학생만)
         shot('07-AI면접-시연.png')),
    notes: '구술 평가 시스템을 대입 면접 연습으로 옮긴 사례입니다. 가짜 학생 자료로 시연하겠습니다.\n가장 중요하게 본 것은 안정성과 개인정보입니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 3) 답 셋, 정보과 문항 나눔', html:
    qttl('3', '수집되지 못한 데이터', '3', '정보과 문항 나눔', '', 3) +
    demo(pts('학교명·교육청·출제자 이름 pdf에서 실제 삭제 | AI가 문항 나누고 문항마다 2022 개정 성취기준 제안, 확정은 올린 교사 | 승인된 시험지 올린 교사만 다른 교사 문항 열람') +
         '<div class="gos">' + go('https://info-exam-bank.fly.dev', '정보과 문항 나눔 열기') + '</div>',
         shot('13-문항나눔-첫화면.png')),
    notes: '학교마다 시험 문항을 만들지만 학교 밖으로 모이지 않았습니다. 정보과 교사끼리 문항을 성취기준별로 모아 보고 토의하려고 만든 도구입니다.\n진행자 계정으로 로그인해 짧게 시연하겠습니다.\n성취기준 123개, 대상 과목 여섯 가지입니다. 원본 pdf는 관리자가 승인하면 삭제됩니다.' },

  // 질문 4 답 둘: 도구 둘씩 한 장에. 캡처(2026-10-28): 로드맵은 컴포넌트만 완주 상태(8/8·23/23)로 그린 것, VPyLab 갤럭시 디스코 실행 화면,
  // Neural Explorer A5(인공 뉴런 하나, 역전파 3 step), 데이터 과학 10차시 연관 분석 막대 위젯(규칙 B 순대국 → 석박지).
  // 항목·노트는 솔라 프로4 집필(_src/solar_day1_q4_fix1.md, 데이터 과학 항목 solar_q4_fix5.md, 둘째 장 노트 solar_day1_q4_fix4.md)
  { sec: '바이브 코딩 프로젝트', title: '질문 4) 답 하나, pythink2 · VPyLab', html:
    qttl('4', 'AI 시대에 더 필요해진 사고력과 창조적 문제해결능력', '1', 'pythink2 · VPyLab', '', 2) +
    '<div class="pair">' +
      card('pythink2', '21-pythink2-로드맵.webp',
        '여덟 개 월드 로드맵으로 출력부터 반복까지 단계 따라가기 | AI 코치 힌트로 답 대신 생각 유도하기',
        go('https://pythink2.vercel.app', 'pythink2 열기')) +
      card('VPyLab', '22-vpylab-갤럭시디스코.webp',
        '파이썬 코드를 3D 장면과 소리로 바꿔 갤러리에서 공유하기 | 수학·과학·미술 융합 코스 따라가기',
        go('https://vpylab.vercel.app/sandbox?example=lightshow-galaxy-disco', '갤럭시 디스코 실행') +
        go('https://vpylab.vercel.app', 'VPyLab 열기', true)) +
    '</div>',
    notes: '두 도구 모두 학생이 코드를 직접 쓰며 생각하는 도구입니다. pythink2는 여덟 개 월드 로드맵과 AI 코치 힌트로 학습 순서를 잡아 줍니다. VPyLab은 갤럭시 디스코 예제를 바로 실행해 보여 드리겠습니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 4) 답 둘, Neural Explorer · 당곡고 데이터 과학', html:
    qttl('4', 'AI 시대에 더 필요해진 AI에 대한 수학적 이해와 데이터 리터러시', '2', 'Neural Explorer · 당곡고 데이터 과학', '', 2) +
    '<div class="pair">' +
      card('Neural Explorer', '23-neural-explorer-역전파.webp',
        '코드 없이 슬라이더와 그림판으로 신경망부터 LLM 첫걸음까지 다루기 | 인공 뉴런 하나의 학습 반복과 역전파 살펴보기',
        go('https://neural-explorer.vercel.app/#/a5', '역전파 시연') +
        go('https://neural-explorer.vercel.app', 'Neural Explorer 열기', true)) +
      card('당곡고 데이터 과학', '24-데이터과학-연관분석.webp',
        '중식 184일 장바구니로 묶은 식단 메뉴 규칙 찾기 | 신뢰도 향상도 차이 손으로 계산해 보기',
        // 10차시 막대 위젯으로 바로: 글 조각 주소(#:~:text=)가 '규칙 B · 순대국 → 석박지' 단추까지 내려 표시해 준다. 누르면 석박지 막대
        go('https://greatsong.github.io/ds-danggok-2026/lesson10.html#:~:text=%EA%B7%9C%EC%B9%99%20B%20%C2%B7%20%EC%88%9C%EB%8C%80%EA%B5%AD%20%E2%86%92%20%EC%84%9D%EB%B0%95%EC%A7%80', '연관 분석 시연') +
        go('https://greatsong.github.io/ds-danggok-2026/', '데이터 과학 교재 열기', true)) +
    '</div>',
    notes: 'Neural Explorer로 인공 뉴런 하나가 역전파로 학습하는 과정을 단계별로 보여 드립니다.\n순대국이 나온 날 석박지가 함께 나온 비율이 1.00이고 평소 석박지가 나온 비율이 0.20이라 향상도가 5.00이 됩니다. 이 수치를 손으로 계산해 보면 신뢰도와 향상도의 차이를 바로 이해하실 수 있습니다.' },

  { sec: '바이브 코딩 프로젝트', title: '질문 4) 직접 해 보는 두 가지', html:
    qttl('4', '', '', 'AI 시대에 더 필요해진 AI 리터러시와 컴퓨팅 사고력 수업 체험') +
    '<div class="twin">' +
      '<div class="card"><div class="n">체험 1</div><h3>🤖 튜링 테스트</h3><p>반 친구들과 함께 \'기계는 생각할 수 있는가?\'라는 앨런 튜링의 역사적 질문에 참여해보는 게이미피케이션 수업</p><img alt="" src="' + C('기존-튜링-교사-진행화면.png') + '"></div>' +
      '<div class="card"><div class="n">체험 2</div><h3>🧊 프롬프트 코딩</h3><p>3차원 장면을 글로 표현하며 컴퓨팅 사고력을 기르는 게이미피케이션 수업</p><img alt="" src="' + C('10-프롬프트코딩-첫화면.png') + '"></div>' +
    '</div>',
    notes: '네 번째 질문에 대한 답은 말보다 직접 해 보시는 편이 낫습니다.\n두 앱 모두 연수 메인에서 바로 들어갑니다.' },

  // ── 체험 ─────────────────────────────────────────────
  { sec: '체험', title: '체험 1) 튜링 테스트', html:
    qttl('1', '체험', '', '튜링 테스트', 'exp', 2) +
    '<div class="url exp top"><div class="lab">연수 메인 → 튜링 테스트</div><div class="u sm">ai-turing-production.up.railway.app/turing-test</div></div>' +
    demo(pts("연수 메인에서 '튜링 테스트' 누르기 | 수업 코드와 팀 이름 넣기 | 질문하고 사람인지 AI인지 투표하기") +
         '<div class="gos">' + go('https://ai-turing-production.up.railway.app/turing-test/teacher', '진행자 화면', true) + '</div>',
         shot('기존-튜링-참가자-대화-확대.png')),   // 대화 부분만 잘라 크게
    notes: '두세 명이 노트북 한 대로 한 팀입니다. 답변을 맡은 팀은 학생인 척 답합니다.\n사람의 답과 AI의 답이 같은 말투로 바뀌고 같은 시간 뒤에 도착하므로 내용으로만 가려내야 합니다. 라운드 1회는 20분입니다.' },

  { sec: '체험', title: '튜링 테스트 돌아보기', html:
    ttl('튜링 테스트 돌아보기') +
    demo('<div class="stat30"><div class="big">30%</div><p>AI가 사람으로 판정된 비율과 튜링의 30% 기준</p></div>' +
         '<ul class="pts"><li>어떤 질문이 사람과 AI를 가르는 데 효과적이었나</li><li>AI는 어떤 답에서 티가 났고, 말투 변환은 판별을 얼마나 어렵게 했나</li><li>튜링의 30% 기준을 넘긴 라운드가 있었다면, 그 기계는 "생각한다"고 할 수 있나</li></ul>',
         shot('기존-튜링-결과-확대.png')),   // 결과·튜링 기준 두 칸만 잘라 크게(전체 화면 캡처는 글씨가 너무 작다)
    notes: '결과 카드의 30% 기준을 함께 확인하고 토론 질문 하나만 골라 짧게 이야기해 보겠습니다.\n학생 수업에서는 이 토론이 중심이 됩니다.' },

  // 30%의 근거: 튜링 1950 원문 442쪽(튜링 아카이브 AMT/B/19 스캔) + 솔라 번역 + 16세 튜링 사진을 한 장으로 디자인한 그림
  { sec: '체험', title: '튜링, 1950', fx: 'fade', html: '<div class="bleed"><img alt="" src="img/turing-1950.webp"></div>', notes: '' },

  { sec: '체험', title: '체험 2) 프롬프트 코딩', html:
    qttl('2', '체험', '', '프롬프트 코딩', 'exp', 2) +
    '<div class="url exp top"><div class="lab">연수 메인 → 프롬프트 코딩</div><div class="u sm">vpython-prompt-challenge.fly.dev</div></div>' +
    demo(pts("연수 메인에서 '프롬프트 코딩' 누르기 | 수업 코드와 번호·이름 넣기 | 목표 장면을 보고 문장으로 설명해 제출하기") +
         '<div class="gos">' + go('https://vpython-prompt-challenge.fly.dev/training', '진행자 화면', true) + '</div>',
         shot('10-프롬프트코딩-첫화면.png')),
    notes: '두 사람이 한 팀입니다. 코드를 쓰지 않고 장면을 문장으로 설명하면 Claude가 3D 코드로 바꾸고 목표 장면과 비교해 점수를 냅니다.\n제출 뒤 결과까지 기다리는 시간을 안내하겠습니다. 결과까지 보통 15~25초입니다. 두 문제, 20분입니다.' },

  { sec: '체험', title: '프롬프트 코딩 돌아보기', html:
    ttl('프롬프트 코딩 돌아보기') +
    '<div class="flow">' +
      '<div class="row"><b>기존 프로그래밍 교육</b><span>문법</span><i>→</i><span>예제</span><i>→</i><span>프로젝트</span></div>' +
      '<div class="row new"><b>이 수업</b><span>결과물</span><i>→</i><span>명세</span><i>→</i><span>코드 읽기</span><i>→</i><span>코드 수정</span><i>→</i><span>코드 창작</span></div>' +
    '</div>' +
    '<div style="margin-top:34px">' + pts('문법보다 먼저 말로 세계를 정의하기 | 그 말이 코드로 어떻게 바뀌는지 거꾸로 따라가며 배우기') + '</div>',
    notes: '기존 프로그래밍 교육은 문법에서 시작하지만 이 수업은 결과물에서 시작합니다. AI가 중간 다리가 되어 가능해진 설계입니다.\n3월 실제 수업에 학생 54명이 참여했고 만족도 96%였습니다.' },

  // ── 마무리 ───────────────────────────────────────────
  // 연수 주소. 화면을 누르면(1단계) 주소 상자 자리에서 실제 연수 메인이 펼쳐져 직접 시연한다
  { sec: '마무리', title: '연수 메인 접속', steps: 1, html:
    ttl('연수 메인 접속') +
    '<div class="url"><div class="lab">노트북 주소창에 입력</div><div class="u">' + HUB + '</div></div>' +
    '<div class="dests">' +
      '<div class="d">🗺️ 우리 학교를 지도에</div><div class="d">🤖 튜링 테스트</div>' +
      '<div class="d">🧊 프롬프트 코딩</div><div class="d">🖼️ 웹앱 갤러리</div>' +
    '</div>' +
    live('../', '연수 메인', '.url'),
    onStep: liveStep,
    notes: '지금 노트북에서 이 주소를 입력해 주십시오.\n오늘 들어가는 곳은 모두 이 페이지의 링크로 연결됩니다. 열어 둔 채로 진행하겠습니다.' },

  // 마지막: 오늘 저녁 갤러리 올리기(과제, 선택)
  { sec: '마무리', title: '오늘 저녁 (선택)', html:
    ttl('오늘 저녁', '선택') +
    '<div class="url top"><div class="lab">연수 메인 → 웹앱 갤러리</div><div class="u sm">' + HUB + '</div></div>' +
    demo(pts('학교에서 풀고 싶은 문제 한 줄 올리기 | 다른 선생님 글에 좋아요와 댓글 남기기') +
         '<div class="gos">' + go('../gallery/#submit', '갤러리에 올리기') + '</div>',
         shot('12-갤러리.png')),
    notes: '오늘 체험과 사례를 보며 떠오른 학교의 문제를 갤러리에 남겨 주십시오. 선택 사항입니다.\n둘째 날 활동은 내일 안내하겠습니다. 감사합니다.' },
  ];
})();
