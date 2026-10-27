/* 발표 엔진: content/slides.js의 SLIDES를 그려 단계별로 넘긴다.
   키: → · 스페이스 · 클릭 = 다음 단계, ← = 이전, Home·End, N = 발표자 노트, O = 전체 보기, F = 전체 화면
   주소: #/쪽/단계 (예: #/6/2). 슬라이드의 [data-s="k"] 요소는 k단계부터 보인다. */
(function () {
  var S = window.SLIDES || [], ST = window.STATS || {};
  var W = window.WIDGETS || {};
  var stage = document.getElementById('stage');
  var cur = 0, step = 0, inited = {};

  // 슬라이드 만들기
  S.forEach(function (s, i) {
    var el = document.createElement('section');
    el.className = 'slide' + (s.fx ? ' fx-' + s.fx : '');
    el.dataset.i = i;
    el.innerHTML = (typeof s.html === 'function' ? s.html(ST) : s.html);
    s.el = el;
    s.steps = Math.max(s.steps || 0, maxStep(el));
    stage.appendChild(el);
  });
  function maxStep(el) {
    var m = 0;
    el.querySelectorAll('[data-s]').forEach(function (x) { m = Math.max(m, +x.dataset.s || 0); });
    el.querySelectorAll('[data-u]').forEach(function (x) { m = Math.max(m, +x.dataset.u || 0); });
    el.querySelectorAll('[data-pan]').forEach(function (x) { x.dataset.pan.split(',').forEach(function (p) { m = Math.max(m, +p.split(':')[0] || 0); }); });
    return m;
  }

  // 머리(섹션 칩)·바닥
  var bar = document.createElement('div');
  bar.id = 'bar';
  var secs = [];
  S.forEach(function (s, i) { if (s.sec && secs.indexOf(s.sec) === -1) secs.push(s.sec); });
  bar.innerHTML = secs.map(function (x) {
    return '<button class="sec" type="button" data-sec="' + x + '">' + x + '</button>';
  }).join('') + '<span class="sp"></span><span class="upd">' + (ST.updated ? '수치 기준 ' + ST.updated : '') + '</span>';
  stage.appendChild(bar);
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('.sec'); if (!b) return;
    var i = S.findIndex(function (s) { return s.sec === b.dataset.sec; }); if (i >= 0) go(i, 0);
  });
  var foot = document.createElement('div');
  foot.id = 'foot';
  foot.innerHTML = '<span class="keys">→ 다음 · ← 이전 · N 노트 · O 전체</span><span class="prog"><i></i></span><span class="num"></span>';
  stage.appendChild(foot);

  // 노트·전체 보기·확대
  var notes = document.createElement('div'); notes.id = 'notes'; document.body.appendChild(notes);
  var ov = document.createElement('div'); ov.id = 'overview'; document.body.appendChild(ov);
  var zoom = document.createElement('div'); zoom.id = 'zoom'; document.body.appendChild(zoom);
  zoom.addEventListener('click', function () { zoom.classList.remove('on'); });
  stage.addEventListener('click', function (e) {
    var img = e.target.closest('.shot, .phone, .frame');
    if (img) {
      var src = img.tagName === 'IMG' ? img.src : img.querySelector('img').src;
      zoom.innerHTML = '<img alt="" src="' + src + '">'; zoom.classList.add('on'); zoom.scrollTop = 0;
      e.stopPropagation(); return;
    }
    if (e.target.closest('button, a, input, label, select, .nonext')) return;
    next();
  });
  function buildOverview() {
    ov.innerHTML = '<div class="grid">' + S.map(function (s, i) {
      return '<button type="button" data-i="' + i + '" class="' + (i === cur ? 'cur' : '') + '"><small>' + (i + 1) + ' · ' + (s.sec || '') + '</small>' + (s.title || '') + '</button>';
    }).join('') + '</div>';
  }
  ov.addEventListener('click', function (e) {
    var b = e.target.closest('button'); ov.classList.remove('on'); if (b) go(+b.dataset.i, 0);
  });

  // 크기 맞추기
  function fit() {
    var k = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    stage.style.transform = 'translate(-50%, -50%) scale(' + k + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  // 이동
  function render(anim) {
    S.forEach(function (s, i) { s.el.classList.toggle('cur', i === cur); });
    var s = S[cur];
    s.el.classList.toggle('anim', !!anim);
    s.el.querySelectorAll('[data-s], [data-u]').forEach(function (x) {
      var k = +(x.dataset.s || 0);
      x.classList.toggle('off', k > step || (x.dataset.u !== undefined && step >= +x.dataset.u));
      x.classList.toggle('dim', !!x.dataset.dimAfter && step >= +x.dataset.dimAfter);
    });
    // 긴 캡처 창: data-pan="단계:이동량" (예: "1:-40%,2:-70%")
    s.el.querySelectorAll('[data-pan]').forEach(function (f) {
      var y = '0';
      f.dataset.pan.split(',').forEach(function (p) { var a = p.split(':'); if (+a[0] <= step) y = a[1]; });
      var img = f.querySelector('img'); if (img) img.style.transform = 'translateY(' + y + ')';
    });
    if (s.widget && W[s.widget] && !inited[cur]) { W[s.widget](s.el, ST); inited[cur] = true; }
    if (s.onStep) s.onStep(s.el, step, ST);
    s.el.dispatchEvent(new CustomEvent('step', { detail: step }));
    bar.querySelectorAll('.sec').forEach(function (b) { b.classList.toggle('on', b.dataset.sec === s.sec); });
    foot.querySelector('.num').textContent = (cur + 1) + ' / ' + S.length + (s.steps ? '  ·  ' + step + '/' + s.steps : '');
    foot.querySelector('.prog i').style.width = ((cur + (s.steps ? step / (s.steps + 1) : 0)) / (S.length - 1 || 1) * 100) + '%';
    notes.innerHTML = '<h4>' + (cur + 1) + '. ' + (s.title || '') + ' · 발표자 노트</h4>' + (s.notes || '').split('\n').filter(Boolean).map(function (p) { return '<p>' + p + '</p>'; }).join('');
    try { history.replaceState(null, '', '#/' + (cur + 1) + (step ? '/' + step : '')); } catch (e) {}
    if (ov.classList.contains('on')) buildOverview();
  }
  function go(i, st, anim) {
    var was = cur;
    cur = Math.max(0, Math.min(S.length - 1, i)); step = Math.max(0, Math.min(S[cur].steps || 0, st));
    // 장이 바뀌면 나가는 장에 .was, 방향(앞으로 f·뒤로 b)을 무대에 적어 전환 효과가 방향을 따르게 한다
    if (cur !== was) { stage.dataset.dir = cur > was ? 'f' : 'b'; void S[cur].el.offsetWidth; S.forEach(function (x, j) { x.el.classList.toggle('was', j === was); }); }   // offsetWidth: 바뀐 방향을 들어오는 장의 출발 자리에 먼저 반영
    render(anim);
  }
  function next() { var s = S[cur]; if (step < (s.steps || 0)) go(cur, step + 1, true); else if (cur < S.length - 1) go(cur + 1, 0, false); }
  function prev() { if (step > 0) go(cur, step - 1, true); else if (cur > 0) go(cur - 1, S[cur - 1].steps || 0, false); }
  window.DECK = { go: go, next: next, prev: prev, cur: function () { return { slide: cur, step: step, steps: S[cur].steps || 0 }; }, count: S.length,
                  steps: S.map(function (s) { return s.steps || 0; }) };

  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0, 0);
    else if (k === 'End') go(S.length - 1, 0);
    else if (k === 'n' || k === 'N' || k === 'ㅜ') notes.classList.toggle('on');
    else if (k === 'o' || k === 'O' || k === 'ㅐ') { buildOverview(); ov.classList.toggle('on'); }
    else if (k === 'f' || k === 'F' || k === 'ㄹ') { if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); else document.exitFullscreen(); }
    else if (k === 'Escape') { zoom.classList.remove('on'); ov.classList.remove('on'); }
  });
  // 손으로 넘기기
  var tx = null;
  stage.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) { if (tx === null) return; var d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) (d < 0 ? next : prev)(); tx = null; });

  var m = location.hash.match(/#\/(\d+)(?:\/(\d+))?/);
  go(m ? +m[1] - 1 : 0, m && m[2] ? +m[2] : 0);
})();
