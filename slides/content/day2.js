/* 2일차 진행 화면 내용. 엔진은 1일차와 같다(deck/deck.js). 움직이는 장면과 타이머는 content/paper.js.
   장 제목·수치 카드 이름은 고정, 항목·핵심 줄·노트는 솔라 프로4 집필
   (워크숍: _src/solar_day2_ws.md·_fix1~3, 피드백: _src/solar_day2_fb.md·_fix1).
   피드백 수치는 2026-10-30 아침 배포본·공개 저장소에서 진행자가 측정한 값이다(_workspace/day2/feedback/ 근거 문서).
   공개 화면이므로 개인에게만 전할 내용(키 노출 등)은 이 파일에 넣지 않는다. */
(function () {
  var HUB = 'greatsong.github.io/aileader';
  var C = function (f) { return 'captures/day2/' + f + '.webp'; };
  var ttl = function (t, tag) { return '<div class="ttl"><h2>' + t + '</h2>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</div>'; };
  // 워크숍 단계 제목: 위에 '워크숍 n단계' 알약, 아래 큰 이름과 여섯 단계 중 몇 번째인지 보여 주는 점
  var wst = function (n, name) {
    var dots = ''; for (var k = 1; k <= 6; k++) dots += '<i' + (k === n ? ' class="on"' : '') + '></i>';
    return '<div class="ttl q ws"><div class="chip"><b>' + n + '</b>워크숍 ' + n + '단계</div><h2>' + name + '<span class="dots">' + dots + '</span></h2></div>';
  };
  var pts = function (s, cls) { return '<ul class="pts' + (cls ? ' ' + cls : '') + '">' + s.split(' | ').map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };
  var tmr = function (segs, labels) { return '<div data-tmr="' + segs + '" data-labels="' + (labels || '') + '"></div>'; };
  var go = function (href, label, sub) { return '<a class="go' + (sub ? ' sub' : '') + '" href="' + href + '" target="_blank" rel="noopener">' + label + ' ↗</a>'; };
  var shot = function (f) { return '<img class="shot" alt="" src="' + C(f) + '">'; };

  // ── 어제 지도(2026-10-30 07:12 응답 8건 기준, map/board.html과 같은 Apps Script) ──
  var MAP = {
    vibe: [['자주 씁니다', 4], ['조금 써봤어요', 2], ['처음이에요', 2]],
    career: [['1~5년', 3], ['6~10년', 3], ['16~20년', 1], ['21~25년', 1]],
    subject: [['정보', 3], ['국어', 1], ['물리', 1], ['음악', 1], ['지구과학', 1], ['디자인', 1]],
    // 궁금한 것은 응답 원문 그대로(오타로 보이는 '평가사력'만 '평가'로), 학교 이름 대신 과목만
    qs: [
      ['국어', '다수의 사용자가 동시에 접속할 때, 깃허브 호스팅이 좋은 방안이 될 수 있을지, 또는 보다 효과적인 데이터베이스가 있을지', '토론 앱 피드백', ''],
      ['음악', '프로그램 설계의 디테일, 프로그램 활용 측면에서 고려할 사항', '발성 연습 피드백 · 워크숍', ''],
      ['정보', '평가', 'PISA 앱 피드백', ''],
      ['정보', '일회성으로 사용하고 마는 것이 아닌, 학생들과 산출물을 잘 끌고 갈 수 있는 바이브코딩 꿀팁', '파이썬 시각화 피드백 · 다음 걸음', ''],
      ['지구과학', '선도교사로서 교내 선생님들께 어떤 연수나 나눔을 하시는지', '지구과학 실험실 피드백 · 마무리', 'ws'],
      ['물리', '수업 관련 AI 활용 방법', '워크숍 전체', 'ws']
    ]
  };
  var bars = function (rows, max) { return rows.map(function (r) { return '<div class="hbar"><span>' + r[0] + '</span><span class="b"><i style="--w:' + (r[1] / max * 100) + '%"></i></span><span class="n">' + r[1] + '</span></div>'; }).join(''); };

  // ── 선생님과 앱(발표 순서). prob는 갤러리에 올린 글 원문. 발표자는 더 늘 수 있으므로 화면에 인원·개수를 적지 않는다 ──
  var PRES_MIN = 40;   // 선생님 발표 전체 시간. 한 분당 타이머는 이 시간을 발표자 수로 나눠 시연 6 : 피드백 4로 정한다
  var perSeg = function () {
    var per = PRES_MIN / T.length, demo = Math.round(per * 0.6 * 2) / 2;
    return demo + ',' + Math.max(0.5, Math.round((per - demo) * 2) / 2);
  };
  var T = [
    { name: '김연경', sub: '수도여자고등학교 · 지구과학', apps: [
      { k: 'earth', title: '지구과학 가상 실험실', url: 'https://earthssaem-lab.vercel.app/', prob: '입체적인 개념 설명, 데이터 분석, 흥미 유발' }],
      notes: '지구과학 실험실 허브입니다. 앱 12개가 한 화면에 모여 있습니다. 듣는 선생님들은 우리 과목에도 가져갈 점 하나를 메모하시면 됩니다.' },
    { name: '지윤호', sub: '경문고등학교 · 정보', apps: [
      { k: 'utov', title: 'UtoV', url: 'https://unono915.github.io/UtoV/', prob: '수업에 필요한 유튜브 영상을 다운로드 받아 사용하고자할때, 영상 전체를 다운로드 받아야하는 문제.' },
      { k: 'pyvis', title: '파이썬 코드 시각화 페이지', url: 'https://unono915.github.io/py_visualize/', prob: '학생들이 코드가 어떻게 동작하는지 이해하지 못하는 문제.' }],
      notes: '두 앱은 교사가 수업 자료를 준비하는 도구(UtoV)와 학생이 코드 실행을 눈으로 따라가는 도구(파이썬 시각화)입니다. 두 앱을 이어서 시연한 뒤 피드백 두 장을 진행합니다.' },
    { name: '이승준', sub: '', apps: [
      { k: 'toron', title: '토론 체험 대시보드', url: 'https://blink-24.github.io/toronbalpyo/', prob: '1. 시간적 어려움으로 실제 토론을 수행하지 못하는 학생들에게 체험을 제공하고 싶었습니다. 2. 학생 기록을 개별적으로 확인하고자 하였습니다. (스프레드시트와 연동하였습니다)' },
      { k: 'pisa', title: 'PISA 시험 도구', url: 'https://blink-24.github.io/pisa-validator/', prob: 'PISA 문항은 적응형 평가로 구성되어 있습니다. 그러한 소검사를 구성하여, 컴퓨터 기반 평가가 가능한 문항 세트를 구상해보는 것도 좋은 평가 고민이 아닐까 생각해 보았습니다. (데이터베이스 연동은 이루어지지 않은 상황입니다)' }],
      notes: '두 앱 모두 평가와 기록에 관한 도구입니다. 토론 앱은 스프레드시트로 학생 기록을 모으고, PISA 앱은 서버 없이 적응형 시험을 구현합니다. 피드백에서 어제 지도에 남은 동시 접속과 데이터베이스 질문에 답합니다.' },
    { name: '강봉정', sub: '', apps: [
      { k: 'voice', title: '발성연습', url: 'https://nimble-gumption-a586a9.netlify.app/', prob: '학생들이 자신이 내는 음을 정확하게 인식할 수 있도록 시각화해주는 프로그램' }],
      notes: '마이크로 받은 소리를 음높이로 바꿔 보여 주는 음악 수업 도구입니다. 피드백에서 어제 지도에 남은 설계의 디테일 질문에 답하고, 그 답이 바로 이어지는 워크숍의 출발점이 됩니다.' }
  ];

  // ── 피드백 장 자료. nums: [값, 단위, 설명], issue: 같은 내용을 I like·I wish로 남긴 깃허브 이슈(2026-10-30 등록) ──
  var FB = {
    earth: { issue: ['earthssaem/earthssaem-lab', '36'], title: '지구과학 가상 실험실',
      nums: [['13', '개', '허브·연결 앱·가이드 주소, 모두 정상 응답'], ['0.996~1.001', '', '케플러 앱 a³/P²(8개 행성, 진행자 계산)'], ['2.0', 'MB', '허브 글꼴 파일(HTML은 gzip 14.6KB)']],
      good: '케플러 법칙 앱의 자체 검증 함수로 면적 속도와 a³/P²를 확인하는 구조 | 학생이 기상자료개방포털 CSV와 바다누리 조위 파일을 직접 올려 API 키 없이 실제 공공 데이터를 사용하고 출처를 화면에 표시하는 설계',
      next: 'Pretendard 가변 글꼴 전체를 받는 허브 HTML을 dynamic-subset으로 바꾸어 필요한 글자만 받기 | 하위 앱 4곳의 user-scalable=no와 lang·viewport 누락을 허브 접근성 기준에 맞추기',
      mapq: ['지구과학 · 교내 연수와 나눔', '선생님의 바이브 코딩 제작 가이드 사이트와 AI가 작게 고치고 선생님이 병합한 PR 35개 기록이 그대로 교내 연수 자료가 됩니다.'],
      notes: '허브에 연결된 12개 앱과 제작 가이드까지 13개 주소가 모두 정상으로 열렸습니다. 3D는 조석 시뮬레이터와 방탈출 두 개였고, 실제 관측 데이터를 쓰는 앱은 기후·조석 데이터 도구 두 개였습니다. 저장소 커밋 71개 가운데 Claude가 38개, 선생님이 35개였고, 마음에 들지 않은 변경은 되돌린 기록도 있었습니다.' },
    utov: { issue: ['unono915/UtoV', '1'], title: 'UtoV',
      nums: [['9/9', '', '테스트 통과(진행자 실행)'], ['9', '번', '3주 동안 릴리스, 누적 다운로드 52회'], ['368', 'MB', '첫 설치 때 받는 양(프로그램과 도구)']],
      good: '유튜브 내려받기 오류 10가지를 한국어 안내로 바꾸고 원래 오류 문장과 복사 버튼을 함께 표시하는 구조 | 받은 뒤 ffprobe로 영상·소리·길이·코덱을 검사하고 나서야 성공으로 표시하는 설계',
      next: '1.3.3부터는 원본 전체를 받은 뒤 PC에서 자르므로 첫 화면 제목을 지금 동작에 맞게 고치기 | 받기 전에 원본 크기와 구간이 전체의 몇 %인지 보여 주기',
      notes: '3주 동안 릴리스 9번, 누적 다운로드 52회였습니다. 테스트 9개가 모두 통과했고, 진행자가 직접 실행해 확인했습니다. 1.3.1까지는 실제로 구간만 받았는데, 받기가 중간에 멈추는 문제 때문에 1.3.3에서 원본을 받아 자르는 방식으로 바꾼 판단과 이유가 README와 커밋에 남아 있습니다. 처음 설치하는 PC는 프로그램 약 100MB와 도구 약 268MB를 받습니다.' },
    pyvis: { issue: ['unono915/py_visualize', '1'], title: '파이썬 코드 시각화 페이지',
      nums: [['6/6', '', '내장 예제 정상 재생(입력 예제 제외)'], ['5.6', 'MB', '첫 로딩 압축 전송, 30명이면 약 167MB'], ['6,000', '회', '이상 반복하면 무한 반복으로 멈춤']],
      good: '실제 파이썬(Pyodide)의 sys.settrace로 줄마다 변수·호출 스택·출력을 기록하는 구조 | 단계마다 바뀐 변수를 계산해 학생 눈높이의 한국어 해설 문장을 만드는 설계',
      next: '기록 한도 400단계와 중단 한도 12,000회를 분리해 정상 반복문이 멈추지 않게 하기 | 오류 메시지에서 도구 내부 줄을 빼고 한국어 설명 붙이기',
      mapq: ['정보 · 산출물을 이어 가는 꿀팁', '예제 배열에 학생이 만든 예제를 쌓으면 해마다 자라는 교재가 되며, 문제 보고에서 원인 기록, 고침, 테스트로 고정하는 UtoV의 과정 자체가 학생 프로젝트를 이어 가는 방식의 본보기가 됩니다.'],
      notes: '내장 예제 7개 가운데 입력 예제를 뺀 6개를 진행자가 실제로 실행했고 모두 오류 없이 재생되었습니다. range(6000) 이상의 합계 같은 정상 반복문이 0.17초 만에 무한 반복으로 판단되어 멈췄고, 원인은 기록 한도와 중단 한도가 묶여 있기 때문이었습니다. 첫 로딩은 Pyodide 압축 전송 약 5.6MB였고, 30명이 동시에 처음 열면 학교망으로 약 167MB가 됩니다. 코딩 전에 AI에게 줄 기획 문서(VIBE_CODING_PLAN.md)를 먼저 쓰신 기록이 있었습니다.' },
    toron: { issue: ['blink-24/toronbalpyo', '21'], title: '토론 체험 대시보드',
      nums: [['159', '개', '테스트 모두 통과'], ['93', 'KB', '학생 1명 첫 화면(gzip), GitHub Pages'], ['95', '%', '30명·50분 요청 가운데 15초 설정 조회 몫(추정)']],
      good: '제출을 기기 대기열에 먼저 넣고 재시도하며 같은 제출을 해시로 한 번만 저장해 연결이 끊겨도 기록을 잃지 않는 구조 | 서버 로직을 저장소와 분리해 테스트 159개로 확인한 설계',
      next: '열린 화면마다 15초에 한 번 하는 설정 조회를 60초로 늘리고 제출 뒤에는 멈추기 | 한 요청 안에서 설정은 한 번만 읽고 세션은 탭 전체 대신 해당 세션만 찾기',
      mapq: ['국어 · 동시 접속과 데이터베이스', '화면 파일은 GitHub Pages로 충분하고 학생 1명 약 93KB입니다. 실제 한계는 동시 접속 수보다 시트에 쌓이는 행 수와 조회 빈도이며, 한 학급이면 지금 구조로 충분하고 데이터베이스 교체보다 조회 줄이기가 먼저입니다.'],
      notes: '진행자가 저장소의 서버 코드를 메모리 저장소로 돌려 학생 흐름을 재현했습니다. 질문 요청 1건이 읽는 행 수가 30명 누적 때 1,199행, 13개 반 390명 누적 때 15,599행으로 늘어납니다. 30명이 50분 동안 화면을 열어 두면 설정 조회가 약 6,000회로 전체 요청의 약 95%입니다. Apps Script 공식 할당량은 사용자당 동시 실행 30개, 개인 계정의 속성 읽기·쓰기는 하루 50,000회입니다.' },
    pisa: { issue: ['blink-24/pisa-validator', '10'], title: 'PISA 시험 도구',
      nums: [['96', '개', '테스트 모두 통과'], ['110', '가지', '정오 조합을 모두 돌려 확인한 분기 경로'], ['148', 'KB', '첫 화면(gzip), 서버 없이 기기 안에서 채점']],
      good: '핵심 → 1단계 → 2단계로 이어지는 다단계 적응형 분기를 실제로 구현하고 분기 사유를 기록하는 설계 | 그 문항을 본 학생만 집계하고 자기 점수를 뺀 교정 변별도를 사용하는 적응형용 통계',
      next: '정오 조합을 모두 돌려 도달 가능한 경로를 보여 주는 경로 시뮬레이터 만들기 | 익명 코드·경로·응답만 모으는 최소 데이터베이스로 결과 수합하기',
      notes: '진행자가 저장소의 분기 코드로 서술형을 뺀 정오 조합 110가지를 모두 돌려 보았습니다. 지금 컷 0.7, 0.4에서는 핵심 3문항을 모두 맞혀야 1단계 상 묶음으로 가고, 1단계 상 묶음 문항은 이후 분기에 영향을 주지 않습니다. 테스트 96개가 모두 통과했고 서버가 없어 동시 접속 병목이 없으며 첫 화면은 약 148KB입니다.' },
    voice: { title: '발성연습',
      nums: [['0', '건', '녹음한 소리의 외부 전송'], ['±103 / ±52', '센트', '판정 허용 폭(온음 / 반음 구간)'], ['2', '배', '120Hz 화면의 진행 속도(60Hz 대비)']],
      good: '교실 소음을 고려해 학생이 조절하는 소음 차단 슬라이더와 음량 표시 | 성별이 아니라 실제로 낸 목소리 높이(Hz)로 저음·고음 모드를 추천하는 설계',
      next: '판정 기준을 화면 픽셀이 아니라 음악 단위인 센트로 정하기 | 점수와 통계는 코드가 계산하고 AI는 문장만 쓰게 나누기',
      mapq: ['음악 · 설계의 디테일과 활용', '측정·다듬기·판정·피드백 네 단계로 나눠 보면 어디를 고치면 무엇이 바뀌는지 보이고, 판정 단위와 시간 단위를 교사가 정해 주는 일이 설계의 디테일입니다.'],
      notes: '녹음된 소리는 기기 밖으로 나가지 않습니다. 진행자가 코드로 확인했습니다. 음높이는 자기상관 방식으로 약 46ms 길이의 소리를 분석하고 최근 5프레임 중앙값으로 튀는 값을 줄입니다. 판정 허용 폭이 화면 픽셀 기준이라 온음 구간은 약 ±103센트, 반음 구간은 약 ±52센트로 음마다 다릅니다. 진행 속도와 통계가 프레임 단위라 120Hz 화면에서는 60Hz 화면보다 두 배 빨라집니다.' }
  };

  function presSlide(t, i) {
    var n = t.apps.length;
    var apps = t.apps.map(function (a) {
      var meta = '<h3>' + a.title + '</h3><div class="prob"><small>갤러리에 올린 글</small>' + a.prob + '</div>' + go(a.url, '앱 열기');
      return n === 1 ? '<div class="ap"><div class="pic">' + shot(a.k) + '</div><div class="meta">' + meta + '</div></div>'
        : '<div class="ap"><div class="pic">' + shot(a.k) + '</div>' + meta + '</div>';
    }).join('');
    return { sec: '선생님 발표', title: (i + 1) + ') ' + t.name + ' 선생님', html:
      ttl(t.name + ' 선생님') + (t.sub ? '<div class="whoami">' + t.sub + '</div>' : '') +
      tmr(perSeg(), '시연과 설명,피드백과 질문') +
      '<div class="pres n' + n + '">' + apps + '</div>', notes: t.notes };
  }
  function fbSlide(k) {
    var f = FB[k];
    var nums = f.nums.map(function (x) { return '<div class="num"><div class="v' + (x[0].length > 6 ? ' long' : '') + '">' + x[0] + (x[1] ? '<small>' + x[1] + '</small>' : '') + '</div><div class="k">' + x[2] + '</div></div>'; }).join('');
    var li = function (s) { return '<ul>' + s.split(' | ').map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };
    return { sec: '선생님 발표', title: '피드백) ' + f.title, fx: 'fade', html:
      ttl('피드백) ' + f.title) +
      '<div class="fb"><div class="l">' + shot(k) + '<div class="nums">' + nums + '</div><div class="src">2026-10-30 배포본과 공개 코드를 진행자가 측정·실행한 값</div></div>' +
      '<div class="r"><div class="blk"><h4><i></i>I like</h4>' + li(f.good) + '</div>' +
      '<div class="blk nx"><h4><i></i>I wish</h4>' + li(f.next) + '</div>' +
      (f.issue ? '<a class="iss" href="https://github.com/' + f.issue[0] + '/issues/' + f.issue[1] + '" target="_blank" rel="noopener"><b>GitHub 이슈 #' + f.issue[1] + ' ↗</b><span>github.com/' + f.issue[0] + '/issues/' + f.issue[1] + '</span></a>' : '') +
      (f.mapq ? '<div class="mapq"><small>어제 지도의 질문 · ' + f.mapq[0] + '</small>' + f.mapq[1] + '</div>' : '') +
      '</div></div>', notes: f.notes };
  }

  var S = [
  // ── 시작 ─────────────────────────────────────────────
  { sec: '시작', title: '표지', html:
    '<div class="cover">' +
      '<div class="eyebrow">동작관악 AI에듀테크 선도교사단 · 2일차</div>' +
      '<h1>바이브코딩 사례 나눔과<br><span class="a">아이데이션 해커톤</span></h1>' +
      '<div class="who"><b>당곡고등학교 송석리</b></div>' +
    '</div>', notes: '' },

  { sec: '시작', title: '어제 지도에 남긴 것', html:
    ttl('어제 지도에 남긴 것', '응답 8건') +
    '<div class="mapd"><div class="tiles">' +
      '<div class="tile"><div class="k">학교</div><div class="v">8<small>곳</small></div><div class="s">동작구 5 · 관악구 3</div></div>' +
      '<div class="tile"><div class="k">궁금한 것</div><div class="v">6<small>개</small></div><div class="s">오늘 안에서 답하기</div></div>' +
      '<div class="tile w"><div class="k">바이브코딩 경험</div>' + bars(MAP.vibe, 4) + '</div>' +
      '<div class="tile w"><div class="k">교육 경력</div>' + bars(MAP.career, 4) + '</div>' +
      '<div class="tile w"><div class="k">과목</div><div class="subj">' + MAP.subject.map(function (s) { return '<span>' + s[0] + '<b>' + s[1] + '</b></span>'; }).join('') + '</div></div>' +
    '</div><div class="qlist">' + MAP.qs.map(function (q) {
      return '<div class="qi"><div class="q"><small>' + q[0] + '</small>' + q[1] + '</div><div class="a' + (q[3] ? ' ' + q[3] : '') + '">→ ' + q[2] + '</div></div>';
    }).join('') + '</div></div>',
    notes: '어제 지도에 남긴 궁금한 것 여섯 개는 오늘 발표 피드백과 워크숍 안에서 답합니다. 동시 접속과 데이터베이스 질문은 토론 앱 피드백에서, 설계의 세부와 활용 질문은 발성 연습 앱 피드백과 워크숍에서, 평가 질문은 PISA 앱 피드백에서 다룹니다. 산출물을 일회성으로 끝내지 않는 방법과 교내 연수·나눔 질문은 마무리에서 답합니다.' },

  { sec: '시작', title: '오늘의 흐름', html:
    ttl('오늘의 흐름') +
    '<p class="kick">먼저 선생님들이 만든 앱을 발표로 보고, 이어서 워크숍에서 두 사람이 한 팀으로 다음 프로젝트를 종이로 먼저 만들어 봅니다.</p>' +
    '<div class="flow"><div class="f" style="--m:5"><b>시작</b><span>5분</span></div><div class="f p" style="--m:40"><b>선생님 발표</b><span>40분</span></div>' +
    '<div class="f w" style="--m:40"><b>아이데이션 워크숍</b><span>40분 · 두 사람이 한 팀</span></div><div class="f" style="--m:5"><b>마무리</b><span>5분</span></div></div>' +
    '<div class="outs"><div class="o"><div class="n">하나</div><h3>가설 문장과 HMW 질문</h3></div><div class="o"><div class="n">둘</div><h3>종이 화면 3장</h3></div><div class="o"><div class="n">셋</div><h3>바이브코딩 시작 프롬프트</h3></div></div>',
    notes: '발표는 선생님마다 시연 뒤 진행자가 측정한 수치와 코드로 확인한 피드백을 짧게 덧붙입니다. 워크숍 결과물은 가설 문장, 종이 화면 세 장, 바이브코딩 시작 프롬프트 한 장입니다. 발표는 시연과 피드백 순서로 진행합니다.' },

  // ── 선생님 발표 ─────────────────────────────────────────
  { sec: '선생님 발표', title: '선생님 발표', fx: 'fade', html: '<div class="sep"><h2>선생님 발표</h2></div>', notes: '' },
  { sec: '선생님 발표', title: '발표 순서', html:
    ttl('발표 순서') + tmr(String(PRES_MIN), '선생님 발표 전체') +
    '<div class="order' + (T.length > 4 ? ' many' : '') + '" style="--cols:' + (T.length > 4 ? Math.ceil(T.length / 2) : T.length) + '">' + T.map(function (t, i) {
      return '<div class="p"><div class="no">' + (i + 1) + '번째</div><h3>' + t.name + '</h3>' + (t.sub ? '<div class="sub">' + t.sub + '</div>' : '') +
        '<img alt="" src="' + C(t.apps[0].k) + '"><div class="apps">' + t.apps.map(function (a) { return '<span>' + a.title + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div>',
    notes: '선생님마다 시연과 설명 뒤 진행자 피드백과 질문을 진행합니다. 피드백은 배포된 앱을 직접 열어 측정한 값과 공개된 코드를 읽고 확인한 사실만 담습니다. 듣는 선생님들은 우리 교실에 가져갈 점 하나를 메모합니다.' }
  ];
  T.forEach(function (t, i) {
    S.push(presSlide(t, i));
    t.apps.forEach(function (a) { S.push(fbSlide(a.k)); });
  });

  var ex = '중학생 / 음악 시간 발성 연습 / 자기가 낸 음이 맞는지 들을 방법이 없기 / 음정을 스스로 고치는 데 어려움 | ' +
    '고등학생 / 지구과학 수업 / 교과서 그림이 평면 그림뿐이기 / 지구 내부와 천체 운동의 입체 구조를 떠올리는 데 어려움 | ' +
    '학생 / 수업 마무리 활동 / 헷갈린 개념을 말할 기회가 없기 / 모르는 채로 다음 차시로 넘어가는 어려움';
  var HYP = ['가설 문장 예시 1 · 음악 발성 연습', '가설 문장 예시 2 · 지구과학 수업', '가설 문장 예시 3 · 수업 마무리 활동'];
  var HMW = ["어떻게 하면 중학생이 자기 음정을 스스로 듣고 고칠 수 있을까?", "어떻게 하면 고등학생이 지구 내부를 입체로 떠올릴 수 있을까?", "어떻게 하면 학생이 헷갈린 개념을 수업 중에 말할 수 있을까?"];
  var prompt = [
    '나는 <span class="bl">[과목]</span> 교사야.',
    '<span class="bl">[가설 문장]</span>',
    '<span class="bl">[HMW 질문]</span>에 대한 답이 될 앱을 만들고 싶어.',
    '첨부한 종이 화면 세 장을 보고 HTML 파일 하나로 만들어 줘.',
    '첫 화면에서는 <span class="bl">[첫 화면에서 할 일]</span>, 핵심 행동 화면에서는 <span class="bl">[핵심 행동]</span>, 결과 화면에서는 <span class="bl">[결과 화면에서 보여 줄 것]</span>을 보여 줘.',
    '버튼 문구는 종이에 적힌 그대로 쓰고, 데이터는 예시 값으로 채워 줘.',
    '서버나 로그인 없이 브라우저에서만 동작하게 하고, 학생 이름 같은 개인정보는 받지 않아야 해.',
    '만든 뒤 종이와 달라진 곳을 알려 줘.'
  ];

  S = S.concat([
  // ── 아이데이션 워크숍 ─────────────────────────────────────
  { sec: '워크숍', title: '아이데이션 워크숍', fx: 'fade', html: '<div class="sep" style="background:#e08a00"><h2>아이데이션 워크숍</h2></div>', notes: '' },

  { sec: '워크숍', title: '종이 프로토타이핑', html:
    ttl('종이 프로토타이핑') +
    '<p class="kick" style="margin-bottom:14px">코드를 쓰기 전에 종이에 화면을 그리고, 사람이 컴퓨터 역할을 하며 시험해 보는 방법입니다.</p>' +
    PAPER.introHTML('종이에 화면 세 장 손으로 그리기 | 누른 순서대로 화살표로 잇기 | 한 사람이 컴퓨터 역할 맡아 종이 바꾸기 | 지켜보는 사람이 멈칫한 곳 포스트잇에 적기 | 종이 위에서 바로 고치기 | 종이 사진과 프롬프트를 AI에게 주기'.split(' | ')),
    notes: '바이브코딩은 만드는 속도가 빨라서 무엇을 만들지 정하는 단계가 더 중요해집니다. 종이에서 고치는 데는 몇 초가 걸리고, 코드에서 고치는 데는 다시 대화와 확인이 필요합니다. 오늘 40분 동안 앱을 완성하지 않고, 다른 팀 선생님이 실제로 써 보며 막힌 곳을 찾는 데까지 진행합니다.' },

  { sec: '워크숍', title: '팀과 준비물', html:
    ttl('팀과 준비물') +
    pts('두 사람이 한 팀, 세 팀 구성(여덟 명이면 네 팀) | A4 다섯 장, 포스트잇, 굵은 펜, 휴대폰 카메라 준비 | 과목이 다른 두 사람이 한 팀', 's') +
    '<div class="teams" style="margin-top:30px">' + [0, 1, 2, 3].map(function (t) {
      return '<div class="tm' + (t === 3 ? ' spare' : '') + '" style="border-color:var(--t' + (t + 1) + ')"><h3><i style="background:var(--t' + (t + 1) + ')"></i>' + (t + 1) + '팀' + (t === 3 ? '<small>필요할 때만</small>' : '') + '</h3>' +
        '<input type="text" data-team="t' + t + 'a" placeholder="가 · 이름" maxlength="8"><input type="text" data-team="t' + t + 'b" placeholder="나 · 이름" maxlength="8"></div>';
    }).join('') + '</div>',
    notes: '' },

  { sec: '워크숍', title: '1단계) 가설 문장', html:
    wst(1, '가설 문장') + tmr('3', '가설 문장 쓰기') +
    '<div class="hyp" data-scene="hyp" data-ex="' + ex + '"><span class="ex">예시</span>' +
      '<span class="slot" data-ph="[누가]">[누가]</span><span class="js" data-j="은는" data-d="는">는</span> ' +
      '<span class="slot" data-ph="[상황]">[상황]</span>에서 ' +
      '<span class="slot" data-ph="[원인]">[원인]</span> 때문에 ' +
      '<span class="slot" data-ph="[어려움]">[어려움]</span><span class="js" data-j="을를" data-d="을">을</span> 겪고 있을 것이다.</div>' +
    '<div class="srcs"><div class="c"><b>문제를 찾는 곳 1</b>오늘 발표한 앱의 다음 버전</div><div class="c"><b>문제를 찾는 곳 2</b>어제 지도에 적은 궁금한 것</div><div class="c"><b>문제를 찾는 곳 3</b>우리 교실에서 매주 되풀이되는 불편</div></div>' +
    pts('실제 본 장면 하나를 떠올리며 쓰기 | 확인한 경험과 짐작한 부분을 나누어 표시하기 | 문장에 해결 방법(앱 이름, 기능)을 넣지 않기', 's').replace('<ul class="pts s">', '<ul class="pts s" style="margin-top:22px;grid-template-columns:1fr 1fr 1fr;gap:18px">'),
    notes: '두 사람이 각자 하나씩 떠올린 뒤 둘 중 하나를 고르거나 합칩니다. 해결 방법이 문장에 들어가면 다음 단계에서 다른 방법을 떠올리기 어렵습니다. 가설 문장은 사용자가 겪는 어려움만 남깁니다.' },

  // 1단계 이어서: 가설 문장을 HMW 질문으로 바꾸고 갤러리에 올린다(문구 _src/solar_day2_hmw.md, 예시 질문은 갤러리 제목 칸 40자에 맞춰 진행자가 줄임)
  { sec: '워크숍', title: '1단계) HMW 질문', html:
    wst(1, 'HMW 질문') + tmr('1,2', 'HMW 질문으로 바꾸기,갤러리에 올리기') +
    '<p class="kick" style="margin-bottom:18px">HMW는 가설 문장의 어려움을 “어떻게 하면 ~할 수 있을까?” 질문으로 바꾼 것으로, 해결 방법을 여러 개 떠올리게 하는 출발점입니다.</p>' +
    '<div class="hmw"><div class="pairs">' + HMW.map(function (h, i) {
      return '<div class="pr2" style="--i:' + i + '"><div class="hy">' + HYP[i] + '</div><div class="q"><b>HMW</b>' + h + '</div></div>';
    }).join('') + '</div>' +
    '<div class="side">' + pts("가설 문장의 [누가]와 [어려움]에서 시작하기 | 수업 전체를 바꾸려는 질문은 피하기 | 해결 방법(앱, 기능)을 질문에 넣지 않기 | 갤러리 '문제 제목' 칸에 들어가도록 40자 이내", 's') +
      '<div class="bad"><div><i>너무 넓은 질문</i>어떻게 하면 음악 수업 전체를 더 좋게 만들 수 있을까?</div><div><i>너무 좁은 질문</i>어떻게 하면 음정 측정 앱으로 음정을 고칠 수 있을까?</div></div>' +
      // 갤러리 '풀고 싶은 문제' 칸 이름은 gallery/app.js FORM_TEXT와 같게
      '<div class="gbox"><img alt="" src="../assets/qr/gallery.svg"><div><div class="gh">갤러리에 올리기</div>' +
      '<dl><dt>올릴 종류</dt><dd>풀고 싶은 문제</dd><dt>표시 이름</dt><dd>팀 이름과 두 사람</dd><dt>문제 제목</dt><dd>HMW 질문</dd><dt>풀고 싶은 문제</dt><dd>가설 문장</dd></dl>' +
      '<small>팀 휴대폰 한 대로 올립니다. 같은 휴대폰이어야 나중에 고치기로 영상 링크를 더할 수 있습니다.</small></div></div>' +
    '</div></div>',
    notes: 'HMW는 디자인 씽킹에서 문제를 기회로 바꿀 때 쓰는 질문 형식입니다. 영어의 might에는 정답이 하나가 아니라 여러 개일 수 있다는 뜻이 담겨 있습니다. 갤러리에 올릴 때 문제 제목 칸에는 HMW 질문, 풀고 싶은 문제 칸에는 가설 문장을 넣습니다. 다음 단계의 4칸 스케치는 이 질문에 대한 서로 다른 답 네 가지를 그리는 활동입니다.' },

  { sec: '워크숍', title: '2단계) 4칸 스케치', html:
    wst(2, '4칸 스케치') + tmr('4,2', '말없이 그리기,둘이 고르기') +
    '<div class="sk"><div class="col">' + pts('A4 한 장을 네 칸으로 접기 | 각자 말없이 4분 동안 해결 방법 네 가지 그리기 | 한 칸은 코드 없이 푸는 방법(종이·규칙·수업 운영) | 2분 동안 둘이 하나 고르기 | HMW 질문에 들어맞는지와 종이 세 장으로 시연할 수 있는지로 고르기', 's') + '</div>' +
    PAPER.sketchHTML() + '</div>',
    notes: '말없이 그리는 이유는 먼저 말한 사람의 아이디어로 쏠리지 않게 하려는 것입니다. 코드 없는 방법이 더 나으면 그 방법을 골라도 됩니다. 그때는 그 방법을 돕는 작은 도구를 종이로 그립니다.' },

  { sec: '워크숍', title: '3단계) 종이 화면 3장', html:
    wst(3, '종이 화면 3장') + tmr('8', '종이 화면 그리기') +
    '<div class="three"><div class="col">' + pts('첫 화면은 무엇을 하는 앱인지 3초 안에 알 수 있게 | 핵심 행동 화면은 사용자가 누르거나 입력하는 화면 | 결과 화면은 사용자가 얻는 것(교사 화면·그래프·피드백) | 버튼에는 실제 문구, 데이터 자리에는 예시 값, 바뀌는 부분은 포스트잇', 's') + '</div>' +
    PAPER.threeHTML() + '</div>',
    notes: '예쁘게 그리지 않아도 됩니다. 네모와 글자면 충분합니다. 학생 실명 대신 예시 값을 사용하십시오. 나중에 AI에게 줄 때도 개인정보가 들어가지 않습니다. 두 사람이 한 장씩 나눠 그리고 마지막 한 장은 같이 그립니다.' },

  { sec: '워크숍', title: '4단계) 종이 시연 교대', html:
    wst(4, '종이 시연 교대') + tmr('3,1,3,1', '1라운드 시연,1라운드 메모,2라운드 시연,2라운드 메모') +
    '<div class="rot"><div class="col">' + pts('한 사람은 남아서 컴퓨터, 한 사람은 다음 팀으로 가서 사용자 | 라운드마다 3분 시연과 1분 메모, 2라운드에서 역할 바꾸기 | 컴퓨터는 설명 없이 누른 곳에 맞춰 종이와 포스트잇만 바꾸기 | 사용자는 생각을 소리 내어 말하기', 's') + '</div>' +
    PAPER.rotHTML() + '</div>',
    notes: '메모할 것은 사용자가 멈칫한 곳, 사용자가 기대했는데 없던 것입니다. 컴퓨터 역할이 설명하기 시작하면 실제 앱에서는 학생 옆에 아무도 없다는 사실을 떠올립니다. 사용자는 친절하게 넘어가지 말고 막히면 막혔다고 말합니다.' },

  { sec: '워크숍', title: '5단계) 고치고 프롬프트로', html:
    wst(5, '고치고 프롬프트로') + tmr('5', '고치기·사진·프롬프트') +
    '<div class="ws5"><div class="col">' + pts('막힌 곳 하나를 종이 위에서 바로 고치기 | 종이 세 장을 순서대로 사진 찍기 | 시작 프롬프트 카드의 빈칸 채우기', 's') + '</div>' +
    '<div class="pc2 nonext"><div class="hd">바이브코딩 시작 프롬프트 · 종이 사진 세 장과 함께</div><button class="copy" type="button" data-copy>복사</button><div class="body2">' + prompt.map(function (l) { return '<p>' + l + '</p>'; }).join('') + '</div></div></div>',
    notes: '오늘은 프롬프트까지 준비하고, 실제로 AI에게 넣는 것은 학교에 돌아가서 해도 됩니다. 시간이 남는 팀은 바로 넣어 보고 첫 화면이 종이와 얼마나 비슷한지 확인합니다. 사진은 한 장에 한 화면, 위에서 똑바로 찍습니다.' },

  { sec: '워크숍', title: '6단계) 팀별 공유', html:
    wst(6, '팀별 공유') + '<div data-tmr="1.5,1.5,1.5,0.5" data-labels="1팀,2팀,3팀,정리" data-share></div>' +
    '<div class="row6">' + pts('HMW 질문과 가설 문장 읽기 | 종이 세 장을 넘기며 시연하기 | 교대 시연에서 찾은 막힌 곳 하나와 고친 점 | 발표하는 동안 옆 팀이 휴대폰으로 시연 영상 찍어 주기 | 같은 상황을 겪어 본 선생님은 그 팀 갤러리 글에 좋아요', 's') +
    '<div class="gos">' + go('https://' + HUB + '/gallery/', '웹앱 갤러리 열기') + '</div></div>' +
    '<div class="share" style="margin-top:30px">' + [0, 1, 2, 3].map(function (t) { return '<div class="s" data-shareteam="' + t + '" style="background:var(--t' + (t + 1) + ')"><b>' + (t + 1) + '팀</b><span data-teamline="' + t + '"></span><span class="mins">1분 30초</span></div>'; }).join('') + '</div>',
    notes: '듣는 선생님들은 같은 상황을 겪어 본 적이 있으면 그 팀 갤러리 글에 좋아요를 눌러 주십시오. 좋아요 수가 그 문제가 우리 학교에도 있다는 첫 증거입니다. 시간이 남으면 진행자가 한 팀의 종이 사진을 AI 채팅에 바로 넣어 첫 화면을 만들어 봅니다.' },

  // ── 마무리 ─────────────────────────────────────────────
  { sec: '마무리', title: '다음 걸음', html:
    ttl('다음 걸음') +
    // 갤러리는 사진을 받지 않으므로 종이 시연 영상(유튜브 일부 공개·구글 드라이브) 링크를 설명 칸에 적는다(사용자 결정, 2026-10-30)
    '<div class="next3">' + "종이 시연 영상을 유튜브(일부 공개)나 구글 드라이브에 올리고, 오늘 올린 갤러리 글을 같은 휴대폰에서 '고치기'로 열어 영상 링크 더하기 | 일주일 안에 시작 프롬프트로 첫 화면 만들기 | 앱을 만들면 같은 글을 '만든 앱'으로 바꾸기, 받은 좋아요와 댓글은 그대로 남음".split(' | ').map(function (x, i) {
      return '<div class="n"><div class="i">' + ['오늘', '일주일 안에', '만든 뒤'][i] + '</div><p>' + x + '</p></div>';
    }).join('') + '</div>' +
    '<div class="next-qr"><img alt="" src="../assets/qr/gallery.svg"><div class="url top"><div class="lab">웹앱 갤러리</div><div class="u sm">' + HUB + '/gallery</div></div></div>',
    notes: '어제 지도의 질문 가운데 산출물을 일회성으로 끝내지 않는 방법에 대한 답은 다음과 같습니다. 문제 글에서 시작해 만든 앱으로 바뀌는 기록이 갤러리에 남고, 댓글이 다음 버전의 요구 사항이 됩니다. 교내 연수·나눔 질문에 대한 답은 다음과 같습니다. 오늘 진행 방식(갤러리에 올리기, 종이 시연 교대)은 장비 없이 교내 연수에서 그대로 사용할 수 있습니다. 진행 화면도 공유합니다.' },

  { sec: '마무리', title: '마무리', html:
    '<div class="cover"><div class="eyebrow">동작관악 AI에듀테크 선도교사단</div><h1>고맙습니다</h1>' +
    '<div class="url top" style="align-self:flex-start"><div class="lab">연수 메인</div><div class="u sm">' + HUB + '</div></div></div>', notes: '' }
  ]);

  // 모든 장: 장에 들어올 때 그 장의 장면·타이머를 켜고 다른 장의 장면은 멈춘다
  S.forEach(function (s) {
    var o = s.onStep;
    s.onStep = function (el, st, ST) { if (window.PAPER) PAPER.activate(el); if (o) o(el, st, ST); };
  });
  window.SLIDES = S;

  // 팀 이름 저장(이 브라우저에만). 교대 시연 그림과 공유 순서에 쓴다
  var KEY = 'aileader_day2_teams';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function paintTeams() {
    var d = load();
    document.querySelectorAll('[data-team]').forEach(function (inp) { if (document.activeElement !== inp) inp.value = d[inp.dataset.team] || ''; });
    document.querySelectorAll('[data-teamline]').forEach(function (el) {
      var t = el.dataset.teamline, a = (d['t' + t + 'a'] || '').trim(), b = (d['t' + t + 'b'] || '').trim();
      el.textContent = a || b ? [a, b].filter(Boolean).join(' · ') : '';
    });
    if (window.PAPER) {
      PAPER.repaintTeams();
      var n = PAPER.teamCount();
      document.querySelectorAll('[data-shareteam]').forEach(function (el) { el.hidden = +el.dataset.shareteam >= n; el.querySelector('.mins').textContent = n === 4 ? '1분 15초' : '1분 30초'; });
      document.querySelectorAll('.share').forEach(function (el) { el.style.setProperty('--n', n); });
      document.querySelectorAll('[data-share]').forEach(function (el) {
        var want = n === 4 ? '1.25,1.25,1.25,1.25' : '1.5,1.5,1.5,0.5', labels = n === 4 ? '1팀,2팀,3팀,4팀' : '1팀,2팀,3팀,정리';
        if (el.dataset.tmr !== want && el._t) PAPER.setTimer(el, want, labels); else if (!el._t) { el.dataset.tmr = want; el.dataset.labels = labels; }
      });
    }
  }
  document.addEventListener('input', function (e) {
    var inp = e.target.closest('[data-team]'); if (!inp) return;
    var d = load(); d[inp.dataset.team] = inp.value;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (er) {}
    paintTeams();
  });
  document.addEventListener('DOMContentLoaded', paintTeams);
  window.addEventListener('load', paintTeams);
})();
