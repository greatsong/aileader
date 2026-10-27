/* 1일차 슬라이드 내용. 장 제목은 고정, 핵심 줄·항목·노트는 솔라 프로4 집필(_src/solar_day1_v1.md, solar_day1_fix1.md).
   [data-s="k"]는 k번째 클릭부터 보인다. notes는 N키 발표자 노트(줄마다 한 문단). 2일차 내용은 넣지 않는다(연수생 비공개). */
(function () {
  var HUB = 'greatsong.github.io/2026-ai-leader-training';
  var C = function (f) { return 'captures/' + encodeURI(f); };
  var ttl = function (t, tag) { return '<div class="ttl"><h2>' + t + '</h2>' + (tag ? '<span class="tag">' + tag + '</span>' : '') + '</div>'; };
  var kick = function (t) { return '<p class="kick">' + t + '</p>'; };
  var pts = function (s, attr) { return '<ul class="pts"' + (attr || '') + '>' + s.split(' | ').map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };
  var shot = function (f) { return '<img class="shot" alt="" src="' + C(f) + '">'; };
  var go = function (href, label, sub) { return '<a class="go' + (sub ? ' sub' : '') + '" href="' + href + '" target="_blank" rel="noopener">' + label + ' ↗</a>'; };
  var demo = function (side, pic) { return '<div class="demo"><div class="side">' + side + '</div><div class="pic">' + pic + '</div></div>'; };

  window.SLIDES = [
  // ── 시작 ─────────────────────────────────────────────
  { sec: '시작', title: '표지', html:
    '<div class="cover">' +
      '<div class="eyebrow">2026 고등학교 AI 디지털 선도교사 연수 · 1일차</div>' +
      '<h1>바이브코딩 사례 나눔과<br><span class="a">아이데이션 해커톤</span></h1>' +
      '<div class="who"><b>당곡고등학교 송석리</b></div>' +
    '</div>',
    notes: '자, 오늘은 제가 직접 만든 수업용 도구를 보여 드리고 두 앱을 함께 체험하는 시간입니다.\n저는 당곡고등학교 정보 교사로, 올해 2월부터 수업용 도구를 직접 만들어 수업에 사용하고 있습니다.\n먼저 제가 만든 도구 사례를 간단히 살펴보겠습니다.' },

  { sec: '시작', title: '연수 메인 접속', html:
    ttl('연수 메인 접속') + kick('오늘 접속 주소 하나로 네 가지 활동을 모두 이동하는 경로') +
    '<div class="url"><div class="lab">노트북 주소창에 입력</div><div class="u">' + HUB + '</div></div>' +
    '<div class="dests">' +
      '<div class="d">🗺️ 우리 학교를 지도에</div><div class="d">🤖 튜링 테스트</div>' +
      '<div class="d">🧊 프롬프트 코딩</div><div class="d">🖼️ 웹앱 갤러리</div>' +
    '</div>',
    notes: '지금 노트북에서 이 주소를 입력해 주십시오.\n오늘 들어가는 곳은 모두 이 페이지의 링크로 연결됩니다. 열어 둔 채로 진행하겠습니다.' },

  // ── 학교 ─────────────────────────────────────────────
  { sec: '학교', title: '우리 학교를 지도에', html:
    ttl('우리 학교를 지도에') +
    demo(pts("연수 메인에서 '우리 학교를 지도에' 누르기 | 학교 이름 검색하기 | 담당 과목·교육경력·궁금한 것 적고 올리기") +
         '<div class="gos">' + go('../map/board.html', '앞 화면 지도 열기') + '</div>',
         shot('01-학교지도-전국판.png')),
    notes: '학교를 올리면 앞 화면 지도에 바로 표시됩니다. 궁금한 것을 적어 주시면 오늘 이야기에 반영하겠습니다.\n올라오는 동안 지도를 함께 보며 어느 지역에서 오셨는지 짚어 보겠습니다. 활동 시간은 5분입니다.' },

  // ── 인트로 ───────────────────────────────────────────
  { sec: '인트로', title: '10년 후의 세상', html:
    '<div class="full"><img alt="10년 후의 세상을 예측할 수 있을까?" src="img/source-05.png"></div>',
    notes: '10년 후의 세상을 예측할 수 있을지 함께 생각해 보겠습니다.\n답을 기다리지 않고 다음 화면으로 넘어가겠습니다.' },

  { sec: '인트로', title: '아톰의 세상과 비트의 세상', steps: 2, html:
    '<div class="full">' +
      '<div class="layer" data-u="1"><img alt="" src="img/source-06.png"></div>' +
      '<div class="layer off" data-s="1" data-u="2"><img alt="" src="img/source-07.png"></div>' +
      '<div class="layer off" data-s="2"><img alt="" src="img/source-09.png"></div>' +
      '<div class="over" data-s="2">교실과 사람이 있는 아톰의 세상, 정보와 디지털 도구의 비트의 세상, 오늘은 둘을 잇는 사례</div>' +
      '<span class="src">출처: JTBC 차이나는 클라스(사진, 닐 거센필드)</span>' +
      go('https://greatsong.github.io/vibe1-gg/intro-keynote.html', '인트로 키노트', true) +
    '</div>',
    notes: '닐 거센필드는 세상을 아톰의 세상과 비트의 세상으로 구분했습니다. 아톰은 물질이고 비트는 정보입니다.\n교사가 만드는 도구는 비트의 세상에 있습니다. 풀려는 문제는 교실이라는 아톰의 세상에 있습니다.' },

  // ── 네 질문 ──────────────────────────────────────────
  { sec: '네 질문', title: '제가 해 온 네 가지 질문', steps: 4, html:
    ttl('제가 해 온 네 가지 질문') +
    '<ol class="qs">' +
      '<li data-s="1"><span class="qno">1</span>10년 전, 팅커벨에 대한 저의 생각</li>' +
      '<li data-s="2"><span class="qno">2</span>AI가 날 도와준다면 어떤 수업을 해볼 수 있을까?</li>' +
      '<li data-s="3"><span class="qno">3</span>그동안 수집되지 못한 데이터를 AI가 도와준다면 어떻게 더 좋은 교육활동을 해볼 수 있을까?</li>' +
      '<li data-s="4"><span class="qno">4</span>AI시대, 아이들에게 더 필요해진 능력들, 더 중요해진 능력들을 어떻게 기르도록 도와줄 수 있을까?</li>' +
    '</ol>',
    notes: '올해 도구를 만들면서 이 네 질문을 붙들어 왔습니다. 오늘은 그 질문에 대한 답 몇 가지를 보여 드리겠습니다.\n10년 전 팅커벨에 대한 생각, AI가 날 도와준다면 어떤 수업을 해볼 수 있을까, 그동안 수집되지 못한 데이터를 AI가 도와준다면 어떻게 더 좋은 교육활동을 해볼 수 있을까, AI시대 아이들에게 더 필요해진 능력들을 어떻게 기르도록 도와줄 수 있을까입니다.' },

  { sec: '네 질문', title: '질문 1) 10년 전, 팅커벨에 대한 생각', html:
    ttl('<span class="qno">1</span>10년 전, 팅커벨에 대한 저의 생각') +
    '<div class="wait"></div>',
    notes: '' },

  { sec: '네 질문', title: '질문 2) 답 하나, 커리큘럼 위버', html:
    ttl('<span class="qno">2</span>AI가 날 도와준다면 1) 커리큘럼 위버') +
    demo(pts('교사 팀이 AI 공동설계자와 함께 협력 원리에 따라 융합 수업을 설계하는 플랫폼 | 성취기준을 검색하고 다른 교과의 연결된 성취기준 찾기 | 국어·영어·음악 교사 세 명이 절차를 끝까지 밟아 수업까지 실행한 사례') +
         '<div class="gos">' + go('https://curriculum-weaver.vercel.app/graph', '커리큘럼 위버 열기') + '</div>',
         shot('기존-커리큘럼위버-성운3D-0905.png')),
    notes: '로그인 없이 열리는 교육과정 지도로 짧게 시연하겠습니다. 성취기준 하나를 검색해 연결된 다른 교과를 보여 드립니다.\n10월 교사 연수 뒤 사용이 멈춘 기록도 숨기지 않고 언급하겠습니다.\n10월 연수 첫날 교사 메시지 924건, 둘째 날 289건, 그 뒤 8일 동안 0건이었으나 원인은 분석하지 않았습니다.' },

  { sec: '네 질문', title: '질문 2) 답 둘, AI 채팅 앱', html:
    ttl('<span class="qno">2</span>AI가 날 도와준다면 2) AI 채팅 앱') +
    demo(pts('학생이 학교 계정으로 Claude·Gemini·ChatGPT·Solar를 한 화면에서 사용 | 교사는 대화 기록과 사용량 확인 | 학습 모드와 프로젝트 모드') +
         '<div class="gos">' + go('https://danggok-ai.vercel.app', 'AI 채팅 앱 열기') + '</div>',
         shot('04-AI채팅-로그인.png')),
    notes: '모든 학생이 유료 AI를 사용할 수 있게 하려고 만든 도구입니다. 진행자 계정으로 직접 시연하겠습니다.\n학교망에서 여러 학생이 같은 주소로 접속해 요청 한도를 올린 일이 있었습니다. 5월에 학교 NAT 때문에 요청 한도를 분당 500회에서 3,000회로 올렸습니다.' },

  { sec: '네 질문', title: '질문 3) 답 하나, 구술 평가', html:
    ttl('<span class="qno">3</span>수집되지 못한 데이터 1) 구술 평가') +
    demo(pts('팀 구술을 녹음하면 AI가 받아 적고 피드백 초안 작성 | 교사가 검토한 피드백만 학생에게 전달') +
         '<div class="gos">' + go('https://greatsong.github.io/ai-ta-project-assessment/#/3/4', '발표 자료 열기') + '</div>',
         shot('06-구술평가-해결의흐름.png')),
    notes: '그동안 말로 사라지던 설명이 기록과 피드백이 됩니다. AI는 정리하고 초안을 쓰고 판단은 교사가 합니다.\n데이터 과학 팀 프로젝트에서 팀마다 3~5분 구술을 진행했습니다. 학습 효과는 아직 측정하지 않았습니다.' },

  { sec: '네 질문', title: '질문 3) 답 둘, AI 면접 앱', html:
    ttl('<span class="qno">3</span>수집되지 못한 데이터 2) AI 면접 앱') +
    demo(pts('생기부와 대학 자료로 기본 질문을 만들고 답마다 꼬리질문 | 끝나면 연습 메모와 다음 연습 목표 | 생기부 원문이 교사 노트북 밖으로 나가지 않는 구조') +
         '<div class="gos">' + go('demo/interview/manual-demo.html', '시연 화면 열기') + '</div>' +
         '<div class="src">시연 화면은 가짜 학생 자료로 그리며 서버와 AI를 부르지 않습니다</div>',
         shot('07-AI면접-시연.png')),
    notes: '구술 평가 시스템을 대입 면접 연습으로 옮긴 사례입니다. 가짜 학생 자료로 시연하겠습니다.\n가장 중요하게 본 것은 안정성과 개인정보입니다.' },

  { sec: '네 질문', title: '질문 4) 직접 해 보는 두 가지', html:
    ttl('<span class="qno">4</span>AI시대에 더 필요해진 능력') +
    '<div class="twin">' +
      '<div class="card"><div class="n">체험 1</div><h3>🤖 튜링 테스트</h3><p>튜링 테스트는 AI의 답을 사람의 답과 가려내 보는 체험</p><img alt="" src="' + C('기존-튜링-교사-진행화면.png') + '"></div>' +
      '<div class="card"><div class="n">체험 2</div><h3>🧊 프롬프트 코딩</h3><p>프롬프트 코딩은 결과물을 보고 말로 정확히 설명하는 체험</p><img alt="" src="' + C('10-프롬프트코딩-첫화면.png') + '"></div>' +
    '</div>',
    notes: '네 번째 질문에 대한 답은 말보다 직접 해 보시는 편이 낫습니다.\n두 앱 모두 연수 메인에서 바로 들어갑니다.' },

  // ── 체험 ─────────────────────────────────────────────
  { sec: '체험', title: '체험 1) 튜링 테스트', html:
    ttl('체험 1) 튜링 테스트') +
    '<div class="url exp top"><div class="lab">연수 메인 → 튜링 테스트</div><div class="u sm">ai-turing-production.up.railway.app/turing-test</div></div>' +
    demo(pts("연수 메인에서 '튜링 테스트' 누르기 | 수업 코드와 팀 이름 넣기 | 질문하고 사람인지 AI인지 투표하기") +
         '<div class="gos">' + go('https://ai-turing-production.up.railway.app/turing-test/teacher', '진행자 화면', true) + '</div>',
         shot('기존-튜링-참가자-대화.png')),
    notes: '두세 명이 노트북 한 대로 한 팀입니다. 답변을 맡은 팀은 학생인 척 답합니다.\n사람의 답과 AI의 답이 같은 말투로 바뀌고 같은 시간 뒤에 도착하므로 내용으로만 가려내야 합니다. 라운드 1회는 20분입니다.' },

  { sec: '체험', title: '튜링 테스트 돌아보기', html:
    ttl('튜링 테스트 돌아보기') +
    demo('<div class="stat30"><div class="big">30%</div><p>AI가 사람으로 판정된 비율과 튜링의 30% 기준</p></div>' +
         '<ul class="pts"><li>어떤 질문이 사람과 AI를 가르는 데 효과적이었나</li><li>AI는 어떤 답에서 티가 났고, 말투 변환은 판별을 얼마나 어렵게 했나</li><li>튜링의 30% 기준을 넘긴 라운드가 있었다면, 그 기계는 "생각한다"고 할 수 있나</li></ul>',
         shot('기존-튜링-결과.png')),
    notes: '결과 카드의 30% 기준을 함께 확인하고 토론 질문 하나만 골라 짧게 이야기해 보겠습니다.\n학생 수업에서는 이 토론이 중심이 됩니다.' },

  { sec: '체험', title: '체험 2) 프롬프트 코딩', html:
    ttl('체험 2) 프롬프트 코딩') +
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
  { sec: '마무리', title: '오늘 저녁 (선택)', html:
    ttl('오늘 저녁', '선택') +
    '<div class="url top"><div class="lab">연수 메인 → 웹앱 갤러리</div><div class="u sm">' + HUB + '</div></div>' +
    demo(pts('학교에서 풀고 싶은 문제 한 줄 올리기 | 다른 선생님 글에 좋아요와 댓글 남기기') +
         '<div class="gos">' + go('../gallery/#submit', '갤러리에 올리기') + '</div>',
         shot('12-갤러리.png')),
    notes: '오늘 체험과 사례를 보며 떠오른 학교의 문제를 갤러리에 남겨 주십시오. 선택 사항입니다.\n둘째 날 활동은 내일 안내하겠습니다. 감사합니다.' },
  ];
})();
