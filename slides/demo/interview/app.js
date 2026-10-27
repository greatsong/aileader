/* 당곡 AI 모의 면접 · 화면. 주소: #/ 학생 목록 · #/s/<id>/<1|2|3>/<지원id> 준비 · #/iv/<지원id> 면접 · #/r/<연습id> 결과 · #/settings */
(function () {
  var V = document.getElementById('view');
  var S = { state: null };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var val = function (v) { return v && typeof v === 'object' && !Array.isArray(v) ? (v['값'] || '') : (v || ''); };

  function api(path, body, opt) {
    opt = opt || {};
    var init = body === undefined ? {} : { method: 'POST', headers: opt.headers || { 'Content-Type': 'application/json' }, body: opt.raw ? body : JSON.stringify(body) };
    var stop = waitForRequest(path, body);
    var request;
    try { request = fetch(path, init); } catch (e) { stop(); return Promise.reject(e); }
    // 브라우저의 영어 오류(Failed to fetch, JSON 해석 실패 등)를 학생·교사에게 그대로 보이지 않는다(교사 지적 2026-10-23)
    var LOST = '서버와 연결이 잠시 끊겼습니다. 잠시 뒤 다시 시도해 주세요.';
    return request.then(function (r) {
      var body = typeof r.text === 'function' ? r.text().then(function (t) { return t ? JSON.parse(t) : {}; }) : r.json();
      return body.then(null, function () { throw new Error(r.ok ? '서버 응답을 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요.' : LOST); }).then(function (j) {
        if (!r.ok || j.error) throw new Error(j.error || (r.status >= 500 ? LOST : '요청을 처리하지 못했습니다(' + r.status + ').'));
        return j;
      });
    }, function () { throw new Error(LOST); }).then(function (r) { stop(); return r; }, function (e) { stop(); throw e; });
  }
  // 요청별 수명으로 대기 안내를 관리한다. 화면 이동 뒤 늦은 응답은 표시하지 않는다.
  var WAITS = [], analysisWait = null;
  // 차분하게 보이도록: 2.5초 뒤 한 번만 그리고, 초를 세지 않으며, 저절로 넘기지 않는다(교사 지적 2026-10-23: 깜빡임·불안감)
  var WAIT_SHOW_MS = 2500, WAIT_SLOW_MS = 25000;
  function startWait(context) {
    var stopped = false, panel = null, timer, slowTimer, index = 0, cards = [];
    function drawCard() {
      if (!panel) return;
      var box = panel.querySelector('.wait-card'), item = cards.length ? cards[index % cards.length] : null;
      box.innerHTML = item ? '<div class="tipcard"><span>' + esc(item.k) + '</span><p class="preserve">' + esc(item.t) + '</p>' + (item.s ? '<small class="tipsrc">' + esc(item.s) + '</small>' : '') + '</div>' +
        (cards.length > 1 ? '<div class="row"><button class="btn small wait-prev">이전 자료</button><button class="btn small wait-next">다른 자료 보기</button></div>' : '') : '';
      if (item && cards.length > 1) {
        box.querySelector('.wait-prev').onclick = function () { index = (index + cards.length - 1) % cards.length; drawCard(); };
        box.querySelector('.wait-next').onclick = function () { index++; drawCard(); };
      }
    }
    timer = setTimeout(function () {
      if (stopped) return;
      panel = document.createElement('aside'); panel.className = 'ai-wait noprint'; panel.setAttribute('aria-label', '기다리는 동안 참고 자료');
      panel.innerHTML = '<p class="wait-status" role="status"><span class="wait-dot"></span><span class="wait-text">답을 준비하고 있습니다. 기다리는 동안 아래 자료를 읽어 보면 도움이 됩니다.</span></p><div class="wait-card"></div>';
      document.body.appendChild(panel);
      slowTimer = setTimeout(function () { var st = panel && panel.querySelector('.wait-text'); if (st && !stopped) st.textContent = '조금 더 걸리고 있습니다. 잠시만 기다려 주세요.'; }, WAIT_SLOW_MS - WAIT_SHOW_MS);
      api('/api/wait', context || {}).then(function (r) { if (!stopped) { cards = (r.items || []).slice(0, 15); drawCard(); } }).catch(function () {});
    }, WAIT_SHOW_MS);
    function stop() { stopped = true; clearTimeout(timer); clearTimeout(slowTimer); if (panel) panel.remove(); WAITS = WAITS.filter(function (x) { return x !== stop; }); }
    WAITS.push(stop); return stop;
  }
  function stopWaits() { WAITS.slice().forEach(function (stop) { stop(); }); analysisWait = null; }
  function waitForRequest(path, body) {
    var base = path.split('?')[0];
    // 면접 중 답 처리(/api/answer)는 면접 화면 안의 참고 카드를 쓰므로 여기서 띄우지 않는다
    if (!/^\/api\/(mentor(?:\/voice)?|coach(?:\/voice)?|session\/(end|memo)|questions\/generate|analysis\/(make|detail))$/.test(base)) return function () {};
    var query = new URLSearchParams(path.split('?')[1] || '');
    return startWait({ session_id: (body && body.session_id) || query.get('session_id') || query.get('session') || 0,
      application_id: (body && body.application_id) || 0 });
  }

  // ── AI 멘토: 면접 답과 생기부 분석을 근거로 글로 묻고 답한다(교사 결정 2026-10-23) ──
  var MENTOR = null;
  function mentorView(sid) {
    if (MENTOR && MENTOR.stop) MENTOR.stop();
    var m = MENTOR = { sid: sid, active: true, draft: '', busy: false, pending: null, message: '', logs: [], suggestions: [], used: 0, limit: 30 };
    V.innerHTML = '<div class="card loading"><span class="spin"></span>대화를 불러오고 있습니다.</div>';
    m.stop = function () { m.active = false; };
    return api('/api/mentor/state', { session_id: sid }).then(function (r) {
      if (!m.active) return;
      Object.assign(m, r); mentorDraw(m);
    }).catch(function (e) { if (!m.active) return; V.innerHTML = '<div class="card"><p>' + esc(e.message) + '</p><div class="row"><a class="btn" href="#/r/' + sid + '">보고서로 돌아가기</a><button class="btn" id="mentorLoadRetry">다시 불러오기</button></div></div>'; var retry = document.getElementById('mentorLoadRetry'); if (retry) retry.onclick = function () { mentorView(sid); }; });
  }
  function mentorDraw(m) {
    if (!m.active) return;
    var full = m.used >= m.limit, locked = m.busy || full;
    var msgs = (m.logs || []).map(function (x) {
      return (x.ask ? '<div class="msg me">' + esc(x.ask) + '</div>' : '') + '<div class="msg ai">' + esc(x.reply) +
        ((x.refs || []).length ? '<div class="refs">' + x.refs.map(function (r) { return '<span>' + esc(r) + '</span>'; }).join('') + '</div>' : '') + '</div>';
    }).join('');
    var waiting = m.busy && m.pending ? '<div class="msg me">' + esc(m.pending.body.ask) + '</div><div class="typing"><span class="spin"></span>근거를 찾아 답을 준비하고 있습니다</div>' : '';
    var first = !(m.logs || []).length && !m.busy;
    V.innerHTML = '<div class="mentor-page"><div class="page-title"><div><h1>AI 멘토에게 질문하기</h1><p class="sub">' + esc(m.intro || '이번 면접의 답과 생기부 분석을 근거로 답합니다.') + '</p></div><a class="btn" href="#/r/' + m.sid + '">보고서로 돌아가기</a></div>' +
      '<div class="chat" id="chat" aria-live="polite">' + msgs + waiting + '</div>' +
      (first && (m.suggestions || []).length ? '<div class="suggest-block"><p class="small muted">이렇게 물어볼 수 있습니다</p><div class="suggest">' + m.suggestions.map(function (q, i) { return '<button type="button" data-sg="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div></div>' : '') +
      (m.message ? '<div class="warnbox" role="status">' + esc(m.message) + (m.pending && !m.busy ? ' <button class="btn small" type="button" id="mentorRetry">다시 보내기</button>' : '') + '</div>' : '') +
      '<form id="mentorForm" class="composer"><textarea id="mentorAsk" rows="1" maxlength="2000" aria-label="멘토에게 할 질문" placeholder="' + (full ? '질문 횟수를 모두 사용했습니다' : '예: 3번 답에서 무엇을 더 설명하면 좋을까요?') + '"' + (locked ? ' disabled' : '') + '>' + esc(m.draft) + '</textarea>' +
      '<button class="btn pri" type="submit"' + (locked ? ' disabled' : '') + '>보내기</button></form>' +
      '<p class="composer-note">질문 ' + m.used + ' / ' + m.limit + '회 · Enter로 보내고 Shift+Enter로 줄을 바꿉니다</p></div>';
    var ask = document.getElementById('mentorAsk');
    ask.oninput = function (e) { m.draft = e.target.value; m.pending = null; e.target.style.height = 'auto'; e.target.style.height = Math.min(160, e.target.scrollHeight) + 'px'; };
    ask.onkeydown = function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!locked && m.draft.trim()) mentorSend(m); } };
    document.getElementById('mentorForm').onsubmit = function (e) { e.preventDefault(); if (!locked && m.draft.trim()) mentorSend(m); };
    V.querySelectorAll('[data-sg]').forEach(function (b) { b.onclick = function () { if (locked) return; m.draft = m.suggestions[+b.dataset.sg]; mentorSend(m); }; });
    var retry = document.getElementById('mentorRetry'); if (retry) retry.onclick = function () { mentorSend(m, true); };
    if ((msgs || waiting) && window.scrollTo) window.scrollTo(0, document.body.scrollHeight || 0);
    if (!locked && ask.focus) ask.focus();
  }
  function mentorSend(m, retry) {
    if (!m.active || m.busy) return;
    if (!retry || !m.pending) m.pending = { body: { session_id: m.sid, used: m.used, ask: m.draft.trim(), request_id: 'mentor_' + Date.now() + '_' + Math.random().toString(36).slice(2) } };
    var pending = m.pending; m.busy = true; m.message = ''; m.draft = ''; mentorDraw(m);
    return api('/api/mentor', pending.body).then(function (r) {
      if (!m.active) return;
      Object.assign(m, r); m.pending = null; m.busy = false; m.message = ''; mentorDraw(m);
    }).catch(function (e) { if (m.active) { m.busy = false; m.draft = pending.body.ask; m.message = e.message; mentorDraw(m); } });
  }

  function toast(msg, err) {
    var t = document.getElementById('toast'); t.textContent = msg; t.className = 'on' + (err ? ' err' : '');
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = ''; }, err ? 6000 : 2600);
  }
  function loadState() { return api('/api/state').then(function (s) { S.state = s; return s; }); }

  // ── 라우터 ──
  function route() {
    stopWaits(); if (MENTOR && MENTOR.stop) MENTOR.stop();
    document.body.classList.remove('iv');
    if (IV.active) IV.stop();
    var h = location.hash.replace(/^#\/?/, '').split('/');
    // 다른 화면으로 옮기면 맨 위에서 시작하고, 새 화면이 그려질 때까지 이전 화면을 흐리게 둔다(점검 P1-3)
    var key = h[0] + '/' + (h[1] || '');
    if (key !== route.last && window.scrollTo) window.scrollTo(0, 0);
    route.last = key;
    if (V.setAttribute) { V.setAttribute('aria-busy', 'true'); clearTimeout(route.busy); route.busy = setTimeout(function () { V.removeAttribute('aria-busy'); }, 6000); }
    if (window.MutationObserver && !route.watch) { route.watch = new MutationObserver(function () { V.removeAttribute('aria-busy'); }); route.watch.observe(V, { childList: true }); }
    if (document.querySelectorAll) document.querySelectorAll('#top nav a').forEach(function (a) { var on = (a.getAttribute('href') === '#/settings') === (h[0] === 'settings'); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (h[0] === 's') return prep(+h[1], +(h[2] || 1), h[3]);
    if (h[0] === 'iv') return interview(+h[1]);
    if (h[0] === 'r') return result(+h[1]);
    if (h[0] === 'mentor') return mentorView(+h[1]);
    if (h[0] === 'mt') return mentoringView(+h[1]);
    if (h[0] === 'an') return analysisView(+h[1]);
    if (h[0] === 'settings') return settingsView();
    if (h[0] === 'me' || ROLE === 'student') return me();
    return home();
  }
  window.addEventListener('hashchange', route);

  // ── 학생 링크로 들어온 경우: 자기 면접과 결과만 ──
  var ROLE = 'teacher';
  function me() {
    api('/api/me').then(function (d) {
      var left = d.limit ? Math.max(0, d.limit - d.today) : null;
      V.innerHTML = '<h1>' + esc(d.student.name || d.student.code) + ' 학생의 면접 연습</h1>' +
        '<p class="sub">질문을 듣고 말로 답합니다. 답할 때 이름과 학교 이름은 말하지 않습니다.' + (left !== null ? ' 오늘 남은 연습: <b>' + left + '번</b>' : '') + '</p>' +
        (d.applications.length ? d.applications.map(function (a) {
          return '<div class="card" style="margin-top:14px"><div class="row"><div><h2 style="margin:0">' + esc(a.univ) + '</h2><p class="sub" style="margin:4px 0 0">' + esc(a.track) + (a.unit ? ' · ' + esc(a.unit) : '') + ' · 질문 ' + a.questions + '개</p></div><div class="spacer"></div>' +
            (a.questions && left !== 0 ? '<a class="btn pri big" href="#/iv/' + a.id + '">면접 시작 →</a>' : '<span class="muted small">' + (a.questions ? '오늘 연습을 모두 했습니다' : '선생님이 질문을 준비하고 있습니다') + '</span>') + '</div>' +
            '<a class="btn" href="#/mt/' + a.id + '">멘토링 준비</a>' + (historyRows(a).length ? '<div class="grid" style="margin-top:12px">' + historyRows(a).map(function (x) {
              if (x.kind === 'mentoring') return mentoringRow(x, a.id);
              var m = (x.memo || '').split('\n').filter(function (l) { return /^\s*[-•]/.test(l); })[0] || '';
              return '<a class="hist" href="#/r/' + x.id + '"><span class="rd">' + x.round + '회차</span><span class="dt">' + esc(x.started.slice(0, 16)) + '</span><span class="st">' + badge('답 ' + x.answers + '개', 'gray') + '</span><span class="mm">' + esc(m.replace(/^\s*[-•]\s*/, '').slice(0, 90)) + '</span></a>' + (x.memo ? (d.mentor_enabled ? '<a class="btn" href="#/mentor/' + x.id + '">AI 멘토에게 질문하기</a>' : '') : '');
            }).join('') + '</div>' : '') + '</div>';
        }).join('') : '<div class="card">아직 준비된 면접이 없습니다. 선생님께 알려 주세요.</div>');
    }).catch(function (e) { V.innerHTML = '<div class="card">' + esc(e.message) + '</div>'; });
  }

  // ── 학생 목록 ──
  function applicationSummary(apps) {
    var names = Array.from(new Set(apps.map(function (a) { return a.univ; })));
    return names.length ? names[0] + (names.length > 1 ? ' 외 ' + (names.length - 1) + '곳' : '') + (apps.length > 1 ? ' · 지원 ' + apps.length + '개' : '') : '지원 대학 미선택';
  }
  function prepPath(sid, step, aid) { return '#/s/' + sid + '/' + step + (aid ? '/' + aid : ''); }
  // 학생 목록 아래: 여러 학생에게 연습 링크 메일을 한 번에 보낸다(외부 주소가 바뀐 뒤 다시 보낼 때도 사용, 2026-10-24)
  function linkMailState(st) { var lm = st.link_mail || ''; return lm ? (lm.indexOf('오류') === 0 ? '<span class="bad-text">보내지 못함</span>' : '보냄 ' + esc(lm.slice(5, 16))) : '보내지 않음'; }
  function linkBulkHtml(list) {
    if (!list.length) return '';
    return '<div class="card link-bulk noprint" style="margin-top:18px"><details id="lbBox"><summary>학생 연습 링크 메일 보내기</summary>' +
      '<p class="small muted" style="margin:8px 0 0">학생 정보에 등록한 메일(Gmail 등)로 학생마다 따로 보냅니다. 선생님께도 사본이 갑니다. 외부 접속 주소가 바뀌면 여기서 모두에게 다시 보내면 됩니다.</p>' +
      '<div class="tbl-wrap"><table><thead><tr><th><input type="checkbox" id="lbAll" aria-label="전체 선택"></th><th>학생</th><th>메일 주소</th><th>링크 메일</th></tr></thead><tbody>' +
      list.map(function (st) {
        var can = st.email && !st.link_off;
        return '<tr><td><input type="checkbox" class="lbPick" value="' + st.id + '" data-off="' + (can ? '0' : '1') + '"' + (can ? '' : ' disabled') + '></td><td>' + esc(st.code) + ' ' + esc(st.name || '') + '</td><td>' + (st.email ? esc(st.email) : '<span class="muted">없음</span>') + (st.link_off ? ' <span class="muted">· 링크 꺼짐</span>' : '') + '</td><td data-lm="' + st.id + '">' + linkMailState(st) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="row"><button class="btn pri" id="lbSend" disabled>선택한 학생에게 보내기</button><span class="small muted" id="lbMsg" role="status"></span></div></details></div>';
  }
  function linkBulkBind(list) {
    var all = document.getElementById('lbAll'), send = document.getElementById('lbSend'); if (!send) return;
    function picks() { return Array.from(V.querySelectorAll('.lbPick:checked')).map(function (x) { return +x.value; }); }
    var busy = false;                               // 보내는 중에는 선택을 바꾸거나 다시 보낼 수 없다(코덱스 검토 2026-10-25)
    function sync() { var n = picks().length; send.disabled = busy || !n; send.textContent = busy ? '보내는 중입니다' : n ? '선택한 ' + n + '명에게 보내기' : '선택한 학생에게 보내기'; }
    function lock(on) { busy = on; all.disabled = on; V.querySelectorAll('.lbPick').forEach(function (x) { x.disabled = on || x.dataset.off === '1'; }); sync(); }
    V.querySelectorAll('.lbPick').forEach(function (x) { x.onchange = sync; });
    all.onchange = function () { V.querySelectorAll('.lbPick:not(:disabled)').forEach(function (x) { x.checked = all.checked; }); sync(); };
    send.onclick = function () {
      if (busy) return;
      var ids = picks(); if (!ids.length) return;
      if (!confirm(ids.length + '명에게 연습 링크 메일을 보냅니다. 선생님께도 학생마다 사본이 갑니다.')) return;
      var msg = document.getElementById('lbMsg'), ok = 0, fail = 0;
      lock(true);
      ids.reduce(function (p, id, i) {
        return p.then(function () {
          msg.textContent = (i + 1) + ' / ' + ids.length + '명 보내는 중입니다';
          return api('/api/student/link/send', { id: id }).then(function (r) { ok++; var st = list.find(function (x) { return x.id === id; }); if (st) st.link_mail = r.link_mail; },
            function (e) { fail++; var st = list.find(function (x) { return x.id === id; }); if (st) st.link_mail = '오류: ' + e.message; })
            .then(function () { var st = list.find(function (x) { return x.id === id; }), td = V.querySelector('[data-lm="' + id + '"]'); if (td && st) td.innerHTML = linkMailState(st); });
        });
      }, Promise.resolve()).then(function () {
        msg.textContent = ok + '명에게 보냈습니다' + (fail ? ' · ' + fail + '명은 보내지 못했습니다(학생 화면에서 사유를 확인해 주세요)' : '');
        toast(msg.textContent, !!fail); V.querySelectorAll('.lbPick').forEach(function (x) { x.checked = false; }); all.checked = false; lock(false);
      });
    };
  }
  function home() {
    loadState().then(function (s) {
      V.innerHTML = '<h1>학생</h1><p class="sub">학생을 고르면 지원 대학, 생기부, 기본 질문을 준비하고 면접을 시작합니다. 이름은 이 맥북에만 저장됩니다.</p>' +
        '<div class="grid g3">' + s.students.map(function (st) {
          return '<a class="card st-card" href="#/s/' + st.id + '/1"><span class="chip gray">' + esc(st.code) + '</span><div class="nm">' + esc(st.name || '(이름 없음)') + '</div><div class="muted small" data-st="' + st.id + '">불러오는 중…</div></a>';
        }).join('') + '<button type="button" class="card st-new" id="newSt">+ 새 학생</button></div>' + linkBulkHtml(s.students);
      document.getElementById('newSt').onclick = function () { newStudent(); };
      linkBulkBind(s.students);
      s.students.forEach(function (st) {
        api('/api/student/' + st.id).then(function (d) {
          var el = V.querySelector('[data-st="' + st.id + '"]'); if (!el) return;
          var a = d.applications[0];
          var qn = d.applications.reduce(function (n, x) { return n + x.questions.filter(function (q) { return q.status === 'confirmed'; }).length; }, 0);
          var sn = d.applications.reduce(function (n, x) { return n + x.sessions.length; }, 0);
          el.innerHTML = (a ? esc(applicationSummary(d.applications)) + (d.applications.length === 1 ? ' · ' + esc(a.unit || a.track) : '') : '지원 대학 미선택') +
            '<div class="st-badges">' + badge(d.record ? '생기부 ✓' : '생기부 필요', d.record ? 'good' : 'warn') + (a ? badge(qn ? '질문 ' + qn + '개' : '질문 준비 필요', qn ? 'brand' : 'warn') : '') + badge('연습 ' + sn + '번', 'gray') + '</div>';
        });
      });
    });
  }
  function newStudent(student, back) {
    var st = student || {};
    V.innerHTML = '<h1>' + (st.id ? '학생 정보 고치기' : '새 학생') + '</h1><p class="sub">이름·학번·메일 주소는 이 맥북에 저장합니다. 학생 메일 주소는 보고서와 연습 링크 발송에만 사용하며 구글 시트에는 기록하지 않습니다.</p>' +
      '<div class="card" style="max-width:560px"><div class="grid">' +
      '<label class="f">이름<input type="text" id="nm" placeholder="예: 김서윤"></label>' +
      '<label class="f">학번(선택)<input type="text" id="hb" placeholder="예: 30512"></label>' +
      '<label class="f">학생 메일 주소(선택, Gmail 등 일반 메일)<input type="email" id="em" placeholder="예: student@gmail.com"></label>' +
      '<label class="f">함께 가릴 낱말(선택, 쉼표로 구분)<input type="text" id="ex" placeholder="예: 담임 선생님 이름, 동아리 고유 이름"></label>' +
      '<div class="row"><button class="btn pri" id="mk">' + (st.id ? '저장' : '만들기') + '</button><button class="btn ghost" id="cancelSt">취소</button></div></div></div>';
    document.getElementById('nm').value = st.name || '';
    document.getElementById('hb').value = st.hakbun || '';
    document.getElementById('em').value = st.email || '';
    document.getElementById('ex').value = st.extra_terms || '';
    document.getElementById('cancelSt').onclick = route;
    document.getElementById('mk').onclick = function () {
      var nm = document.getElementById('nm').value.trim(); if (!nm) return toast('이름을 입력해 주세요', true);
      var email = document.getElementById('em'); if (!email.reportValidity()) return;
      var button = document.getElementById('mk'); button.disabled = true;
      api('/api/student', { id: st.id, name: nm, hakbun: document.getElementById('hb').value.trim(), email: email.value.trim(), extra_terms: document.getElementById('ex').value }).then(function (r) {
        var target = back || prepPath(r.id, 1);
        if (location.hash === target) route(); else location.hash = target;
      }).catch(function (e) { button.disabled = false; toast(e.message, true); });
    };
  }

  // 생기부 저장 시각: '생기부 10월 23일 8시 32분 업로드' / 없으면 '생기부 아직 없음'
  function recordStamp(d) {
    var c = d.record_created || '';
    var m = /^\d{4}-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(c);
    if (!d.record || !m) return '<span class="chip gray">생기부 아직 없음</span>';
    return '<span class="chip ok">생기부 ' + (+m[1]) + '월 ' + (+m[2]) + '일 ' + (+m[3]) + '시 ' + (+m[4]) + '분 업로드</span>';
  }

  // ── 준비 ──
  function prep(sid, step, aid) {
    Promise.all([loadState(), api('/api/student/' + sid)]).then(function (res) {
      var st = res[0], d = res[1];
      var adding = aid === 'new';
      var app = adding ? null : (d.applications.find(function (a) { return a.id === +aid; }) || d.applications[0]);
      if (adding) step = 1;
      var selected = adding ? 'new' : (app && app.id);
      var currentPath = prepPath(sid, step, selected);
      if (location.hash !== currentPath) history.replaceState(null, '', currentPath);
      var qn = app ? app.questions.filter(function (q) { return q.status === 'confirmed'; }).length : 0;
      var done = [!!app, !!d.record, qn > 0];
      var stepsHtml = ['지원 대학·전형', '생기부', '기본 질문'].map(function (t, i) {
        return '<a href="' + prepPath(sid, i + 1, selected) + '" class="' + (step === i + 1 ? 'on' : '') + (done[i] ? ' done' : '') + '"><span class="n">' + (done[i] ? '✓' : i + 1) + '</span>' + t + '</a>';
      }).join('');
      V.innerHTML = '<div class="page-head"><div class="avatar" aria-hidden="true">' + esc(String(d.student.name || d.student.code || '?').slice(0, 1)) + '</div><div class="ph-main"><h1>' + esc(d.student.name) + ' <span class="chip gray">' + esc(d.student.code) + '</span></h1>' +
        '<p class="ph-meta">' + esc(applicationSummary(d.applications)) + (app ? ' · 선택한 지원: ' + esc(app.univ) + ' · ' + esc(app.track) + (app.unit ? ' · ' + esc(app.unit) : '') : ' · ' + (adding ? '새 지원을 추가합니다' : '지원 대학을 먼저 고릅니다')) + '</p>' +
        '<p class="ph-stamp">' + recordStamp(d) + '</p>' +
        '<div class="row noprint ph-actions"><button class="btn small" id="editStudent">학생 정보 고치기</button>' + (app ? '<a class="btn small" href="#/mt/' + app.id + '">멘토링 준비</a>' : '') + (app && d.record ? '<a class="btn small" href="#/an/' + app.id + '">생기부 분석</a>' : '') + '</div>' +
        '<div class="slink noprint" id="slinkBox"></div>' +
        '<label class="toggle small" style="margin-top:6px" title="동의 여부를 이 맥북에 기록합니다. 동의한 학생만 보고서 메일에 학번·이름이 들어갑니다. 구글 시트에는 언제나 학생 코드만 들어갑니다."><input type="checkbox" id="consent"' + (d.student.consent ? ' checked' : '') + '>개인정보 제공 동의 받음' + (d.student.consent ? ' (' + esc(d.student.consent) + ')' : '') + ' · 보고서 메일에 학번·이름 포함</label></div>' +
        (app && qn ? '<a class="btn pri big ph-cta" href="#/iv/' + app.id + '">면접 시작 →</a>' : '') + '</div>' +
        '<div class="card" style="margin-top:18px"><div class="row"><h2 style="margin:0">지원 목록</h2><div class="spacer"></div><a class="btn" href="' + prepPath(sid, 1, 'new') + '">지원 추가</a></div>' +
        '<p class="small muted">지원을 고르면 해당 지원의 준비 단계와 면접 기록을 확인합니다. 생기부는 모든 지원에서 함께 사용합니다.</p><div class="grid">' + d.applications.map(function (a) {
          return '<div class="app-item' + (app && a.id === app.id ? ' on' : '') + '"><a href="' + prepPath(sid, step, a.id) + '"' + (app && a.id === app.id ? ' aria-current="true"' : '') + '><b>' + esc(a.univ) + '</b><span>' + esc(a.track) + ' · ' + esc(a.unit || '전체') + '</span><small>확정 질문 ' + a.questions.filter(function (q) { return q.status === 'confirmed'; }).length + '개 · 연습 ' + a.sessions.length + '번</small></a><button class="btn small ghost" data-delete-app="' + a.id + '">지원 삭제</button></div>';
        }).join('') + (d.applications.length ? '' : '<p class="muted">등록된 지원이 없습니다.</p>') + '</div></div>' +
        (adding ? '<h2 style="margin-top:18px">지원 추가</h2>' : '') + '<div class="steps">' + stepsHtml + '</div><div id="stepBody"></div>' +
        (app && historyRows(app).length ? '<div class="card" style="margin-top:18px"><h2>연습 기록 <span class="faint small">' + app.sessions.length + '회</span></h2><div class="grid">' + historyRows(app).map(function (s) {
          if (s.kind === 'mentoring') return mentoringRow(s, app.id);
          var m = (s.memo || '').split('\n').filter(function (l) { return /^\s*[-•]/.test(l); })[0] || '';
          return '<a class="hist" href="#/r/' + s.id + '"' + (s.focus ? ' title="포커스: ' + esc(s.focus) + '"' : '') + '><span class="rd">' + s.round + '회차</span><span class="dt">' + esc(s.started.slice(0, 16)) + '</span><span class="st">' + (s.ended ? '' : badge('중단', 'warn')) + badge('답 ' + s.answers + '개', 'gray') + '</span>' +
            '<span class="mm">' + (s.focus ? '<span class="faint">포커스 · ' + esc(s.focus.slice(0, 24)) + (s.focus.length > 24 ? '…' : '') + '</span> ' : '') + esc(m.replace(/^\s*[-•]\s*/, '').slice(0, 90)) + '</span></a>';
        }).join('') + '</div></div>' : '');
      document.getElementById('editStudent').onclick = function () { newStudent(d.student, currentPath); };
      V.querySelectorAll('[data-delete-app]').forEach(function (button) { button.onclick = function () {
        var target = d.applications.find(function (a) { return a.id === +button.dataset.deleteApp; });
        var count = target.session_count == null ? target.sessions.length : target.session_count;
        if (!confirm(target.univ + ' · ' + target.track + ' · ' + (target.unit || '전체') + ' 지원을 삭제할까요? 질문 ' + target.questions.length + '개와 면접 ' + count + '회차의 답변·녹음·코치 대화, 생기부 분석을 함께 삭제합니다. 학생 공통 생기부는 남습니다.')) return;
        button.disabled = true;
        api('/api/application/delete', { id: target.id, student_id: sid }).then(function () {
          var next = app && app.id !== target.id ? app.id : (d.applications.find(function (a) { return a.id !== target.id; }) || {}).id;
          var path = prepPath(sid, step, adding ? 'new' : next);
          if (location.hash === path) route(); else location.hash = path;
        }).catch(function (e) { button.disabled = false; toast(e.message, true); });
      }; });
      // 학생 연습 링크: 등록할 때 자동으로 만들어 두고 여기서 복사·메일 보내기·새 링크·끄기를 한다(2026-10-24 교사 결정)
      function drawLink(link, off) {
        var box = document.getElementById('slinkBox'); if (!box) return;
        var st0 = d.student, lm = st0.link_mail || '';
        if (off) { box.innerHTML = '<span class="small muted">학생 연습 링크가 꺼져 있습니다.</span> <button class="btn small" id="slNew">새 링크 만들기</button>'; }
        else if (!link) { box.innerHTML = '<span class="small muted">외부 접속 주소가 열려 있지 않아 학생 링크를 만들 수 없습니다. 맥북에서만 연습할 수 있습니다.</span>'; return; }
        else {
          box.innerHTML = '<div class="slink-row"><span class="small slink-label">학생 연습 링크</span><input type="text" id="slUrl" readonly value="' + esc(link) + '"><button class="btn small" id="slCopy">복사</button>' +
            '<button class="btn small pri" id="slMail"' + (st0.email ? '' : ' disabled title="학생 정보 고치기에서 메일 주소를 넣어 주세요"') + '>메일 보내기</button><button class="btn small ghost" id="slNew" title="이전 링크를 끊고 새로 만듭니다">새 링크</button><button class="btn small ghost" id="slOff" title="이 학생이 링크로 들어오지 못하게 합니다">링크 끄기</button></div>' +
            '<p class="small muted" id="slMsg">' + (st0.email ? '받는 주소 ' + esc(st0.email) + ' · ' + (lm ? (lm.indexOf('오류') === 0 ? '<span class="bad-text">' + esc(lm) + '</span>' : '메일 보냄 ' + esc(lm.slice(5, 16))) : '아직 보내지 않았습니다') : '학생 메일 주소가 없습니다. 학생 정보 고치기에서 일반 메일 주소(Gmail 등)를 넣으면 메일로 보낼 수 있습니다') +
            ' · 이 학생의 면접과 결과만 열립니다</p>';
          document.getElementById('slUrl').onclick = function () { this.select(); };
          document.getElementById('slCopy').onclick = function () { var u = document.getElementById('slUrl'); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { toast('복사했습니다'); }, function () { u.select(); toast('주소를 선택했습니다. 복사해 주세요'); }); };
          document.getElementById('slMail').onclick = function () {
            var b = this, msg = st0.email + ' 주소로 연습 링크를 보냅니다. 선생님께도 사본이 갑니다.' + (qn ? '' : '\n아직 확정된 기본 질문이 없어 학생이 면접을 바로 시작할 수는 없습니다.');
            if (!confirm(msg)) return;
            b.disabled = true; b.textContent = '보내는 중입니다';
            api('/api/student/link/send', { id: sid }).then(function (r) { toast('연습 링크를 메일로 보냈습니다'); st0.link_mail = r.link_mail; drawLink(link, false); })
              .catch(function (e) { toast(e.message, true); st0.link_mail = '오류: ' + e.message; drawLink(link, false); });
          };
          document.getElementById('slOff').onclick = function () { if (confirm('이 학생은 지금 링크로 더 이상 들어올 수 없습니다. 링크를 끌까요?')) api('/api/student/link', { id: sid, off: true }).then(function () { toast('링크를 껐습니다'); drawLink('', true); }); };
        }
        document.getElementById('slNew').onclick = function () {
          if (!off && !confirm('이전 링크는 더 이상 열리지 않습니다. 새로 만들까요?')) return;
          api('/api/student/link', { id: sid, new: true }).then(function (r) { st0.link_off = ''; toast('새 링크를 만들었습니다. 학생에게 다시 보내 주세요'); drawLink(r.link, false); });
        };
      }
      drawLink(d.link, !!d.student.link_off);
      var cs = document.getElementById('consent');
      if (cs) cs.onchange = function () { api('/api/student/consent', { id: sid, on: cs.checked }).then(function (r) { toast(r.consent ? '동의 표시를 저장했습니다. 보고서 메일에 학번·이름이 들어갑니다' : '동의 표시를 뺐습니다. 보고서 메일에는 학생 코드만 들어갑니다'); prep(sid, step, selected); }); };
      var B = document.getElementById('stepBody');
      if (step === 1) stepApply(B, st, d, app);
      else if (step === 2) stepRecord(B, st, d, app);
      else stepQuestions(B, d, app);
    }).catch(function (e) { toast(e.message, true); });
  }

  function stepApply(B, st, d, app) {
    var packs = st.packs;
    if (!packs.length) { B.innerHTML = '<div class="card">대학 자료(packs/universities)가 아직 없습니다.</div>'; return; }
    B.innerHTML = '<div class="grid two side">' +
      '<div class="card grid"><label class="f">대학<select id="pk">' + packs.map(function (p) { return '<option value="' + esc(p.file) + '">' + esc(p['대학']) + ' (' + esc(p['학년도']) + '학년도)</option>'; }).join('') + '</select></label>' +
      '<label class="f">전형<select id="tr"></select></label><label class="f">모집단위<select id="un"></select></label>' +
      '<button class="btn pri" id="sv">저장하고 다음 →</button></div><div class="card" id="infoCard"></div></div>';
    var pk = B.querySelector('#pk'), tr = B.querySelector('#tr'), un = B.querySelector('#un'), cache = {};
    if (app && packs.some(function (p) { return p.file === app.pack; })) pk.value = app.pack;
    function getPack() { var f = pk.value; return cache[f] ? Promise.resolve(cache[f]) : api('/api/pack/' + encodeURIComponent(f)).then(function (p) { return (cache[f] = p); }); }
    function fillTracks() {
      getPack().then(function (p) {
        tr.innerHTML = (p['전형'] || []).map(function (t) { return '<option>' + esc(t['이름']) + '</option>'; }).join('');
        if (app && app.pack === pk.value) tr.value = app.track;
        fillUnits();
      });
    }
    function fillUnits() {
      getPack().then(function (p) {
        var t = (p['전형'] || []).filter(function (x) { return x['이름'] === tr.value; })[0] || {};
        var us = Array.isArray(t['모집단위']) ? t['모집단위'] : [val(t['모집단위']) || '전체'];
        un.innerHTML = us.map(function (u) { return '<option>' + esc(u) + '</option>'; }).join('');
        if (app && app.pack === pk.value && app.track === tr.value && us.indexOf(app.unit) >= 0) un.value = app.unit;
        info(p, t);
      });
    }
    un.onchange = function () { getPack().then(function (p) { info(p, (p['전형'] || []).filter(function (x) { return x['이름'] === tr.value; })[0] || {}); }); };
    function info(p, t) {
      var srcs = {}; (p['출처'] || []).forEach(function (s) { srcs[s.id] = s; });
      var cite = function (v) { var g = v && v['근거']; if (!g) return ''; var s = srcs[g['출처']] || {}; return ' <span class="src">' + (s['주소'] ? '<a href="' + esc(s['주소']) + '" target="_blank">' + esc(s['이름'] || g['출처']) + '</a>' : esc(s['이름'] || '')) + (g['쪽'] ? ' ' + g['쪽'] + '쪽' : '') + '</span>'; };
      var iv = t['면접'] || {};
      var ud = (t['모집단위별'] || {})[un.value];
      var rows = [['면접일', ud ? { '값': ud['면접일'], '근거': ud['근거'] } : t['면접일']], ['전형 방법', t['전형 방법']], ['면접 유형', iv['유형']], ['방식', iv['방식']], ['시간', iv['시간']], ['면접위원', iv['면접위원']]]
        .filter(function (r) { return val(r[1]); }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(val(r[1])) + (r[1] && r[1]['근거'] ? cite(r[1]) : (r[0] === '면접 유형' || r[0] === '방식' ? cite(iv) : '')) + '</dd>'; }).join('');
      var els = (t['평가 요소'] || []).map(function (e) { return '<div style="margin:8px 0"><b>' + esc(e['이름']) + '</b>' + (e['비율'] ? ' <span class="chip">' + esc(e['비율']) + '</span>' : '') + '<div class="small muted">' + esc(e['설명'] || '') + '</div>' + cite(e) + '</div>'; }).join('');
      var ex = (t['기출'] || []).filter(function (g) { return (g['출처 종류'] || '공식') === '공식'; }).slice(0, 5).map(function (g) { return '<li>' + esc(g['질문'] || g['문항'] || '') + ' <span class="faint small">(' + esc(g['학년도'] || '') + ' ' + esc(g['계열'] || '') + ')</span></li>'; }).join('');
      var kinds = {}; (p['출처'] || []).forEach(function (x) { (kinds[x['종류'] || '기타'] = kinds[x['종류'] || '기타'] || []).push(x); });
      var srcHtml = Object.keys(kinds).map(function (k) { return '<div style="margin:8px 0"><b class="small">' + esc(k) + '</b>' + kinds[k].map(function (x) { return '<div class="src" style="margin:3px 0">' + esc(x.id) + ' <a href="' + esc(x['주소'] || '#') + '" target="_blank">' + esc(x['이름']) + '</a> · ' + esc(x['게시일'] || x['학년도'] || '') + (x['신뢰'] ? ' · 신뢰 ' + esc(x['신뢰']) : '') + '<br>' + esc(x['본 것'] || '') + '</div>'; }).join('') + '</div>'; }).join('');
      var warn = (p['주의'] || []).slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      document.getElementById('infoCard').innerHTML = '<h2>' + esc(p['대학']) + ' 면접 정보</h2><dl class="info">' + rows + '</dl>' +
        (els ? '<h3 style="margin-top:18px">면접 평가 요소</h3>' + els : '') + (ex ? '<h3 style="margin-top:18px">공개 기출(공식)</h3><ul class="small">' + ex + '</ul><p class="src">공식 공개 기출 ' + (t['기출'] || []).filter(function (g) { return (g['출처 종류'] || '공식') === '공식'; }).length + '문항 가운데 우선 계열 20문항을 면접 대기 카드와 결과 화면에서 다시 보여 줍니다.</p>' : '') +
        (warn ? '<h3 style="margin-top:18px">올해 달라진 점</h3><ul class="small">' + warn + '</ul>' : '') +
        (srcHtml ? '<details style="margin-top:14px"><summary class="small muted" style="cursor:pointer">출처 ' + (p['출처'] || []).length + '개 보기(종류별)</summary>' + srcHtml + '</details>' : '') +
        '<p class="src" style="margin-top:10px">확인일 ' + esc(p['확인일'] || '') + '</p>';
    }
    pk.onchange = fillTracks; tr.onchange = fillUnits;
    fillTracks();
    B.querySelector('#sv').onclick = function () {
      var button = B.querySelector('#sv'); button.disabled = true;
      api('/api/application', { id: app && app.id, student_id: d.student.id, pack: pk.value, track: tr.value, unit: un.value }).then(function (r) { location.hash = prepPath(d.student.id, 2, r.id); }).catch(function (e) { button.disabled = false; toast(e.message, true); });
    };
  }

  function stepRecord(B, st, d, app) {
    var secs = d.record ? JSON.parse(JSON.stringify(d.record)) : null;
    var source = d.record_source || '';
    var ocr = st.settings.ocr;
    B.innerHTML = '<div class="card"><div class="row"><h2 style="margin:0">생기부 올리기</h2><div class="spacer"></div>' +
      '<span class="small muted">스캔 문서 글자 인식</span><select id="eng" style="width:auto"><option value="upstage">업스테이지(이름·인적사항 지운 이미지)</option><option value="mac">맥 내장(밖으로 안 나감)</option></select></div>' +
      '<p class="muted small" style="margin:8px 0 14px">PDF(스캔도 됨)·워드·텍스트·이미지. 한글 파일은 PDF로 저장해 올려 주세요. 이름·학번·학교명은 자동으로 가려지고, 인적·학적사항, 출결, 수상, 자격, 독서, 봉사 실적, 성적표, 학교폭력 조치상황은 제외합니다.</p>' +
      '<label class="drop" id="drop"><input type="file" id="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.heic,.heif" hidden><b>파일을 끌어다 놓거나 눌러서 고르기</b><div class="muted small" style="margin-top:6px">또는 아래에 직접 붙여 넣기</div></label>' +
      '<details style="margin-top:12px"><summary class="muted small" style="cursor:pointer">직접 붙여 넣기</summary><textarea id="paste" rows="6" style="margin-top:8px" placeholder="학생부 내용을 붙여 넣으세요"></textarea><button class="btn" id="pasteGo" style="margin-top:8px">이 글로 읽기</button></details></div>' +
      '<div id="secs" style="margin-top:18px"></div>';
    var eng = B.querySelector('#eng'); eng.value = ocr;
    var file = B.querySelector('#file'), drop = B.querySelector('#drop');
    function send(blob, name) {
      document.getElementById('secs').innerHTML = '<div class="card loading"><span class="spin"></span><span id="upmsg">글자를 읽고 이름을 가리는 중입니다…</span></div>';
      var tick = setInterval(function () {          // 쪽 진행률. 쪽이 많으면 1분 가까이 걸려 멈춘 것처럼 보인다
        api('/api/upload/at?student=' + d.student.id).then(function (p) {
          var m = document.getElementById('upmsg');
          if (!m || !p.pages) return;
          m.textContent = (p.stage === 'send' ? '글자를 읽는 중입니다… ' : '이름을 가리는 중입니다… ') + p.pages + '쪽 중 ' + p.page + '쪽';
        }).catch(function () {});
      }, 900);
      var stop = function () { clearInterval(tick); };
      api('/api/upload?student=' + d.student.id + '&engine=' + eng.value, blob, { raw: true, headers: { 'X-Filename': encodeURIComponent(name) } })
        .then(function (r) { stop(); source = r.file; render(r.sections, r); })
        .catch(function (e) { stop(); document.getElementById('secs').innerHTML = ''; toast(e.message, true); });
    }
    file.onchange = function () { if (file.files[0]) send(file.files[0], file.files[0].name); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); var f = e.dataTransfer.files[0]; if (f) send(f, f.name); };
    B.querySelector('#pasteGo').onclick = function () { var t = B.querySelector('#paste').value; if (t.trim()) send(new Blob([t], { type: 'text/plain' }), 'paste.txt'); };
    if (secs) render(secs, null);

    function render(list, meta) {
      var box = document.getElementById('secs');
      var openGrades = {};
      box.querySelectorAll('[data-grade-panel]').forEach(function (p) { openGrades[p.dataset.gradePanel] = p.open; });
      var groups = [];
      list.forEach(function (s, i) {
        var grade = s.grade || 0, area = s.area || s.key || '전체';
        var g = groups.find(function (v) { return v.grade === grade; });
        if (!g) { g = { grade: grade, areas: [], indices: [] }; groups.push(g); }
        var a = g.areas.find(function (v) { return v.area === area; });
        if (!a) { a = { area: area, indices: [] }; g.areas.push(a); }
        g.indices.push(i); a.indices.push(i);
      });
      groups.sort(function (a, b) { return (a.grade || 4) - (b.grade || 4); });
      var areaNames = { '창체': '창체', '교과': '교과 세특', '행특': '행동특성', '전체': '생기부' };
      function gradeName(g) { return g ? g + '학년' : '학년 미확인'; }
      function title(s) { return (s.grade ? s.grade + '학년 ' : '') + (areaNames[s.area || s.key] || s.area || s.key) + (s.subject ? ' · ' + s.subject : ''); }
      function dirty() { box.querySelector('#recordStatus').textContent = '저장 전'; }
      var how = meta && meta.pages ? meta.pages.map(function (p) { return p.how; }) : [];
      var H = '<div class="row" style="margin-bottom:10px"><h2 style="margin:0">AI로 가는 글 미리보기</h2><div class="spacer"></div>' +
        '<span class="chip gray" id="recordStatus">' + (meta ? '저장 전' : '저장됨') + '</span><button class="btn" id="splitRec">다시 나누기</button></div>' +
        (meta && meta.pages ? '<p class="small muted">' + meta.pages.length + '쪽 · ' + (how.indexOf('mac') >= 0 ? '맥 글자 인식' : how.indexOf('upstage') >= 0 ? '업스테이지 글자 인식' : '글자 그대로') + ' · ' + (meta.ms / 1000).toFixed(1) + '초</p>' : '') +
        '<p class="muted small">체크한 단위만 AI로 보냅니다. ⟦학생⟧·⟦학교⟧는 이름을 가린 표시입니다. 학년과 단위 이름, 내용을 고칠 수 있습니다. 줄 이동은 화면에 표시된 앞뒤 단위를 따르며 학년·영역이 달라도 가능합니다. 다시 나누기는 현재 글을 사용하며, 저장할 때 반영합니다.</p>' +
        '<p id="recordSummary" aria-live="polite"></p>';
      var visibleIndices = [];
      groups.forEach(function (g) { g.areas.forEach(function (a) { visibleIndices = visibleIndices.concat(a.indices); }); });
      groups.forEach(function (g, gi) {
        var opened = Object.prototype.hasOwnProperty.call(openGrades, g.grade) ? openGrades[g.grade] : gi === groups.length - 1;
        H += '<details class="card" data-grade-panel="' + g.grade + '"' + (opened ? ' open' : '') + ' style="margin-bottom:12px"><summary><label class="toggle"><input type="checkbox" data-group="g' + gi + '"> ' + gradeName(g.grade) + '</label> · ' + g.indices.length + '단위</summary>';
        g.areas.forEach(function (a, ai) {
          H += '<h3><label class="toggle"><input type="checkbox" data-group="a' + gi + '-' + ai + '"> ' + esc(areaNames[a.area] || a.area) + '</label></h3><div class="grid">';
          a.indices.forEach(function (i, pos) {
            var s = list[i], w = s.warnings || [];
            var visiblePos = visibleIndices.indexOf(i);
            H += '<div class="sec' + (s.include ? '' : ' off') + '" data-i="' + i + '"><div class="hd"><label class="toggle"><input type="checkbox" data-inc="' + i + '"' + (s.include ? ' checked' : '') + '><span data-title="' + i + '">' + esc(s.title) + '</span></label><span class="faint small" data-count="' + i + '">' + s.text.length.toLocaleString() + '자</span></div>' +
              '<label class="small">단위 이름(활동·과목)<input data-name="' + i + '" value="' + esc(s.subject || '') + '" placeholder="' + esc(areaNames[a.area] || a.area) + '"></label>' +
              '<label class="small">학년<select data-grade="' + i + '">' + [0, 1, 2, 3].map(function (grade) { return '<option value="' + grade + '"' + ((s.grade || 0) === grade ? ' selected' : '') + '>' + gradeName(grade) + '</option>'; }).join('') + '</select></label>' +
              (w.length ? '<div class="warnbox">확인할 낱말: ' + w.map(function (x) { return esc(x.word) + '(' + esc(x.kind) + ')'; }).join(', ') + '</div>' : '') +
              '<textarea data-tx="' + i + '" aria-label="' + esc(s.title) + ' 내용">' + esc(s.text) + '</textarea>' +
              '<button class="btn small" data-merge="' + i + '" data-prev="' + (pos ? a.indices[pos - 1] : -1) + '"' + (pos ? '' : ' disabled') + '>위 단위와 합치기</button>' +
              '<button class="btn small" data-first="' + i + '"' + (visiblePos ? '' : ' disabled') + '>첫 줄을 앞 단위로 보내기</button>' +
              '<button class="btn small" data-last="' + i + '"' + (visiblePos < visibleIndices.length - 1 ? '' : ' disabled') + '>마지막 줄을 다음 단위로 보내기</button></div>';
          });
          H += '</div>';
        });
        H += '</details>';
      });
      H += '<div class="card row" style="margin-top:16px"><label class="toggle" id="ackWrap"><input type="checkbox" id="ack">확인할 낱말을 읽고, 빼야 할 것은 지웠습니다</label><div class="spacer"></div><button class="btn pri" id="saveRec">저장하고 다음 →</button></div>';
      box.innerHTML = H;
      function groupIndices(id) {
        if (id[0] === 'g') return groups[+id.slice(1)].indices;
        var parts = id.slice(1).split('-'); return groups[+parts[0]].areas[+parts[1]].indices;
      }
      function refresh() {
        var included = list.filter(function (s) { return s.include; });
        var chars = included.reduce(function (n, s) { return n + s.text.length; }, 0);
        box.querySelector('#recordSummary').textContent = groups.map(function (g) { return gradeName(g.grade) + ' ' + g.indices.length + '단위'; }).join(' · ') + (groups.length ? ', ' : '') + '켠 단위 ' + included.length + '개(약 ' + chars.toLocaleString() + '자)';
        box.querySelectorAll('[data-group]').forEach(function (c) {
          var ids = groupIndices(c.dataset.group), n = ids.filter(function (i) { return list[i].include; }).length;
          c.checked = n === ids.length; c.indeterminate = n > 0 && n < ids.length;
        });
        box.querySelector('#ackWrap').hidden = !included.some(function (s) { return s.warnings && s.warnings.length; });
      }
      box.querySelectorAll('[data-group]').forEach(function (c) {
        c.onclick = function (e) { e.stopPropagation(); };
        c.onchange = function () {
          groupIndices(c.dataset.group).forEach(function (i) { list[i].include = c.checked; });
          box.querySelectorAll('[data-inc]').forEach(function (v) { v.checked = !!list[+v.dataset.inc].include; v.closest('.sec').classList.toggle('off', !v.checked); });
          dirty(); refresh();
        };
      });
      box.querySelectorAll('[data-inc]').forEach(function (c) { c.onchange = function () { list[+c.dataset.inc].include = c.checked; c.closest('.sec').classList.toggle('off', !c.checked); dirty(); refresh(); }; });
      box.querySelectorAll('[data-tx]').forEach(function (t) { t.oninput = function () {
        list[+t.dataset.tx].text = t.value;
        box.querySelector('[data-count="' + t.dataset.tx + '"]').textContent = t.value.length.toLocaleString() + '자'; dirty(); refresh();
      }; });
      box.querySelectorAll('[data-name]').forEach(function (t) { t.oninput = function () {
        var s = list[+t.dataset.name]; s.subject = t.value.trim(); s.title = title(s);
        box.querySelector('[data-title="' + t.dataset.name + '"]').textContent = s.title; dirty();
      }; });
      box.querySelectorAll('[data-grade]').forEach(function (select) { select.onchange = function () {
        var s = list[+select.dataset.grade]; s.grade = +select.value || null; s.title = title(s);
        render(list, meta || {}); dirty();
      }; });
      function moveLine(i, first) {
        var pos = visibleIndices.indexOf(i), target = visibleIndices[pos + (first ? -1 : 1)];
        if (target === undefined) return;
        var s = list[i], other = list[target], lines = s.text.trim().split(/\r?\n/);
        if (!s.text.trim()) return;
        var line = first ? lines.shift() : lines.pop();
        other.text = (first ? [other.text.trimEnd(), line] : [line, other.text.trimStart()]).filter(Boolean).join('\n');
        other.warnings = (other.warnings || []).concat(s.warnings || []);
        s.text = lines.join('\n').trim();
        if (!s.text) list.splice(i, 1);
        render(list, meta || {}); dirty();
      }
      box.querySelectorAll('[data-first]').forEach(function (b) { b.onclick = function () { moveLine(+b.dataset.first, true); }; });
      box.querySelectorAll('[data-last]').forEach(function (b) { b.onclick = function () { moveLine(+b.dataset.last, false); }; });
      box.querySelectorAll('[data-merge]').forEach(function (button) { button.onclick = function () {
        var i = +button.dataset.merge, prev = +button.dataset.prev;
        if (prev < 0) return;
        var s = list[prev], other = list[i];
        s.text += '\n\n' + other.text;
        s.subject = [s.subject, other.subject].filter(Boolean).join(' / ');
        s.title = title(s); s.warnings = (s.warnings || []).concat(other.warnings || []);
        list.splice(i, 1); render(list, meta || {}); dirty();
        toast('위 단위와 합쳤습니다. 켜기·끄기는 위 단위의 설정을 따릅니다.');
      }; });
      box.querySelector('#splitRec').onclick = function () {
        var button = box.querySelector('#splitRec'); button.disabled = true;
        api('/api/record/split', { student_id: d.student.id, sections: list }).then(function (r) {
          render(r.sections, meta || {});
          toast('다시 나눴습니다. 내용을 확인한 뒤 저장해 주세요.');
        }).catch(function (e) { button.disabled = false; toast(e.message, true); });
      };
      box.querySelector('#saveRec').onclick = function () {
        if (!box.querySelector('#ackWrap').hidden && !box.querySelector('#ack').checked) return toast('확인할 낱말을 먼저 확인해 주세요', true);
        if (list.length && !list.some(function (s) { return s.include; })) return toast('단위를 하나 이상 골라 주세요', true);
        var button = box.querySelector('#saveRec'); button.disabled = true;
        api('/api/record/save', { student_id: d.student.id, sections: list, source: source }).then(function (r) { toast(r.analysis_auto ? '생기부를 저장했습니다. 지원별 분석은 뒤에서 진행합니다.' : '생기부를 저장했습니다. 분석 자동 시작은 꺼져 있습니다.'); location.hash = prepPath(d.student.id, 3, app && app.id); }).catch(function (e) { button.disabled = false; toast(e.message, true); });
      };
      refresh();
    }
  }

  function stepQuestions(B, d, app) {
    if (!app) { B.innerHTML = '<div class="card">먼저 지원 대학·전형을 고르세요.</div>'; return; }
    if (!d.record) { B.innerHTML = '<div class="card">먼저 생기부를 저장하세요.</div>'; return; }
    var qs = app.questions.map(function (q) { return Object.assign({}, q); });
    var focus = app.focus || '';
    var level = app.level || '보통';
    var plan = Object.assign({ n: 8, pick: 'ai', general: 0, past: 0, source_mode: 'official' }, app.plan || {});
    var recent = app.recent_materials || { count: 0, counts: { '언론': 0, '블로그': 0, '학생 후기': 0 } };
    var KIND = { '생기부': '생기부', '일반': '일반 질문', '기출형': '기출 유형' };
    var LEVELS = [['쉬움', '활동이 무엇이었는지, 왜 했는지 묻는 사실 확인 질문'], ['보통', '공개 기출 수준: 활동의 출발점이 된 교과 개념·과정 설명'],
      ['어려움', '원리·한계·다른 방법과 비교·조건 변경까지 깊게(고교 교육과정 안)'], ['단계별', '쉬운 질문부터 시작해 점점 어렵게']];
    var FOCUS = [['전공 개념 깊게', '전공(모집단위)과 이어지는 개념을 정확히 이해했는지 깊게 확인한다. 정의, 원리, 왜 그렇게 했는지를 묻는다.'],
      ['탐구 과정', '활동의 동기, 과정, 어려움, 해결, 결과를 차례로 묻는다. 무엇을 직접 했는지 구체적으로 말하게 한다.'],
      ['지원 동기·진로', '지원 동기와 진로 계획을 학생부 활동과 이어서 묻는다.'],
      ['인성·공동체', '협업, 갈등 해결, 배려, 리더십 경험을 학생부 근거로 묻는다.'],
      ['압박 면접', '답의 허점이나 근거가 약한 부분을 정중하지만 날카롭게 파고든다. 반대 상황을 가정해 묻는다.'],
      ['짧고 빠르게', '질문을 짧게 하고, 답도 1분 안으로 말하게 하는 연습이다.']];
    function draw() {
      B.innerHTML = '<div class="card row"><div><h2 style="margin:0">기본 질문</h2><p class="muted small" style="margin:4px 0 0">대학 자료의 평가 요소와 생기부 근거로 만듭니다. 근거 문장이 생기부에 그대로 없으면 버립니다. 확정한 질문만 면접에 나옵니다.</p></div><div class="spacer"></div>' +
        '</div>' +
        '<div class="card" style="margin-top:12px"><div class="row" style="margin-bottom:10px"><b>질문 구성</b><span class="muted small">만들기 전에 고릅니다. 바꾼 뒤에는 "다시 만들기"를 누르세요</span></div><div class="plan">' +
          '<div><span class="pl">생기부 질문</span><select id="pn">' + [4, 5, 6, 7, 8, 9, 10].map(function (k) { return '<option' + (k === +plan.n ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select><span class="small muted">개</span></div>' +
          '<div><span class="pl">고르는 방법</span>' + [['ai', 'AI에게 맡기기'], ['self', '직접 고르기(후보 두 배)']].map(function (o) { return '<button class="seg' + (plan.pick === o[0] ? ' on' : '') + '" data-pk="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
          '<div><span class="pl">일반 질문</span>' + [0, 1, 2].map(function (k) { return '<button class="seg' + (+plan.general === k ? ' on' : '') + '" data-pg="' + k + '">' + (k ? k + '개' : '넣지 않음') + '</button>'; }).join('') + '</div>' +
          '<div><span class="pl">기출 유형 질문</span>' + [0, 1, 2].map(function (k) { return '<button class="seg' + (+plan.past === k ? ' on' : '') + '" data-pp="' + k + '">' + (k ? k + '개' : '넣지 않음') + '</button>'; }).join('') + '</div>' +
          '</div><p class="small faint" style="margin:8px 0 0">일반 질문은 대학·교육청 자료의 공통 질문에서 고르고, 기출 유형 질문은 이 대학 공개 기출의 형식을 학생의 생기부 내용에 맞춰 만듭니다. 둘 다 출처가 함께 표시됩니다.</p></div>' +
        '<div class="card" style="margin-top:12px"><div class="row" style="margin-bottom:8px"><b>난이도</b><div class="spacer"></div><span class="small">질문 자료</span>' +
        [['official', '기출 중심'], ['recent', '기출 + 최근 후기']].map(function (m) { return '<button class="seg' + (plan.source_mode === m[0] ? ' on' : '') + '" data-sm="' + m[0] + '" aria-pressed="' + (plan.source_mode === m[0]) + '">' + m[1] + '</button>'; }).join('') +
        '</div><p class="small muted" style="margin:0 0 10px">최근 자료 ' + recent.count + '건(언론 ' + recent.counts['언론'] + ', 블로그 ' + recent.counts['블로그'] + ', 학생 후기 ' + recent.counts['학생 후기'] + '). 기출 + 최근 후기에서 더해집니다.</p><div class="row"><span class="muted small">대학이 밝힌 질문의 폭(사실 확인부터 활동의 출발점이 된 수업 내용까지)을 세 단계로 나눴습니다. 추가 질문도 같은 난이도로 나옵니다</span></div>' +
        '<div class="levels">' + LEVELS.map(function (l) { return '<button class="lvbtn' + (l[0] === level ? ' on' : '') + '" data-lv="' + l[0] + '"><b>' + l[0] + '</b><span>' + esc(l[1]) + '</span></button>'; }).join('') + '</div></div>' +
        '<div class="card" style="margin-top:12px"><div class="row" style="margin-bottom:8px"><b>이번 연습의 포커스</b><span class="muted small">기본 질문 만들기, 추가 질문, 연습 메모에 모두 반영합니다(선택)</span></div>' +
        '<div class="row" style="gap:6px;margin-bottom:8px">' + FOCUS.map(function (f, i) { return '<button class="btn ghost small fchip" data-f="' + i + '">' + esc(f[0]) + '</button>'; }).join('') + '</div>' +
        '<textarea id="focus" rows="2" placeholder="예: 정보 세특의 알고리즘 개념을 깊게 확인. 정의를 정확히 말하게 하고 시간 복잡도를 꼭 묻기">' + esc(focus) + '</textarea></div>' +
        '<div class="card row gen-bar"><span class="small muted">위 설정으로 질문을 ' + (qs.length ? '새로 ' : '') + '만듭니다. AI를 사용하며 20~40초 걸립니다.</span><div class="spacer"></div><button class="btn' + (qs.length ? '' : ' pri') + '" id="gen">' + (qs.length ? '다시 만들기' : 'AI로 기본 질문 만들기') + '</button></div>' +
        '<div class="card"><button class="btn" id="cardLoad">분석 카드로 질문 넣기</button><div id="cardChoices"></div></div><div id="qlist" class="grid" style="margin-top:16px"></div>' +
        (qs.length ? '<div class="card row" style="margin-top:16px"><button class="btn" id="addQ">+ 직접 추가</button><div class="spacer"></div><span class="muted small" id="cnt"></span><button class="btn pri" id="saveQ">확정하고 저장</button></div>' : '');
      var cardLoad = B.querySelector('#cardLoad');
      if (cardLoad) cardLoad.onclick = function () {
        cardLoad.disabled = true;
        api('/api/mentoring/' + app.id).then(function (data) {
          var root = B.querySelector('#cardChoices');
          root.innerHTML = '<p>저장된 예상 질문을 후보로 넣습니다. AI를 호출하지 않습니다. 상세가 없는 카드는 질문을 추가하지 않습니다.</p>' + cardSelection(data.cards, (data.latest || {}).card_ids || [], 'questionCard') + '<button class="btn" id="cardInsert">선택한 카드의 질문 넣기</button>';
          root.querySelector('#cardInsert').onclick = function () {
            var button = this; button.disabled = true;
            api('/api/questions/cards', { application_id: app.id, card_ids: checkedValues(root, 'questionCard'), questions: qs }).then(function (r) {
              qs = qs.concat(r.questions); draw(); toast('질문 후보 ' + r.questions.length + '개를 추가했습니다. 확정하고 저장하면 반영합니다.');
            }).catch(function (e) { button.disabled = false; toast(e.message, true); });
          };
          cardLoad.disabled = false;
        }).catch(function (e) { cardLoad.disabled = false; toast(e.message, true); });
      };
      var L = B.querySelector('#qlist');
      L.innerHTML = qs.map(function (q, i) {
        var on = q.status !== 'hidden';
        return '<div class="card qcard' + (on ? '' : ' off') + '"><div class="num">' + (i + 1) + '</div><div><div class="row" style="gap:6px;margin-bottom:6px">' +
          '<button class="chip lvchip lv-' + esc(q.level || '보통') + '" data-qlv="' + i + '" title="눌러서 난이도 바꾸기">' + esc(q.level || '보통') + '</button>' +
          '<span class="chip kind-' + esc(q.kind || '생기부') + '">' + esc(KIND[q.kind || '생기부'] || q.kind) + '</span>' + (q.recommend && plan.pick === 'self' && (q.kind || '생기부') === '생기부' ? '<span class="chip ok">AI 추천</span>' : '') +
          (q.type ? '<span class="chip">' + esc(q.type) + '</span>' : '') + (q.element ? '<span class="chip gray">' + esc(q.element) + '</span>' : '') + '</div>' +
          '<textarea rows="2" data-q="' + i + '">' + esc(q.question) + '</textarea>' + (q.quote ? '<div class="quote">생기부 근거: ' + esc(q.quote) + '</div>' : '') +
          (q.intent ? '<div class="small faint" style="margin-top:6px">확인하려는 것: ' + esc(q.intent) + '</div>' : '') +
          (q.ref && q.ref['질문'] ? '<div class="small faint" style="margin-top:6px">' + (q.kind === '기출형' ? '참고한 기출(' + esc(q.ref['학년도'] || '') + ' ' + esc(q.ref['계열'] || '') + '): ' : '원래 질문: ') + esc(q.ref['질문']) + (q.ref['출처 이름'] ? '<br>출처: ' + esc(q.ref['출처 이름']) : '') + '</div>' : '') + '</div>' +
          '<div class="tools"><button data-up="' + i + '" title="위로" aria-label="위로">▲</button><button data-dn="' + i + '" title="아래로" aria-label="아래로">▼</button><button data-tg="' + i + '" title="' + (on ? '빼기' : '넣기') + '" aria-label="' + (on ? '이 질문 빼기' : '이 질문 다시 넣기') + '">' + (on ? '✕' : '↺') + '</button></div></div>';
      }).join('');
      var cnt = B.querySelector('#cnt'); if (cnt) cnt.textContent = '면접에 쓸 질문 ' + qs.filter(function (q) { return q.status !== 'hidden'; }).length + '개';
      L.querySelectorAll('[data-q]').forEach(function (t) { var fit = function () { if (t.style) { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; } }; fit(); t.oninput = function () { qs[+t.dataset.q].question = t.value; fit(); }; });
      L.querySelectorAll('[data-up]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.up; if (i > 0) { var t = qs[i]; qs[i] = qs[i - 1]; qs[i - 1] = t; draw(); } }; });
      L.querySelectorAll('[data-dn]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.dn; if (i < qs.length - 1) { var t = qs[i]; qs[i] = qs[i + 1]; qs[i + 1] = t; draw(); } }; });
      L.querySelectorAll('[data-qlv]').forEach(function (b) { b.onclick = function () { var q = qs[+b.dataset.qlv], o = ['쉬움', '보통', '어려움']; q.level = o[(o.indexOf(q.level || '보통') + 1) % 3]; draw(); }; });
      B.querySelectorAll('[data-sm]').forEach(function (b) { b.onclick = function () { plan.source_mode = b.dataset.sm; draw(); }; });
      B.querySelectorAll('[data-pk]').forEach(function (b) { b.onclick = function () { plan.pick = b.dataset.pk; draw(); }; });
      B.querySelectorAll('[data-pg]').forEach(function (b) { b.onclick = function () { plan.general = +b.dataset.pg; draw(); }; });
      B.querySelectorAll('[data-pp]').forEach(function (b) { b.onclick = function () { plan.past = +b.dataset.pp; draw(); }; });
      var pn = B.querySelector('#pn'); if (pn) pn.onchange = function () { plan.n = +pn.value; };
      B.querySelectorAll('[data-lv]').forEach(function (b) { b.onclick = function () { level = b.dataset.lv; draw(); if (qs.length) toast('"다시 만들기"를 누르면 ' + level + ' 난이도로 질문을 새로 만듭니다'); }; });
      L.querySelectorAll('[data-tg]').forEach(function (b) { b.onclick = function () { var q = qs[+b.dataset.tg]; q.status = q.status === 'hidden' ? 'confirmed' : 'hidden'; draw(); }; });
      var fx = B.querySelector('#focus');
      fx.oninput = function () { focus = fx.value; };
      fx.onblur = function () { api('/api/focus', { application_id: app.id, focus: focus }); };
      B.querySelectorAll('.fchip').forEach(function (b) { b.onclick = function () { var t = FOCUS[+b.dataset.f][1]; focus = (focus.trim() ? focus.trim() + ' ' : '') + t; fx.value = focus; api('/api/focus', { application_id: app.id, focus: focus }); }; });
      B.querySelector('#gen').onclick = function () {
        L.innerHTML = '<div class="card loading"><span class="spin"></span>대학 자료와 생기부로 기본 질문을 만드는 중입니다(20~40초)…</div>';
        api('/api/questions/generate', { application_id: app.id, focus: focus, level: level, n: plan.n, pick: plan.pick, general: plan.general, past: plan.past, source_mode: plan.source_mode }).then(function (r) {
          qs = r.questions.map(function (q) { return { type: q.type, element: q.element, question: q.question, quote: q.quote, intent: q.intent, kind: q.kind || '생기부', ref: q.ref || null, recommend: q.recommend,
            level: ['쉬움', '보통', '어려움'].indexOf(q.level) >= 0 ? q.level : (level === '단계별' ? '보통' : level), status: q.recommend === false ? 'hidden' : 'confirmed' }; });
          if (plan.pick === 'self') toast('AI 추천 질문을 미리 골라 두었습니다. ✕와 ↺로 넣고 빼세요');
          draw(); toast('질문 ' + qs.length + '개를 만들었습니다' + (r.dropped ? ' (근거가 맞지 않아 ' + r.dropped + '개 버림)' : ''));
        }).catch(function (e) { toast(e.message, true); draw(); });
      };
      fx.value = focus;
      var add = B.querySelector('#addQ'); if (add) add.onclick = function () { qs.push({ type: '직접', element: '', question: '', quote: '', intent: '', level: level === '단계별' ? '보통' : level, status: 'confirmed' }); draw(); };
      var sv = B.querySelector('#saveQ'); if (sv) sv.onclick = function () {
        var list = qs.filter(function (q) { return q.question.trim(); });
        api('/api/questions/save', { application_id: app.id, questions: list, level: level, source_mode: plan.source_mode }).then(function () { toast('저장했습니다'); prep(d.student.id, 3, app.id); });
      };
    }
    draw();
  }

  // ── 면접 ──
  var IV = { active: false };
  var LINES = {
    open: function (a) { return a.univ + ' ' + (a.unit || '') + ' 면접 연습을 시작하겠습니다.'; },
    guide: '질문을 듣고 준비가 되면 답변을 시작해 주세요. 답할 때 이름과 학교 이름은 말하지 않습니다.',
    closing: '마지막으로 하고 싶은 말이 있으면 해 주세요.',
    ack: ['네, 잘 들었습니다.', '네, 알겠습니다.', '네.'],
    nextQ: '다음 질문입니다.',
    follow: '하나 더 묻겠습니다.',
    moveOn: '다음 질문으로 넘어가겠습니다.',
    end: '면접을 마치겠습니다. 수고하셨습니다.'
  };

  function interview(aid) {
    document.body.classList.add('iv');
    api('/api/session/start', { application_id: aid }).then(function (r) {
      Object.assign(IV, { active: true, sid: r.session_id, app: r.application, qs: r.questions, set: r.settings, about: r.about || {}, idx: -1, cur: null, alts: [], follows: 0, last: null, phase: 'intro', answered: 0, ending: false, finishRequested: false, inflight: [], skippedSet: {}, token: 0, redoBusy: false, redoPromise: null, starting: false, moveT: null,
        coachOpen: false, pausedAt: 0, pauseTotal: 0, coachDeferred: [], coach: { logs: [], used: 0, limit: r.settings.coach_limit, remaining: r.settings.coach_limit, draft: '', message: '', busy: false } });
      ivRender();
      var qLines = IV.qs.map(function (q, i) { return (i > 0 ? LINES.nextQ + ' ' : '') + q.question; });
      prefetch(qLines.slice(0, 1).concat(LINES.ack, qLines.slice(1), [LINES.moveOn, LINES.closing, LINES.end]));   // 1번 질문을 먼저 만들어 둔다(실시간 재생 중 끊김 방지)
      // 마이크를 먼저 켜고 인사한다. 아이폰은 마이크가 켜질 때 소리 장치를 바꾸므로, 인사 도중에 켜면 잡음이 난다(교사 지적 2026-10-24)
      var sid0 = IV.sid, greet = function () { if (IV.active && IV.sid === sid0 && IV.phase === 'intro') speak(LINES.open(IV.app) + ' ' + LINES.guide); };
      openMic().then(function () { setTimeout(greet, 400); }, function (e) { toast('마이크를 쓸 수 없습니다: ' + e.message, true); greet(); });
    }).catch(function (e) { toast(e.message, true); history.back(); });
  }
  IV.stop = function () {
    cancelCoachRecording(); IV.coachOpen = false; IV.coachDeferred = [];
    IV.active = false; shush(); clearTimeout(IV.moveT);
    if (IV.mr && IV.mr.state !== 'inactive') try { IV.mr.stop(); } catch (e) {}
    if (IV.stream) IV.stream.getTracks().forEach(function (t) { t.stop(); }); IV.stream = null;
    if (MIC.src) { try { MIC.src.disconnect(); } catch (e) {} MIC.src = null; }
    clearInterval(IV.tick); cancelAnimationFrame(IV.raf);
  };

  function openMic() {
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function (st) {
      IV.stream = st;
      // 소리 크기 측정 장치는 하나만 만들어 다시 쓴다(면접마다 새로 만들면 아이폰에서 소리 장치가 늘어난다, 2026-10-24)
      if (!MIC.ac || MIC.ac.state === 'closed') { MIC.ac = new (window.AudioContext || window.webkitAudioContext)(); MIC.an = MIC.ac.createAnalyser(); MIC.an.fftSize = 512; }
      if (MIC.src) try { MIC.src.disconnect(); } catch (e) {}
      if (MIC.ac.state !== 'running') try { MIC.ac.resume(); } catch (e) {}
      MIC.src = MIC.ac.createMediaStreamSource(st); MIC.src.connect(MIC.an); IV.an = MIC.an;
    });
  }
  var MIC = { ac: null, an: null, src: null };
  function ttsUrl(t, v) { return '/api/tts?v=' + encodeURIComponent(v || (IV.set && IV.set.tts_voice) || '') + '&text=' + encodeURIComponent(t); }
  var AC = null, PLAY = { n: 0, srcs: [], cur: null, endAt: 0 };
  // 목소리와 같은 24kHz로 연다. 조각마다 48kHz로 따로 바뀌며 경계에서 '틱' 소리가 나던 것을 막는다(교사 지적 2026-10-23)
  // 다른 앱으로 갔다 오거나(블루투스 도어 앱 등) 소리 장치가 바뀌면 아이폰이 재생 장치를 멈췄다 다시 붙인다. 그대로 계속 쓰면 잡음이 남을 수 있어
  // '새로 만들 것'으로 표시해 두고, 아이폰이 허용하는 버튼 누름(gesture) 때 새로 만든다(교사 지적 2026-10-24)
  var AC_STALE = false;
  function acStale() { AC_STALE = true; }
  function actx(gesture) {
    var C = window.AudioContext || window.webkitAudioContext;
    if (AC && (AC.state === 'closed' || (gesture && AC_STALE))) { var old = AC; AC = null; shush(); try { old.close(); } catch (e) {} }
    if (gesture) AC_STALE = false;
    if (!AC) {
      try { AC = new C({ sampleRate: 24000, latencyHint: 'playback' }); } catch (e) { try { AC = new C({ sampleRate: 24000 }); } catch (e2) { AC = new C(); } }
      AC.onstatechange = function () { if (this === AC && this.state === 'interrupted') acStale(); };
    }
    if (AC.state === 'suspended' || AC.state === 'interrupted') try { AC.resume(); } catch (e) {}
    // 마이크 음량 측정 장치도 버튼을 누를 때 깨운다. 아이폰은 버튼 밖에서 만든 장치가 멈춘 채로 남아 음량 막대가 움직이지 않는다(Argon 검토 2026-10-25)
    if (gesture && MIC.ac && MIC.ac.state !== 'running' && MIC.ac.state !== 'closed') try { MIC.ac.resume(); } catch (e) {}
    return AC;
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) acStale(); else if (AC) actx(); });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange', acStale);
  function setTalk(on) { var a = document.querySelector('.iver .av'); if (a) a.classList.toggle('talk', on); }
  // 24kHz 16비트 PCM을 받아 오는 대로 이어 재생한다(첫 소리가 빨리 나온다)
  // 24kHz 16비트 PCM을 받아 오는 대로 재생한다. 조각을 0.3초 이상 모아 한 번에 예약하고, 끊겼다 이어지는 곳은 짧게 줄였다 키워 '틱' 소리를 없앤다
  function playTTS(t, v) {
    shush();
    var my = ++PLAY.n, ctx = actx(), at = ctx.currentTime + 0.08, carry = null, pend = [], pendLen = 0, MIN = 24000 * 2 * 0.3, fresh = true;
    setTalk(true);
    function flush(last) {
      if (!pendLen || (!last && pendLen < MIN)) return;
      var b = new Uint8Array(pendLen), o = 0; pend.forEach(function (x) { b.set(x, o); o += x.length; }); pend = []; pendLen = 0;
      var n = b.length / 2, buf = ctx.createBuffer(1, n, 24000), ch = buf.getChannelData(0), dv = new DataView(b.buffer, b.byteOffset, b.length);
      for (var i = 0; i < n; i++) ch[i] = dv.getInt16(i * 2, true) / 32768;
      var gap = at < ctx.currentTime;
      if (gap) { at = ctx.currentTime + 0.1; MIN = 24000 * 2 * 0.8; }   // 끊겼으면 이 말의 나머지는 0.8초씩 모아 재생한다(전원 부족·전파 간섭 대비)
      var fade = Math.min(120, n);                 // 5ms
      if (fresh || gap) for (i = 0; i < fade; i++) ch[i] *= i / fade;
      if (last) for (i = 0; i < fade; i++) ch[n - 1 - i] *= i / fade;
      fresh = false;
      var src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
      src.start(at); at += buf.duration; PLAY.srcs.push(src); PLAY.endAt = at;
    }
    if (PLAY.ctl) try { PLAY.ctl.abort(); } catch (e) {}
    var ctl = PLAY.ctl = (window.AbortController ? new AbortController() : null);
    var ttsTimer = setTimeout(function () { if (ctl) ctl.abort(); }, 30000);   // 서버가 끊지 않아도 30초 뒤에는 멈춘다(2026-10-24)
    return PLAY.cur = fetch(ttsUrl(t, v), ctl ? { signal: ctl.signal } : {}).then(function (r) {
      if (!r.ok || !r.body) throw new Error('목소리를 만들지 못했습니다');
      var rd = r.body.getReader();
      function pump() {
        return rd.read().then(function (x) {
          if (my !== PLAY.n) { try { rd.cancel(); } catch (e) {} return; }
          if (x.done) { clearTimeout(ttsTimer); flush(true); setTimeout(function () { if (my === PLAY.n) setTalk(false); }, Math.max(0, (at - ctx.currentTime) * 1000)); return; }
          var b = x.value;
          if (carry) { var m = new Uint8Array(carry.length + b.length); m.set(carry); m.set(b, carry.length); b = m; carry = null; }
          if (b.length % 2) { carry = b.slice(b.length - 1); b = b.slice(0, b.length - 1); }
          if (b.length) { pend.push(b); pendLen += b.length; flush(false); }
          return pump();
        });
      }
      return pump();
    }).catch(function (e) { clearTimeout(ttsTimer); if (my !== PLAY.n) return; setTalk(false); throw e; });   // 새 목소리로 바뀌어 끊긴 이전 요청은 오류로 보지 않는다
  }
  // 긴 답은 문장으로 나눠 첫 문장부터 말한다. 나머지 문장은 그동안 서버에서 미리 만들어 둔다(교사 요청 2026-10-23)
  function sentences(text) {
    var parts = String(text || '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?。])\s+/), out = [];
    parts.forEach(function (x) { if (out.length && (out[out.length - 1].length < 25 || x.length < 12)) out[out.length - 1] += ' ' + x; else if (x) out.push(x); });
    return out;
  }
  function speakParts(text, v) {
    var list = sentences(text);
    if (list.length < 2) return playTTS(text, v);
    list.slice(1).forEach(function (t) { fetch(ttsUrl(t, v)).then(function (r) { return r.arrayBuffer(); }).catch(function () {}); });
    var i = 0;
    function next() {
      if (i >= list.length) return Promise.resolve();
      return playTTS(list[i++], v).then(function () {
        var my = PLAY.n, rest = AC ? Math.max(0, PLAY.endAt - AC.currentTime) : 0;
        return new Promise(function (r) { setTimeout(r, rest * 1000); }).then(function () { if (my === PLAY.n) return next(); });
      });
    }
    return next();
  }
  // 목소리가 실패하면 한 번 더 시도하고, 그래도 안 되면 빨간 오류 대신 조용히 안내한다(질문 글은 화면에 있다)
  function speak(t) {
    if (!(IV.set && IV.set.speak)) return;
    var p1 = playTTS(t), n = PLAY.n, n2 = null;          // playTTS가 재생 번호를 올리므로 호출 직후의 번호를 잡는다(2026-10-24 Codex 검토)
    p1.catch(function () { if (PLAY.n !== n) return; var p2 = playTTS(t); n2 = PLAY.n; return p2; })
      .catch(function () { if (PLAY.n !== n2) return; setTalk(false); toast('이번 질문은 목소리 없이 화면의 글로 읽어 주세요'); });
  }
  // 맞장구처럼 재생 중인 말이 끝난 뒤에 읽는다(최대 4초 기다림). 그 사이 다른 말이 시작되면 읽지 않는다
  function speakAfter(t) {
    var n0 = PLAY.n, wait = PLAY.cur ? PLAY.cur.catch(function () {}) : Promise.resolve();
    Promise.race([wait, new Promise(function (r) { setTimeout(r, 4000); })]).then(function () {
      var rest = AC ? Math.max(0, Math.min(3, PLAY.endAt - AC.currentTime)) : 0;
      setTimeout(function () { if (PLAY.n === n0) speak(t); }, rest * 1000 + 150);
    });
  }
  function shush() { if (PLAY.ctl) { try { PLAY.ctl.abort(); } catch (e) {} PLAY.ctl = null; } PLAY.n++; PLAY.srcs.forEach(function (x) { try { x.stop(); } catch (e) {} }); PLAY.srcs = []; setTalk(false); }
  function prefetch(list) {
    var q = list.slice();
    (function next() { var t = q.shift(); if (!t || !IV.active) return; fetch(ttsUrl(t)).then(function (r) { return r.arrayBuffer(); }).catch(function () {}).then(next); })();
  }

  // 근거 → "출처: 문서 이름 쪽 (종류)". 학생이 대기 중에 원문을 찾아볼 수 있게
  function srcLine(x, A) {
    var g = x && x['근거']; if (!g) return '';
    var s = ((A || IV.about || {})['출처'] || []).filter(function (y) { return y.id === g['출처']; })[0];
    if (!s) return '';
    var name = String(s['이름'] || '').replace(/\s*\((?:입학처|비교용|2027과 비교용|대조용)[^)]*\)\s*/g, ' ').trim();
    var kind = s['종류'] || '';
    return (kind.indexOf('공식') === 0 || kind.indexOf('공공') === 0 ? '출처: ' : '출처(비공식): ') + name + (g['쪽'] ? ' ' + g['쪽'] + '쪽' : '') +
      (kind.indexOf('공식') === 0 || kind.indexOf('공공') === 0 ? '' : (s['게시일'] ? ' · ' + String(s['게시일']).slice(0, 10) : ''));
  }
  function introCard() {
    var A = IV.about || {}, iv = A['면접'] || {};
    var first = function (v) { v = String(val(v) || ''); var m = v.match(/^[^.]*?(?:\.|$)/); return (m ? m[0] : v).replace(/\.$/, '').trim(); };
    var mode = [first(iv['유형']), first(iv['방식']), iv['면접위원'] ? '면접위원 ' + first(iv['면접위원']) : '', first(iv['시간']) ? '시간 ' + first(iv['시간']) : ''].filter(Boolean).join(' · ');
    var els = (A['평가 요소'] || []).map(function (e) { return e['이름']; }).filter(Boolean).join(' · ');
    var feat = (A['학교 특징'] || []).slice(0, 2).map(function (x) { var sl = srcLine(x, A); return '<li>' + esc(x['내용'] || x) + (sl ? ' <span class="tipsrc">' + esc(sl) + '</span>' : '') + '</li>'; }).join('');
    var tips = (A['면접 팁'] || []).filter(function (x) { return !x['비공식']; }).slice(0, 3).map(function (x) { var sl = srcLine(x, A); return '<li>' + esc(x['내용'] || x) + (sl ? ' <span class="tipsrc">' + esc(sl) + '</span>' : '') + '</li>'; }).join('');
    if (!mode && !els && !feat && !tips) return '';
    return '<div class="about">' + (mode || els ? '<div><h4>면접 방식</h4><p>' + esc(mode) + '</p>' + (els ? '<p class="faint">평가 요소: ' + esc(els) + '</p>' : '') + '</div>' : '') +
      (feat ? '<div><h4>' + esc(A['대학'] || '') + ' 알아 두기</h4><ul>' + feat + '</ul></div>' : '') + (tips ? '<div><h4>면접 팁</h4><ul>' + tips + '</ul></div>' : '') + '</div>';
  }

  function nextBase(after) {
    if (IV.coachOpen) { IV.coachDeferred.push(nextBase); return; }
    if (IV.redoBusy || IV.ending) return;
    clearTimeout(IV.moveT);
    IV.idx += 1; IV.follows = 0; IV.alts = [];
    if (IV.idx < IV.qs.length) { var q = IV.qs[IV.idx]; IV.cur = { text: q.question, source: 'base', qid: q.id }; }
    else if (IV.idx === IV.qs.length) IV.cur = { text: LINES.closing, source: 'closing', qid: 0 };
    else return finish();
    IV.phase = 'question'; ivRender(); (after === true ? speakAfter : speak)((IV.idx > 0 && IV.cur.source === 'base' ? LINES.nextQ + ' ' : '') + IV.cur.text);
  }

  function ivRender() {
    if (IV.coachOpen) return;
    var a = IV.app, total = IV.qs.length;
    var dots = IV.qs.map(function (q, i) { return '<i class="' + (i < IV.idx ? 'done' : i === IV.idx ? 'cur' : '') + '"></i>'; }).join('');
    var label = !IV.cur ? '' : IV.cur.source === 'follow' ? '<span class="qlabel follow">추가 질문</span>' : IV.cur.source === 'closing' ? '<span class="qlabel">마지막 질문</span>' : '<span class="qlabel">질문 ' + (IV.idx + 1) + ' / ' + total + (IV.qs[IV.idx] && IV.qs[IV.idx].level ? ' · ' + esc(IV.qs[IV.idx].level) : '') + (IV.qs[IV.idx] && IV.qs[IV.idx].kind === '일반' ? ' · 일반 질문' : IV.qs[IV.idx] && IV.qs[IV.idx].kind === '기출형' ? ' · 기출 유형' : '') + '</span>';
    var stage;
    if (IV.phase === 'intro') {
      stage = '<div class="iver"><span class="av"><svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></span>면접관</div>' +
        '<div class="qtext">' + esc(LINES.open(a)) + '</div><p class="muted" style="font-size:20px;margin-top:18px;max-width:900px">' + esc(LINES.guide) + '</p>' + introCard() +
        '<div class="iv-state"><button class="btn pri big" id="go">면접 시작</button><span class="hint"><kbd>Space</kbd> 답변 시작·끝 · <kbd>→</kbd> 다음 기본 질문 · <kbd>Esc</kbd> 끝내기</span></div>';
    } else if (IV.phase === 'done') {
      stage = '<div class="closing">' + esc(LINES.end) + '</div><div class="iv-state"><div class="loading"><span class="spin"></span>연습 메모를 쓰고 있습니다…</div></div>';
    } else {
      stage = '<div class="iver"><span class="av"><svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></span>면접관</div>' + label +
        '<div class="qtext">' + esc(IV.cur.text) + '</div><div class="iv-state" id="ivState"></div>' +
        (IV.phase === 'question' && IV.cur.source === 'follow' && IV.alts.length > 1 ? '<div class="alts noprint">' + IV.alts.map(function (f, i) { return f.question === IV.cur.text ? '' : '<button data-alt="' + i + '">다른 추가 질문: ' + esc(f.question) + '</button>'; }).join('') + '</div>' : '');
    }
    var bottom = '<div class="iv-bottom">' + (IV.last ? '<div class="lastans"><b>방금 답(받아 적은 글)</b> · ' + Math.round(IV.last.seconds || 0) + '초' + (IV.last.ms ? ' · 정리 ' + (IV.last.ms / 1000).toFixed(1) + '초' : '') + '<br>' + esc(IV.last.transcript || '(들리지 않음)') + '</div>' : '') +
      '<div class="ctrl noprint">' + (IV.phase === 'question' && IV.last ? '<button class="btn" id="redo">다시 답하기</button>' : '') +
      (IV.phase === 'question' && IV.cur && IV.cur.source !== 'closing' ? '<button class="btn" id="skip">다음 기본 질문 →</button>' : '') +
      '<button class="btn" id="coachOpen"' + (!IV.cur || IV.phase === 'recording' || IV.starting || IV.redoBusy ? ' disabled' : '') + '>코치에게 묻기 <kbd>C</kbd></button>' +
      '<button class="btn" id="spk">' + (IV.set.speak ? '🔊 질문 읽기 켬' : '🔈 질문 읽기 끔') + '</button><button class="btn danger" id="end">면접 끝내기</button></div></div>';
    V.innerHTML = '<div class="iv-wrap"><div class="iv-top"><div class="t">당곡 AI 모의 면접<span>' + esc(a.univ) + ' · ' + esc(a.unit || a.track) + '</span></div><div class="dots">' + dots + '</div></div>' +
      '<div class="iv-stage">' + stage + '</div>' + (IV.phase === 'done' ? '' : bottom) + '</div>';
    var go = document.getElementById('go'); if (go) go.onclick = function () { actx(true); nextBase(); };
    var st = document.getElementById('ivState'); if (st) drawState(st);
    V.querySelectorAll('[data-alt]').forEach(function (b) { b.onclick = function () { IV.cur.text = IV.alts[+b.dataset.alt].question; ivRender(); speak(IV.cur.text); }; });
    var redo = document.getElementById('redo'); if (redo) redo.onclick = redoLast;
    var skip = document.getElementById('skip'); if (skip) skip.onclick = function () { nextBase(); };
    // 학생은 이 회차에서만 켜고 끈다(선생님 설정을 바꾸지 않는다, Argon 검토 2026-10-25). 선생님은 설정에도 저장한다
    var spk = document.getElementById('spk'); if (spk) spk.onclick = function () { IV.set.speak = !IV.set.speak; if (ROLE !== 'student') api('/api/settings', { speak: IV.set.speak }).catch(function () {}); if (!IV.set.speak) shush(); ivRender(); };
    var end = document.getElementById('end'); if (end) end.onclick = function () { if (confirm('면접을 끝내고 연습 메모를 만들까요?')) finish(); };
    var coachButton = document.getElementById('coachOpen'); if (coachButton) coachButton.onclick = openCoach;
  }

  // 코치 패널이 열린 시간은 답변·대기 시간에서 제외한다.
  function ivNow() { return (IV.coachOpen ? IV.pausedAt : Date.now()) - (IV.pauseTotal || 0); }
  function afterCoach(fn) { if (IV.coachOpen) IV.coachDeferred.push(fn); else fn(); }
  function scheduleMove() {
    clearTimeout(IV.moveT);
    var at = ivNow() + 900;
    IV.moveT = setInterval(function () {
      if (IV.coachOpen || ivNow() < at) return;
      clearInterval(IV.moveT);
      if (!IV.ending && IV.active) nextBase(true);   // "다음 질문으로 넘어가겠습니다"가 끝난 뒤 읽는다
    }, 50);
  }
  function openCoach() {
    if (!IV.active || IV.ending || !IV.cur || IV.starting || IV.redoBusy || IV.phase === 'recording' || IV.phase === 'done' || IV.coachOpen) return;
    IV.pausedAt = Date.now(); IV.coachOpen = true; shush();
    var wrap = V.querySelector('.iv-wrap'); wrap.classList.add('coach-open'); wrap.inert = true;
    var panel = document.createElement('aside'); panel.id = 'coachPanel'; panel.className = 'coach-panel';
    panel.setAttribute('aria-label', '면접관 코치'); V.appendChild(panel); coachDraw();
    var c = IV.coach, sid = IV.sid, version = c.version || 0;
    if (!c.busy) api('/api/coach/state', { session_id: sid }).then(function (r) {
      if (!IV.active || IV.sid !== sid || c !== IV.coach || version !== (c.version || 0)) return;
      Object.assign(c, r); coachDraw();
    }).catch(function (e) { if (c === IV.coach) { c.message = e.message; coachDraw(); } });
    var input = panel.querySelector('textarea'); if (input) input.focus(); else panel.querySelector('#coachClose').focus();
  }
  function cancelCoachRecording() {
    var c = IV.coach; if (!c) return;
    c.micToken = (c.micToken || 0) + 1;
    if (c.mr) { c.mr.onstop = null; if (c.mr.state !== 'inactive') c.mr.stop(); c.mr = null; }
    if (c.stream && c.stream !== IV.stream) c.stream.getTracks().forEach(function (t) { t.stop(); });   // 면접 마이크를 함께 쓴 경우에는 끄지 않는다
    c.stream = null; c.recording = false; c.micPending = false;
  }
  function closeCoach() {
    if (!IV.coachOpen) return;
    cancelCoachRecording(); shush();
    IV.pauseTotal += Date.now() - IV.pausedAt; IV.coachOpen = false;
    var tasks = IV.coachDeferred.splice(0); ivRender();
    tasks.forEach(function (fn) { if (IV.active && !IV.ending) fn(); });
    var b = document.getElementById('coachOpen'); if (b) b.focus();
  }
  function coachDraw() {
    var panel = document.getElementById('coachPanel'), c = IV.coach;
    if (!IV.coachOpen || !panel) return;
    var focused = panel.contains(document.activeElement) ? document.activeElement.id : '', caret = focused === 'coachAsk' ? document.activeElement.selectionStart : null;
    var locked = c.busy || c.recording || c.micPending || !c.remaining;
    panel.innerHTML = '<div class="row"><h2 id="coachTitle">면접관 코치</h2><div class="spacer"></div><button class="btn" id="coachClose">닫기</button></div>' +
      '<p class="small muted">면접이 일시 정지되었습니다. 패널을 닫으면 이어집니다. 답 문장 대신 질문의 의도와 답하는 순서를 안내합니다.</p>' +
      '<p class="small">코치 질문 ' + c.used + ' / ' + c.limit + '회</p>' +
      '<div class="coach-messages" aria-live="polite">' + c.logs.map(function (x) { return '<article><p class="small muted">질문 ' + x.question_no + ' · ' + (x.mode === 'voice' ? '음성' : '텍스트') + '</p><p><b>학생</b><br>' + esc(x.ask) + '</p><p><b>코치</b><br>' + esc(x.reply) + '</p></article>'; }).join('') + '</div>' +
      '<p class="small" role="status">' + esc(c.message || (c.busy ? '코치 도움말을 준비하고 있습니다.' : '')) + '</p>' +
      (!c.remaining ? '<p>' + (c.limit ? '이 회차의 코치 질문 수를 모두 사용했습니다.' : '코치 기능이 꺼져 있습니다.') + '</p>' :
        '<form id="coachForm"><label class="f">코치에게 물을 내용<textarea id="coachAsk" maxlength="2000" rows="3"' + (locked ? ' disabled' : '') + '>' + esc(c.draft) + '</textarea></label>' +
        '<div class="row"><button class="btn pri" type="submit"' + (locked ? ' disabled' : '') + '>질문 보내기</button><button class="btn" type="button" id="coachVoice"' + (c.busy || c.micPending ? ' disabled' : '') + '>' + (c.recording ? '녹음 끝내기' : c.micPending ? '마이크 연결 중입니다' : '말로 묻기') + '</button></div></form>') +
      (c.recording ? '<p role="status">질문을 녹음하고 있습니다. 다시 누르면 녹음을 마칩니다.</p>' : '') + '<p class="small muted">닫기: Esc · 입력란 밖에서 C</p>';
    panel.querySelector('#coachClose').onclick = closeCoach;
    var form = panel.querySelector('#coachForm');
    if (form) {
      form.querySelector('textarea').oninput = function (e) { c.draft = e.target.value; };
      form.onsubmit = function (e) { e.preventDefault(); if (!locked && c.draft.trim()) sendCoach(c.draft, null); };
      form.querySelector('#coachVoice').onclick = coachVoice;
    }
    var log = panel.querySelector('.coach-messages'); log.scrollTop = log.scrollHeight;
    var target = focused && document.getElementById(focused); if (target && !target.disabled) { target.focus(); if (caret != null) target.setSelectionRange(caret, caret); }
  }
  function sendCoach(ask, blob) {
    var c = IV.coach, sid = IV.sid;
    if (c.busy || !c.remaining) return;
    c.version = (c.version || 0) + 1;
    c.busy = true; c.message = blob ? '질문을 받아 적고 코치 도움말을 준비하고 있습니다.' : '코치 도움말을 준비하고 있습니다.'; coachDraw();
    var b = { session_id: sid, base_qid: IV.cur.qid || 0, source: IV.cur.source, question: IV.cur.text, ask: ask };
    var req = blob ? api('/api/coach/voice?' + new URLSearchParams(b).toString(), blob, { raw: true, headers: { 'Content-Type': blob.type } }) : api('/api/coach', b);
    c.pending = req.then(function (r) {
      if (!IV.active || IV.sid !== sid || c !== IV.coach) return;
      Object.assign(c, r); c.message = r.redirect || r.message || ''; if (!r.limited) c.draft = ''; coachDraw();
      if (blob && r.reply && IV.coachOpen && !c.recording) speakParts(r.reply).catch(function () {
        if (IV.active && IV.sid === sid && c === IV.coach && IV.coachOpen) { c.message = '목소리를 재생하지 못했습니다. 도움말은 글로 확인할 수 있습니다.'; coachDraw(); }
      });
    }).catch(function (e) {
      if (IV.active && IV.sid === sid && c === IV.coach) c.message = e.message;
    }).then(function () { c.busy = false; if (c === IV.coach) coachDraw(); });
    return c.pending;
  }
  function coachVoice() {
    var c = IV.coach;
    if (c.recording) { c.mr.stop(); c.recording = false; c.micPending = true; coachDraw(); return; }
    if (c.busy || c.micPending || !c.remaining) return;
    actx(true); shush(); c.micPending = true; c.message = '';
    var token = c.micToken = (c.micToken || 0) + 1; coachDraw();
    // 면접 마이크가 켜져 있으면 그대로 쓴다. 새로 열면 아이폰이 소리 장치를 한 번 더 바꾼다(2026-10-24)
    var shared = micLive(), stopTracks = function (stream) { if (!shared) stream.getTracks().forEach(function (t) { t.stop(); }); };
    (shared ? Promise.resolve(IV.stream) : navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })).then(function (stream) {
      if (!IV.active || c !== IV.coach || !IV.coachOpen || token !== c.micToken) { stopTracks(stream); return; }
      c.stream = stream;
      var mime = (IS_SAFARI ? ['audio/mp4', 'audio/webm'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']).filter(function (m) { return window.MediaRecorder && MediaRecorder.isTypeSupported(m); })[0] || '';
      var mr = c.mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : {}), chunks = [];
      mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      mr.onerror = function () { cancelCoachRecording(); c.busy = false; c.message = '녹음을 마치지 못했습니다. 다시 녹음할 수 있습니다.'; coachDraw(); };
      mr.onstop = function () {
        stopTracks(stream); c.stream = null; c.mr = null; c.recording = false; c.micPending = false;
        if (IV.active && c === IV.coach && IV.coachOpen && token === c.micToken) sendCoach('', new Blob(chunks, { type: (mr.mimeType || 'audio/webm').split(';')[0] }));
      };
      mr.start(); c.recording = true; c.micPending = false; coachDraw();
    }).catch(function (e) {
      if (c !== IV.coach || token !== c.micToken) return;
      cancelCoachRecording(); c.message = '마이크를 사용할 수 없습니다: ' + e.message; coachDraw();
    });
  }

  function drawState(el) {
    if (IV.phase === 'question') {
      el.innerHTML = '<button class="btn pri big" id="rec">● 답변 시작</button><span class="hint"><kbd>Space</kbd>로도 시작합니다. 생각할 시간을 가져도 됩니다.</span>';
      el.querySelector('#rec').onclick = startRec;
    } else if (IV.phase === 'recording') {
      el.innerHTML = '<div class="rec"><span class="dot"></span><span id="tm">0:00</span></div><div class="meter"><i id="lv"></i></div><div class="limit" id="lim"><i></i></div>' +
        '<button class="btn pri big" id="stop">■ 답변 끝</button><span class="hint"><kbd>Space</kbd>로도 끝냅니다 · 권장 ' + IV.set.answer_limit + '초 안</span>';
      el.querySelector('#stop').onclick = stopRec;
    } else if (IV.phase === 'processing') {
      el.innerHTML = '<div class="memoing"><span class="pen">✎</span>면접관이 메모하고 있습니다 <span class="faint" id="pt"></span></div>' +
        (IV.liveText ? '<div class="livetx">' + esc(IV.liveText) + '</div>' : '');
    }
  }

  var IS_SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.userAgent);
  function micLive() { var t = IV.stream && IV.stream.getAudioTracks()[0]; return t && t.readyState === 'live' && t.enabled && !t.muted; }
  function startRec() {
    if (!IV.active || IV.coachOpen || IV.ending || IV.finishRequested || IV.starting || IV.redoBusy || IV.phase !== 'question') return;
    actx(true);                                // 아이폰은 버튼을 누를 때 소리 장치를 깨워야 한다(멈췄던 장치는 여기서 새로 만든다)
    if (!micLive()) {
      IV.stream = null; IV.starting = true; var sid0 = IV.sid;
      return openMic().then(function () { IV.starting = false; if (IV.active && !IV.ending && sid0 === IV.sid && IV.phase === 'question') startRec(); })
        .catch(function (e) { IV.starting = false; toast('마이크를 쓸 수 없습니다: ' + e.message, true); });
    }
    shush();
    var mime = (IS_SAFARI ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']).filter(function (m) { return window.MediaRecorder && MediaRecorder.isTypeSupported(m); })[0] || '';
    var mr = new MediaRecorder(IV.stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : {});
    mr._ctx = { sid: IV.sid, cur: Object.assign({}, IV.cur), idx: IV.idx, follows: IV.follows };
    mr._chunks = []; mr._key = Math.random().toString(36).slice(2, 10);
    mr._reg = new Promise(function (ok) { mr._regOk = ok; });       // 이 녹음의 올리기 요청이 등록되면 풀린다(끝내기가 기다림)
    IV.mr = mr; IV.chunks = mr._chunks; IV.t0 = ivNow(); IV.key = mr._key; IV.liveText = ''; IV.partialBusy = false; IV.lastPartial = Date.now();
    mr.ondataavailable = function (e) { if (e.data.size) mr._chunks.push(e.data); };
    mr.onstop = function () { upload(mr); };
    mr.start(1000);
    IV.phase = 'recording'; ivRender();
    var lim = IV.set.answer_limit || 90;
    IV.tick = setInterval(function () {
      if (IV.coachOpen) return;
      var s = Math.floor((ivNow() - IV.t0) / 1000), tm = document.getElementById('tm');
      if (tm) tm.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
      var L = document.getElementById('lim'); if (L) { L.firstChild.style.width = Math.min(100, s / lim * 100) + '%'; L.className = 'limit' + (s > lim ? ' over' : s > lim * 0.75 ? ' mid' : ''); }
      if (!IV.partialBusy && Date.now() - IV.lastPartial > 12000 && IV.chunks.length) {
        IV.partialBusy = true; IV.lastPartial = Date.now(); var key = IV.key;
        var b = new Blob(IV.chunks, { type: (mr.mimeType || 'audio/webm').split(';')[0] });
        api('/api/partial?session=' + IV.sid + '&key=' + key + '&question=' + encodeURIComponent((IV.cur && IV.cur.text || '').slice(0, 160)), b, { raw: true, headers: { 'Content-Type': b.type } }).then(function (r) { if (key === IV.key && r.text) IV.liveText = r.text; })
          .catch(function () {}).then(function () { IV.partialBusy = false; });
      }
    }, 250);
    var buf = new Uint8Array(IV.an ? IV.an.fftSize : 0);
    (function loop() {
      if (IV.phase !== 'recording') return;
      if (IV.an) { IV.an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i] - 128)); var lv = document.getElementById('lv'); if (lv) lv.style.width = Math.min(100, m / 64 * 100) + '%'; }
      IV.raf = requestAnimationFrame(loop);
    })();
  }
  function stopRec() {
    if (!(IV.mr && IV.mr.state === 'recording')) return;
    var tok = IV.token = (IV.token || 0) + 1;
    IV.mr._tok = tok;
    clearInterval(IV.tick); IV.mr.stop(); IV.phase = 'processing'; ivRender();
    if (IV.cur.source !== 'closing') speak(LINES.ack[IV.answered % LINES.ack.length]);
    var p0 = ivNow(), lim = (+IV.set.wait_limit || 30) * 1000;
    IV.tick = setInterval(function () {
      if (IV.coachOpen) return;
      var p = document.getElementById('pt'); if (p) p.textContent = '';
      var lt = document.querySelector('.livetx'); if (!lt && IV.liveText) { var st = document.getElementById('ivState'); if (st) drawState(st); }
      if (ivNow() - p0 > lim && IV.phase === 'processing' && IV.token === tok && IV.cur.source !== 'closing') {
        clearInterval(IV.tick); IV.skippedSet[tok] = 1; speak(LINES.moveOn); scheduleMove();
      }
    }, 500);
  }

  // 끝내기가 기다리는 신호: 지금 녹음의 올리기 요청이 등록되었다(빈 녹음도 포함)
  function upload(mr) {
    mr = mr || IV.mr;
    var ctx = mr._ctx || { sid: IV.sid, cur: IV.cur };
    var uploaded = function () { if (mr._regOk) { mr._regOk(); mr._regOk = null; } };
    var blob = new Blob(mr._chunks || IV.chunks, { type: (mr.mimeType || 'audio/webm').split(';')[0] });
    var c = ctx.cur;
    if (blob.size < 2000) {                    // 녹음이 거의 비었으면(마이크가 끊긴 경우) 다시 답하게 한다
      uploaded();
      if (IV.ending || !IV.active) return;
      afterCoach(function () {
        clearInterval(IV.tick); IV.stream = null; IV.phase = 'question'; ivRender();
        toast('녹음이 되지 않았습니다. 마이크를 다시 연결했으니 답변 시작을 한 번 더 눌러 주세요.', true); openMic().catch(function () {});
      });
      return;
    }
    // 마지막 질문, 추가 질문을 다 쓴 뒤, 면접을 끝내는 중이면 추가 질문을 만들지 않는다(다음 질문이 빨리 나오게)
    var maxF0 = +IV.set.max_follow || 0;
    var noF = maxF0 === 0 || c.source === 'closing' || IV.ending || (c.source === 'follow' && (ctx.follows || 0) >= maxF0);
    var q = '/api/answer?session=' + ctx.sid + '&source=' + c.source + '&base_qid=' + (c.qid || 0) + '&question=' + encodeURIComponent(c.text) + (noF ? '&nofollow=1' : '') + '&key=' + mr._key;
    var tok = mr._tok != null ? mr._tok : IV.token;
    var req = api(q, blob, { raw: true, headers: { 'Content-Type': blob.type } });
    IV.inflight.push(req);
    uploaded();
    req.then(function (r) {
      afterCoach(function () {
      var last = { id: r.answer_id, transcript: r.transcript, seconds: r.seconds, ms: (r.stt_ms || 0) + (r.ai_ms || 0), cur: Object.assign({}, c), idx: ctx.idx, follows: ctx.follows };
      if (IV.ending || !IV.active || ctx.sid !== IV.sid) return;
      if (r.stt_error) toast('받아 적기가 실패했습니다. 녹음은 저장했습니다.', true);
      if (IV.skippedSet[tok] || tok !== IV.token) { IV.answered++; return; }   // 이미 다음 질문으로 넘어간 답: 화면과 다시 답하기 대상을 바꾸지 않는다
      clearInterval(IV.tick);
      IV.last = last; IV.answered++;
      if (c.source === 'closing') return finish();
      var maxF = +IV.set.max_follow || 0;
      if (r.followups && r.followups.length && r.recommend === 'follow' && IV.follows < maxF) {
        IV.follows++; IV.alts = r.followups;
        IV.cur = { text: r.followups[0].question, source: 'follow', qid: c.qid };
        IV.phase = 'question'; ivRender(); speakAfter(LINES.follow + ' ' + IV.cur.text);
      } else nextBase(true);
      });
    }).catch(function (e) {
      afterCoach(function () {
      if (IV.ending || !IV.active || ctx.sid !== IV.sid || tok !== IV.token || IV.skippedSet[tok]) return;
      clearInterval(IV.tick); toast(e.message, true); IV.phase = 'question'; ivRender();
      });
    });
  }
  function redoLast() {
    if (IV.coachOpen || !IV.last || IV.redoBusy || IV.phase !== 'question') return;
    IV.redoBusy = true;
    var t = IV.last, sid = IV.sid, tok0 = IV.token;
    IV.redoPromise = api('/api/answer/delete', { answer_id: t.id }).then(function () {
      if (!IV.active || IV.ending || IV.finishRequested || sid !== IV.sid || tok0 !== IV.token) return;
      IV.last = null; IV.token = (IV.token || 0) + 1;
      if (t.idx != null) IV.idx = t.idx;
      IV.follows = t.follows || 0;
      IV.cur = Object.assign({}, t.cur); IV.alts = []; IV.phase = 'question'; ivRender(); speak(IV.cur.text);
    }).catch(function (e) { toast(e.message, true); }).then(function () { IV.redoBusy = false; });
  }
  function finish() {
    if (IV.coachOpen) return;
    if (IV.phase === 'done' || IV.ending) return;
    if (IV.coach && IV.coach.busy && IV.coach.pending) return IV.coach.pending.then(finish);
    if (IV.redoBusy && IV.redoPromise) { IV.finishRequested = true; return IV.redoPromise.then(finish, finish); }
    // 답하는 중이거나 올리는 중인 답을 모두 저장한 뒤에 끝낸다(마지막 답이 빠지지 않게)
    IV.ending = true; clearInterval(IV.tick); clearTimeout(IV.moveT);
    var mr = IV.mr;
    if (mr && mr.state === 'recording') { mr._tok = IV.token = (IV.token || 0) + 1; try { mr.stop(); } catch (e) { if (mr._regOk) mr._regOk(); } }
    IV.phase = 'done'; ivRender(); speak(LINES.end);
    var sid = IV.sid;
    var reg = mr && mr._reg ? mr._reg : Promise.resolve();
    var limit = function (p, ms) { return Promise.race([p, new Promise(function (ok) { setTimeout(ok, ms); })]); };   // 받아 적기가 멈춰도 영원히 기다리지 않는다
    limit(reg, 10000).then(function () {
      return limit(Promise.all(IV.inflight.map(function (p) { return p.then(function () { return true; }, function () { return false; }); })), 60000);
    }).then(function (res) {
      if (Array.isArray(res) && res.indexOf(false) >= 0) toast('저장하지 못한 답이 있습니다. 결과 화면에서 확인해 주세요.', true);
      return api('/api/session/end', { session_id: sid });
    }).then(function () { location.hash = '#/r/' + sid; }).catch(function (e) { toast(e.message, true); location.hash = '#/r/' + sid; });
  }
  document.addEventListener('keydown', function (e) {
    if (!IV.active) return;
    if (IV.coachOpen && e.key === 'Escape') { e.preventDefault(); closeCoach(); return; }
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (e.repeat) { if (e.code === 'Space') e.preventDefault(); return; }
    if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); if (IV.coachOpen) closeCoach(); else openCoach(); return; }
    if (IV.coachOpen) { if (e.code === 'Space' && e.target.tagName !== 'BUTTON' || e.key === 'ArrowRight') e.preventDefault(); return; }
    if (e.code === 'Space') { e.preventDefault(); actx(true); if (IV.phase === 'intro') nextBase(); else if (IV.phase === 'question') startRec(); else if (IV.phase === 'recording') stopRec(); }
    else if (e.key === 'ArrowRight' && IV.phase === 'question' && IV.cur && IV.cur.source !== 'closing') nextBase();
    else if (e.key === 'Escape' && IV.phase !== 'done' && IV.phase !== 'intro') { if (confirm('면접을 끝내고 연습 메모를 만들까요?')) finish(); }
  });

  // ── 결과 ──
  function result(sid, noteDraft) {
    return api('/api/session/' + sid).then(function (s) {
      var a = s.application;
      V.innerHTML = '<div class="row"><div><h1>' + (s.round || '') + '회차 면접 연습</h1><p class="sub" style="margin:0">' + esc(s.student.name) + ' · ' + esc(a.univ) + ' · ' + esc(a.unit || a.track) + ' · ' + esc(s.started) + (s.focus ? '<br>포커스: ' + esc(s.focus) : '') + '</p></div><div class="spacer"></div>' +
        '<div class="row noprint result-actions"><button class="btn ghost" onclick="print()">인쇄</button>' + (s.role === 'student' ? '<a class="btn" href="#/me">처음으로</a>' : '<a class="btn" href="#/s/' + a.student_id + '/3/' + a.id + '">질문 고치기</a>') + (s.memo ? (s.mentor_enabled ? '<a class="btn" href="#/mentor/' + sid + '">AI 멘토에게 질문하기</a>' : '') : '') + '<a class="btn" href="#/mt/' + a.id + '">멘토링 기록</a><a class="btn pri" href="#/iv/' + a.id + '">다시 연습</a></div></div>' +
        '<div class="card info-strip"><span class="chip gray">질문 자료 · ' + esc(s.mode_label || '기출 중심') + '</span>' + (s.coach && (s.coach.logs || []).length ? '' : '<span class="chip gray">코치 도움 0회</span>') +
        (s.source_mode === 'recent' ? '<details style="margin-top:8px"><summary>반영한 최근 자료 출처</summary>' + ((s.material_sources || []).length ? '<ul>' + s.material_sources.map(function (x) { return '<li>' + esc(x.name) + '</li>'; }).join('') + '</ul>' : '<p>조건에 맞는 최근 자료가 없습니다.</p>') + '</details>' : '') + '</div>' +
        (s.coach && (s.coach.logs || []).length ? '<div class="card coach-result">' + (s.coach_html || '') + '</div>' : '') +
        (s.metrics ? '<div class="result-metrics"><span>답변 <b>' + s.metrics.answers + '개</b></span><span>평균 답 길이 <b>' + (s.metrics.average == null ? '확인 불가' : Math.round(s.metrics.average) + '초') + '</b></span><span>권장 길이 안의 답 <b>' + s.metrics.in_range + '/' + s.metrics.timed + '개</b></span><span>내용 확인 불가 <b>' + s.metrics.unavailable + '개</b></span></div>' : '') + '<div class="result-layout">' +
        '<div class="grid"><div class="card memo"><h2>연습 메모</h2><div id="memo">' + (s.memo_html || '<p class="muted" style="white-space:pre-wrap">' + esc(s.memo || '메모가 없습니다.') + '</p>') + '</div>' + (s.role === 'student' && s.memo ? '' : '<button class="btn noprint" id="mkMemo">' + (s.memo ? '연습 메모 다시 만들기' : '연습 메모 만들기') + '</button><p class="src noprint">다시 만든 메모는 이 맥북에 저장됩니다. 메일은 보내기 버튼으로 전송합니다.</p>') + '</div>' +
        (s.about && (s.about['기출'] || []).length ? '<div class="card"><details><summary style="cursor:pointer"><h2 style="display:inline">' + esc(s.about['대학'] || '') + ' 기출·예시 질문</h2> <span class="muted small">눌러서 펼치기</span></summary><ul class="small">' + s.about['기출'].filter(function (g) { return (g['출처 종류'] || '공식') === '공식'; }).slice(0, 20).map(function (g) { return '<li style="margin:6px 0">' + esc(g['질문'] || g['문항'] || '') + ' <span class="faint">(' + esc(g['학년도'] || '') + ' ' + esc(g['계열'] || '') + ')</span>' + (srcLine(g, s.about) ? '<br><span class="src">' + esc(srcLine(g, s.about)) + '</span>' : '') + '</li>'; }).join('') + '</ul></details></div>' : '') +
        (s.role === 'student' ? (s.note ? '<div class="card teacher-note"><h2>선생님 메모</h2><p style="white-space:pre-wrap">' + esc(s.note) + '</p>' : '<div>') :
        '<div class="card teacher-note"><h2>선생님 메모</h2><textarea id="note" rows="6" placeholder="학생과 함께 볼 메모">' + esc(s.note || '') + '</textarea><button class="btn noprint" id="saveNote" style="margin-top:8px">저장</button>') +
        (s.sheet ? '<p class="src noprint" style="margin-top:8px">' + (s.sheet.indexOf('오류') === 0 ? esc(s.sheet) : '구글 시트에 기록됨 ' + esc(s.sheet.slice(5, 16))) + '</p>' : '') +
        (s.role === 'student' ? '' : '<div class="row noprint" style="margin-top:8px;gap:8px"><button class="btn" id="mailBtn">보고서 메일 보내기</button><label class="f">받는 사람<select id="mailWho"><option value="teacher">선생님만</option><option value="student"' + (s.student.email ? '' : ' disabled') + '>선생님과 학생</option></select></label><span class="small" id="mailRecipients"></span><span class="src" id="mailMsg">' + (s.mail ? (s.mail.indexOf('오류') === 0 ? esc(s.mail) : '메일 보냄 ' + esc(s.mail.slice(5, 16))) : '') + '</span></div>') + '</div>' +
        (function () {
          var used = (s.areas || []).filter(function (f) { return (s.memo || '').indexOf('[' + f['이름'] + ']') >= 0; });
          return used.length ? '<div class="card" style="margin-bottom:16px"><h2>이번 메모의 피드백 기준</h2><p class="small muted" style="margin:0 0 8px">대학 입학처와 교육청 공식 자료에서 정리한 면접 피드백 영역입니다.</p>' +
            used.map(function (f) { return '<div style="margin:8px 0"><b>' + esc(f['이름']) + '</b> <span class="small">' + esc(f['보는 것'] || '') + '</span>' + (f['출처'] && f['출처'].length ? '<div class="src">출처: ' + f['출처'].map(esc).join(' · ') + '</div>' : '') + '</div>'; }).join('') + '</div>' : '';
        })() +
        '<div class="card cmp"><h2>지난 연습과 비교</h2>' + (s.compare_html || '<p>서버를 재시작하면 회차 비교가 표시됩니다.</p>') + '</div></div>' +
        '<div class="card"><h2>질문과 답 <span class="faint small">' + s.answers.length + '개</span></h2>' + s.answers.map(function (x) {
          return '<div class="qa' + (x.source === 'follow' ? ' follow' : '') + '"><div class="row" style="gap:8px">' + (x.source === 'follow' ? '<span class="chip ok">추가 질문</span>' : x.source === 'closing' ? '<span class="chip gray">마지막</span>' : '') + '<span class="faint small">' + Math.round(x.seconds || 0) + '초</span></div>' +
            '<div class="q">' + esc(x.question) + '</div><div class="a">' + esc(x.transcript || (x.stt_error ? '(받아 적기 실패. 녹음을 들어 주세요)' : '(들리지 않음)')) + '</div><audio controls preload="none" src="/audio/' + encodeURIComponent(x.audio) + '" class="noprint"></audio></div>';
        }).join('') + '</div></div>';
      if (noteDraft !== undefined && noteDraft !== null && document.getElementById('note')) document.getElementById('note').value = noteDraft;
      var mk = document.getElementById('mkMemo'); if (mk) mk.onclick = function () {
        mk.disabled = true; mk.textContent = '메모 작성 중…';
        var noteDraft = document.getElementById('note');
        var noteValue = noteDraft ? noteDraft.value : null;
        api('/api/session/memo', { session_id: sid }).then(function () { return result(sid, noteValue); }).catch(function (e) { toast(e.message, true); mk.disabled = false; mk.textContent = '연습 메모 다시 만들기'; });
      };
      var mb = document.getElementById('mailBtn');
      var mailWho = document.getElementById('mailWho');
      if (mailWho) {
        mailWho.onchange = function () {
          var addresses = s.report_to || '선생님 주소 미등록';
          if (mailWho.value === 'student') addresses += ', ' + s.student.email;
          document.getElementById('mailRecipients').textContent = '받는 주소: ' + addresses + (!s.student.email ? ' · 학생 메일 주소 미등록' : mailWho.value === 'student' && (!s.report_student_domain || (s.report_student_domain !== '*' && s.student.email.split('@')[1].toLowerCase() !== s.report_student_domain)) ? ' · 학생 주소의 허용 도메인을 설정하고 연결 확인이 필요합니다.' : '');
        };
        mailWho.onchange();
      }
      if (mb) mb.onclick = function () { mb.disabled = true; mailWho.disabled = true; var includeStudent = mailWho.value === 'student'; var mm = document.getElementById('mailMsg'); mm.textContent = '보내는 중…';
        api('/api/session/note', { session_id: sid, note: document.getElementById('note').value }).then(function () { return api('/api/report/send', { session_id: sid, include_student: includeStudent }); })
          .then(function () { mm.textContent = '메일을 보냈습니다'; mb.disabled = false; mailWho.disabled = false; }).catch(function (e) { mm.textContent = e.message; mb.disabled = false; mailWho.disabled = false; }); };
      if (document.getElementById('saveNote')) document.getElementById('saveNote').onclick = function () { api('/api/session/note', { session_id: sid, note: document.getElementById('note').value }).then(function () { toast('저장했습니다'); }); };
    });
  }

  // ── 설정 ──
  // ── 생기부 분석 ──
  function historyRows(app) {
    return (app.sessions || []).map(function (s) { return Object.assign({ time: s.started, kind: 'session' }, s); })
      .concat((app.mentoring || []).map(function (m) { return Object.assign({ time: m.created, kind: 'mentoring' }, m); }))
      .sort(function (a, b) { return b.time.localeCompare(a.time) || b.id - a.id; });
  }
  function mentoringRow(m, aid) {
    return '<a class="hist mentoring-history" href="#/mt/' + aid + '"><span class="rd">멘토링</span><span class="dt">' + esc(m.created.slice(0, 16)) + '</span><span class="st">' + badge('목표 ' + m.goals.length + '개', 'brand') + '</span><span class="mm">' + esc(m.goals.join(' · ')) + '</span></a>';
  }
  function cardSelection(cards, selected, name) {
    var rank = { '상': 0, '중': 1, '하': 2 };
    var list = cards.slice().sort(function (a, b) { return (rank[a.importance] || 0) - (rank[b.importance] || 0); });
    return list.length ? '<div class="checklist">' + list.map(function (p) { return '<label class="checkline"><input type="checkbox" name="' + name + '" value="' + esc(p.id) + '"' + (selected.indexOf(p.id) >= 0 ? ' checked' : '') + '>' + badge('중요도 ' + p.importance, p.importance === '상' ? 'brand-solid' : p.importance === '중' ? 'brand' : 'gray') + (p.element ? badge(p.element, 'gray') : '') + '<span>' + esc(p.title) + '</span></label>'; }).join('') + '</div>' : '<p class="empty">선택할 카드가 없습니다.</p>';
  }
  function checkedValues(root, name) {
    return Array.from(root.querySelectorAll('input[name="' + name + '"]:checked')).map(function (x) { return x.value; });
  }
  // 멘토링 준비 자료: 요약 숫자 → 다시 볼 답 → 지난 목표 → 최근 메모 → 연습하지 않은 카드
  function badge(text, tone) { return '<span class="badge' + (tone ? ' ' + tone : '') + '">' + esc(text) + '</span>'; }
  function statusTone(v) { return v === '확인됨' ? 'good' : v === '확인되지 않음' ? 'bad' : 'neutral'; }
  function prepBoard(d, teacher) {
    var high = d.unpracticed.filter(function (p) { return p.importance === '상'; });
    function stat(label, value, tone, note) { return '<div class="stat' + (tone ? ' ' + tone : '') + '"><span>' + label + '</span><b>' + value + '</b>' + (note ? '<small>' + note + '</small>' : '') + '</div>'; }
    var stats = '<div class="stats">' + stat('최근 연습', d.sessions.length + '회') + stat('다시 볼 답', d.errors.length + '개', d.errors.length ? 'bad' : '') +
      stat('지난 목표', d.goals.length + '개', '', d.goals.filter(function (g) { return g.status === '확인됨'; }).length + '개 확인됨') +
      stat('연습하지 않은 카드', d.unpracticed.length + '장', 'brand', '중요도 상 ' + high.length + '장') + '</div>';
    var errors = '<section class="card panel"><div class="panel-head"><h2>다시 볼 답</h2><span class="count">' + d.errors.length + '</span></div>' +
      (d.errors.length ? d.errors.map(function (x) {
        return '<div class="item"><div class="item-head">' + badge(x.round + '회차 질문 ' + x.answer, 'gray') +
          (x.correct && x.correct !== '맞음' && x.correct !== '판단 대상 아님' ? badge(x.correct, 'bad') : '') + (x.complete === '설명 부족' ? badge('설명 부족', 'warn') : '') + '</div><p>' + esc(x.reason) + '</p></div>';
      }).join('') : '<p class="empty">사실 오류나 설명 부족으로 판정된 답이 없습니다.</p>') + '</section>';
    var goals = '<section class="card panel"><div class="panel-head"><h2>지난 멘토링 목표</h2><span class="count">' + d.goals.length + '</span></div>' +
      (d.goals.length ? d.goals.map(function (g) {
        return '<div class="item"><div class="item-head"><b class="item-title">' + esc(g.text) + '</b>' + badge(g.status, statusTone(g.status)) + '</div>' +
          (g.checks.length ? g.checks.map(function (x) { return '<p class="small muted">' + x.round + '회차 · ' + esc(x.status) + ' · ' + esc(x.text) + '</p>'; }).join('') : '<p class="small muted">이후 메모에서 확인한 근거가 없습니다.</p>') + '</div>';
      }).join('') : '<p class="empty">아직 정한 목표가 없습니다.</p>') + '</section>';
    function list(items, tone) { return items.length ? '<ul class="dotlist ' + tone + '">' + items.map(function (x) { return '<li>' + esc(x.text) + '</li>'; }).join('') + '</ul>' : '<p class="empty">확인한 내용이 없습니다.</p>'; }
    var memos = '<section class="card panel"><div class="panel-head"><h2>최근 연습 메모</h2><span class="count">' + d.sessions.length + '</span></div>' +
      (d.sessions.map(function (s) {
        return '<div class="memo-round"><a class="round-link" href="#/r/' + s.id + '">' + s.round + '회차 · ' + esc(String(s.started).slice(0, 16)) + ' →</a>' +
          '<div class="grid two"><div><h4 class="h-good">확인된 강점</h4>' + list(s.strengths, 'good') + '</div><div><h4 class="h-brand">다음 연습 방법</h4>' + list(s.next, 'brand') + '</div></div>' +
          (s.practice.length ? '<h4>지난 방법 확인</h4>' + s.practice.map(function (x) { return '<div class="item compact"><div class="item-head">' + badge((x.previous_status ? x.previous_status + ' → ' : '') + x.status, statusTone(x.status)) + '<span class="small">' + esc(x.guide_text) + '</span></div><p class="small muted">' + esc(x.text) + '</p></div>'; }).join('') : '') + '</div>';
      }).join('') || '<p class="empty">마지막 멘토링 뒤에 완료한 회차가 없습니다.</p>') + '</section>';
    var order = { '상': 0, '중': 1, '하': 2 };
    var cards = d.unpracticed.slice().sort(function (a, b) { return order[a.importance] - order[b.importance]; });
    function tile(p) {
      var q = (p.questions || [])[0];
      return '<article class="tile"><div class="tile-top">' + badge('중요도 ' + p.importance, p.importance === '상' ? 'brand-solid' : p.importance === '중' ? 'brand' : 'gray') + (p.element ? badge(p.element, 'gray') : '') + '</div>' +
        '<h3>' + esc(p.title) + '</h3>' + (p.where ? '<p class="tile-where">' + esc(p.where) + '</p>' : '') +
        (q ? '<p class="tile-q"><span>예상 질문</span>' + esc(q.q) + '</p>' : '') +
        (teacher ? '<button type="button" class="btn small" data-pick="' + esc(p.id) + '">연습할 카드로 고르기</button>' : '') + '</article>';
    }
    var shown = cards.filter(function (p, i) { return p.importance === '상' || i < high.length + 6; }), rest = cards.slice(shown.length);
    var unpracticed = '<section class="card panel"><div class="panel-head"><h2>아직 연습하지 않은 카드</h2><span class="count">' + cards.length + '</span></div>' +
      '<p class="small muted">생기부 분석 카드 가운데 확정 질문과 저장된 답에 한 번도 연결되지 않은 카드입니다. 중요도 상부터 보여 줍니다.</p>' +
      (cards.length ? '<div class="tiles">' + shown.map(tile).join('') + '</div>' + (rest.length ? '<details class="more"><summary>나머지 ' + rest.length + '장 보기</summary><div class="tiles">' + rest.map(tile).join('') + '</div></details>' : '') : '<p class="empty">모든 카드를 한 번 이상 연습했습니다.</p>') + '</section>';
    return stats + '<div class="grid two">' + errors + goals + '</div>' + memos + unpracticed;
  }
  function mentoringView(aid) {
    V.innerHTML = '<div class="card">멘토링 자료를 불러오는 중입니다.</div>';
    return api('/api/mentoring/' + aid).then(function (d) {
      var a = d.application, last = d.latest || {}, teacher = d.role !== 'student';
      function lines(items) { return items.length ? '<ul>' + items.map(function (x) { return '<li>' + esc(x.text) + '</li>'; }).join('') + '</ul>' : '<p class="muted">확인한 내용이 없습니다.</p>'; }
      V.innerHTML = '<div class="page-title"><div><h1>멘토링 기록</h1><p class="sub">' + esc(a.univ) + ' · ' + esc(a.track) + ' · ' + esc(a.unit) + '</p></div><a class="btn" href="' + (teacher ? prepPath(a.student_id, 3, aid) : '#/me') + '">돌아가기</a></div>' +
        '<p class="muted">선생님이 학생과 정한 목표를 기록합니다. 아래 준비 자료는 저장된 연습 메모와 생기부 분석에서 모았습니다.</p>' +
        prepBoard(d, teacher) +
        (teacher ? '<form id="mtForm" class="card"><h2>목표 확인·수정</h2><label class="f">수정할 기록<select id="mtEdit"><option value="">새 교사 기록</option>' + d.history.map(function (m) { return '<option value="' + m.id + '">' + esc(m.created) + ' · ' + esc(m.author || '교사') + '</option>'; }).join('') + '</select></label><label class="f">목표 1~3개 · 한 줄에 한 문장<textarea id="mtGoals" rows="3" required></textarea></label><div class="grid two"><label class="f">다음 연습 포커스<textarea id="mtFocus" rows="3">' + esc(a.focus || '') + '</textarea></label><label class="f">난이도<select id="mtLevel">' + ['쉬움', '보통', '어려움', '단계별'].map(function (x) { return '<option' + (x === (a.level || '보통') ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div><h3>연습할 카드</h3>' + cardSelection(d.cards, last.card_ids || [], 'mtCard') + '<div class="grid two"><label class="f">교사 메모<textarea id="mtTeacher" rows="3"></textarea></label><label class="f">학생 소감<textarea id="mtStudent" rows="3"></textarea></label></div><label class="checkline"><input type="checkbox" id="mtApply">포커스와 난이도를 다음 연습 설정에 반영합니다.</label><p class="small muted">멘토링 기록은 맥북에 저장합니다. 메일은 저장 후 보내기 버튼 또는 설정한 자동 발송으로 전송합니다. 저장한 목표는 다음 회차 메모의 확인 항목에 포함합니다.</p><button class="btn pri" type="submit">멘토링 저장</button><p id="mtStatus" role="status"></p></form>' : '<p>연습 메모가 있는 회차의 결과 화면에서 AI 멘토와 이야기할 수 있습니다.</p>') +
        '<div class="card mentoring-records"><h2>멘토링 기록</h2>' + (teacher ? '<label class="f" style="max-width:280px">메일 받는 사람<select id="mtMailWho"><option value="teacher">선생님만</option><option value="student"' + (d.student_email ? '' : ' disabled') + '>선생님과 학생</option></select></label><p id="mtMailTo" class="small preserve"></p>' : '') + (d.history.map(function (m) { return '<details' + (m.id === last.id ? ' open' : '') + '><summary>' + esc(m.author || '교사') + ' · ' + esc(m.created) + ' · ' + esc(m.goals.join(' · ')) + '</summary><dl class="info" style="margin:12px 0">' + [['포커스', m.focus], ['난이도', m.level], ['연습할 카드', (m.preparation && m.preparation.card_titles ? m.preparation.card_titles : m.card_ids.map(function (id) { var card = d.cards.find(function (p) { return p.id === id; }); return card ? card.title : id + ' (이전 분석)'; })).join(' · ')], ['교사 메모', m.teacher_note], ['학생 소감', m.student_note]].filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd class="preserve">' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' + '<p class="preserve">' + esc(m.summary || '') + '</p>' + ((m.conversation || []).length ? '<details><summary>AI 멘토 대화 전문</summary>' + (m.conversation || []).map(function (t) { return '<article><p class="small muted">' + t.stage + '단계 · ' + esc(t.created) + '</p><p class="preserve"><b>학생</b><br>' + esc(t.ask) + '</p><p class="preserve"><b>AI 멘토</b><br>' + esc(t.reply) + '</p></article>'; }).join('') + '</details>' : '') + (teacher ? '<button class="btn mt-mail" id="mtSend' + m.id + '">멘토링 기록 메일 보내기</button>' : '') + '<p class="small preserve" id="mtMailStatus' + m.id + '" role="status">' + esc((m.mail ? '메일 보냄 ' + m.mail : '') + (m.mail_error ? ' · 발송 오류: ' + m.mail_error : '')) + '</p></details>'; }).join('') || '<p>저장한 멘토링이 없습니다.</p>') + '</div>';
      var who = document.getElementById('mtMailWho');
      if (who) {
        who.value = 'teacher';
        who.onchange = function () {
          var domain = d.report_student_domain || '';
          document.getElementById('mtMailTo').textContent = '받는 주소: ' + ((d.report_to || []).join(', ') || '선생님 주소 미등록') +
            (who.value === 'student' ? ', ' + d.student_email + (!domain || (domain !== '*' && d.student_email.split('@')[1].toLowerCase() !== domain) ? ' · 학생 주소의 허용 도메인을 확인합니다.' : '') : '');
        };
        who.onchange();
        d.history.forEach(function (m) {
          var button = document.getElementById('mtSend' + m.id);
          button.onclick = function () {
            var includeStudent = who.value === 'student';
            if (!confirm('이 멘토링 기록을 ' + (includeStudent ? '선생님과 학생에게' : '선생님에게') + ' 메일로 보냅니다. 계속할까요?')) return;
            button.disabled = true; who.disabled = true;
            var status = document.getElementById('mtMailStatus' + m.id); status.textContent = '보내는 중입니다.';
            api('/api/mentoring/send', { application_id: aid, mentoring_id: m.id, include_student: includeStudent }).then(function (r) {
              status.textContent = '메일 보냄 ' + r.mail; button.disabled = false; who.disabled = false;
            }).catch(function (e) { status.textContent = '발송 오류: ' + e.message; button.disabled = false; who.disabled = false; });
          };
        });
      }
      var form = document.getElementById('mtForm');
      V.querySelectorAll('[data-pick]').forEach(function (b) {
        b.onclick = function () {
          var box = form && form.querySelector('input[value="' + b.dataset.pick + '"]');
          if (!box) return;
          box.checked = true; b.textContent = '연습할 카드에 넣음'; b.disabled = true;
          toast('아래 목표 기록의 연습할 카드에 넣었습니다.');
        };
      });
      var edit = document.getElementById('mtEdit');
      if (edit) {
        edit.onchange = function () {
          var m = d.history.find(function (x) { return x.id === +edit.value; });
          document.getElementById('mtGoals').value = m ? m.goals.join('\n') : '';
          document.getElementById('mtFocus').value = m ? m.focus : a.focus || '';
          document.getElementById('mtLevel').value = m ? m.level : a.level || '보통';
          document.getElementById('mtTeacher').value = m ? m.teacher_note : '';
          document.getElementById('mtStudent').value = m ? m.student_note : '';
          Array.from(form.querySelectorAll('input[name="mtCard"]')).forEach(function (x) { x.checked = !!m && m.card_ids.indexOf(x.value) >= 0; });
          document.getElementById('mtApply').checked = !!m && m.id === last.id;
        };
        if (last.author === 'AI 멘토') { edit.value = String(last.id); edit.onchange(); }
      }
      if (form) form.onsubmit = function (event) {
        event.preventDefault(); var button = form.querySelector('button[type="submit"]'); button.disabled = true;
        api('/api/mentoring/save', { application_id: aid, mentoring_id: edit && edit.value ? +edit.value : null, goals: document.getElementById('mtGoals').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean), focus: document.getElementById('mtFocus').value, level: document.getElementById('mtLevel').value, card_ids: checkedValues(form, 'mtCard'), teacher_note: document.getElementById('mtTeacher').value, student_note: document.getElementById('mtStudent').value, apply_settings: document.getElementById('mtApply').checked })
          .then(function (r) { toast(r.mail_error ? '멘토링은 저장했습니다. 자동 메일 발송 오류는 기록에서 확인합니다.' : r.mail ? '멘토링을 저장하고 메일을 보냈습니다.' : '멘토링을 저장했습니다.'); return mentoringView(aid); }).catch(function (e) { button.disabled = false; document.getElementById('mtStatus').textContent = e.message; });
      };
    }).catch(function (e) { toast(e.message, true); });
  }

  function analysisAdjustments(aid, a, level, area) {
    var root = document.getElementById('anAdjust'), d = a.adjustments;
    if (!root || !d) return;
    var allowed = { core: ['상'], mid: ['상', '중'], full: ['상', '중', '하'] }[level];
    var hidden = d.cards.filter(function (p) { return allowed.indexOf(p.importance) < 0 || (area !== 'all' && p.element !== area); });
    function cardRows(cards) {
      var groups = ['상', '중', '하'].map(function (lv) { return cards.filter(function (p) { return p.importance === lv; }); });
      var order = [].concat(groups[0], groups[1], groups[2]);
      return order.map(function (p, i) {
        return (i === 0 || order[i - 1].importance !== p.importance ? '<p class="adjust-group">중요도 ' + p.importance + ' ' + cards.filter(function (c) { return c.importance === p.importance; }).length + '장</p>' : '') + '<div class="adjust-item"><div class="adjust-main"><div class="item-head">' + badge('중요도 ' + p.importance, p.importance === '상' ? 'brand-solid' : p.importance === '중' ? 'brand' : 'gray') + (p.element ? badge(p.element, 'gray') : '') + '<b class="item-title">' + esc(p.title) + '</b></div>' +
          '<p class="adjust-reason">' + esc(p.importance_reason) + '</p></div><div class="adjust-actions">' + (p.importance !== '상' ? '<button class="btn small" data-adjust="include" data-card="' + esc(p.id) + '">핵심에 넣기</button>' : '') + '<button class="btn small ghost" data-adjust="exclude" data-card="' + esc(p.id) + '">모든 보기에서 빼기</button></div></div>';
      }).join('') || '<p class="empty">해당 카드가 없습니다.</p>';
    }
    function unitRows(items) { return items.map(function (u) { var merged = d.cards.find(function (p) { return p.id === u.merged_into; }); return '<li>' + esc(u.title) + (u.reason ? ' · ' + esc(u.reason) : '') + (u.merged_into ? ' · 합친 카드: ' + esc(merged ? merged.title + ' (' + merged.id + ')' : u.merged_into) : '') + '</li>'; }).join('') || '<li>해당 단위가 없습니다.</li>'; }
    function unitList(title, items, note) { return '<details class="unit-list"><summary><b>' + title + '</b> ' + items.length + '개</summary>' + (note ? '<p class="small muted">' + note + '</p>' : '') + '<ul>' + unitRows(items) + '</ul></details>'; }
    root.innerHTML = '<div class="panel-head"><h2>교사 조정</h2><span class="count">숨긴 카드 ' + hidden.length + ' · 저장한 조정 ' + d.edits.filter(function (x) { return x.status === 'active'; }).length + '</span></div><details><summary><b>빠진 내용 보기</b> · 숨겨진 카드 ' + hidden.length + '개' + (d.legacy ? '' : ' · 카드로 만들지 않은 단위 ' + d.skipped.length + '개') + '</summary>' + (d.legacy ? '<p class="small">이 분석은 예전 방식으로 만들어 어느 생기부 단위가 빠졌는지 계산할 수 없습니다. 다시 만들기를 누르면 확인할 수 있습니다.</p>' : '') + '<h3>현재 보기에서 숨겨진 카드</h3><p class="small">중요도와 영역 선택에 따라 숨겨진 카드입니다. ' + ['상', '중', '하'].map(function (v) { return v + ' ' + hidden.filter(function (p) { return p.importance === v; }).length + '개'; }).join(' · ') + '</p>' + cardRows(hidden) + '' + (d.legacy ? '' : unitList('카드를 만들지 않은 생기부 단위', d.skipped, '') + (d.changed.length ? unitList('분석 이후 바뀐 단위', d.changed, '분석을 만든 뒤 생기부에서 고치거나 새로 생긴 단위입니다. 다시 만들기를 누르면 반영됩니다.') : '')) + '</details>' +
      '<details><summary>현재 카드 조정</summary>' + cardRows(d.cards.filter(function (p) { return hidden.indexOf(p) < 0; })) + '</details>' +
      '<div id="anEditForm"></div><details><summary>교사가 카드 직접 추가</summary><form id="anAdd"><label class="f">생기부 단위(선택)<select id="anUnit"><option value="">단위 선택 없이 인용으로 확인</option>' + d.units.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(u.title) + '</option>'; }).join('') + '</select></label><label class="f">제목<input id="anTitle" required></label><div class="grid two"><label class="f">대학 평가 요소<select id="anElement">' + a.elements.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></label><label class="f">중요도<select id="anImportance"><option>상</option><option>중</option><option>하</option></select></label></div><label class="f">근거 인용<textarea id="anQuote" required rows="3"></textarea></label><label class="f">이 카드를 넣는 이유<textarea id="anReason" required rows="2"></textarea></label><label class="f">요청자<select id="anProposer"><option>교사</option><option>학생</option></select></label><p class="small muted">생기부 원문과 공백만 다를 수 있습니다. 상세 없이 추가하며 AI를 호출하지 않습니다.</p><button class="btn" type="submit">카드 추가</button></form></details>' +
      '<details' + (d.edits.some(function (x) { return x.status === 'active'; }) ? ' open' : '') + '><summary>저장한 교사 조정</summary>' + (d.edits.filter(function (x) { return x.status === 'active'; }).map(function (x) { return '<div class="adjust-item"><div class="adjust-main"><div class="item-head">' + badge(({ include: '핵심에 넣음', exclude: '모든 보기에서 뺌', add: '직접 추가' })[x.kind], x.kind === 'exclude' ? 'bad' : 'brand') + '<b class="item-title">' + esc(x.data.title || x.card_id) + '</b></div><p class="adjust-reason">' + esc(x.reason) + ' · 요청: ' + esc(x.proposer) + '</p></div><div class="adjust-actions"><button class="btn small" data-undo="' + x.id + '">되돌리기</button></div></div>'; }).join('') || '<p class="empty">아직 저장한 조정이 없습니다.</p>') + '</details>' +
      (d.pending.length ? '<h3>이전 분석에서 한 조정 확인 필요</h3>' + d.pending.map(function (x) { return '<div class="adjust-item">' + esc(x.data.title || x.card_id) + ' · ' + esc(x.reason) + ' · 요청: ' + esc(x.proposer) + '<p>새 카드와 연결하거나 인용을 확인하지 못했습니다. 현재 카드에서 다시 조정할 수 있습니다.</p><button class="btn small" data-undo="' + x.id + '">확인 후 조정 해제</button></div>'; }).join('') : '') + '<p id="anEditStatus" role="status"></p>';
    function submit(path, body, button) {
      button.disabled = true;
      api(path, Object.assign({ application_id: aid, analysis_id: a.id }, body)).then(function () { analysisView(aid, level, area); }).catch(function (e) { button.disabled = false; document.getElementById('anEditStatus').textContent = e.message; });
    }
    root.querySelectorAll('[data-adjust]').forEach(function (button) { button.onclick = function () {
      var target = document.getElementById('anEditForm');
      target.innerHTML = '<form class="adjust-item"><h3>' + esc(button.textContent) + '</h3><label class="f">이유<textarea required rows="2"></textarea></label><label class="f">요청자<select><option>교사</option><option>학생</option></select></label><button class="btn" type="submit">조정 저장</button></form>';
      target.querySelector('form').onsubmit = function (event) { event.preventDefault(); submit('/api/analysis/edit', { kind: button.dataset.adjust, card_id: button.dataset.card, reason: target.querySelector('textarea').value, proposer: target.querySelector('select').value }, target.querySelector('button')); };
      target.querySelector('textarea').focus();
    }; });
    root.querySelectorAll('[data-undo]').forEach(function (button) { button.onclick = function () { submit('/api/analysis/undo', { edit_id: +button.dataset.undo }, button); }; });
    document.getElementById('anAdd').onsubmit = function (event) {
      event.preventDefault(); var unit = document.getElementById('anUnit').value;
      submit('/api/analysis/edit', { kind: 'add', unit_ids: unit ? [unit] : [], title: document.getElementById('anTitle').value, element: document.getElementById('anElement').value, importance: document.getElementById('anImportance').value, quote: document.getElementById('anQuote').value, reason: document.getElementById('anReason').value, proposer: document.getElementById('anProposer').value }, event.target.querySelector('button'));
    };
  }

  function analysisView(aid, level, area) {
    clearTimeout(analysisView.pollTimer);
    var request = analysisView.request = (analysisView.request || 0) + 1;
    level = level || 'core'; area = area || 'all';
    V.innerHTML = '<div id="anLoading" class="card loading"><span class="spin"></span>불러오는 중…</div>';
    var loadingNode = document.getElementById('anLoading');
    api('/api/analysis/' + aid).then(function (r) {
      if (request !== analysisView.request || document.getElementById('anLoading') !== loadingNode) return;
      var a = r.analysis, job = r.job, running = job && job.status === 'running';
      if (running && !analysisWait) analysisWait = startWait({ application_id: aid });
      if (!running && analysisWait) { analysisWait(); analysisWait = null; }
      var statusText = running ? '분석 중… 완료하면 자동으로 표시합니다.' : job && job.status === 'failed' ?
        '분석 실패. ' + (a ? '이전 분석을 유지합니다. ' : '') + (job.error || '') : a ? '완료' : '아직 분석을 시작하지 않았습니다.';
      var status = '<p class="small" id="anStatus" role="status"><span class="badge ' + (running ? 'warn' : job && job.status === 'failed' ? 'bad' : a ? 'good' : 'gray') + '">' + esc(running ? '분석 중' : job && job.status === 'failed' ? '실패' : a ? '완료' : '시작 전') + '</span> <span class="muted">' + esc(running || (job && job.status === 'failed') ? statusText : a ? a.created.slice(0, 16) + '에 만든 분석 · 관심 내용 ' + a.points + '가지' : statusText) + '</span>' +
        (running && job.stale ? ' 현재 작업 뒤에 최신 생기부를 분석합니다.' : '') + '</p>';
      var head = '<div class="page-title noprint"><div><h1>생기부 분석</h1><p class="sub">면접관이 관심을 가질 내용, 예상 질문, 답을 준비하는 순서입니다. 이름을 가린 생기부와 대학 공식 자료만 근거로 씁니다.</p></div><div class="row">' +
        '<a class="btn" href="javascript:history.back()">돌아가기</a>' +
        (a ? '<button class="btn" id="anMake">다시 만들기</button><a class="btn pri" id="anPdf" href="/analysis/' + aid + '.pdf">PDF 내려받기</a>' : '') + '</div></div>';
      head += status;
      if (!a) {
        V.innerHTML = head + '<div class="card" style="margin-top:16px"><p>아직 만든 분석이 없습니다. 전체 활동 목록과 카드별 상세를 한 번에 만듭니다. 완성한 뒤에는 다시 만들지 않고 보기 단계와 영역을 바꿀 수 있습니다.</p><button class="btn pri" id="anMake">분석 만들기</button></div>';
      } else {
        var mailRow = '<div class="tb-row tb-mail"><span class="tb-label">메일</span><button class="btn" id="anMail">분석 메일 보내기</button>' +
          '<select id="anWho" style="width:auto"><option value="teacher">선생님만</option><option value="student"' + (a.student_email ? '' : ' disabled') + '>선생님과 학생</option></select>' +
          '<span class="small muted" id="anTo"></span><span class="src" id="anMailMsg">' + (a.mail ? (a.mail.indexOf('오류') === 0 ? esc(a.mail) : '메일 보냄 ' + esc(a.mail)) : '') + '</span></div></div>';
        var filters = '<div class="card toolbar noprint"><div class="tb-row" role="group" aria-label="분석 보기 단계"><span class="tb-label">보기</span><div class="seg-group">' +
          '<button class="btn" id="anCore">핵심 · 상</button><button class="btn" id="anMid">확장 · 상+중</button><button class="btn" id="anFull">전체 · 상+중+하</button></div>' +
          '<label class="tb-area">영역 <select id="anArea" style="width:auto"><option value="all">골고루 · 대학 평가 비율</option>' +
          (a.elements || []).map(function (name) { return '<option value="' + esc(name) + '">' + esc(name) + '</option>'; }).join('') + '</select></label>' +
          '<span class="small muted" id="anCount"></span></div><p class="small muted" id="anAreaNote" hidden>의사소통 영역에서는 생기부의 발표·토론·설명 활동을 바탕으로 질문 의도를 파악하고 구조 있게 답하는 방법을 안내합니다.</p>';
        V.innerHTML = head + filters + mailRow + (a.stale ? '<div class="warnbox" style="margin:12px 0">현재 생기부와 분석 기준을 모두 반영한 결과가 아닙니다. 최신 분석을 완료할 때까지 이전 내용을 표시합니다.</div>' : '') +
          '<div class="card" style="padding:0;overflow:hidden"><iframe id="anPreview" title="생기부 분석 미리보기" scrolling="no" src="/analysis/' + aid + '.html" style="width:100%;min-height:480px;border:0;display:block;background:#fff"></iframe></div>' +
          '<div id="anAdjust" class="card analysis-adjust"></div>';
      }
      if (a) {
        if ((a.elements || []).indexOf(area) < 0) area = 'all';
        var areaSelect = document.getElementById('anArea');
        areaSelect.value = area;
        var showView = function () {
          analysisAdjustments(aid, a, level, area);
          var query = '?level=' + encodeURIComponent(level) + '&area=' + encodeURIComponent(area);
          var frame = document.getElementById('anPreview');
          frame.style.opacity = .4;
          frame.onload = function () { try { frame.style.height = frame.contentDocument.documentElement.scrollHeight + 'px'; } catch (e) { frame.style.height = '78vh'; } frame.style.opacity = 1; };
          frame.src = '/analysis/' + aid + '.html' + query;
          document.getElementById('anPdf').href = '/analysis/' + aid + '.pdf' + query;
          [['anCore', 'core'], ['anMid', 'mid'], ['anFull', 'full']].forEach(function (item) {
            var button = document.getElementById(item[0]);
            button.classList.toggle('pri', level === item[1]);
            button.setAttribute('aria-pressed', level === item[1] ? 'true' : 'false');
            button.onclick = function () { level = item[1]; showView(); };
          });
          var count = a.counts && a.counts[level] ? a.counts[level][area] : a.points;
          document.getElementById('anCount').textContent = '선택한 카드 ' + count + '개 / 전체 ' + a.points + '개';
          document.getElementById('anAreaNote').hidden = area.replace(/\s/g, '').indexOf('의사소통') < 0;
        };
        areaSelect.onchange = function () { area = areaSelect.value; showView(); };
        showView();
      }
      var mb = document.getElementById('anMail'), who = document.getElementById('anWho');
      if (mb) {
        var showTo = function () {
          document.getElementById('anTo').textContent = '받는 주소: ' + ((a.report_to || []).join(', ') || '(설정에서 선생님 주소를 저장해 주세요)') +
            (who.value === 'student' ? ', ' + a.student_email : '') + (a.student_email ? '' : ' · 학생 메일 주소 미등록');
        };
        who.onchange = showTo; showTo();
        mb.onclick = function () {
          if (!confirm(({ core: '핵심', mid: '확장', full: '전체' }[level]) + ' · ' + (area === 'all' ? '골고루' : area) + ' 보기의 생기부 분석 PDF를 ' + (who.value === 'student' ? '선생님과 학생에게' : '선생님에게') + ' 보냅니다.')) return;
          mb.disabled = true; mb.textContent = '보내는 중…';
          api('/api/analysis/send', { application_id: aid, include_student: who.value === 'student', level: level, area: area }).then(function (r) {
            mb.disabled = false; mb.textContent = '분석 메일 보내기';
            document.getElementById('anMailMsg').textContent = '메일 보냄 ' + r.mail;
            toast('분석 PDF를 메일로 보냈습니다');
          }).catch(function (e) { mb.disabled = false; mb.textContent = '분석 메일 보내기'; toast(e.message, true); });
        };
      }
      var mk = document.getElementById('anMake');
      if (mk) mk.disabled = !!running;
      if (mk) mk.onclick = function () {
        mk.disabled = true; mk.textContent = '전체 활동과 카드 상세를 만드는 중…';
        api('/api/analysis/make', { application_id: aid, force: true }).then(function () {
          if (request === analysisView.request && document.getElementById('anMake') === mk) analysisView(aid, level, area);
        })
          .catch(function (e) { mk.disabled = false; mk.textContent = '다시 시도'; toast(e.message, true); });
      };
      if (running) {
        var statusNode = document.getElementById('anStatus');
        analysisView.pollTimer = setTimeout(function () {
          if (request === analysisView.request && document.getElementById('anStatus') === statusNode) analysisView(aid, level, area);
        }, 4000);
      }
    }).catch(function (e) { if (request === analysisView.request && analysisWait) { analysisWait(); analysisWait = null; } toast(e.message, true); });
  }

  function settingsView() {
    loadState().then(function (s) {
      var st = s.settings;
      V.innerHTML = '<h1>설정</h1><p class="sub">이 맥북에서만 쓰는 설정입니다.</p>' + ((s.health || []).length ? '<div class="card" style="margin-bottom:16px"><h3>이 기기에서 확인할 것</h3><ul class="small">' + s.health.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>' : '') + '<div class="grid two">' +
        '<div class="card grid"><h3 class="set-h">받아 적기와 생기부</h3><label class="f">답변 받아 적기<select id="stt"><option value="mac">맥북에서(목소리가 밖으로 안 나감)</option><option value="gemini">제미나이(녹음을 보내 받아 적기와 추가 질문을 한 번에)</option></select></label>' +
        '<label class="f">스캔 생기부 글자 인식<select id="ocr"><option value="upstage">업스테이지(이름·인적사항 지운 이미지)</option><option value="mac">맥 내장</option></select></label>' +
        '<label class="toggle"><input type="checkbox" id="analysisAuto"' + (st.analysis_auto !== false ? ' checked' : '') + '>생기부 저장 시 분석 자동 시작</label>' +
        '<h3 class="set-h">면접 진행</h3><label class="f">기본 질문 하나에 추가 질문 최대<select id="mf"><option>0</option><option>1</option><option>2</option></select></label>' +
        '<label class="f">권장 답변 시간(초)<input type="text" id="lim" value="' + st.answer_limit + '"></label>' +
        '<h3 class="set-h">학생 연습과 AI 기능</h3><label class="f">학생 링크로 하는 하루 연습 횟수(0이면 제한 없음)<input type="text" id="dl" value="' + (st.daily_limit != null ? st.daily_limit : 5) + '"></label>' +
        '<label class="toggle"><input type="checkbox" id="mentorOn"' + (st.mentor_enabled ? ' checked' : '') + '>AI 멘토링 사용(학생이 보고서 뒤 AI 멘토와 대화)</label>' +
        '<label class="f">AI 멘토링 발언 수<input type="number" min="1" max="100" step="1" id="ml" value="' + (st.mentor_limit != null ? st.mentor_limit : 30) + '"></label>' +
        '<label class="f">회차당 코치 질문 수(0이면 코치 끔)<input type="number" min="0" max="50" step="1" id="cl" value="' + (st.coach_limit != null ? st.coach_limit : 5) + '"></label>' +
        '<label class="f">추가 질문을 기다리는 최대 시간(초, 넘으면 다음 질문으로)<input type="text" id="wl" value="' + (st.wait_limit || 30) + '"></label>' +
        '<h3 class="set-h">이름 가리기와 목소리</h3><label class="f">가릴 학교 이름(쉼표로)<input type="text" id="sch" value="' + esc(st.school_terms.join(', ')) + '"></label>' +
        '<label class="toggle"><input type="checkbox" id="spk"' + (st.speak ? ' checked' : '') + '>질문을 소리 내어 읽기</label>' +
        '<div class="row"><label class="f" style="flex:1">면접관 목소리<select id="vc">' + '<optgroup label="제미나이 목소리(권장)">' + ['Charon', 'Iapetus', 'Orus', 'Schedar', 'Gacrux', 'Achird', 'Sadaltager', 'Kore', 'Aoede', 'Leda'].map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</optgroup><optgroup label="오픈에이아이 목소리(예비)">' + ['marin', 'cedar', 'ash', 'coral', 'sage'].map(function (v) { return '<option>' + v + '</option>'; }).join('') + '</optgroup>' + '</select></label><button class="btn" id="try" style="align-self:flex-end">미리 듣기</button></div>' +
        '</div>' +
        '<div class="grid"><div class="card"><h2>구글 시트 기록</h2>' +
        (s.sheets.ready ? '<p class="small muted">연습이 끝나거나 선생님 메모를 저장하면 그 회차가 시트에 자동으로 기록됩니다. 학생 이름·학번은 보내지 않고 학생 코드만 보냅니다. 받아 적은 답과 메모는 이름·학교 이름을 가린 뒤 보냅니다.</p>' +
          '<label class="toggle"><input type="checkbox" id="sht"' + (st.sheets ? ' checked' : '') + '>시트로 자동 기록</label>' +
          '<h3 style="margin:16px 0 6px">모의 면접 보고서 메일</h3><p class="small muted" style="margin:0 0 8px">연습 메모, 지난 연습과 비교, 질문과 답을 메일로 보냅니다. 개인정보 제공 동의를 표시한 학생만 학번·이름을 넣고, 나머지는 학생 코드만 담습니다. 녹음은 보내지 않습니다. 선생님 주소는 구글 스크립트에 저장한 주소만 사용합니다(최대 5개, 쉼표로 구분). 학생 주소는 허용 도메인에 속한 한 명만 추가할 수 있습니다. 학생 주소는 구글 시트에 기록하지 않습니다.</p>' +
          '<div class="row" style="gap:8px"><input type="text" id="rto" value="' + esc(st.report_to || '') + '" placeholder="예: teacher@school.kr" style="flex:1"><button class="btn" id="rtoSave">주소 저장</button></div>' +
          '<label class="f" style="margin-top:12px">학생 메일 허용 도메인<input type="text" id="studentDomain" value="' + esc(st.report_student_domain || '') + '" placeholder="예: danggok.hs.kr, 모든 도메인은 *"></label><p class="src">도메인 하나를 입력합니다. *를 넣으면 도메인을 가리지 않습니다. 하위 도메인은 포함하지 않습니다. 저장 후 연결 확인을 누르면 구글 스크립트에 반영합니다. 비워 두면 학생에게 보내지 않습니다.</p>' +
          '<label class="toggle" style="margin-top:8px"><input type="checkbox" id="studentAuto"' + (st.mail_student_auto ? ' checked' : '') + '>학생에게도 자동으로 보내기</label>' +
          '<label class="toggle" style="margin-top:8px"><input type="checkbox" id="mauto"' + (st.mail_auto ? ' checked' : '') + '>연습이 끝나면 자동으로 보내기</label>' +
          '<label class="toggle" style="margin-top:8px"><input type="checkbox" id="mentoringAuto"' + (st.mail_mentoring_auto ? ' checked' : '') + '>멘토링 저장 시 자동으로 보내기</label><p class="src">멘토링 자동 발송은 위의 연습 자동 발송도 켠 경우에 실행합니다. 멘토링 메일은 동의한 학생만 제목과 머리에 학번·이름을 표시합니다. 카드는 제목만 포함합니다. 구글 시트에는 멘토링을 기록하지 않습니다.</p>' +
          '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><button class="btn" id="shTest">연결 확인</button><button class="btn" id="shAll">지금까지 기록 모두 보내기</button>' + (s.sheets.link ? '<a class="btn" href="' + esc(s.sheets.link) + '" target="_blank">시트 열기</a>' : '') + '</div><p class="small" id="shMsg" style="margin-top:8px"></p>'
          : '<p class="small muted">연결되지 않았습니다(.env에 SHEETS_URL·SHEETS_TOKEN 없음). 맥북 저장만 합니다.</p>') +
        '</div><div class="card"><h2>AI로 보낸 기록</h2><p class="muted small">무엇을 언제 어느 API로 보냈는지(최근 100건)</p><div id="log" class="small"></div></div></div></div>' +
        '<div class="card row settings-bar"><span class="small muted" id="dirty">왼쪽 설정과 메일·시트 선택은 이 버튼으로 저장합니다</span><div class="spacer"></div><button class="btn pri" id="save">설정 저장</button></div>';
      V.querySelectorAll('input, select').forEach(function (el) { if (el.id !== 'rto') el.addEventListener('change', function () { var d = V.querySelector('#dirty'); if (d) d.textContent = '저장하지 않은 변경이 있습니다'; }); });
      V.querySelector('#stt').value = st.stt; V.querySelector('#ocr').value = st.ocr; V.querySelector('#mf').value = String(st.max_follow);
      V.querySelector('#vc').value = st.tts_voice || 'Charon';
      V.querySelector('#try').onclick = function () { playTTS('스택과 큐의 차이를 설명하고, 프린터 대기열에 큐를 쓴 이유를 말해 주세요.', V.querySelector('#vc').value).catch(function (e) { toast(e.message, true); }); };
      V.querySelector('#save').onclick = function () {
        api('/api/settings', { stt: V.querySelector('#stt').value, ocr: V.querySelector('#ocr').value, max_follow: +V.querySelector('#mf').value, answer_limit: +V.querySelector('#lim').value || 90, wait_limit: Math.max(10, Math.min(90, +V.querySelector('#wl').value || 30)), daily_limit: Math.max(0, Math.min(50, parseInt(V.querySelector('#dl').value, 10) || 0)),
          analysis_auto: V.querySelector('#analysisAuto').checked, mentor_limit: +V.querySelector('#ml').value, mentor_enabled: !!(V.querySelector('#mentorOn') && V.querySelector('#mentorOn').checked), coach_limit: +V.querySelector('#cl').value, school_terms: V.querySelector('#sch').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean), speak: V.querySelector('#spk').checked, tts_voice: V.querySelector('#vc').value, sheets: V.querySelector('#sht') ? V.querySelector('#sht').checked : st.sheets,
          mail_student_auto: V.querySelector('#studentAuto') ? V.querySelector('#studentAuto').checked : st.mail_student_auto, report_student_domain: V.querySelector('#studentDomain') ? V.querySelector('#studentDomain').value.trim() : st.report_student_domain,
          mail_mentoring_auto: V.querySelector('#mentoringAuto') ? V.querySelector('#mentoringAuto').checked : !!st.mail_mentoring_auto,
          mail_auto: V.querySelector('#mauto') ? V.querySelector('#mauto').checked : st.mail_auto }).then(function () { toast('저장했습니다'); var d = V.querySelector('#dirty'); if (d) d.textContent = '저장했습니다'; }).catch(function (e) { toast(e.message, true); });
      };
      var shMsg = function (t, bad) { var m = document.getElementById('shMsg'); if (m) { m.textContent = t; m.style.color = bad ? 'var(--bad, #dc2626)' : ''; } };
      var shT = V.querySelector('#shTest'), shA = V.querySelector('#shAll');
      var rs = V.querySelector('#rtoSave');
      if (rs) rs.onclick = function () { shMsg('주소 저장 중…'); api('/api/report/to', { to: V.querySelector('#rto').value }).then(function (r) { V.querySelector('#rto').value = r.report_to || ''; shMsg(r.report_to ? '보고서를 받을 주소: ' + r.report_to : '주소가 비었습니다. 메일을 보내지 않습니다.'); }).catch(function (e) { shMsg(e.message, true); }); };
      if (shT) shT.onclick = function () { shMsg('확인 중…'); api('/api/settings', { report_student_domain: V.querySelector('#studentDomain').value.trim() }).then(function () { return api('/api/sheets/test', {}); }).then(function (r) { V.querySelector('#rto').value = (r.report_to || []).join(', '); shMsg('연결되었습니다. 선생님 주소를 확인하고 학생 허용 도메인을 반영했습니다.'); }).catch(function (e) { shMsg(e.message, true); }); };
      if (shA) shA.onclick = function () { shA.disabled = true; shMsg('보내는 중…'); api('/api/sheets/push_all', {}).then(function (r) { shMsg('보냄 ' + r.ok + '회차' + (r.failed ? ', 실패 ' + r.failed + '회차' : '')); shA.disabled = false; }).catch(function (e) { shMsg(e.message, true); shA.disabled = false; }); };
      api('/api/sendlog').then(function (L) {
        document.getElementById('log').innerHTML = L.length ? '<table style="width:100%;border-collapse:collapse">' + L.map(function (r) { return '<tr style="border-bottom:1px solid var(--line)"><td style="padding:6px 4px;white-space:nowrap">' + esc(r.at.slice(5, 16)) + '</td><td><span class="chip gray">' + esc(r.api) + '</span></td><td>' + esc(r.purpose) + '</td><td class="faint">' + r.chars.toLocaleString() + '자</td></tr>'; }).join('') + '</table>' : '<p class="faint">아직 없습니다.</p>';
      });
    });
  }

  api('/api/whoami').then(function (w) {
    ROLE = w.role || 'teacher';
    if (ROLE === 'student') { document.body.classList.add('student'); var nv = document.querySelector('nav'); if (nv) nv.style.display = 'none'; }
  }).catch(function () {}).then(route);
})();
